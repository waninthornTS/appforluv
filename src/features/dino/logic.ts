// กติกาการเลี้ยงไดโน (ฟังก์ชันล้วน ไม่แตะฐานข้อมูล — คำนวณจากเวลาจริงทุกครั้ง)
// เก็บแค่ "ค่า ณ เวลาที่ทำล่าสุด" แล้วคำนวณค่าปัจจุบันจากเวลาที่ผ่านไป
// สองเครื่องจึงเห็นค่าตรงกันโดยไม่ต้องมีเซิร์ฟเวอร์คอยนับเวลา
import { addDays, diffDays, parse, toStr } from '../../lib/date';
import type { Dino, DinoSpecies, GameStat, Meter } from '../../lib/types';
import { COMMON, foodGain, FOODS, RARE, type Food, type FoodId, type Stage } from './species';

export const HOUR = 3_600_000;
export const HATCH_TAPS = 20; // แตะไข่รวมกี่ครั้งถึงจะฟัก (ใครแตะก็ได้)
/** แตะไข่ไปแล้วกี่ครั้ง (ไข่แบบเก่าที่อุ่นแยกคน นับรวมของสองคน) */
export const eggTaps = (d: Dino) => d.taps ?? d.warm.A + d.warm.B;
export const GROW_DAYS = 10; // เลี้ยงครบกี่วันถึงโตเต็มวัย → เข้าคอลเลคชั่น แล้วมีไข่ใบใหม่มาส่ง
const POOP_SMELLY = 4 * HOUR; // ไม่เก็บอึ 4 ชม. = ห้องเริ่มเหม็น
const POOP_SICK = 8 * HOUR; // 8 ชม. = ป่วย
const STARVE_SICK = 12 * HOUR; // หิวจนหมดหลอดนาน 12 ชม. = ป่วย
const DIRTY_SICK = 12 * HOUR; // ไม่อาบน้ำจนตัวเน่า (สะอาด 0%) นาน 12 ชม. = ป่วย
export const GAME_DIRT = 25; // วิ่งเล่นหนึ่งรอบ ตัวมอมแมม ความสะอาดลด
const FULL_SLEEP_H = 1.5; // นอนชาร์จพลังจาก 0 จนเต็มใช้เวลากี่ชม.
const MIN_SLEEP = 20 * 60_000; // นอนอย่างน้อย 20 นาที
const SICK_CRITICAL = 24 * HOUR;
const SICK_STAR = 48 * HOUR; // ป่วยนาน 48 ชม. ไม่ได้ยา = กลายเป็นดาว

export type MeterKey = 'food' | 'fun' | 'bath' | 'energy';
export const METERS: MeterKey[] = ['food', 'fun', 'bath', 'energy'];
// ลดลงกี่ % ต่อชั่วโมงตอนตื่น (อิ่ม 100→0 ใน 5 ชม. = หิวบ่อย ต้องไปวิ่งหาอาหารมาป้อน)
const RATE_ENERGY = 100 / 16;
const RATE: Record<MeterKey, number> = { food: 100 / 5, fun: 100 / 12, bath: 100 / 24, energy: RATE_ENERGY };
// ตอนหลับ: หิว/เหงาช้าลง พลังงานฟื้นเร็ว (เต็มใน FULL_SLEEP_H ชม.)
const SLEEP_MUL: Record<MeterKey, number> = { food: 0.3, fun: 0.3, bath: 0.5, energy: -(100 / FULL_SLEEP_H) / RATE_ENERGY };

// กติกาใหม่ (หิวไวขึ้น / นอนชาร์จไว / ตัวเน่าแล้วป่วย) เริ่มนับตั้งแต่เวลานี้เท่านั้น
// ช่วงเวลาก่อนหน้านี้คิดแบบเดิม — ไดโนที่เลี้ยงอยู่จริงจะไม่โดนย้อนหลังจนหิว/ป่วย/เป็นดาวทันทีตอนอัปเดตแอป
export const RULES_AT = Date.parse('2026-10-18T04:30:00+07:00');
const OLD_RATE: Partial<Record<MeterKey, number>> = { food: 100 / 9 };
const OLD_SLEEP_MUL: Partial<Record<MeterKey, number>> = { energy: -1.5 };

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const dayOf = (t: number) => toStr(new Date(t));

/** ตื่นเองตอนไหน: นอนแบบเดียว ตื่นเองตอนพลังงานเต็ม (ข้อมูลเก่าที่ไม่มี until ใช้กติกาเดิม) */
export const sleepEnd = (s: { since: number; until?: number }) => s.until ?? legacyWake(s.since);
/** กติกาเดิม: งีบกลางวัน (08–19 น.) 2 ชม. / นอนกลางคืนตื่น 08:00 */
function legacyWake(since: number) {
  const d = new Date(since);
  if (d.getHours() >= 8 && d.getHours() < 19) return since + 2 * HOUR;
  const w = new Date(d);
  w.setHours(8, 0, 0, 0);
  if (+w <= since) w.setDate(w.getDate() + 1);
  return +w;
}

/** ช่วงเวลาตื่น/หลับระหว่าง from → to (เรียงตามเวลา): [เริ่ม, ยาว, หลับไหม] — ตัดแบ่งตรง RULES_AT ด้วย */
function phases(d: Dino, from: number, to: number): [number, number, boolean][] {
  const out: [number, number, boolean][] = [];
  const seg = (s: number, e: number, asleep: boolean) => {
    if (e <= s) return;
    if (s < RULES_AT && e > RULES_AT) { out.push([s, RULES_AT - s, asleep], [RULES_AT, e - RULES_AT, asleep]); return; }
    out.push([s, e - s, asleep]);
  };
  if (!d.sleep) { seg(from, to, false); return out; }
  const a = d.sleep.since, b = sleepEnd(d.sleep);
  seg(from, Math.min(to, a), false);
  seg(Math.max(from, a), Math.min(to, b), true);
  seg(Math.max(from, b), to, false);
  return out;
}
const ratePerMs = (k: MeterKey, asleep: boolean, at: number) => {
  const old = at < RULES_AT;
  const rate = (old && OLD_RATE[k]) || RATE[k];
  const mul = asleep ? ((old && OLD_SLEEP_MUL[k]) || SLEEP_MUL[k]) : 1;
  return (rate * mul) / HOUR;
};

export function meter(d: Dino, k: MeterKey, t: number) {
  const m: Meter = d[k];
  let v = m.v;
  if (t <= m.at) return v; // นาฬิกาสองเครื่องอาจต่างกันนิดหน่อย
  for (const [at, len, asleep] of phases(d, m.at, t)) v = clamp(v - ratePerMs(k, asleep, at) * len);
  return v;
}

/** เวลาที่หลอดนี้จะหมด (null = ไม่หมด) */
function zeroAt(d: Dino, k: MeterKey): number | null {
  const m: Meter = d[k];
  let v = m.v, t = m.at;
  for (const [at, len, asleep] of phases(d, m.at, Infinity)) {
    const r = ratePerMs(k, asleep, at);
    if (v <= 0) return t;
    if (r > 0 && v - r * len <= 0) return t + v / r;
    v = clamp(v - r * len);
    t += len;
  }
  return null;
}

export const isSleeping = (d: Dino, t: number) => !!d.sleep && t < sleepEnd(d.sleep);
export const visiblePoops = (d: Dino, t: number) => d.poops.filter(p => p <= t);

/** เริ่มป่วยตอนไหน (null = ไม่ป่วย) */
export function sickStart(d: Dino, t: number): number | null {
  if (d.sickSince) return d.sickSince;
  const base = d.curedAt || 0;
  const cands: number[] = [];
  const poops = visiblePoops(d, t);
  if (poops.length) cands.push(Math.max(Math.min(...poops), base) + POOP_SICK);
  const z = zeroAt(d, 'food');
  if (z != null) cands.push(Math.max(z, base) + STARVE_SICK);
  const zb = zeroAt(d, 'bath');
  if (zb != null) cands.push(Math.max(zb, base, RULES_AT) + DIRTY_SICK); // กติกาใหม่ ไม่นับย้อนหลัง
  const s = Math.min(...cands);
  return cands.length && s <= t ? s : null;
}

// โตเต็มวัยตั้งแต่เริ่มวันที่ GROW_DAYS (ขึ้น "วันที่ 10/10" = ไข่ใบใหม่มาส่งเลย)
const growAt = (d: Dino) => +parse(addDays(dayOf(d.hatchedAt!), GROW_DAYS - 1));
/** แบบเก่า: โตแล้วจบเองตอนเที่ยงคืนหลังวันสุดท้าย */
const atMidnight = (t: number) => { const x = new Date(t); return !x.getHours() && !x.getMinutes() && !x.getSeconds() && !x.getMilliseconds(); };

export interface DinoView {
  status: Dino['status'];
  stage: Stage;
  day: number; // วันที่เท่าไหร่ของการเลี้ยง (1..GROW_DAYS)
  m: Record<MeterKey, number>;
  sleeping: boolean;
  poops: number; // จำนวนอึบนพื้น
  dirt: 0 | 1 | 2; // 0 สะอาด, 1 เหม็น, 2 เละเต็มห้อง
  sick: 0 | 1 | 2; // 0 สบายดี, 1 ป่วย, 2 อาการหนัก
  endedAt?: number;
  grownUp: boolean; // เลี้ยงครบ GROW_DAYS วันแล้ว (ยังเลี้ยงต่อได้จนกว่าจะรับไข่ใบใหม่)
  age: number; // อยู่ด้วยกันมากี่วันแล้ว (นับต่อหลังโต)
}

/** สถานะปัจจุบันของไดโน ณ เวลา t */
export function view(d: Dino, t: number): DinoView {
  const base = { day: 0, m: { food: 0, fun: 0, bath: 0, energy: 0 }, sleeping: false, poops: 0, dirt: 0 as const, sick: 0 as const, grownUp: false, age: 0 };
  if (d.status === 'egg') return { ...base, status: 'egg', stage: 'egg' };
  const end = d.status === 'alive' ? endOf(d, t) : d.endedAt != null ? { status: d.status, at: d.endedAt } : null;
  const at = end ? Math.min(t, end.at) : t; // หลังจบแล้วหยุดเวลาไว้
  const age = diffDays(dayOf(d.hatchedAt!), dayOf(at)) + 1;
  const day = Math.min(GROW_DAYS, age);
  const stage: Stage = day <= 3 ? 'baby' : day <= 7 ? 'teen' : 'adult';
  if (end) {
    // ย้ายเข้าสวนแล้ว: นับวันจริงจนถึงวันที่รับไข่ใบใหม่ (แบบเก่าที่โตแล้วจบเองตอนเที่ยงคืน นับถึงวันโต)
    const days = end.status === 'grown' ? Math.max(1, atMidnight(end.at) ? age - 1 : age) : day;
    return { ...base, status: end.status, stage: end.status === 'grown' ? 'adult' : stage, day: days, age: days, endedAt: end.at, grownUp: end.status === 'grown' };
  }
  const poops = visiblePoops(d, t);
  const oldest = poops.length ? t - Math.min(...poops) : 0;
  const sick = sickStart(d, t);
  return {
    status: 'alive', stage, day, age, grownUp: growAt(d) <= t,
    m: { food: meter(d, 'food', t), fun: meter(d, 'fun', t), bath: meter(d, 'bath', t), energy: meter(d, 'energy', t) },
    sleeping: isSleeping(d, t),
    poops: poops.length,
    dirt: oldest >= POOP_SICK ? 2 : oldest >= POOP_SMELLY ? 1 : 0,
    sick: sick == null ? 0 : t - sick >= SICK_CRITICAL ? 2 : 1,
  };
}

/** จบการเลี้ยงเองไหม — มีแค่ป่วยหนักจนเป็นดาว (โตครบแล้วยังเลี้ยงต่อได้ จนกว่าจะกดรับไข่ใบใหม่) */
function endOf(d: Dino, t: number): { status: 'star'; at: number } | null {
  const sick = sickStart(d, t);
  const starAt = sick != null ? sick + SICK_STAR : Infinity;
  return starAt <= t ? { status: 'star', at: starAt } : null;
}

/** อัปเดตค่าทั้งหมดให้เป็นของ ณ เวลา t (ก่อนทำแอ็กชันใดๆ) */
export function settle(d: Dino, t: number): Dino {
  if (d.status !== 'alive') return d;
  const end = endOf(d, t);
  if (end) return { ...d, status: end.status, endedAt: end.at, sleep: null };
  const next: Dino = { ...d };
  for (const k of METERS) next[k] = { v: meter(d, k, t), at: t };
  if (d.sleep && !isSleeping(d, t)) next.sleep = null;
  const sick = sickStart(d, t);
  if (sick != null && !d.sickSince) { next.sickSince = sick; next.everSick = true; }
  return next;
}

/** มีอะไรเปลี่ยนที่ควรบันทึกลงเครื่อง/ซิงก์ไหม (ตื่นเอง, เริ่มป่วย, โตครบ, เป็นดาว) */
export function needsPersist(d: Dino, t: number) {
  if (d.status !== 'alive') return false;
  if (endOf(d, t)) return true;
  if (d.sleep && !isSleeping(d, t)) return true;
  return !d.sickSince && sickStart(d, t) != null;
}

// ---------- คลังอาหาร: มีจำกัด ต้องไปวิ่งเล่นมินิเกมหามา ----------
export type Pantry = Partial<Record<FoodId, number>>;
const STARTER: Pantry = { meat: 1, veg: 1, egg: 1, apple: 1, milk: 1 }; // ของติดบ้านตอนเริ่ม
export const pantryOf = (d: Dino): Pantry => (d.pantry as Pantry | undefined) ?? STARTER;
export const foodLeft = (d: Dino) => Object.values(pantryOf(d)).reduce<number>((a, b) => a + (b || 0), 0);
export const NO_FOOD = 'อาหารหมดแล้ว กด "เล่นด้วย" ไปวิ่งหาอาหารกันน้า 🏃';

// ---------- มินิเกมวิ่งหาอาหาร ----------
export const GAME_ENERGY = 8; // ใช้พลังงานต่อรอบ
// โอกาสได้อาหารแต่ละอย่าง (เค้ก/นม/สตรอว์เบอร์รีหายากกว่า)
const PRIZE_WEIGHT: Record<FoodId, number> = { meat: 3, fish: 3, veg: 3, apple: 3, egg: 3, berry: 2, milk: 2, cake: 1 };
/** ได้อาหารกี่ชิ้นจากคะแนน: 1 ชิ้น + ทุกๆ 120 คะแนนได้เพิ่มอีก 1 (สูงสุด 5) แล้วสุ่มชนิด */
export function prizeFor(score: number, rnd = Math.random): FoodId[] {
  const n = Math.min(5, 1 + Math.floor(score / 120));
  const ids = FOODS.map(f => f.id), total = ids.reduce((a, id) => a + PRIZE_WEIGHT[id], 0);
  return Array.from({ length: n }, () => {
    let r = rnd() * total;
    for (const id of ids) { r -= PRIZE_WEIGHT[id]; if (r < 0) return id; }
    return ids[0];
  });
}
const EMPTY_STAT: GameStat = { plays: 0, best: 0, total: 0, food: 0 };
/** สถิติรวมทุกตัวที่เคยเลี้ยง — ใครวิ่งได้ไกลสุด เล่นกี่รอบ หาอาหารมาได้กี่ชิ้น */
export function gameStats(all: Dino[]): Record<'A' | 'B', GameStat> {
  const out = { A: { ...EMPTY_STAT }, B: { ...EMPTY_STAT } };
  for (const d of all) for (const w of ['A', 'B'] as const) {
    const g = d.games?.[w];
    if (!g) continue;
    out[w] = { plays: out[w].plays + g.plays, best: Math.max(out[w].best, g.best), total: out[w].total + g.total, food: out[w].food + g.food };
  }
  return out;
}

// ---------- แอ็กชัน: คืนค่า Dino ใหม่ หรือข้อความถ้าทำไม่ได้ ----------
type Result = Dino | string;
const add = (d: Dino, k: MeterKey, n: number, t: number): Dino => ({ ...d, [k]: { v: clamp(d[k].v + n), at: t } });
const addDay = (days: string[], t: number) => (days.includes(dayOf(t)) ? days : [...days, dayOf(t)]);

function guard(d: Dino, t: number): string | null {
  if (d.status !== 'alive') return 'ยังทำไม่ได้นะ';
  if (isSleeping(d, t)) return 'ชู่ว… หลับอยู่ 🤫';
  return null;
}

export const actions = {
  warm(d: Dino, t: number): Result {
    if (d.status !== 'egg') return d;
    const taps = Math.min(HATCH_TAPS, eggTaps(d) + 1);
    if (taps < HATCH_TAPS) return { ...d, taps };
    return { ...d, taps, status: 'alive', hatchedAt: t, food: { v: 60, at: t }, fun: { v: 80, at: t }, bath: { v: 100, at: t }, energy: { v: 90, at: t } };
  },
  canEat(d0: Dino, t: number): string | null {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    if (d.food.v >= 95) return 'อิ่มแล้วว ไม่ไหวแล้ว 😵';
    if (foodLeft(d) <= 0) return NO_FOOD;
    return null;
  },
  feed(d0: Dino, t: number, f: Food, rnd = Math.random()): Result {
    const d = settle(d0, t);
    const no = actions.canEat(d, t); if (no) return no;
    const have = pantryOf(d)[f.id] || 0;
    if (have <= 0) return `${f.name}หมดแล้ว ไปวิ่งหาอาหารเพิ่มน้า 🏃`;
    const gain = foodGain(d.species, f);
    let n = add(add(add(d, 'food', gain.food, t), 'fun', gain.fun, t), 'energy', gain.energy, t);
    n = { ...n, pantry: { ...pantryOf(d), [f.id]: have - 1 } };
    // มื้อหลัก: อึจะโผล่ 1–2 ชม. หลังกิน
    if (gain.food >= 12 && d.poops.length < 8) n = { ...n, poops: [...d.poops, t + HOUR + rnd * HOUR] };
    return n;
  },
  clean(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    if (d.status !== 'alive') return 'ยังทำไม่ได้นะ';
    if (!visiblePoops(d, t).length) return 'ห้องสะอาดอยู่แล้ว ✨';
    return { ...d, poops: d.poops.filter(p => p > t) };
  },
  bath(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    return { ...add(add(d, 'bath', 100, t), 'fun', 5, t), bathDays: addDay(d.bathDays, t) };
  },
  hug(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    return add(d, 'fun', 10, t);
  },
  canPlay(d0: Dino, t: number): string | null {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    if (d.sickSince) return 'ป่วยอยู่ ไม่มีแรงวิ่ง 🤒';
    if (d.energy.v < GAME_ENERGY) return 'เหนื่อยแล้ว ขอพักก่อนน้า 😮‍💨';
    return null;
  },
  /** วิ่งจบหนึ่งรอบ: สนุก + เหนื่อย + ได้อาหารเข้าคลัง + บันทึกสถิติของคนที่เล่น */
  gameOver(d0: Dino, t: number, who: 'A' | 'B', score: number, prize: FoodId[]): Result {
    const d = settle(d0, t);
    if (d.status !== 'alive') return 'ยังทำไม่ได้นะ';
    const pantry = { ...pantryOf(d) };
    for (const id of prize) pantry[id] = (pantry[id] || 0) + 1;
    const g = d.games?.[who] ?? EMPTY_STAT;
    const games = { ...d.games, [who]: { plays: g.plays + 1, best: Math.max(g.best, score), total: g.total + score, food: g.food + prize.length } };
    const n = add(add(add(add(d, 'fun', 15, t), 'energy', -GAME_ENERGY, t), 'food', -3, t), 'bath', -GAME_DIRT, t);
    return { ...n, pantry, games, workoutDays: addDay(d.workoutDays, t) };
  },
  sleep(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    if (d.energy.v >= 95) return 'ยังไม่ง่วงเลย พลังงานเต็มอยู่ ⚡';
    // นอนจนพลังงานเต็มแล้วตื่นเอง
    const until = t + Math.max(MIN_SLEEP, ((100 - d.energy.v) / (100 / FULL_SLEEP_H)) * HOUR);
    return { ...d, sleep: { since: t, until } };
  },
  wake(d0: Dino, t: number): Result {
    if (!isSleeping(d0, t)) return d0;
    const d = settle(d0, t);
    return add({ ...d, sleep: null }, 'fun', -5, t);
  },
  /** รับไข่ใบใหม่: ตัวที่โตครบแล้วย้ายไปอยู่ในสวน */
  retire(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    if (d.status !== 'alive') return 'ยังทำไม่ได้นะ';
    if (growAt(d) > t) return 'ยังไม่โตเต็มวัยเลยน้า';
    return { ...d, status: 'grown', endedAt: t, sleep: null };
  },
  medicine(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    if (d.status !== 'alive') return 'ยังทำไม่ได้นะ';
    if (!d.sickSince) return 'ไม่ได้ป่วยนะ แข็งแรงดี 💪';
    return add({ ...d, sickSince: null, curedAt: t }, 'fun', -3, t);
  },
};

// ---------- ไข่ใบใหม่ ----------
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** ทำครบทุกวันจนโตไหม (วันที่ 1 ถึงก่อนวันที่โตเต็มวัย — วันที่ไข่ใบใหม่มาส่งไม่ต้องนับ) */
const coversAll = (days: string[], d: Dino) =>
  Array.from({ length: GROW_DAYS - 1 }, (_, i) => addDays(dayOf(d.hatchedAt!), i)).every(x => days.includes(x));

/** ตัวที่จบไปล่าสุด */
export const lastEnded = (all: Dino[]) =>
  all.filter(d => d.status === 'grown' || d.status === 'star').sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))[0];

/** สายพันธุ์ของไข่ใบถัดไป — คำนวณแบบเดียวกันทุกเครื่อง (สองเครื่องกดพร้อมกันได้ไข่ใบเดียวกัน)
 *  ไม่ซ้ำกับตัวที่เคยมี (ในสวน + สุสาน + ตัวที่เลี้ยงอยู่) */
export function nextSpecies(all: Dino[], seed: string): DinoSpecies {
  const owned = new Set(all.map(d => d.species));
  const grown = all.filter(d => d.status === 'grown');
  const last = lastEnded(all);
  const rare: DinoSpecies[] = [];
  if (grown.length >= 3) rare.push('galaxy');
  if (last?.status === 'grown') {
    if (!last.everSick) rare.push('phoenix');
    if (coversAll(last.bathDays, last)) rare.push('crystal');
    if (coversAll(last.workoutDays, last)) rare.push('lava');
  }
  const newRare = rare.filter(s => !owned.has(s));
  if (newRare.length) return newRare[0];
  const fresh = COMMON.filter(s => !owned.has(s));
  if (fresh.length) return fresh[hash(seed) % fresh.length];
  // พันธุ์ธรรมดาครบแล้ว → ได้ตัวหายากที่ยังไม่มี / มีครบทุกพันธุ์แล้วถึงจะซ้ำได้
  const rest = RARE.filter(s => !owned.has(s));
  const pool = rest.length ? rest : [...COMMON, ...RARE];
  return pool[hash(seed) % pool.length];
}

export function newEgg(all: Dino[]): Omit<Dino, 'createdAt' | 'updatedAt'> {
  const last = lastEnded(all);
  const id = last ? `dino-after-${last.id}` : 'dino-first';
  const z = { v: 0, at: 0 };
  const egg: Omit<Dino, 'createdAt' | 'updatedAt'> = { id, species: nextSpecies(all, id), status: 'egg', warm: { A: 0, B: 0 }, food: z, fun: z, bath: z, energy: z, poops: [], bathDays: [], workoutDays: [] };
  return last?.pantry ? { ...egg, pantry: last.pantry } : egg; // อาหารที่เหลือในคลังยกไปให้ตัวใหม่
}

/** สวนไดโน: ตัวที่เลี้ยงจนโตแล้ว (เรียงตามลำดับที่โต) — วิ่งเล่นกันเองในสวน ไม่ต้องดูแลแล้ว */
export const collection = (all: Dino[]) =>
  all.filter(d => d.status === 'grown').sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0));

/** ตัวที่กำลังเลี้ยงอยู่ (ไข่ หรือยังมีชีวิต) — เลี้ยงได้ทีละตัว ต้องโตก่อนถึงจะรับไข่ใบใหม่ได้ */
export const activeDino = (all: Dino[]) =>
  all.filter(d => d.status === 'egg' || d.status === 'alive').sort((a, b) => b.createdAt - a.createdAt)[0];

/** ต้องการการดูแลไหม (ใช้กับจุด ! บนไอคอน) */
export function needs(v: DinoView, _t?: number) {
  return {
    feed: v.m.food < 35,
    clean: v.poops > 0,
    bath: v.m.bath < 30,
    fun: v.m.fun < 30,
    bed: !v.sleeping && v.m.energy < 30, // นอนชาร์จพลังเมื่อเหนื่อย (ไม่ผูกกับเวลากลางคืนแล้ว)
    medicine: v.sick > 0,
  };
}
export const anyNeed = (v: DinoView, t: number) => v.status === 'egg' || (v.status === 'alive' && (v.grownUp || (!v.sleeping && Object.values(needs(v, t)).some(Boolean))));
