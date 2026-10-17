// วันพิเศษ: วันเกิด / ครบรอบปี / ครบรอบทุกเดือน (วันที่ 22) / ครบทุก 100 วัน
import { useEffect, useState } from 'react';
import { addDays, diffDays, parse, todayStr } from '../../lib/date';
import { PROFILE } from '../../lib/store';
import type { Who } from '../../lib/types';

export type Special =
  | { kind: 'birthday'; date: string; who: Who; age: number }
  | { kind: 'anniv'; date: string; years: number }
  | { kind: 'days'; date: string; days: number }
  | { kind: 'month'; date: string; months: number };

/** วันนี้เป็นวันพิเศษไหม (ถ้าตรงหลายอย่าง เลือกวันเกิด > ครบรอบปี > ครบ 100 วัน > ครบรอบเดือน) */
export function specialOf(date: string): Special | null {
  const d = parse(date), md = date.slice(5);
  for (const who of ['A', 'B'] as const) {
    const birth = who === 'A' ? PROFILE.birthA : PROFILE.birthB;
    if (birth.slice(5) === md) return { kind: 'birthday', date, who, age: d.getFullYear() - +birth.slice(0, 4) };
  }
  const start = PROFILE.startDate;
  if (date <= start) return null;
  const s = parse(start);
  const months = (d.getFullYear() - s.getFullYear()) * 12 + d.getMonth() - s.getMonth();
  if (d.getDate() === s.getDate() && months % 12 === 0) return { kind: 'anniv', date, years: months / 12 };
  const days = diffDays(start, date) + 1; // วันแรกที่คบ = วันที่ 1 (ตรงกับตัวนับหน้าแรก)
  if (days % 100 === 0) return { kind: 'days', date, days };
  if (d.getDate() === s.getDate()) return { kind: 'month', date, months };
  return null;
}

/** วันพิเศษที่กำลังจะมาถึง (รวมวันนี้) */
export function upcomingSpecials(from: string, n = 6): Special[] {
  const out: Special[] = [];
  for (let i = 0; i < 400 && out.length < n; i++) {
    const s = specialOf(addDays(from, i));
    if (s) out.push(s);
  }
  return out;
}

const name = (w: Who) => (w === 'A' ? PROFILE.nameA : PROFILE.nameB);
/** หัวข้อของวันนั้น */
export function titleOf(s: Special) {
  switch (s.kind) {
    case 'birthday': return { emo: '🎂', short: `วันเกิด ${name(s.who)}`, big: `Happy Birthday\n${name(s.who)}`, sub: `อายุครบ ${s.age} ปีแล้วน้า 🎉` };
    case 'anniv': return { emo: '💍', short: `ครบรอบ ${s.years} ปี`, big: `Happy ${s.years} Year${s.years > 1 ? 's' : ''}\nAnniversary`, sub: `ครบรอบ ${s.years} ปีที่เรารักกัน 💕` };
    case 'days': return { emo: '💯', short: `ครบ ${s.days.toLocaleString()} วัน`, big: `${s.days.toLocaleString()} Days\nTogether`, sub: `เรารักกันมาครบ ${s.days.toLocaleString()} วันแล้ว 💕` };
    case 'month': return { emo: '💕', short: `ครบรอบ ${s.months} เดือน`, big: `Happy ${s.months} Month${s.months > 1 ? 's' : ''}`, sub: `วันที่ ${parse(s.date).getDate()} ของเรา ครบ ${s.months} เดือนแล้วน้า` };
  }
}

// ---------- จำลองวันที่ (เฉพาะตอน npm run dev — ใช้ดูหน้าตาวันพิเศษล่วงหน้า) ----------
const SIM_KEY = 'sim-date';
const subs = new Set<() => void>();
const readSim = () => { if (!import.meta.env.DEV) return null; try { return localStorage.getItem(SIM_KEY); } catch { return null; } };
export function setSimDate(d: string | null) {
  try { if (d) localStorage.setItem(SIM_KEY, d); else localStorage.removeItem(SIM_KEY); } catch { /* ไม่เป็นไร */ }
  subs.forEach(f => f());
}
/** วันที่ "วันนี้" ของหน้าแรก (ตอนทดสอบในคอมเลือกจำลองได้ — เวอร์ชันจริงเป็นวันนี้เสมอ) */
export function useToday() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick(n => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return readSim() || todayStr();
}
export const isSimulating = () => !!readSim();
