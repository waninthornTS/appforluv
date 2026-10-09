// สายพันธุ์ไดโน + อาหาร (รูปวาดเป็นเวกเตอร์อยู่ใน art.ts)
import type { DinoSpecies } from '../../lib/types';

export type Stage = 'egg' | 'baby' | 'teen' | 'adult';
export type Diet = 'meat' | 'plant' | 'any';
export interface SpeciesInfo { name: string; rare?: boolean; how: string; diet: Diet }

export const SPECIES: Record<DinoSpecies, SpeciesInfo> = {
  trex: { name: 'ทีเร็กซ์', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'meat' },
  styra: { name: 'สไตราโคซอรัส', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'plant' },
  pachy: { name: 'แพคีเซฟาโลซอรัส', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'plant' },
  galli: { name: 'แกลลิไมมัส', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'any' },
  diplo: { name: 'ดิปโพลโดคัส', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'plant' },
  elas: { name: 'เอลาสโมซอรัส', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'meat' },
  ptero: { name: 'เทอโรซอร์', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'meat' },
  flame: { name: 'ไดเมโทรดอน', how: 'สุ่มได้จากไข่ใบใหม่', diet: 'meat' },
  galaxy: { name: 'พาราซอโรโลฟัสกาแล็กซี', rare: true, how: 'เลี้ยงจนโตครบ 3 ตัว', diet: 'plant' },
  phoenix: { name: 'เทอโรซอร์ฟีนิกซ์', rare: true, how: 'เลี้ยงจนโตโดยไม่ป่วยเลย', diet: 'any' },
  crystal: { name: 'ไดโนคริสตัล', rare: true, how: 'อาบน้ำให้ทุกวันจนโต (14 วัน)', diet: 'plant' },
  lava: { name: 'แองคิโลซอรัสลาวา', rare: true, how: 'เล่นด้วยทุกวันจนโต (14 วัน)', diet: 'plant' },
};

export const COMMON: DinoSpecies[] = ['trex', 'styra', 'pachy', 'galli', 'diplo', 'elas', 'ptero', 'flame'];
export const RARE: DinoSpecies[] = ['galaxy', 'phoenix', 'crystal', 'lava'];

export const STAGE_NAME: Record<Stage, string> = { egg: 'ไข่', baby: 'วัยเด็ก', teen: 'วัยรุ่น', adult: 'โตเต็มวัย' };
export const STAGE_EMOJI: Record<Stage, string> = { egg: '🥚', baby: '🐣', teen: '🦖', adult: '👑' };

// ---------- อาหาร ----------
// diet: กินเนื้อ / กินพืช / กินได้ทุกตัว — ตรงกับที่ไดโนชอบจะอิ่มและดีใจกว่า
export type FoodId = 'meat' | 'fish' | 'egg' | 'veg' | 'apple' | 'berry' | 'milk' | 'cake';
export interface Food { id: FoodId; e: string; name: string; diet: Diet; food: number; fun: number; energy: number }
export const FOODS: Food[] = [
  { id: 'meat', e: '🍖', name: 'เนื้อย่าง', diet: 'meat', food: 35, fun: 3, energy: 5 },
  { id: 'fish', e: '🐟', name: 'ปลาสด', diet: 'meat', food: 30, fun: 5, energy: 3 },
  { id: 'veg', e: '🥬', name: 'ผักกรอบ', diet: 'plant', food: 30, fun: 3, energy: 3 },
  { id: 'apple', e: '🍎', name: 'แอปเปิล', diet: 'plant', food: 18, fun: 8, energy: 2 },
  { id: 'berry', e: '🍓', name: 'สตรอว์เบอร์รี', diet: 'plant', food: 10, fun: 12, energy: 0 },
  { id: 'egg', e: '🍳', name: 'ไข่ดาว', diet: 'any', food: 22, fun: 5, energy: 4 },
  { id: 'milk', e: '🥛', name: 'นมอุ่นๆ', diet: 'any', food: 12, fun: 4, energy: 12 },
  { id: 'cake', e: '🍰', name: 'เค้กสตรอว์เบอร์รี', diet: 'any', food: 10, fun: 20, energy: 0 },
];

/** ไดโนตัวนี้ชอบอาหารนี้ไหม: 1 ชอบมาก, 0 เฉยๆ, -1 ไม่ชอบ */
export function taste(species: DinoSpecies, f: Food): -1 | 0 | 1 {
  const diet = SPECIES[species].diet;
  if (f.diet === 'any' || diet === 'any') return 0;
  return f.diet === diet ? 1 : -1;
}

/** ค่าที่ได้จริงเมื่อกิน (ชอบ = อิ่ม/สุขเพิ่ม, ไม่ชอบ = อิ่มน้อยและงอนนิดๆ) */
export function foodGain(species: DinoSpecies, f: Food) {
  const t = taste(species, f);
  if (t === 1) return { food: Math.round(f.food * 1.2), fun: f.fun + 8, energy: f.energy };
  if (t === -1) return { food: Math.round(f.food * .5), fun: -4, energy: f.energy };
  return { food: f.food, fun: f.fun, energy: f.energy };
}
