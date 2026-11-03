// ห้องเลี้ยงไดโนวันเกิด Ploy/Dream: สายรุ้งกระดาษ + ดาวห้อย, เค้กก้อนใหญ่บนโต๊ะ (แตะ = ไดโนเดินมาเป่าเทียน), กล่องของขวัญ,
// หน้าต่างมีลูกโป่งลอยผ่าน (กลางวัน) / พลุเล็กๆ (กลางคืน) — แสดงเฉพาะวันเกิด
import { useEffect, useRef, type CSSProperties } from 'react';
import { burstHearts } from '../../ui/overlays';

/** out = เวลาที่เทียนดับ (0 = เทียนติดอยู่) · onTap = แตะเค้ก (ห้องเป็นคนสั่งให้ไดโนเดินมาเป่า) */
export function BirthdayParty({ night, out, onTap }: { night: boolean; out: number; onTap: () => void }) {
  const cake = useRef<HTMLButtonElement>(null);

  // เทียนดับ = กระดาษสี/หัวใจระเบิดออกจากเค้ก
  useEffect(() => {
    if (!out || !cake.current) return;
    const r = cake.current.getBoundingClientRect();
    burstHearts(r.left + r.width / 2, r.top + 14, 16, ['🎉', '🎊', '✨', '💖', '🎂']);
  }, [out]);

  return (
    <div className="party" aria-hidden="true">
      {/* สายรุ้งกระดาษโค้งตามผนัง + ดาวกระดาษห้อย */}
      <svg className="party-swags" viewBox="0 0 360 70" preserveAspectRatio="none">
        <path d="M-5 6 Q45 46 95 8 Q140 44 185 8 Q232 46 278 8 Q322 44 365 6" fill="none" stroke="#FF9EBB" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 11" />
        <path d="M-5 6 Q45 46 95 8 Q140 44 185 8 Q232 46 278 8 Q322 44 365 6" fill="none" stroke="#FFD36B" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 11" strokeDashoffset="6" />
        <path d="M-5 14 Q60 60 120 16 Q180 60 240 16 Q300 60 365 14" fill="none" stroke="#9BD7FF" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
        <path d="M-5 14 Q60 60 120 16 Q180 60 240 16 Q300 60 365 14" fill="none" stroke="#C7A8FF" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" strokeDashoffset="5" />
      </svg>
      {[[22, 30, '#FFD36B'], [48, 44, '#FF9EBB'], [72, 26, '#9BD7FF']].map(([l, len, c], i) => (
        <span key={i} className="party-star" style={{ left: `${l}%`, '--len': `${len}px`, '--c': c, animationDelay: `${i * -.9}s` } as CSSProperties}>
          <svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" fill="var(--c)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </span>
      ))}

      {/* หน้าต่าง: ลูกโป่งลอยผ่าน / พลุ */}
      <div className="party-window">
        {night
          ? [0, 1, 2].map(i => <i key={i} className="firework" style={{ left: `${22 + i * 26}%`, top: `${30 + (i % 2) * 22}%`, animationDelay: `${i * .9}s`, '--c': ['#FFD36B', '#FF9EBB', '#9BD7FF'][i] } as CSSProperties} />)
          : [0, 1].map(i => <i key={i} className="win-balloon" style={{ left: `${26 + i * 36}%`, animationDelay: `${i * 2.2}s`, '--c': i ? '#9BD7FF' : '#FF9EBB' } as CSSProperties} />)}
      </div>

      {/* กล่องของขวัญ */}
      <svg className="party-gift g1" viewBox="0 0 40 40"><rect x="4" y="14" width="32" height="24" rx="4" fill="#C7A8FF" /><rect x="2" y="10" width="36" height="8" rx="3" fill="#B394F5" /><rect x="17" y="10" width="6" height="28" fill="#FFE27A" /><path d="M20 10c-6-8-13-3-8 0M20 10c6-8 13-3 8 0" fill="none" stroke="#FFE27A" strokeWidth="3" strokeLinecap="round" /></svg>
      <svg className="party-gift g2" viewBox="0 0 40 40"><rect x="5" y="16" width="30" height="22" rx="4" fill="#9BD7FF" /><rect x="3" y="12" width="34" height="7" rx="3" fill="#7CC4F2" /><rect x="17" y="12" width="6" height="26" fill="#FF9EBB" /><path d="M20 12c-5-7-12-3-7 0M20 12c5-7 12-3 7 0" fill="none" stroke="#FF9EBB" strokeWidth="3" strokeLinecap="round" /></svg>

      {/* เค้กก้อนใหญ่บนโต๊ะ: แตะ = ไดโนเดินมาเป่าเทียน */}
      <button ref={cake} className={`party-cake no-walk ${out ? 'out' : ''}`} onPointerDown={e => { e.stopPropagation(); onTap(); }} aria-label="ให้ไดโนเป่าเทียน">
        <svg viewBox="0 0 80 84">
          <ellipse cx="40" cy="80" rx="30" ry="4" fill="rgba(120,80,40,.18)" />
          <rect x="37" y="58" width="6" height="22" rx="2" fill="#D9A877" />
          <ellipse cx="40" cy="58" rx="32" ry="6" fill="#F1C894" />
          <path d="M14 34h52v18a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="#FFF3F7" />
          <path d="M14 36c4 6 8 6 10 0s7 6 10 0 7 6 10 0 7 6 10 0 7 6 12 0" fill="none" stroke="#FF9EBB" strokeWidth="5" strokeLinecap="round" />
          <path d="M14 46h52" stroke="#FFD1E0" strokeWidth="3" />
          <circle cx="24" cy="50" r="2" fill="#9BD7FF" /><circle cx="40" cy="52" r="2" fill="#FFD36B" /><circle cx="56" cy="50" r="2" fill="#C7A8FF" />
          {[28, 40, 52].map((x, i) => <rect key={x} x={x - 2} y="20" width="4" height="15" rx="2" fill={['#9BD7FF', '#FF9EBB', '#FFD36B'][i]} />)}
        </svg>
        {[28, 40, 52].map((x, i) => out
          ? <i key={x} className="smoke" style={{ left: `${(x / 80) * 100}%`, animationDelay: `${i * .12}s` }} />
          : <i key={x} className="flame" style={{ left: `${(x / 80) * 100}%`, animationDelay: `${i * .17}s` }} />)}
      </button>
    </div>
  );
}
