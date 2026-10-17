// ฉากหน้าแรก: Ploy & Dream ยืนบนเนินหญ้า ท้องฟ้าเปลี่ยนตามเวลา กดปุ่มหัวใจด้านขวาแล้วสองคนกอดกัน
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Character, HEART_SVG } from '../../characters/Character';
import { PROFILE } from '../../lib/store';
import type { Who } from '../../lib/types';
import type { Period } from '../../lib/sky';
import { SceneDecor } from '../celebrate/Celebrate';
import type { Special } from '../celebrate/days';

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

// ปุ่มหัวใจด้านขวาของฉาก: กดแล้วสองคนเดินเข้าไปกอดกันแบบนุ่มๆ ด้วย CSS (ป้ายชื่ออยู่ที่เดิม ขยับแค่ตัว)
const HUG_MS = 3000;

function Person({ who, name }: { who: Who; name: string }) {
  return (
    <div className="char-wrap" data-who={who}>
      <div className="char-body">
        <Character who={who === 'A' ? 'ploy' : 'dream'} />
        <i className="blush" />
      </div>
      <span className="name-tag">{name}</span>
    </div>
  );
}

/** หัวใจลอยขึ้นตอนกอด */
function HugHearts() {
  const bits = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: (Math.random() - .5) * 150, d: .5 + Math.random() * 1.4, i })), []);
  return (
    <div className="act-fx" aria-hidden="true">
      {bits.map(b => <i key={b.i} style={{ '--x': `${b.x}px`, animationDelay: `${b.d}s` } as CSSProperties}>{['💗', '💕', '💖'][b.i % 3]}</i>)}
    </div>
  );
}

export const Scene = memo(function Scene({ sky, days, special }: { sky: Period; days: number; special?: Special | null }) {
  const [hug, setHug] = useState(0); // เวลาที่กดกอด (0 = ไม่ได้กอด)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const play = () => {
    if (hug) return;
    setHug(Date.now());
    timer.current = setTimeout(() => setHug(0), HUG_MS);
  };
  return (
    <section className={`scene sky-${sky}`} aria-label="Ploy และ Dream">
      <div className="sun" />
      {sky === 'night' && STARS.map((s, i) => <i key={i} className="star" style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${s.d}s` }} />)}
      {sky === 'night' && GOLD.map(([x, y], i) => (
        <svg key={i} className="gstar" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.5}s` }} viewBox="0 0 10 10"><path d={STAR_PATH} fill="#FFE08A" /></svg>
      ))}
      <div className="cloud c1" /><div className="cloud c2" />
      {special && <SceneDecor s={special} />}
      <div className="ground" />
      <Flower color="#FFB3CB" style={{ left: '5%', bottom: 34 }} />
      <Flower color="#E9D8FF" style={{ left: '13%', bottom: 18, width: 15 }} />
      <Flower color="#FFC9DA" style={{ right: '4%', bottom: 12 }} />
      <svg className="sprout" viewBox="0 0 24 22" aria-hidden="true">
        <path d="M12 22 V11" stroke="#3F8F4A" strokeWidth="2.2" />
        <path d="M12 12 Q4 12 3 4 Q11 4 12 12Z M12 10 Q19 9 21 2 Q13 2 12 10Z" fill="#6CC46A" />
      </svg>
      <div className={`couple ${hug ? 'do-hug' : ''}`} key={hug}>
        <Person who="A" name={PROFILE.nameA} />
        <div className="center-heart">
          <span dangerouslySetInnerHTML={{ __html: HEART_SVG }} />
          <div className="dday">D+{days.toLocaleString()}</div>
        </div>
        <Person who="B" name={PROFILE.nameB} />
        {hug > 0 && <HugHearts />}
      </div>
      <div className="act-btns">
        <button className={hug ? 'on' : ''} onClick={play} aria-label="กอด">
          {/* วาดหัวใจเอง (อิโมจิแต่ละเครื่องวางไม่ตรงกลาง) */}
          <svg className="act-heart" viewBox="0 .6 24 24" aria-hidden="true">
            <defs><linearGradient id="actHeart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9CC2" /><stop offset="1" stopColor="#F2548A" /></linearGradient></defs>
            <path d="M12 21.2C11.6 21 3 15.6 3 9.1 3 6.2 5.2 4 7.9 4c1.7 0 3.2.9 4.1 2.3C12.9 4.9 14.4 4 16.1 4 18.8 4 21 6.2 21 9.1c0 6.5-8.6 11.9-9 12.1Z" fill="url(#actHeart)" />
            <ellipse cx="8.2" cy="8.4" rx="2.2" ry="1.3" fill="#fff" opacity=".75" transform="rotate(-30 8.2 8.4)" />
          </svg>
        </button>
      </div>
    </section>
  );
});
