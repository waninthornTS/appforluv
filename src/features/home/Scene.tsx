// ฉากหน้าแรก: Ploy & Dream ยืนบนเนินหญ้า ท้องฟ้าเปลี่ยนตามเวลา แตะตัวละครแล้วจะพูด
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Character, HEART_SVG } from '../../characters/Character';
import type { CharKey } from '../../characters/svg';
import { isEn, T } from '../../lib/i18n';
import { PROFILE } from '../../lib/store';
import type { Period } from '../../lib/sky';

// คำพูดเวลาแตะ ({o} = ชื่ออีกคน)
const LINES_TH: Record<CharKey, string[]> = {
  ploy: ['วันนี้กินข้าวยัง?', 'เดี๋ยวจัดการให้เอง 😎', 'วางแผนทริปไว้แล้วนะ ✈️', '{o} น่ารักจัง', 'วันนี้เหนื่อยมั้ย?', 'ไปดูหนังกันมั้ย 🎬', 'อย่านอนดึกนะ', 'รักนะ 💕'],
  dream: ['{o}~ 🥺', 'น้องหมีคิดถึง {o} 🧸', 'ไปกินขนมกันน้า 🍰', 'ง่วงแล้ววว 😴', 'อยากไปเที่ยวด้วยกัน ✈️', 'หิวชานมไข่มุก 🧋', 'คิดถึงจัง~', 'รักนะ 💕'],
};
const LINES_EN: Record<CharKey, string[]> = {
  ploy: ['Have you eaten yet?', "Leave it to me 😎", 'Trip plan is ready ✈️', '{o} is so cute', 'Tired today?', 'Movie night? 🎬', "Don't stay up late", 'Love you 💕'],
  dream: ['{o}~ 🥺', 'Teddy misses {o} 🧸', "Let's get dessert 🍰", 'So sleepy~ 😴', "Let's travel together ✈️", 'Craving bubble tea 🧋', 'Miss you~', 'Love you 💕'],
};

const STARS = Array.from({ length: 14 }, (_, i) => ({ l: (i * 37) % 100, t: (i * 23) % 55 + 4, d: i * 0.3 }));
const GOLD = [[8, 30], [30, 12], [62, 22], [86, 40], [48, 8]];
const STAR_PATH = 'M5 0 L6.2 3.6 L10 3.8 L7 6.1 L8 10 L5 7.7 L2 10 L3 6.1 L0 3.8 L3.8 3.6Z';

const Flower = ({ color, style }: { color: string; style: React.CSSProperties }) => (
  <svg className="flower" style={style} viewBox="0 0 20 26" aria-hidden="true">
    <path d="M10 12 V26" stroke="#3F8F4A" strokeWidth="2" />
    {[0, 72, 144, 216, 288].map(a => <circle key={a} cx="10" cy="5.5" r="4" fill={color} transform={`rotate(${a} 10 10)`} />)}
    <circle cx="10" cy="10" r="2.8" fill="#FFD66B" />
  </svg>
);

// แสดงข้อความทีละตัวแบบในเกม (ตัดตามตัวอักษรที่มองเห็น ไม่ตัดสระ/วรรณยุกต์ไทยแยก)
const graphemes = (t: string) => {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? [...new Seg('th', { granularity: 'grapheme' }).segment(t)].map(x => x.segment) : [...t];
};

function useTypewriter(text: string, speed = 45) {
  const [n, setN] = useState(0);
  const parts = useMemo(() => graphemes(text), [text]);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const t = setInterval(() => setN(v => (v >= parts.length ? v : v + 1)), speed);
    return () => clearInterval(t);
  }, [text, parts, speed]);
  return { shown: parts.slice(0, n).join(''), done: n >= parts.length };
}

function Person({ who, name, other }: { who: CharKey; name: string; other: string }) {
  const [line, setLine] = useState('');
  const [hop, setHop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { shown, done } = useTypewriter(line);
  const tap = () => {
    const pool = (isEn() ? LINES_EN : LINES_TH)[who];
    let next = pool[Math.floor(Math.random() * pool.length)].replace('{o}', other);
    if (next === line) next = pool[(pool.indexOf(next) + 1) % pool.length].replace('{o}', other);
    setLine(next);
    setHop(n => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(''), 2600);
  };
  return (
    <button className={`char-wrap ${line ? 'love' : ''}`} data-who={who === 'ploy' ? 'A' : 'B'} onClick={tap} aria-label={name}>
      <div className={`bubble ${line ? 'show' : ''}`} aria-live="polite">
        <span className="speaker">{name}</span>{shown}{line && done && <span className="next">▼</span>}
      </div>
      <div key={hop} className={hop ? 'hop' : ''}><Character who={who} /></div>
      <span className="name-tag">{name}</span>
    </button>
  );
}

export const Scene = memo(function Scene({ sky, days }: { sky: Period; days: number }) {
  return (
    <section className={`scene sky-${sky}`} aria-label={T('Ploy และ Dream', 'Ploy and Dream')}>
      <div className="sun" />
      {sky === 'night' && STARS.map((s, i) => <i key={i} className="star" style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${s.d}s` }} />)}
      {sky === 'night' && GOLD.map(([x, y], i) => (
        <svg key={i} className="gstar" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.5}s` }} viewBox="0 0 10 10"><path d={STAR_PATH} fill="#FFE08A" /></svg>
      ))}
      <div className="cloud c1" /><div className="cloud c2" />
      <div className="ground" />
      <svg className="bench" viewBox="0 0 60 38" aria-hidden="true">
        <rect x="3" y="3" width="54" height="7" rx="2.5" fill="#B5784A" /><rect x="3" y="12" width="54" height="7" rx="2.5" fill="#A56B40" />
        <rect x="1" y="21" width="58" height="6" rx="2.5" fill="#8C5A36" /><rect x="7" y="26" width="5" height="12" rx="1.5" fill="#6E4127" /><rect x="48" y="26" width="5" height="12" rx="1.5" fill="#6E4127" />
      </svg>
      <Flower color="#FFB3CB" style={{ left: '5%', bottom: 34 }} />
      <Flower color="#E9D8FF" style={{ left: '13%', bottom: 18, width: 15 }} />
      <Flower color="#FFC9DA" style={{ right: '4%', bottom: 12 }} />
      <svg className="sprout" viewBox="0 0 24 22" aria-hidden="true">
        <path d="M12 22 V11" stroke="#3F8F4A" strokeWidth="2.2" />
        <path d="M12 12 Q4 12 3 4 Q11 4 12 12Z M12 10 Q19 9 21 2 Q13 2 12 10Z" fill="#6CC46A" />
      </svg>
      <div className="couple">
        <Person who="ploy" name={PROFILE.nameA} other={PROFILE.nameB} />
        <div className="center-heart">
          <span dangerouslySetInnerHTML={{ __html: HEART_SVG }} />
          <div className="dday">D+{days.toLocaleString()}</div>
        </div>
        <Person who="dream" name={PROFILE.nameB} other={PROFILE.nameA} />
      </div>
    </section>
  );
});
