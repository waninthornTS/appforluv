// นาฬิกาด้านบน + พื้นหลังท้องฟ้าที่เปลี่ยนตามเวลา (เช้า / กลางวัน / เย็น / กลางคืน)
import { $, TH_DAYS, TH_MONTHS_S, refresh } from './utils.js';

export const SKY = {
  morning: { icon: '🌅', label: 'ยามเช้า', theme: '#FFD9C7' },
  day: { icon: '☀️', label: 'กลางวัน', theme: '#CFEAFF' },
  evening: { icon: '🌇', label: 'ยามเย็น', theme: '#FFB199' },
  night: { icon: '🌙', label: 'กลางคืน', theme: '#24224F' },
};

export function period(h = new Date().getHours()) {
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'evening';
  return 'night';
}

function buildSky() {
  const sky = $('#sky');
  // ดาวสุ่มตำแหน่งแบบคงที่ (ใช้สูตรแทน Math.random เพื่อไม่ให้กระพริบตำแหน่งทุกครั้งที่เปิด)
  const stars = Array.from({ length: 34 }, (_, i) => {
    const x = (i * 53.7) % 100, y = (i * 29.3) % 70, s = 1.5 + (i % 3);
    return `<i class="sky-star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${(i % 7) * .4}s"></i>`;
  }).join('');
  sky.innerHTML = `<div class="sky-sun"></div><div class="sky-moon"></div>${stars}
    <div class="sky-cloud k1"></div><div class="sky-cloud k2"></div><div class="sky-cloud k3"></div>
    <span class="sky-heart h1">♥</span><span class="sky-heart h2">♥</span><span class="sky-heart h3">♥</span>`;
}

let current = '';
function tick() {
  const now = new Date();
  const p = period(now.getHours());
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  $('#clock-ico').textContent = SKY[p].icon;
  $('#clock-time').innerHTML = `${hh}<i class="colon">:</i>${mm} น.`;
  $('#clock-date').textContent = `วัน${TH_DAYS[now.getDay()]} ${now.getDate()} ${TH_MONTHS_S[now.getMonth()]}`;
  if (p !== current) {
    const first = !current;
    current = p;
    document.documentElement.dataset.sky = p;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', SKY[p].theme);
    if (!first) refresh(); // ให้ฉากในหน้าแรกเปลี่ยนตามด้วย
  }
}

export function startSky() {
  buildSky();
  tick();
  setInterval(tick, 10_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
