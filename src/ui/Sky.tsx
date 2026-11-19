// พื้นหลังท้องฟ้าทั้งแอป + นาฬิกาด้านบน (เปลี่ยนตาม เช้า / กลางวัน / เย็น / กลางคืน)
import { memo, useEffect } from 'react';
import { TH_DAYS, TH_MONTHS_S } from '../lib/date';
import { periodOf, SKY, useNow } from '../lib/sky';
import { isXmas } from '../lib/theme';
import { MenuButton } from './Settings';

// ดาวตำแหน่งคงที่ (ไม่สุ่มใหม่ทุกครั้งที่เปิด)
const STARS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 53.7) % 100, y: (i * 29.3) % 70, s: 1.5 + (i % 3), d: (i % 7) * 0.4 }));

export const SkyBackground = memo(function SkyBackground() {
  const period = periodOf(useNow(60_000).getHours());
  useEffect(() => {
    document.documentElement.dataset.sky = period;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', SKY[period].theme);
  }, [period]);
  return (
    <div id="sky" aria-hidden="true">
      <div className="sky-sun" /><div className="sky-moon" />
      {STARS.map((s, i) => <i key={i} className="sky-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
      <div className="sky-cloud k1" /><div className="sky-cloud k2" /><div className="sky-cloud k3" />
      <span className="sky-heart h1">♥</span><span className="sky-heart h2">♥</span><span className="sky-heart h3">♥</span>
      {isXmas && <XmasSky />}
    </div>
  );
});

// ---------- ธีมคริสต์มาส: หิมะตกทั้งแอป + ไฟประดับห้อยขอบบน ----------
const FLAKES = Array.from({ length: 36 }, (_, i) => ({ x: (i * 37.3) % 100, s: 3 + (i % 4) * 1.6, dur: 9 + (i % 6) * 2.2, delay: -((i * 1.7) % 14), big: i % 7 === 0 }));
const BULBS = ['#FF5C6E', '#FFD15C', '#5CC98B', '#6FB6F5', '#FF9DBC'];
function XmasSky() {
  return (
    <>
      <div className="xm-lights">
        <svg viewBox="0 0 400 34" preserveAspectRatio="none"><path d="M0 2 Q25 26 50 4 T100 4 T150 4 T200 4 T250 4 T300 4 T350 4 T400 2" fill="none" stroke="#4E7A55" strokeWidth="2" /></svg>
        {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${3.125 + i * 6.25}%`, '--c': BULBS[i % BULBS.length], animationDelay: `${(i % 3) * .5}s` } as React.CSSProperties} />)}
      </div>
      {FLAKES.map((f, i) => f.big
        ? <span key={i} className="xm-flake big" style={{ left: `${f.x}%`, fontSize: f.s * 3, animationDuration: `${f.dur * 1.3}s`, animationDelay: `${f.delay}s` }}>❄</span>
        : <i key={i} className="xm-flake" style={{ left: `${f.x}%`, width: f.s, height: f.s, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />)}
    </>
  );
}

export function TopBar() {
  const now = useNow();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="topbar">
      <MenuButton />
      <div className="clock">
        <span>{SKY[periodOf(now.getHours())].icon}</span>
        <b>{hh}<i className="colon">:</i>{mm} น.</b>
        <span className="clock-sep">·</span>
        <span>วัน{TH_DAYS[now.getDay()]} {now.getDate()} {TH_MONTHS_S[now.getMonth()]}</span>
      </div>
    </div>
  );
}
