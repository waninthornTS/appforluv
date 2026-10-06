// พื้นหลังท้องฟ้าทั้งแอป + นาฬิกาด้านบน (เปลี่ยนตาม เช้า / กลางวัน / เย็น / กลางคืน)
import { memo, useEffect } from 'react';
import { daysLong, monthsShort } from '../lib/date';
import { isEn, T } from '../lib/i18n';
import { periodOf, SKY, useNow } from '../lib/sky';

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
    </div>
  );
});

export function TopBar() {
  const now = useNow();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="topbar">
      <div className="clock">
        <span>{SKY[periodOf(now.getHours())].icon}</span>
        <b>{hh}<i className="colon">:</i>{mm}{T(' น.', '')}</b>
        <span className="clock-sep">·</span>
        <span>{isEn() ? `${daysLong()[now.getDay()].slice(0, 3)} ${now.getDate()} ${monthsShort()[now.getMonth()]}` : `วัน${daysLong()[now.getDay()]} ${now.getDate()} ${monthsShort()[now.getMonth()]}`}</span>
      </div>
    </div>
  );
}
