// กระดานเพลง (หน้าแรก): Ploy กับ Dream เลือกได้คนละ 1 เพลง (เลือกใหม่ = ทับเพลงเดิมของตัวเอง)
// พิมพ์ชื่อเพลงค้นหาจาก Spotify → ทั้งสองเครื่องเห็นเหมือนกัน กดฟังได้ในแอป (บนมือถือได้ตัวอย่าง 30 วินาที)
// กล่องสูงไม่เกินจอ: ขอบล่างอยู่เหนือแถบเมนูล่างพอดี เปิดแอปมาก็เห็นปุ่มเลือกเพลงโดยไม่ต้องเลื่อน
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { openSheet, toast } from '../../ui/overlays';
import { db } from '../../lib/db';
import { coll, PROFILE, useCollection } from '../../lib/store';
import { searchTracks, type FoundTrack } from '../../lib/spotify';
import type { SongPick, SpotifyKind, Who } from '../../lib/types';

const WHO_KEY = 'song-who'; // เครื่องนี้เป็นใคร (จำไว้ครั้งล่าสุดที่เลือก)
const readWho = (): Who => { try { return localStorage.getItem(WHO_KEY) === 'B' ? 'B' : 'A'; } catch { return 'A'; } };
const nameOf = (w: Who) => (w === 'A' ? PROFILE.nameA : PROFILE.nameB);
const slotId = (w: Who) => `song-${w}`; // คนละ 1 รายการ บันทึกทับที่เดิม
const embedUrl = (p: { kind: SpotifyKind; sid: string }) => `https://open.spotify.com/embed/${p.kind}/${p.sid}?utm_source=generator`;

const Player = ({ p, h = 152 }: { p: { kind: SpotifyKind; sid: string }; h?: number }) => (
  <iframe className="spotify-player" key={p.sid} src={embedUrl(p)} title="Spotify" loading="lazy" style={{ height: h }}
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
);

/** เพลงล่าสุดของแต่ละคน (คนละ 1 เพลง) เรียงใหม่สุดก่อน */
const picksOf = (songs: SongPick[]) =>
  (['A', 'B'] as const).map(w => songs.filter(s => s.who === w).sort((a, b) => b.updatedAt - a.updatedAt)[0])
    .filter((s): s is SongPick => !!s).sort((a, b) => b.updatedAt - a.updatedAt);

export function MusicBoard() {
  const picks = picksOf(useCollection('songs') || []);
  const [playId, setPlayId] = useState<string | null>(null);
  const current = picks.find(s => s.id === playId) || picks[0];
  const other = picks.find(s => s !== current);
  const box = useRef<HTMLElement>(null);
  const [maxH, setMaxH] = useState<number>();

  // พื้นที่ตั้งแต่กล่องลงไปถึงเหนือแถบเมนูล่าง (คิดจากตำแหน่งจริงบนจอ รวมขอบจอ/พื้นที่เกาะของ iPhone)
  useLayoutEffect(() => {
    const fit = () => {
      const el = box.current, tab = document.querySelector('.tabbar');
      if (!el || !tab) return;
      const top = el.getBoundingClientRect().top + scrollY;
      setMaxH(Math.round(innerHeight - tab.getBoundingClientRect().height - top - 12));
    };
    fit();
    const t = setTimeout(fit, 400); // รอฟอนต์/รูปโหลดเสร็จแล้ววัดอีกรอบ
    addEventListener('resize', fit);
    return () => { clearTimeout(t); removeEventListener('resize', fit); };
  }, []);
  // ที่พอ (หัว + ปกใหญ่ + แถวเพลงของอีกคน) ใช้ตัวเล่นแบบมีปก ไม่พอใช้แบบแถบเล็ก — แถวของอีกคนโชว์เสมอ
  const big = !maxH || maxH >= 28 + 8 + 152 + (current ? 8 + 52 : 0) + 22;
  // อีกคนที่ไม่ใช่เจ้าของเพลงที่กำลังเล่น (ยังไม่ได้เลือก = แถวชวนเลือกเพลง)
  const otherWho: Who | null = current ? (current.who === 'A' ? 'B' : 'A') : null;

  return (
    <section ref={box} className="card music">
      <div className="music-head">
        {current && <span className={`who now ${current.who}`}>🎧 {nameOf(current.who)}</span>}
        <span className="music-icon" aria-hidden="true">🎵</span>
        {current && <button className="music-add" onClick={() => openAddSong()}>＋ เลือกเพลง</button>}
      </div>
      {current ? <Player p={current} h={big ? 152 : 80} />
        : <button className="music-empty" onClick={() => openAddSong()}><span>🎵</span>เลือกเพลงแรกของเรา</button>}
      {other ? (
        <button className="music-row" onClick={() => setPlayId(other.id)} aria-label={`ฟังเพลงของ${nameOf(other.who)}`}>
          {other.cover ? <img src={other.cover} alt="" loading="lazy" /> : <i>🎵</i>}
          <span className="t"><b className="ellipsis">{other.title || 'เพลง'}</b>{other.artist && <small className="ellipsis">{other.artist}</small>}</span>
          <span className={`who ${other.who}`}>{nameOf(other.who)}</span>
        </button>
      ) : otherWho && (
        <button className="music-row empty" onClick={() => openAddSong(otherWho)}>
          <i>＋</i>
          <span className="t"><b className="ellipsis">{nameOf(otherWho)} ยังไม่ได้เลือกเพลง</b></span>
          <span className={`who ${otherWho}`}>{nameOf(otherWho)}</span>
        </button>
      )}
    </section>
  );
}

// ---------- ชีตเลือกเพลง: พิมพ์ชื่อเพลงแล้วค้นหาจาก Spotify ----------
function openAddSong(forWho?: Who) {
  openSheet({ title: 'เลือกเพลง', render: close => <AddSong close={close} forWho={forWho} /> });
}

function AddSong({ close, forWho }: { close: () => void; forWho?: Who }) {
  const [who, setWho] = useState<Who>(() => forWho ?? readWho());
  const whoNow = useRef(who); // ค่าล่าสุดเสมอ (กดเลือกคนแล้วกดใส่เพลงทันทีก็ไม่พลาด)
  const [q, setQ] = useState('');
  const [found, setFound] = useState<FoundTrack[] | 'not-connected' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<FoundTrack | null>(null);
  const seq = useRef(0);

  // พิมพ์หยุดแป๊บนึงค่อยค้นหา (ไม่ยิงทุกตัวอักษร)
  useEffect(() => {
    const text = q.trim();
    if (!text) { setFound(null); setLoading(false); return; }
    const n = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      let r: FoundTrack[] | 'not-connected' | 'error';
      try { r = await searchTracks(text); } catch { r = 'error'; }
      if (n === seq.current) { setFound(r); setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (w: Who) => { whoNow.current = w; setWho(w); try { localStorage.setItem(WHO_KEY, w); } catch { /* ไม่เป็นไร */ } };
  const save = async () => {
    if (!sel) return;
    const w = whoNow.current;
    await coll.save('songs', { id: slotId(w), kind: 'track', sid: sel.sid, who: w, title: sel.title, artist: sel.artist, cover: sel.cover });
    // เก็บกวาดเพลงเก่าของคนนี้ (ให้เหลือคนละ 1 เพลงจริงๆ)
    for (const s of await db.all<SongPick>('songs')) if (s.who === w && s.id !== slotId(w)) await coll.remove('songs', s.id);
    toast('ใส่เพลงแล้ว 🎵');
    close();
  };

  if (sel) {
    return (
      <div className="song-form">
        <Player p={{ kind: 'track', sid: sel.sid }} />
        <div className="song-who">
          <span className="small muted">เพลงของ</span>
          {(['A', 'B'] as const).map(w => (
            <button key={w} type="button" className={`${w} ${who === w ? 'on' : ''}`} onClick={() => pick(w)}>{nameOf(w)}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={save}>ใส่เพลงนี้</button>
        <button className="btn btn-ghost btn-block" onClick={() => setSel(null)}>‹ เลือกเพลงอื่น</button>
      </div>
    );
  }

  return (
    <div className="song-form">
      <input className="input song-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 พิมพ์ชื่อเพลง หรือศิลปิน" autoFocus enterKeyHint="search" />
      {loading && <div className="song-status"><div className="spinner" /></div>}
      {!loading && found === 'not-connected' && <p className="song-status small muted">ยังไม่ได้เชื่อม Spotify — เปิดเมนู ☰ มุมซ้ายบน แล้วกด “เชื่อมต่อ Spotify”</p>}
      {!loading && found === 'error' && <p className="song-status small muted">ค้นหาไม่ได้ตอนนี้ ลองใหม่อีกครั้งนะ</p>}
      {!loading && Array.isArray(found) && !found.length && <p className="song-status small muted">ไม่เจอเพลงนี้ ลองพิมพ์ชื่ออื่นดูนะ</p>}
      {!loading && Array.isArray(found) && found.length > 0 && (
        <div className="song-results">
          {found.map(t => (
            <button key={t.sid} className="song-hit" onClick={() => setSel(t)}>
              {t.thumb || t.cover ? <img src={t.thumb || t.cover} alt="" loading="lazy" /> : <i>🎵</i>}
              <span className="t"><b className="ellipsis">{t.title}</b><small className="ellipsis">{t.artist}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
