// เตาผิงในห้องไดโน: แตะจุดไฟได้ทีละ 4 ชม. (ดับเอง แล้วค่อยแตะจุดใหม่) — ระหว่างไฟติด ตัวสกปรกช้าลงมาก อึไม่เหม็นจนแมลงวันมาตอม
// รูป 3D ที่เจนจาก Gemini: src/assets/scenes/fireplace.webp (ไฟติด) + fireplace-off.webp (ไฟดับ) — ไม่มีไฟล์ใช้ภาพวาดเวกเตอร์แทน
import type { Dino } from '../../lib/types';
import { fireLit } from './logic';
import { propPic } from './rooms';

export function FireplaceProp({ d, now, onTap }: { d: Dino; now: number; onTap: () => void }) {
  const lit = fireLit(d, now);
  const on = propPic('fireplace'), off = propPic('fireplace-off');
  const pic = lit ? on : off || on;
  return (
    <button className={`room-fire no-walk ${lit ? 'lit' : ''} ${pic ? 'has-pic' : ''}`} onPointerDown={e => { e.stopPropagation(); onTap(); }}
      aria-label={lit ? 'เตาผิงติดอยู่ (แตะเพื่อดับ)' : 'จุดเตาผิง'}>
      {lit && <span className="fire-glow" aria-hidden="true" />}
      {pic ? <img src={pic} alt="" draggable={false} className={!lit && !off ? 'cold' : ''} /> : <FireplaceSvg lit={lit} />}
      {lit && <span className="fire-sparks" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  );
}

function FireplaceSvg({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 90 80" aria-hidden="true">
      <rect x="4" y="10" width="82" height="68" rx="10" fill="#F6D9CF" stroke="#fff" strokeWidth="3" />
      <rect x="0" y="4" width="90" height="12" rx="5" fill="#C98B62" />
      <path d="M24 78V50a21 21 0 0 1 42 0v28z" fill="#5A3B33" />
      <rect x="28" y="66" width="34" height="7" rx="3.5" fill="#A86E45" />
      {lit && <g className="fire-flames">
        <path d="M45 40c7 8 11 14 9 21-1 5-5 8-9 8s-8-3-9-8c-2-7 2-13 9-21z" fill="#FF8A3C" />
        <path d="M45 50c4 5 6 8 5 12-1 3-3 4-5 4s-4-1-5-4c-1-4 1-7 5-12z" fill="#FFD15C" />
      </g>}
    </svg>
  );
}
