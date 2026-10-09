// ห้องแบบมินิมอล + ตัวไดโนที่เดินไปมาได้ (แตะพื้นตรงไหน เดินไปตรงนั้น)
import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import type { DinoSpecies } from '../../lib/types';
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
        <div className="m-window"><i className="m-sun" /><i className="m-cloud" /></div>
        <div className="m-plant"><i /><i /><i /><span /></div>
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

export function Actor({ a, species, stage, size = 175, mood = 'normal', pose, react, children, onTap, className = '' }: {
  a: ActorState; species: DinoSpecies; stage: Stage; size?: number; mood?: Mood; pose?: Pose; react?: string; children?: ReactNode;
  onTap?: () => void; className?: string;
}) {
  const scale = 1 - a.depth * .28;
  const landing = Date.now() - a.land < 400;
  return (
    <div className={`actor ${a.walking ? 'walking' : ''} ${landing ? 'landing' : ''} ${react || ''} ${className}`}
      style={{ left: `${a.x}%`, bottom: `${6 + a.depth * 30}%`, zIndex: 20 - Math.round(a.depth * 10), transitionDuration: `${a.dur}s`, '--s': scale } as React.CSSProperties}
      onPointerDown={e => { if (onTap) { e.stopPropagation(); onTap(); } }}>
      <span className="actor-shadow" />
      <div className="actor-body" key={a.land}>
        <DinoSprite species={species} stage={stage} size={size} mood={mood} pose={pose} anim={a.walking ? 'run' : 'idle'} flip={a.face === 'right'} />
        {children}
      </div>
    </div>
  );
}

/** เดินเล่นเองเป็นระยะตอนไม่มีใครเล่นด้วย */
export function useWander(walkTo: (x: number, d?: number, speed?: number) => Promise<void>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const go = () => {
      t = setTimeout(() => { walkTo(25 + Math.random() * 50, Math.random() * .7, .55).then(go); }, 6000 + Math.random() * 7000);
    };
    go();
    return () => clearTimeout(t);
  }, [walkTo, enabled]);
}
