// กติกาการเลี้ยงไดโน (ฟังก์ชันล้วน ไม่แตะฐานข้อมูล — คำนวณจากเวลาจริงทุกครั้ง)
// เก็บแค่ "ค่า ณ เวลาที่ทำล่าสุด" แล้วคำนวณค่าปัจจุบันจากเวลาที่ผ่านไป
// สองเครื่องจึงเห็นค่าตรงกันโดยไม่ต้องมีเซิร์ฟเวอร์คอยนับเวลา
import { addDays, diffDays, parse, toStr } from '../../lib/date';
import type { Dino, DinoSpecies, Meter } from '../../lib/types';
import { COMMON, foodGain, type Food, type Stage } from './species';

export const HOUR = 3_600_000;
export const HATCH_TAPS = 5; // แต่ละคนต้องอุ่นไข่กี่ครั้ง
export const GROW_DAYS = 14;
const POOP_SMELLY = 4 * HOUR; // ไม่เก็บอึ 4 ชม. = ห้องเริ่มเหม็น
const POOP_SICK = 8 * HOUR; // 8 ชม. = ป่วย
const STARVE_SICK = 12 * HOUR; // หิวจนหมดหลอดนาน 12 ชม. = ป่วย
const SICK_CRITICAL = 24 * HOUR;
const SICK_STAR = 48 * HOUR; // ป่วยนาน 48 ชม. ไม่ได้ยา = กลายเป็นดาว

export type MeterKey = 'food' | 'fun' | 'bath' | 'energy';
export const METERS: MeterKey[] = ['food', 'fun', 'bath', 'energy'];
// ลดลงกี่ % ต่อชั่วโมงตอนตื่น (อิ่ม 100→0 ใน 9 ชม. = หิวทุก ~3 ชม.)
const RATE: Record<MeterKey, number> = { food: 100 / 9, fun: 100 / 12, bath: 100 / 24, energy: 100 / 16 };
// ตอนหลับ: หิว/เหงาช้าลง พลังงานฟื้น
const SLEEP_MUL: Record<MeterKey, number> = { food: 0.3, fun: 0.3, bath: 0.5, energy: -1.5 };

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const dayOf = (t: number) => toStr(new Date(t));

/** ตื่นเองตอนไหน: งีบกลางวัน (08–19 น.) 2 ชม. / นอนกลางคืนตื่น 08:00 */
export function wakeAt(since: number) {
  const d = new Date(since);
  if (d.getHours() >= 8 && d.getHours() < 19) return since + 2 * HOUR;
  const w = new Date(d);
  w.setHours(8, 0, 0, 0);
  if (+w <= since) w.setDate(w.getDate() + 1);
  return +w;
}

/** ช่วงเวลาตื่น/หลับระหว่าง from → to (เรียงตามเวลา) */
function phases(d: Dino, from: number, to: number): [number, boolean][] {
  if (!d.sleep) return [[to - from, false]];
  const a = d.sleep.since, b = wakeAt(a);
  const seg = (s: number, e: number, asleep: boolean): [number, boolean][] => (e > s ? [[e - s, asleep]] : []);
  return [
    ...seg(from, Math.min(to, a), false),
    ...seg(Math.max(from, a), Math.min(to, b), true),
    ...seg(Math.max(from, b), to, false),
  ];
}
const ratePerMs = (k: MeterKey, asleep: boolean) => (RATE[k] * (asleep ? SLEEP_MUL[k] : 1)) / HOUR;

export function meter(d: Dino, k: MeterKey, t: number) {
  const m: Meter = d[k];
  let v = m.v;
  if (t <= m.at) return v; // นาฬิกาสองเครื่องอาจต่างกันนิดหน่อย
  for (const [len, asleep] of phases(d, m.at, t)) v = clamp(v - ratePerMs(k, asleep) * len);
  return v;
}

/** เวลาที่หลอดนี้จะหมด (null = ไม่หมด) */
function zeroAt(d: Dino, k: MeterKey): number | null {
  const m: Meter = d[k];
  let v = m.v, t = m.at;
  for (const [len, asleep] of phases(d, m.at, Infinity)) {
    const r = ratePerMs(k, asleep);
    if (v <= 0) return t;
    if (r > 0 && v - r * len <= 0) return t + v / r;
    v = clamp(v - r * len);
    t += len;
  }
  return null;
}

export const isSleeping = (d: Dino, t: number) => !!d.sleep && t < wakeAt(d.sleep.since);
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
  const s = Math.min(...cands);
  return cands.length && s <= t ? s : null;
}

const growAt = (d: Dino) => +parse(addDays(dayOf(d.hatchedAt!), GROW_DAYS));

export interface DinoView {
  status: Dino['status'];
  stage: Stage;
  day: number; // วันที่เท่าไหร่ของการเลี้ยง (1..14)
  m: Record<MeterKey, number>;
  sleeping: boolean;
  poops: number; // จำนวนอึบนพื้น
  dirt: 0 | 1 | 2; // 0 สะอาด, 1 เหม็น, 2 เละเต็มห้อง
  sick: 0 | 1 | 2; // 0 สบายดี, 1 ป่วย, 2 อาการหนัก
  endedAt?: number;
}

/** สถานะปัจจุบันของไดโน ณ เวลา t */
export function view(d: Dino, t: number): DinoView {
  const base = { day: 0, m: { food: 0, fun: 0, bath: 0, energy: 0 }, sleeping: false, poops: 0, dirt: 0 as const, sick: 0 as const };
  if (d.status === 'egg') return { ...base, status: 'egg', stage: 'egg' };
  const end = d.status === 'alive' ? endOf(d, t) : d.endedAt != null ? { status: d.status, at: d.endedAt } : null;
  const at = end ? Math.min(t, end.at) : t; // หลังจบแล้วหยุดเวลาไว้
  const day = Math.min(GROW_DAYS, diffDays(dayOf(d.hatchedAt!), dayOf(at)) + 1);
  const stage: Stage = day <= 3 ? 'baby' : day <= 9 ? 'teen' : 'adult';
  if (end) return { ...base, status: end.status, stage: end.status === 'grown' ? 'adult' : stage, day: end.status === 'grown' ? GROW_DAYS : day, endedAt: end.at };
  const poops = visiblePoops(d, t);
  const oldest = poops.length ? t - Math.min(...poops) : 0;
  const sick = sickStart(d, t);
  return {
    status: 'alive', stage, day,
    m: { food: meter(d, 'food', t), fun: meter(d, 'fun', t), bath: meter(d, 'bath', t), energy: meter(d, 'energy', t) },
    sleeping: isSleeping(d, t),
    poops: poops.length,
    dirt: oldest >= POOP_SICK ? 2 : oldest >= POOP_SMELLY ? 1 : 0,
    sick: sick == null ? 0 : t - sick >= SICK_CRITICAL ? 2 : 1,
  };
}

/** จบการเลี้ยงแล้วหรือยัง (โตครบ 14 วัน / ป่วยหนักจนเป็นดาว) */
function endOf(d: Dino, t: number): { status: 'grown' | 'star'; at: number } | null {
  const sick = sickStart(d, t);
  const starAt = sick != null ? sick + SICK_STAR : Infinity;
  const grow = growAt(d);
  if (starAt <= t && starAt < grow) return { status: 'star', at: starAt };
  if (grow <= t) return { status: 'grown', at: grow };
  return null;
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
  warm(d: Dino, who: 'A' | 'B', t: number): Result {
    if (d.status !== 'egg') return d;
    const warm = { ...d.warm, [who]: Math.min(HATCH_TAPS, d.warm[who] + 1) };
    if (warm.A < HATCH_TAPS || warm.B < HATCH_TAPS) return { ...d, warm };
    return { ...d, warm, status: 'alive', hatchedAt: t, food: { v: 60, at: t }, fun: { v: 80, at: t }, bath: { v: 100, at: t }, energy: { v: 90, at: t } };
  },
  canEat(d0: Dino, t: number): string | null {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    if (d.food.v >= 95) return 'อิ่มแล้วว ไม่ไหวแล้ว 😵';
    return null;
  },
  feed(d0: Dino, t: number, f: Food, rnd = Math.random()): Result {
    const d = settle(d0, t);
    const no = actions.canEat(d, t); if (no) return no;
    const gain = foodGain(d.species, f);
    let n = add(add(add(d, 'food', gain.food, t), 'fun', gain.fun, t), 'energy', gain.energy, t);
    // มื้อหลัก: อึจะโผล่ 1–2 ชม. หลังกิน
    if (gain.food >= 15 && d.poops.length < 8) n = { ...n, poops: [...d.poops, t + HOUR + rnd * HOUR] };
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
  play(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    if (d.sickSince) return 'ป่วยอยู่ ไม่มีแรงเล่น 🤒';
    if (d.energy.v < 8) return 'เหนื่อยแล้ว ขอพักก่อนน้า 😮‍💨';
    return { ...add(add(add(d, 'fun', 15, t), 'energy', -8, t), 'food', -3, t), workoutDays: addDay(d.workoutDays, t) };
  },
  sleep(d0: Dino, t: number): Result {
    const d = settle(d0, t);
    const g = guard(d, t); if (g) return g;
    return { ...d, sleep: { since: t } };
  },
  wake(d0: Dino, t: number): Result {
    if (!isSleeping(d0, t)) return d0;
    const d = settle(d0, t);
    return add({ ...d, sleep: null }, 'fun', -5, t);
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
const coversAll = (days: string[], d: Dino) =>
  Array.from({ length: GROW_DAYS }, (_, i) => addDays(dayOf(d.hatchedAt!), i)).every(x => days.includes(x));

/** ตัวที่จบไปล่าสุด */
export const lastEnded = (all: Dino[]) =>
  all.filter(d => d.status === 'grown' || d.status === 'star').sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))[0];

/** สายพันธุ์ของไข่ใบถัดไป — คำนวณแบบเดียวกันทุกเครื่อง (สองเครื่องกดพร้อมกันได้ไข่ใบเดียวกัน) */
export function nextSpecies(all: Dino[], seed: string): DinoSpecies {
  const owned = new Set(all.filter(d => d.status !== 'egg').map(d => d.species));
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
  const pool = fresh.length ? fresh : COMMON;
  return pool[hash(seed) % pool.length];
}

export function newEgg(all: Dino[]): Omit<Dino, 'createdAt' | 'updatedAt'> {
  const last = lastEnded(all);
  const id = last ? `dino-after-${last.id}` : 'dino-first';
  const z = { v: 0, at: 0 };
  return { id, species: nextSpecies(all, id), status: 'egg', warm: { A: 0, B: 0 }, food: z, fun: z, bath: z, energy: z, poops: [], bathDays: [], workoutDays: [] };
}

/** ตัวที่กำลังเลี้ยงอยู่ (ไข่ หรือยังมีชีวิต) */
export const activeDino = (all: Dino[]) =>
  all.filter(d => d.status === 'egg' || d.status === 'alive').sort((a, b) => b.createdAt - a.createdAt)[0];

/** ต้องการการดูแลไหม (ใช้กับจุด ! บนไอคอน) */
export function needs(v: DinoView, t: number) {
  const h = new Date(t).getHours();
  return {
    feed: v.m.food < 35,
    clean: v.poops > 0,
    bath: v.m.bath < 30,
    fun: v.m.fun < 30,
    bed: !v.sleeping && (h >= 21 || h < 5 || v.m.energy < 20),
    medicine: v.sick > 0,
  };
}
export const anyNeed = (v: DinoView, t: number) => v.status === 'egg' || (v.status === 'alive' && !v.sleeping && Object.values(needs(v, t)).some(Boolean));
