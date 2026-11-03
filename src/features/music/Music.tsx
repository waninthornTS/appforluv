// เพลงของเรา: ไอคอนเพลงบนหัวหน้าแรก → หน้าต่างกลางจอ (ตัวเล่น + เพลงของอีกคน + ค้นหาจาก Spotify)
// ตัวเล่นอยู่ระดับแอป (ไม่ผูกกับหน้า) — ปิดหน้าต่าง/สลับแท็บ เพลงก็ยังเล่นต่อ
// Ploy กับ Dream เลือกได้คนละ 1 เพลง (เลือกใหม่ = ทับเพลงเดิมของตัวเอง) · บนมือถือได้ตัวอย่าง 30 วินาที
import { useEffect, useRef, useState } from 'react';
import { db } from '../../lib/db';
import { createStore, useStore } from '../../lib/signal';
import { searchTracks, type FoundTrack } from '../../lib/spotify';
import { coll, PROFILE, useCollection } from '../../lib/store';
import type { SongPick, Who } from '../../lib/types';
import { toast } from '../../ui/overlays';
import './music.css';

const WHO_KEY = 'song-who'; // เครื่องนี้เป็นใคร (จำไว้ครั้งล่าสุดที่เลือก)
const readWho = (): Who => { try { return localStorage.getItem(WHO_KEY) === 'B' ? 'B' : 'A'; } catch { return 'A'; } };
const nameOf = (w: Who) => (w === 'A' ? PROFILE.nameA : PROFILE.nameB);
const slotId = (w: Who) => `song-${w}`; // คนละ 1 รายการ บันทึกทับที่เดิม
const uriOf = (s: { sid: string }) => `spotify:track:${s.sid}`;

const musicOpen = createStore(false);
const musicPlaying = createStore(false);
const setPlaying = (on: boolean) => {
  musicPlaying.set(on);
  document.body.dataset.music = on ? 'on' : ''; // เพลงเล่นอยู่ = แอปยังไม่รีโหลดอัปเดตเอง (main.tsx)
};

/** เพลงล่าสุดของแต่ละคน (คนละ 1 เพลง) เรียงใหม่สุดก่อน */
const picksOf = (songs: SongPick[]) =>
  (['A', 'B'] as const).map(w => songs.filter(s => s.who === w).sort((a, b) => b.updatedAt - a.updatedAt)[0])
    .filter((s): s is SongPick => !!s).sort((a, b) => b.updatedAt - a.updatedAt);

// ---------- ตัวควบคุมของ Spotify (iFrame API ทางการ) ----------
interface EmbedController {
  loadUri(uri: string): void;
  play(): void;
  addListener(ev: 'playback_update', cb: (e: { data: { isPaused: boolean } }) => void): void;
}
interface SpotifyIFrameAPI {
  createController(el: HTMLElement, opts: { uri: string; width?: string | number; height?: number }, cb: (c: EmbedController) => void): void;
}
declare global { interface Window { onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void } }
let apiPromise: Promise<SpotifyIFrameAPI> | undefined;
const loadApi = () => (apiPromise ??= new Promise(done => {
  window.onSpotifyIframeApiReady = done;
  const s = document.createElement('script');
  s.src = 'https://open.spotify.com/embed/iframe-api/v1';
  s.async = true;
  document.body.appendChild(s);
}));

// ---------- ไอคอนเพลง (หัวหน้าแรก) ----------
export function MusicButton() {
  const playing = useStore(musicPlaying);
  return (
    <button className={`music-btn ${playing ? 'playing' : ''}`} onClick={() => musicOpen.set(true)} aria-label="เพลงของเรา">
      <svg viewBox="0 0 48 48" className="music-ico" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="#C9B6FF" stroke="#8C6FE0" strokeWidth="2" />
        <path d="M21 31.5V15.5l11-2.6v14.6" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="18" cy="31.5" rx="4" ry="3.3" fill="#fff" />
        <ellipse cx="29" cy="27.5" rx="4" ry="3.3" fill="#fff" />
      </svg>
      {playing && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  );
}

// ---------- หน้าต่างเพลงกลางจอ + ตัวเล่น (อยู่ตลอดทั้งแอป) ----------
export function MusicHost() {
  const open = useStore(musicOpen);
  const picks = picksOf(useCollection('songs') || []);
  const [playId, setPlayId] = useState<string | null>(null);
  const current = picks.find(s => s.id === playId) || picks[0];
  const other = picks.find(s => s !== current);
  const otherWho: Who | null = current ? (current.who === 'A' ? 'B' : 'A') : null;
  const [who, setWho] = useState<Who>(readWho);
  const [typing, setTyping] = useState(false); // กำลังค้นหา = หน้าต่างเลื่อนขึ้นบน (แป้นพิมพ์ไม่บัง)
  const search = useRef<HTMLInputElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const ctl = useRef<EmbedController | null>(null);
  const loaded = useRef('');
  const close = () => { musicOpen.set(false); setTyping(false); };

  // สร้างตัวเล่นครั้งเดียว แล้วเปลี่ยนเพลงด้วย loadUri (ไม่สร้างใหม่ เพลงจะได้ไม่สะดุด)
  useEffect(() => {
    if (!current) return;
    const uri = uriOf(current);
    if (ctl.current) {
      if (loaded.current !== uri) { ctl.current.loadUri(uri); loaded.current = uri; }
      return;
    }
    let dead = false;
    loadApi().then(api => {
      if (dead || ctl.current || !slot.current) return;
      const el = document.createElement('div');
      slot.current.replaceChildren(el);
      api.createController(el, { uri, width: '100%', height: 152 }, c => {
        ctl.current = c;
        loaded.current = uri;
        c.addListener('playback_update', e => setPlaying(!e.data.isPaused));
      });
    });
    return () => { dead = true; };
  }, [current?.sid]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [open]);

  const pickWho = (w: Who) => { setWho(w); try { localStorage.setItem(WHO_KEY, w); } catch { /* ไม่เป็นไร */ } };
  const askFor = (w: Who) => { pickWho(w); search.current?.focus(); };
  const switchTo = (s: SongPick) => {
    setPlayId(s.id);
    // แตะเลือกเพลง = ลองเล่นเลย (บางเครื่องต้องกดปุ่มเล่นในตัวเล่นเองครั้งแรก)
    setTimeout(() => ctl.current?.play(), 300);
  };

  return (
    <div className={`music-modal ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="music-backdrop" onClick={close} />
      <div className={`music-panel ${typing ? 'typing' : ''}`} role="dialog" aria-label="เพลงของเรา">
        <div className="music-panel-head">
          {current && <span className={`who now ${current.who}`}>🎧 {nameOf(current.who)}</span>}
          <span className="music-note" aria-hidden="true">🎵</span>
          <button className="icon-btn" onClick={close} aria-label="ปิด">✕</button>
        </div>
        {/* ตัวเล่นต้องไม่ถูกถอดออก (เพลงจะหยุด) — ปิดหน้าต่างแค่ซ่อนไว้ */}
        <div ref={slot} className="music-player" style={{ display: current ? undefined : 'none' }} />
        {other ? (
          <button className="music-row" onClick={() => switchTo(other)} aria-label={`ฟังเพลงของ${nameOf(other.who)}`}>
            {other.cover ? <img src={other.cover} alt="" loading="lazy" /> : <i>🎵</i>}
            <span className="t"><b className="ellipsis">{other.title || 'เพลง'}</b>{other.artist && <small className="ellipsis">{other.artist}</small>}</span>
            <span className={`who ${other.who}`}>{nameOf(other.who)}</span>
          </button>
        ) : otherWho && (
          <button className="music-row empty" onClick={() => askFor(otherWho)}>
            <i>＋</i>
            <span className="t"><b className="ellipsis">{nameOf(otherWho)} ยังไม่ได้เลือกเพลง</b></span>
            <span className={`who ${otherWho}`}>{nameOf(otherWho)}</span>
          </button>
        )}
        <SongSearch who={who} onWho={pickWho} inputRef={search} onPicked={s => switchTo(s)} onTyping={setTyping} />
      </div>
    </div>
  );
}

// ---------- ช่องค้นหา: พิมพ์ → รายการขึ้นต่อท้าย → แตะเพลง = ใส่เป็นเพลงของคนที่เลือกไว้ ----------
function SongSearch({ who, onWho, inputRef, onPicked, onTyping }: {
  who: Who; onWho: (w: Who) => void; inputRef: React.RefObject<HTMLInputElement | null>; onPicked: (s: SongPick) => void; onTyping: (on: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState<FoundTrack[] | 'not-connected' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  // พิมพ์หยุดแป๊บนึงค่อยค้นหา (ไม่ยิงทุกตัวอักษร)
  useEffect(() => {
    const text = q.trim();
    if (!text) { seq.current++; setFound(null); setLoading(false); return; }
    const n = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      let r: FoundTrack[] | 'not-connected' | 'error';
      try { r = await searchTracks(text); } catch { r = 'error'; }
      if (n === seq.current) { setFound(r); setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const choose = async (t: FoundTrack) => {
    const id = slotId(who);
    const saved = await coll.save('songs', { id, kind: 'track', sid: t.sid, who, title: t.title, artist: t.artist, cover: t.cover });
    // เก็บกวาดเพลงเก่าของคนนี้ (ให้เหลือคนละ 1 เพลงจริงๆ)
    for (const s of await db.all<SongPick>('songs')) if (s.who === who && s.id !== id) await coll.remove('songs', s.id);
    setQ('');
    inputRef.current?.blur();
    onTyping(false);
    onPicked(saved);
    toast(`ใส่เพลงของ${nameOf(who)}แล้ว 🎵`);
  };

  return (
    <div className="song-search-box">
      <div className="song-search-row">
        <div className="who-pick" role="radiogroup" aria-label="เพลงของใคร">
          {(['A', 'B'] as const).map(w => (
            <button key={w} type="button" role="radio" aria-checked={who === w} className={`${w} ${who === w ? 'on' : ''}`} onClick={() => onWho(w)}>{nameOf(w)}</button>
          ))}
        </div>
        <input ref={inputRef} className="input song-search" value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเพลง…" enterKeyHint="search"
          onFocus={() => onTyping(true)} onBlur={() => { if (!q.trim()) onTyping(false); }} />
        {q && <button type="button" className="clear" onClick={() => { setQ(''); onTyping(false); }} aria-label="ล้าง">✕</button>}
      </div>
      {q.trim() && (
        <div className="song-results">
          {loading && <div className="song-status"><div className="spinner" /></div>}
          {!loading && found === 'not-connected' && <p className="song-status small muted">ยังไม่ได้เชื่อม Spotify — เปิดเมนู ☰ แล้วกด “เชื่อมต่อ Spotify”</p>}
          {!loading && found === 'error' && <p className="song-status small muted">ค้นหาไม่ได้ตอนนี้ ลองใหม่อีกครั้งนะ</p>}
          {!loading && Array.isArray(found) && !found.length && <p className="song-status small muted">ไม่เจอเพลงนี้</p>}
          {!loading && Array.isArray(found) && found.map(t => (
            <button key={t.sid} className="song-hit" onClick={() => choose(t)}>
              {t.thumb || t.cover ? <img src={t.thumb || t.cover} alt="" loading="lazy" /> : <i>🎵</i>}
              <span className="t"><b className="ellipsis">{t.title}</b><small className="ellipsis">{t.artist}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
