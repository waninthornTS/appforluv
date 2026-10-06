// พื้นหลังท้องฟ้าทั้งแอป + นาฬิกาด้านบน (เปลี่ยนตาม เช้า / กลางวัน / เย็น / กลางคืน)
import { memo, useEffect } from 'react';
import { TH_DAYS, TH_MONTHS_S } from '../lib/date';
import { periodOf, SKY, useNow } from '../lib/sky';
import { setSoundPrefs, useSoundPrefs } from '../lib/sound';

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

function MusicButton() {
  const { music } = useSoundPrefs();
  return (
    <button className={`music-btn ${music ? 'on' : ''}`} onClick={() => setSoundPrefs({ music: !music })} aria-label={music ? 'ปิดเพลง' : 'เปิดเพลง'} aria-pressed={music}>
      {music ? '🎵' : '🔇'}
    </button>
  );
}

export function TopBar() {
  const now = useNow();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="topbar">
      <div className="clock">
        <span>{SKY[periodOf(now.getHours())].icon}</span>
        <b>{hh}<i className="colon">:</i>{mm} น.</b>
        <span className="clock-sep">·</span>
        <span>วัน{TH_DAYS[now.getDay()]} {now.getDate()} {TH_MONTHS_S[now.getMonth()]}</span>
      </div>
      <MusicButton />
    </div>
  );
}
