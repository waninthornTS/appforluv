// กระดานเพลง (หน้าแรก): Ploy กับ Dream เลือกได้คนละ 1 เพลง (เลือกใหม่ = ทับเพลงเดิมของตัวเอง)
// ค้นหาจาก Spotify ได้ในกล่องเลย (ไม่มีหน้าต่างเด้ง) → ทั้งสองเครื่องเห็นเหมือนกัน กดฟังได้ในแอป (บนมือถือได้ตัวอย่าง 30 วินาที)
// กล่องสูงไม่เกินจอ: ขอบล่างอยู่เหนือแถบเมนูล่าง เปิดแอปมาก็เห็นช่องค้นหาโดยไม่ต้องเลื่อน
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from '../../ui/overlays';
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
  const [who, setWho] = useState<Who>(readWho);
  const search = useRef<HTMLInputElement>(null);

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
  // ที่พอ (หัว + ปกใหญ่ + แถวเพลงอีกคน + ช่องค้นหา) ใช้ตัวเล่นแบบมีปก ไม่พอใช้แบบแถบเล็ก
  const big = !maxH || maxH >= 22 + 152 + (current ? 6 + 44 : 0) + 6 + 38 + 6 + 20;
  // อีกคนที่ไม่ใช่เจ้าของเพลงที่กำลังเล่น (ยังไม่ได้เลือก = แถวชวนเลือกเพลง)
  const otherWho: Who | null = current ? (current.who === 'A' ? 'B' : 'A') : null;

  const pickWho = (w: Who) => { setWho(w); try { localStorage.setItem(WHO_KEY, w); } catch { /* ไม่เป็นไร */ } };
  const askFor = (w: Who) => { pickWho(w); search.current?.focus(); };

  return (
    <section ref={box} className="card music">
      <div className="music-head">
        {current && <span className={`who now ${current.who}`}>🎧 {nameOf(current.who)}</span>}
        <span className="music-icon" aria-hidden="true">🎵</span>
      </div>
      {current && <Player p={current} h={big ? 152 : 80} />}
      {other ? (
        <button className="music-row" onClick={() => setPlayId(other.id)} aria-label={`ฟังเพลงของ${nameOf(other.who)}`}>
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
      <SongSearch who={who} onWho={pickWho} inputRef={search} onPicked={id => setPlayId(id)} />
    </section>
  );
}

// ---------- ช่องค้นหาในกล่อง: พิมพ์ → รายการขึ้นต่อท้าย → แตะเพลง = ใส่เป็นเพลงของคนที่เลือกไว้ ----------
function SongSearch({ who, onWho, inputRef, onPicked }: {
  who: Who; onWho: (w: Who) => void; inputRef: React.RefObject<HTMLInputElement | null>; onPicked: (id: string) => void;
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
    await coll.save('songs', { id, kind: 'track', sid: t.sid, who, title: t.title, artist: t.artist, cover: t.cover });
    // เก็บกวาดเพลงเก่าของคนนี้ (ให้เหลือคนละ 1 เพลงจริงๆ)
    for (const s of await db.all<SongPick>('songs')) if (s.who === who && s.id !== id) await coll.remove('songs', s.id);
    setQ('');
    inputRef.current?.blur();
    onPicked(id);
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
        <input ref={inputRef} className="input song-search" value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเพลง…" enterKeyHint="search" />
        {q && <button type="button" className="clear" onClick={() => setQ('')} aria-label="ล้าง">✕</button>}
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
