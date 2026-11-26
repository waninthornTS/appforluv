import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DinoOutfit, DinoSpecies } from '../../lib/types';
import { dinoSvg, eggSvg, type Mood } from './art';
import { dressedOf } from './outfits';
import type { Stage } from './species';

// ขนาดแต่ละวัยเทียบกับตัวโต
const SCALE: Record<Stage, number> = { egg: .62, baby: .66, teen: .84, adult: 1 };

// รูป 3D ที่เจนจาก Gemini (src/assets/dino/<พันธุ์>-<ท่า>.webp) — มีรูปไหนใช้รูปนั้น ไม่มีใช้ภาพวาดเวกเตอร์แทน
// ท่า: egg baby teen adult blink happy eat eatdown chew sleep sick run run2 jump bath (ถ้ามี <พันธุ์>-<วัย>-<ท่า> จะใช้ก่อน)
const FILES = import.meta.glob('../../assets/dino/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PHOTOS: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([p, url]) => [p.split('/').pop()!.replace('.webp', ''), url]));

export type Pose = 'eat' | 'eatdown' | 'chew' | 'bath' | 'jump' | 'sleep' | 'happy' | 'sick' | 'run' | 'blink';
export const photo = (species: DinoSpecies, key: string) => PHOTOS[`${species}-${key}`];

/** หาชื่อรูปตามวัย + ท่า (วัยเด็ก/วัยรุ่นที่ยังไม่มีรูปท่าของตัวเอง ยืมรูปท่าของตัวโตเฉพาะท่าที่ตัวต้องเปลี่ยนรูปร่าง) */
export function photoKeyOf(species: DinoSpecies, stage: Stage, key: string): string | undefined {
  const k = (s: string) => (PHOTOS[`${species}-${s}`] ? `${species}-${s}` : undefined);
  if (stage === 'egg') return k('egg');
  if (!key) return k(stage);
  const own = k(`${stage}-${key}`);
  if (own) return own;
  const borrow = ['sleep', 'run', 'run2', 'jump', 'bath', 'eatdown', 'chew'];
  if (stage === 'adult' || borrow.includes(key)) return k(key);
  return undefined;
}
const moodKey = (m: Mood) => (m === 'normal' || m === 'sad' ? '' : m);

/** โหลดรูปทุกท่าของตัวนี้ไว้ก่อน จะได้สลับท่าไม่กระพริบ */
const preloaded = new Set<string>();
function preload(species: DinoSpecies) {
  if (preloaded.has(species)) return;
  preloaded.add(species);
  for (const [k, url] of Object.entries(PHOTOS)) if (k.startsWith(`${species}-`)) { const i = new Image(); i.src = url; }
}

/** ไดโน — size = ความสูงของตัวโตเต็มวัย (px) วัยอื่นย่อตามสัดส่วน
 *  anim: 'idle' หายใจ/กะพริบตา/โยกตัว, 'run' วิ่ง (สลับเฟรมขา), 'none' นิ่ง
 *  pose: บังคับท่าเฉพาะ เช่น ก้มกิน/เคี้ยว/อาบน้ำ/กระโดด */
export function DinoSprite({ species, stage, size, mood = 'normal', anim = 'idle', pose, crack = 0, flip = false, outfit, className = '', style, onClick }: {
  species: DinoSpecies; stage: Stage; size: number; mood?: Mood; anim?: 'idle' | 'run' | 'none'; pose?: Pose; crack?: number; flip?: boolean;
  outfit?: DinoOutfit; className?: string; style?: CSSProperties; onClick?: () => void;
}) {
  const px = Math.round(size * SCALE[stage]);
  useEffect(() => preload(species), [species]);
  // เดินอยู่ก็ใช้รูปเดิม (ขยับด้วย CSS) — สลับไปรูปท่าวิ่งที่วาดแยกทุกครั้งที่ออกเดิน/หยุด ทำให้ภาพกระพริบ
  const key = pose || moodKey(mood);
  const idleKey = photoKeyOf(species, stage, '');
  const mainKey = photoKeyOf(species, stage, key) || idleKey;
  // ใส่ชุด = ใช้รูปไดโนใส่ชุดทั้งตัวแทนรูปเดิม (วางให้ตัวไดโนทับตำแหน่งเดิมพอดี หมวกยื่นออกนอกกรอบได้)
  const dz = stage !== 'egg' && mainKey ? dressedOf(outfit, mainKey, idleKey, key === 'sleep') : undefined;
  let dressedStyle: CSSProperties | undefined;
  if (dz) {
    const { w, h, bw, bh, ox, oy } = dz.meta;
    const s = Math.min(px / bw, px / bh), L = (px - bw * s) / 2, T = px - bh * s;
    dressedStyle = { inset: 'auto', left: L - ox * s, top: T - oy * s, width: w * s, height: h * s };
  }
  const main = dz ? dz.url : mainKey && PHOTOS[mainKey];
  const styleOf = (src?: string) => (dz && src === dz.url ? dressedStyle : undefined);
  // ไม่สลับรูปกะพริบตาแล้ว — รูปกะพริบวาดแยกจากรูปหลัก สลับไปมาแล้วภาพกระตุก ไม่สมูท
  const alt: string | undefined = undefined;
  // เปลี่ยนท่า = รูปเก่าค่อยๆ จางออก รูปใหม่ค่อยๆ ชัด
  // (จำรูปเก่าไว้ตั้งแต่ตอน render เลย ไม่รอ effect — ไม่งั้นจะมีเฟรมที่รูปใหม่โผล่เดี่ยวๆ ก่อนแล้วรูปเก่าเด้งกลับมา)
  const [shown, setShown] = useState(main);
  const [prev, setPrev] = useState<string | undefined>();
  // ตำแหน่งของรูปเก่าตอนจางออก (รูปใส่ชุดวางต่างจากรูปเดิม)
  const shownStyle = useRef<CSSProperties | undefined>(undefined), prevStyle = useRef<CSSProperties | undefined>(undefined);
  if (main !== shown) { setPrev(shown); setShown(main); prevStyle.current = shownStyle.current; }
  shownStyle.current = styleOf(main);
  useEffect(() => {
    if (!prev) return;
    const t = setTimeout(() => setPrev(undefined), 220);
    return () => clearTimeout(t);
  }, [prev, shown]);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!alt) { setFrame(0); return; }
    // กะพริบตาแบบสุ่ม ทุก 2.5–5 วินาที
    let t: ReturnType<typeof setTimeout>;
    const blink = () => { setFrame(1); t = setTimeout(() => { setFrame(0); t = setTimeout(blink, 2500 + Math.random() * 2500); }, 170); };
    t = setTimeout(blink, 1500 + Math.random() * 2000);
    return () => clearTimeout(t);
  }, [alt]);
  const svg = useMemo(() => (main ? '' : stage === 'egg' ? eggSvg(species, crack) : dinoSvg(species, stage, mood)), [main, species, stage, mood, crack]);
  if (main) {
    return (
      <span className={`dino-sprite dz-photo dz-anim-${anim} dz-m-${mood} ${pose ? `dz-p-${pose}` : ''} ${flip ? 'flip' : ''} ${className}`} style={{ width: px, height: px, ...style }} onClick={onClick}>
        <span className="dz-body">
          {prev && <img className="fprev" key={`p-${prev}`} src={prev} alt="" draggable={false} style={styleOf(prev) ?? prevStyle.current} />}
          <img className={`f0 ${alt && frame ? 'off' : ''}`} key={main} src={main} alt="" draggable={false} style={styleOf(main)} />
          {alt && <img className={`f1 ${frame ? '' : 'off'}`} src={alt} alt="" draggable={false} />}
        </span>
        {stage === 'egg' && crack > 0 && <i className={`egg-crack c${crack}`} />}
      </span>
    );
  }
  return (
    <span className={`dino-sprite dz-anim-${anim} ${flip ? 'flip' : ''} ${className}`} style={{ width: px, height: px, ...style }} onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
