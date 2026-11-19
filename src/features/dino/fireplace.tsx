// เตาไฟเล็กติดผนังในห้องไดโน + ปล่องไฟลายลูกกวาดขึ้นเพดาน — แตะ = เปิด/ปิด
// เปิดอยู่ (ทีละ 4 ชม. แล้วดับเอง) ตัวสกปรกช้าลงมาก อึไม่เหม็นจนแมลงวันมาตอม — ลอจิกอยู่ใน logic.ts (fireLit/fireOn/fireOff)
// วาดเป็นเวกเตอร์ทั้งหมด: สลับเปิด/ปิดแล้วขนาดไม่กระโดด ไม่ต้องรอโหลดรูป
import type { Dino } from '../../lib/types';
import { fireLit } from './logic';

export function FireplaceProp({ d, now, onTap }: { d: Dino; now: number; onTap: () => void }) {
  // นาฬิกาห้องเดินทีละ 15 วิ — ใช้เวลาปัจจุบันจริง ไม่งั้นแตะแล้วภาพยังค้างสถานะเดิม แตะซ้ำเลยกลายเป็นสลับกลับ
  const lit = fireLit(d, Math.max(now, Date.now()));
  return (
    <div className={`room-stove ${lit ? 'lit' : ''}`}>
      <i className="stove-pipe" aria-hidden="true" />
      <button className="stove-btn no-walk" aria-pressed={lit} aria-label={lit ? 'เตาไฟเปิดอยู่ (แตะเพื่อปิด)' : 'เปิดเตาไฟ'}
        onPointerDown={e => e.stopPropagation()} onClick={onTap}>
        <span className="stove-glow" aria-hidden="true" />
        <StoveSvg lit={lit} />
      </button>
    </div>
  );
}

function StoveSvg({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 72 80" aria-hidden="true">
      <defs>
        <linearGradient id="stoveBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8C9B" /><stop offset="1" stopColor="#E9576B" /></linearGradient>
        <radialGradient id="stoveFire" cx="50%" cy="70%" r="65%"><stop offset="0" stopColor="#FFE7A3" /><stop offset=".55" stopColor="#FFA352" /><stop offset="1" stopColor="#E65A4C" /></radialGradient>
        <clipPath id="stoveWin"><circle cx="36" cy="39" r="12" /></clipPath>
      </defs>
      {/* คอปล่อง */}
      <rect x="25" y="4" width="22" height="8" rx="4" fill="#D24A60" />
      {/* ตัวเตา */}
      <rect x="18" y="58" width="7" height="7" rx="2.5" fill="#C9445A" />
      <rect x="47" y="58" width="7" height="7" rx="2.5" fill="#C9445A" />
      <rect x="8" y="11" width="56" height="50" rx="18" fill="url(#stoveBody)" stroke="#fff" strokeWidth="2.5" />
      <path d="M17 17Q36 5 55 17Q51 22 47 19Q43 23 39.5 19.5Q36 23 32.5 19.5Q29 23 25 19Q21 22 17 17Z" fill="#fff" />
      {/* ช่องไฟ */}
      <circle cx="36" cy="39" r="15" fill="#FFF1DC" />
      <circle cx="36" cy="39" r="12" fill={lit ? 'url(#stoveFire)' : '#5B3F4B'} />
      <g clipPath="url(#stoveWin)">
        <rect x="26" y="44" width="20" height="5" rx="2.5" fill="#A86E45" transform="rotate(-10 36 46.5)" />
        <rect x="26" y="44" width="20" height="5" rx="2.5" fill="#8E5A38" transform="rotate(10 36 46.5)" />
        {lit && <g className="fire-flames">
          <path d="M36 28c5 6 8 10 7 15-1 3-4 5-7 5s-6-2-7-5c-1-5 2-9 7-15z" fill="#FFB547" />
          <path d="M36 35c3 3.5 4.5 6 4 8.5-.5 2-2 3-4 3s-3.5-1-4-3c-.5-2.5 1-5 4-8.5z" fill="#FFF3B5" />
        </g>}
      </g>
      <path d="M28.5 33a10 10 0 0 1 5.5-4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      {/* ใบฮอลลี่บนหิมะ */}
      <ellipse cx="21" cy="17" rx="4.2" ry="2.2" fill="#3BB574" transform="rotate(-25 21 17)" />
      <ellipse cx="27" cy="16" rx="4.2" ry="2.2" fill="#2E9E62" transform="rotate(20 27 16)" />
      <circle cx="24" cy="18.5" r="2" fill="#E8445A" />
      {/* ชั้นวางติดผนัง */}
      <path d="M12 70h9l-9 9z M60 70h-9l9 9z" fill="#B07850" />
      <rect x="1" y="64" width="70" height="7" rx="3.5" fill="#C98B62" />
      <rect x="3" y="64" width="66" height="2.5" rx="1.25" fill="#DFA97F" />
    </svg>
  );
}
