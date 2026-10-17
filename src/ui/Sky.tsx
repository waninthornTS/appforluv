// พื้นหลังท้องฟ้าทั้งแอป + นาฬิกาด้านบน (เปลี่ยนตาม เช้า / กลางวัน / เย็น / กลางคืน)
import { memo, useEffect, useState } from 'react';
import { TH_DAYS, TH_MONTHS_S } from '../lib/date';
import { periodOf, SKY, useNow } from '../lib/sky';
import { refreshApp } from '../lib/update';
import { toast } from './overlays';

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
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    const r = await refreshApp(() => toast('มีเวอร์ชันใหม่ กำลังอัปเดต… ✨'));
    if (r === 'latest') { toast('อัปเดตล่าสุดแล้ว ✨'); setBusy(false); }
  };
  return (
    <div className="topbar">
      <div className="clock">
        <button className={`refresh-btn ${busy ? 'spin' : ''}`} onClick={refresh} aria-label="รีเฟรช อัปเดตแอป">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M20.5 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span>{SKY[periodOf(now.getHours())].icon}</span>
        <b>{hh}<i className="colon">:</i>{mm} น.</b>
        <span className="clock-sep">·</span>
        <span>วัน{TH_DAYS[now.getDay()]} {now.getDate()} {TH_MONTHS_S[now.getMonth()]}</span>
      </div>
    </div>
  );
}
