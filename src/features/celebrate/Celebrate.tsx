// วันพิเศษบนหน้าแรก: ไอคอนจดหมายที่ล็อกไว้ (เปิดได้ตั้งแต่วันครบรอบ), ตกแต่งฉาก, และแถบจำลองวันที่ (เฉพาะในคอม)
import { useMemo, useState, type CSSProperties } from 'react';
import '@fontsource/itim/thai-400.css';
import '@fontsource/itim/latin-400.css';
import { countdown, diffDays, fmtDate, todayStr } from '../../lib/date';
import { nameOf } from '../../lib/store';
import { toast } from '../../ui/overlays';
import { setSimDate, titleOf, upcomingSpecials, type Special } from './days';
import type { Letter } from './letter';
import './celebrate.css';

// จำว่าเปิดอ่านจดหมายแล้วหรือยัง (ต่อเครื่อง)
const openedKey = (id: string) => `letter-opened:${id}`;
export const wasOpened = (id: string) => { try { return localStorage.getItem(openedKey(id)) === '1'; } catch { return false; } };
export const markOpened = (ids: string[]) => { try { ids.forEach(id => localStorage.setItem(openedKey(id), '1')); } catch { /* ไม่เป็นไร */ } };

// ---------- ไอคอนจดหมายที่ล็อกไว้ ----------
// ยังไม่ถึงวัน = ซองมีแม่กุญแจ แตะแล้วบอกว่าอีกกี่วัน · ถึงวันแล้ว = ซองปลดล็อก (ดุ๊กดิ๊ก + จุดแดงถ้ายังไม่ได้อ่าน) แตะแล้วเปิดเรื่องเล่า
export function LetterButton({ today, letter, onOpen }: { today: string; letter: Letter; onOpen: () => void }) {
  const ready = letter.date <= today;
  const fresh = ready && !wasOpened(letter.id);
  const [shake, setShake] = useState(0);
  const tap = () => {
    if (ready) return onOpen();
    setShake(n => n + 1);
    toast(`จดหมายจาก ${nameOf(letter.from)} 🔒 เปิดได้ ${fmtDate(letter.date, { year: false })} · ${countdown(diffDays(today, letter.date))}`);
  };
  return (
    <button key={shake} className={`letter-btn ${ready ? 'ready' : 'locked'} ${fresh ? 'fresh' : ''} ${shake ? 'shake' : ''}`} onClick={tap}
      aria-label={ready ? 'เปิดจดหมาย' : `จดหมายล็อกไว้ เปิดได้ ${fmtDate(letter.date)}`}>
      <svg viewBox="0 0 48 40" className="letter-ico" aria-hidden="true">
        <rect x="3" y="6" width="42" height="30" rx="5" fill="#FFFDF8" stroke="#F3C6D6" strokeWidth="2" />
        <path d="M4 8 L24 24 L44 8" fill="#FFB8CF" stroke="#F3C6D6" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 35 L18 22 M44 35 L30 22" stroke="#F3D6E0" strokeWidth="2" fill="none" />
        <circle cx="24" cy="23" r="6.5" fill="#F2548A" />
        <path d="M24 26.3l-2.6-2.4a1.6 1.6 0 0 1 2.6-1.8 1.6 1.6 0 0 1 2.6 1.8z" fill="#fff" />
      </svg>
      {!ready && <span className="lock">🔒</span>}
      {fresh && <span className="dot">!</span>}
    </button>
  );
}

// ---------- ตกแต่งฉากหน้าแรก ----------
const BALLOONS = [
  { l: 4, t: 26, c: '#FF9EBB', d: 0 }, { l: 14, t: 12, c: '#9BD7FF', d: .8 }, { l: 82, t: 16, c: '#FFD36B', d: .4 }, { l: 91, t: 32, c: '#C7A8FF', d: 1.2 },
];
export function SceneDecor({ s }: { s: Special }) {
  const bday = s.kind === 'birthday';
  const flags = bday ? ['H', 'A', 'P', 'P', 'Y', '', 'B', '-', 'D', 'A', 'Y'] : ['♥', '♥', '♥', '♥', '♥', '♥', '♥', '♥', '♥', '♥', '♥'];
  return (
    <div className={`cel-decor ${bday ? 'bday' : 'love'}`} aria-hidden="true">
      <div className="bunting">{flags.map((f, i) => <span key={i} style={{ '--i': i } as CSSProperties}>{f}</span>)}</div>
      {BALLOONS.map((b, i) => (
        <span key={i} className="balloon" style={{ left: `${b.l}%`, top: `${b.t}%`, '--c': b.c, animationDelay: `${b.d}s` } as CSSProperties}>{bday ? '' : '♥'}</span>
      ))}
      {!bday && Array.from({ length: 9 }, (_, i) => <i key={i} className="petal" style={{ left: `${(i * 11 + 4) % 100}%`, animationDelay: `${i * .7}s`, animationDuration: `${5 + (i % 3)}s` }} />)}
    </div>
  );
}

/** กระดาษสีโปรยลงมา (หัวใจด้วยถ้า love) */
export function Confetti({ love }: { love: boolean }) {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    l: Math.random() * 100, d: Math.random() * 2.5, dur: 3 + Math.random() * 2.5, r: Math.random() * 360,
    c: ['#FF7FA8', '#FFD36B', '#8FD3FF', '#B9F0C8', '#C7A8FF', '#FFB37A'][i % 6],
  })), []);
  return (
    <div className="cel-confetti" aria-hidden="true">
      {bits.map((b, i) => <i key={i} className={love && i % 3 === 0 ? 'heart' : ''} style={{ left: `${b.l}%`, animationDelay: `${b.d}s`, animationDuration: `${b.dur}s`, '--r': `${b.r}deg`, '--c': b.c } as CSSProperties} />)}
    </div>
  );
}

// ---------- แถบจำลองวันที่ (เฉพาะตอน npm run dev) ----------
export function SimDateBar({ today }: { today: string }) {
  const real = todayStr();
  const days = upcomingSpecials(real, 7);
  const [open, setOpen] = useState(false);
  const pick = (d: string | null) => setSimDate(d && d !== real ? d : null);
  if (!open) return <button className="cel-sim-pill" onClick={() => setOpen(true)}>🧪 {today === real ? 'จำลองวันที่' : `จำลอง ${fmtDate(today, { year: false })}`}</button>;
  return (
    <div className="cel-sim">
      <b>🧪 จำลองวันที่ (เห็นเฉพาะในคอม)</b> <button className="x" onClick={() => setOpen(false)}>ย่อ</button>
      <div className="chips">
        <button className={today === real ? 'on' : ''} onClick={() => pick(null)}>วันนี้จริง</button>
        {days.map(s => <button key={s.date} className={today === s.date ? 'on' : ''} onClick={() => pick(s.date)}>{titleOf(s).emo} {fmtDate(s.date, { year: false })}</button>)}
        <input type="date" value={today} onChange={e => e.target.value && pick(e.target.value)} />
      </div>
    </div>
  );
}
