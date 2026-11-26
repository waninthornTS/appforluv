// แต่งตัวไดโน: ใช้รูปไดโนที่ใส่ชุดอยู่แล้วทั้งตัว (เจนจาก Gemini โดยใช้รูปเดิมของแต่ละพันธุ์) — ไม่แปะชุดซ้อนบนรูป ใส่แล้วจึงไม่เพี้ยน
// ตอนนี้เปิดให้ใส่แค่หมวกซานต้า ชิ้นอื่นขึ้น "Coming soon" ไว้ก่อน (เพิ่ม/เปิดชิ้นใหม่ได้ใน outfit-catalog.json)
// รูปไดโนใส่ชุด: src/assets/dino-dressed/<พันธุ์>-<วัยหรือท่า>--<id ชุด>.webp (ทำด้วย scripts/dino-dress.mjs)
// ตำแหน่ง/ขนาดของรูป เทียบกับรูปเดิม อยู่ใน dino-dressed.json — ไดโนจึงตัวเท่าเดิม ยืนที่เดิม แค่มีหมวกเพิ่ม
import { useState } from 'react';
import type { DinoOutfit } from '../../lib/types';
import CATALOG from './outfit-catalog.json';
import DRESSED_META from './dino-dressed.json';

export type OutfitCat = 'hat' | 'body' | 'shoes';
export interface OutfitItem { id: string; cat: OutfitCat; name: string; emoji: string; xmas?: boolean; soon?: boolean }

export const OUTFITS = CATALOG as OutfitItem[];
export const OUTFIT_BY_ID: Record<string, OutfitItem> = Object.fromEntries(OUTFITS.map(o => [o.id, o]));
export const CAT_NAME: Record<OutfitCat, string> = { hat: '🎩 หมวก', body: '👕 ชุด', shoes: '👟 รองเท้า' };

// รูปตัวอย่างในตู้
const THUMBS = import.meta.glob('../../assets/outfits/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const THUMB: Record<string, string> = Object.fromEntries(Object.entries(THUMBS).map(([p, url]) => [p.split('/').pop()!.replace('.webp', ''), url]));

// รูปไดโนใส่ชุด
const FILES = import.meta.glob('../../assets/dino-dressed/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const DRESSED: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([p, url]) => [p.split('/').pop()!.replace('.webp', ''), url]));
/** w,h = ขนาดรูปใส่ชุด · bw,bh = ขนาดรูปเดิม · ox,oy = มุมซ้ายบนของรูปเดิมในรูปใส่ชุด (หน่วยพิกเซลของรูปเดิม) */
export interface DressedMeta { w: number; h: number; bw: number; bh: number; ox: number; oy: number }
const META = DRESSED_META as Record<string, DressedMeta>;

/** ชิ้นที่ใส่อยู่และใส่ได้จริง (ชิ้นที่ยัง Coming soon ไม่นับ) */
export const wornItems = (o?: DinoOutfit) => [o?.hat, o?.body, o?.shoes].filter((id): id is string => !!id && !!OUTFIT_BY_ID[id] && !OUTFIT_BY_ID[id].soon);

/** หารูปไดโนใส่ชุดของรูปนี้ — ท่าไหนไม่มีรูปของตัวเองจะใช้รูปยืนของวัยนั้นแทน (ยกเว้นท่านอน = ถอดหมวกนอน)
 *  photoKey = ชื่อรูปเดิมที่กำลังแสดง, idleKey = ชื่อรูปยืนของวัยนั้น */
export function dressedOf(outfit: DinoOutfit | undefined, photoKey: string | undefined, idleKey: string | undefined, sleeping: boolean) {
  const id = wornItems(outfit)[0]; // ตอนนี้ใส่ได้ทีละชิ้น (หมวก)
  if (!id) return undefined;
  for (const k of [photoKey, sleeping ? undefined : idleKey]) {
    const key = k && `${k}--${id}`;
    if (key && DRESSED[key] && META[key]) return { url: DRESSED[key], meta: META[key] };
  }
  return undefined;
}
export const hasDressed = (idleKey: string | undefined, id: string) => !!idleKey && !!DRESSED[`${idleKey}--${id}`];

/** รูปตัวอย่างของชิ้นนั้น (ในตู้เสื้อผ้า) */
export function OutfitThumb({ id }: { id: string }) {
  const [bad, setBad] = useState(false);
  const it = OUTFIT_BY_ID[id];
  const art = THUMB[id];
  if (art && !bad) return <img className="ofit-thumb" src={art} alt="" draggable={false} onError={() => setBad(true)} />;
  return <span className="ofit-thumb emo">{it?.emoji}</span>;
}
