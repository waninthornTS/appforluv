// ห้องแบบมินิมอล + ตัวไดโนที่เดินไปมาได้ (แตะพื้นตรงไหน เดินไปตรงนั้น)
import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import type { DinoOutfit, DinoSpecies } from '../../lib/types';
import { isXmas } from '../../lib/theme';
import type { Mood } from './art';
import type { Food, Stage } from './species';
import { DinoSprite, type Pose } from './Sprite';

// ---------- รูปอาหาร 3D (src/assets/scenes/food-*.webp) ----------
const FILES = import.meta.glob('../../assets/scenes/food-*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const FOOD_PIC: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([p, url]) => [p.split('/').pop()!.replace('.webp', '').replace('food-', ''), url]));
export const FoodPic = ({ f, className = '' }: { f: Food; className?: string }) =>
  FOOD_PIC[f.id] ? <img className={`food-pic ${className}`} src={FOOD_PIC[f.id]} alt="" draggable={false} /> : <span className={`food-emo ${className}`}>{f.e}</span>;
export const foodPicUrl = (f: Food) => FOOD_PIC[f.id];

// ---------- ห้อง ----------
export type RoomKind = 'home' | 'bath' | 'bed';
export function Room({ kind, night = false, dark = false, children, onFloorTap, className = '' }: {
  kind: RoomKind; night?: boolean; dark?: boolean; children?: ReactNode; className?: string;
  onFloorTap?: (x: number, depth: number, e: RPointerEvent<HTMLDivElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (!onFloorTap || !ref.current || (e.target as HTMLElement).closest('button, .no-walk')) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    // พื้นอยู่ช่วงล่าง 6%–36% ของห้อง: แตะสูงกว่านั้น = เดินไปไกลสุด
    const fromBottom = (r.bottom - e.clientY) / r.height;
    const depth = Math.max(0, Math.min(1, (fromBottom - .06) / .3));
    onFloorTap(Math.max(14, Math.min(86, x)), depth, e);
  };
  return (
    <div ref={ref} className={`dino-room mroom mroom-${kind} ${night ? 'night' : ''} ${dark ? 'dark' : ''} ${className}`} onPointerDown={down}>
      <div className="mroom-wall" />
      <div className="mroom-floor" />
      {kind === 'home' && <>
        <div className="m-window"><i className="m-sun" /><i className="m-cloud" />{isXmas && <span className="m-snow"><i /><i /><i /><i /><i /><i /></span>}</div>
        {isXmas ? <><XmasLights /><XmasTree /></> : <div className="m-plant"><i /><i /><i /><span /></div>}
        <div className="m-rug" />
      </>}
      {kind === 'bath' && <>
        <div className="m-tiles" />
        <div className="m-mirror" />
        <div className="m-towel" />
        <div className="m-mat" />
      </>}
      {kind === 'bed' && <>
        <div className="m-window moon"><i className="m-moon" /><i className="m-star s1" /><i className="m-star s2" /></div>
        <div className="m-frame" />
        <div className="m-rug bed-rug" />
      </>}
      {children}
      <div className="mroom-dim" />
    </div>
  );
}

// ---------- ธีมคริสต์มาส: ต้นคริสต์มาส (แทนกระถางต้นไม้) + ไฟประดับบนผนัง ----------
const BULB = ['#FF5C6E', '#FFD15C', '#5CC98B', '#6FB6F5', '#FF9DBC'];
// ต้นคริสต์มาสแบบเรียบ: ใบ 3 ชั้นขอบมน + ลูกบอลไม่กี่ลูก + ดาวบนยอด + กระถางชมพู (เวกเตอร์ คมชัดทุกขนาด)
/** ใบหนึ่งชั้น: สามเหลี่ยมมน ยอดที่ (35, top) ฐานกว้าง ±w ที่ระดับ bot */
const tier = (top: number, bot: number, w: number) =>
  `M35 ${top}C39 ${top} ${35 + w} ${bot - 7} ${35 + w - 1} ${bot - 1}Q35 ${bot + 6} ${35 - w + 1} ${bot - 1}C${35 - w} ${bot - 7} 31 ${top} 35 ${top}Z`;
const TIERS: [number, number, number, string][] = [[34, 84, 27, '#2FA56A'], [20, 63, 21, '#3DBA79'], [9, 42, 15, '#56CB8B']];
const BALLS: [number, number, string][] = [[26, 52, '#FF5C6E'], [45, 49, '#FFD15C'], [35, 70, '#FF9DBC'], [20, 77, '#FFD15C'], [50, 75, '#FF5C6E'], [36, 32, '#FF9DBC']];
function XmasTree() {
  return (
    <svg className="m-xtree" viewBox="0 0 70 112" aria-hidden="true">
      <rect x="31" y="82" width="8" height="9" rx="2" fill="#B07850" />
      <path d="M18 92h34l-3.2 15a4 4 0 0 1-3.9 3.2H25.1a4 4 0 0 1-3.9-3.2z" fill="#FF9DB4" />
      <rect x="15" y="87" width="40" height="8" rx="4" fill="#FFB9C9" />
      {TIERS.map(([t, b, w, c], i) => <g key={i}>
        {i > 0 && <path d={tier(t, b + 2.5, w)} fill="#25915B" opacity=".45" />}
        <path d={tier(t, b, w)} fill={c} />
      </g>)}
      {BALLS.map(([x, y, c], i) => <g key={i}>
        <circle cx={x} cy={y} r="3.6" fill={c} />
        <circle cx={x - 1.2} cy={y - 1.2} r="1" fill="#fff" opacity=".8" />
      </g>)}
      <path className="xt-star" d="M35 1.5l2.8 5.6 6.1.9-4.4 4.3 1 6.1L35 15.5l-5.5 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#FFD15C" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function XmasLights() {
  return (
    <div className="m-lights" aria-hidden="true">
      <svg viewBox="0 0 300 30" preserveAspectRatio="none"><path d="M0 4 Q37 26 75 6 Q112 26 150 6 Q187 26 225 6 Q262 26 300 4" fill="none" stroke="#5E8A5A" strokeWidth="2" /></svg>
      {Array.from({ length: 12 }, (_, i) => {
        const x = (i + .5) / 12, seg = (x * 4) % 1, y = 4 + Math.sin(seg * Math.PI) * 15;
        return <i key={i} style={{ left: `${x * 100}%`, top: `${y}px`, '--c': BULB[i % BULB.length], animationDelay: `${(i % 3) * .45}s` } as React.CSSProperties} />;
      })}
    </div>
  );
}

// ---------- ตัวไดโนเดินได้ ----------
export interface ActorState { x: number; depth: number; face: 'left' | 'right'; walking: boolean; dur: number; land: number }
export function useActor(start = { x: 50, depth: .3 }) {
  const [a, setA] = useState<ActorState>({ ...start, face: 'left', walking: false, dur: 0, land: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<(() => void) | undefined>(undefined); // เดินใหม่ก่อนถึง = จบการเดินเดิมด้วย
  const cur = useRef(a);
  cur.current = a;
  const walkTo = useCallback((x: number, depth = cur.current.depth, speed = 1) => new Promise<void>(done => {
    pending.current?.();
    pending.current = done;
    const p = cur.current;
    const dist = Math.hypot((x - p.x) * 3.4, (depth - p.depth) * 90); // ประมาณเป็นพิกเซล
    if (dist < 6) { done(); return; }
    const dur = Math.max(.35, Math.min(2.4, dist / (95 * speed)));
    clearTimeout(timer.current);
    setA({ x, depth, face: Math.abs(x - p.x) < 2 ? p.face : x > p.x ? 'right' : 'left', walking: true, dur, land: p.land });
    timer.current = setTimeout(() => { setA(s => ({ ...s, walking: false, land: Date.now() })); pending.current = undefined; done(); }, dur * 1000);
  }), []);
  const face = useCallback((f: 'left' | 'right') => setA(s => ({ ...s, face: f })), []);
  const place = useCallback((x: number, depth: number) => { clearTimeout(timer.current); setA(s => ({ ...s, x, depth, walking: false, dur: 0 })); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { a, walkTo, face, place };
}

export function Actor({ a, species, stage, size = 175, mood = 'normal', pose, react, outfit, children, onTap, className = '' }: {
  a: ActorState; species: DinoSpecies; stage: Stage; size?: number; mood?: Mood; pose?: Pose; react?: string; outfit?: DinoOutfit; children?: ReactNode;
  onTap?: () => void; className?: string;
}) {
  const scale = 1 - a.depth * .28;
  const landing = Date.now() - a.land < 400;
  return (
    <div className={`actor ${a.walking ? 'walking' : ''} ${landing ? 'landing' : ''} ${react || ''} ${className}`}
      style={{ left: `${a.x}%`, bottom: `${6 + a.depth * 30}%`, zIndex: 20 - Math.round(a.depth * 10), transitionDuration: `${a.dur}s`, '--s': scale } as React.CSSProperties}
      onPointerDown={e => { if (onTap) { e.stopPropagation(); onTap(); } }}>
      <span className="actor-shadow" />
      <div className="actor-body">
        <DinoSprite species={species} stage={stage} size={size} mood={mood} pose={pose} anim={a.walking ? 'run' : 'idle'} flip={a.face === 'right'} outfit={outfit} />
        {children}
      </div>
    </div>
  );
}

/** เดินเล่นเองเป็นระยะตอนไม่มีใครเล่นด้วย */
export function useWander(walkTo: (x: number, d?: number, speed?: number) => Promise<void>, enabled: boolean,
  { gap = [6000, 13000], speed = .55, range = [25, 75] }: { gap?: [number, number]; speed?: number; range?: [number, number] } = {}) {
  const [g0, g1] = gap, [r0, r1] = range;
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const go = () => {
      t = setTimeout(() => { walkTo(r0 + Math.random() * (r1 - r0), Math.random() * .7, speed).then(go); }, g0 + Math.random() * (g1 - g0));
    };
    go();
    return () => clearTimeout(t);
  }, [walkTo, enabled, g0, g1, r0, r1, speed]);
}
