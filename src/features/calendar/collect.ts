// รวบรวมทุกอย่างที่ต้องแสดงบนปฏิทินในช่วงวันที่ [from, to]
import { addDays, diffDays, fmtRange, parse, toStr } from '../../lib/date';
import { T } from '../../lib/i18n';
import { EVENT_TYPES, MEM_CATS } from '../../lib/meta';
import { PROFILE } from '../../lib/store';
import type { CalEvent, Color, Memory, Trip } from '../../lib/types';
import { tripFlag } from '../travel/sheets';

export interface CalItem {
  kind: 'event' | 'trip' | 'memory' | 'anniv' | 'birthday';
  id?: string;
  emo: string;
  color: Color;
  title: string;
  sub?: string;
  sort?: string;
  special?: boolean;
  tripStart?: boolean;
  tripEnd?: boolean;
}

export function collect(data: { events: CalEvent[]; trips: Trip[]; memories: Memory[] }, from: string, to: string) {
  const map = new Map<string, CalItem[]>();
  const add = (date: string, item: CalItem) => {
    if (date < from || date > to) return;
    const list = map.get(date);
    if (list) list.push(item); else map.set(date, [item]);
  };
  const eachDay = (a: string, b: string, fn: (d: string) => void) => {
    for (let d = a < from ? from : a; d <= b && d <= to; d = addDays(d, 1)) fn(d);
  };

  for (const e of data.events) {
    const t = EVENT_TYPES[e.type] || EVENT_TYPES.other;
    eachDay(e.date, e.endDate || e.date, d => add(d, { kind: 'event', id: e.id, emo: t.emoji, color: t.color, title: e.title, sub: [e.time, e.place].filter(Boolean).join(' · '), sort: e.time || '' }));
  }
  for (const t of data.trips) {
    if (!t.startDate) continue;
    const end = t.endDate || t.startDate;
    eachDay(t.startDate, end, d => add(d, {
      kind: 'trip', id: t.id, emo: tripFlag(t), color: 'mint', title: T(`ทริป ${t.place}`, `Trip: ${t.place}`),
      tripStart: d === t.startDate, tripEnd: d === end, sub: fmtRange(t.startDate, t.endDate),
    }));
  }
  for (const m of data.memories) {
    const c = MEM_CATS[m.cat] || MEM_CATS.other;
    if (m.date) add(m.date, { kind: 'memory', id: m.id, emo: c.emoji, color: 'lav', title: m.title, sub: `${T('ไดอารี่', 'Diary')} · ${c.label}` });
  }

  // วันครบรอบรายปี + ครบเดือน + ทุก 100 วัน
  const s = parse(PROFILE.startDate);
  for (let y = +from.slice(0, 4); y <= +to.slice(0, 4); y++) {
    for (let mo = 0; mo < 12; mo++) {
      const d = new Date(y, mo, s.getDate());
      if (d.getDate() !== s.getDate()) continue; // เช่น วันที่ 31 ในเดือนที่ไม่มี
      const months = (y - s.getFullYear()) * 12 + (mo - s.getMonth());
      if (months <= 0) continue;
      if (months % 12 === 0) add(toStr(d), { kind: 'anniv', emo: '💍', color: 'red', title: T(`ครบรอบ ${months / 12} ปี`, `${months / 12}-year anniversary`), special: true });
      else add(toStr(d), { kind: 'anniv', emo: '💗', color: 'red', title: T(`ครบ ${months} เดือน`, `${months} months together`), sub: T('วันครบเดือน', 'Monthsary') });
    }
  }
  for (let k = Math.max(1, Math.ceil((diffDays(PROFILE.startDate, from) + 1) / 100)); ; k++) {
    const d = addDays(PROFILE.startDate, k * 100 - 1);
    if (d > to) break;
    add(d, { kind: 'anniv', emo: '💯', color: 'red', title: T(`ครบ ${(k * 100).toLocaleString()} วัน`, `${(k * 100).toLocaleString()} days together`), special: true });
  }

  // วันเกิด
  for (const [who, b] of [[PROFILE.nameA, PROFILE.birthA], [PROFILE.nameB, PROFILE.birthB]]) {
    const bd = parse(b);
    for (let y = +from.slice(0, 4); y <= +to.slice(0, 4); y++) {
      add(toStr(new Date(y, bd.getMonth(), bd.getDate())), { kind: 'birthday', emo: '🎂', color: 'yellow', title: T(`วันเกิด ${who}`, `${who}'s birthday`), sub: T(`ครบ ${y - bd.getFullYear()} ปี`, `Turns ${y - bd.getFullYear()}`), special: true });
    }
  }
  for (const list of map.values()) list.sort((a, b) => (a.sort || '').localeCompare(b.sort || ''));
  return map;
}
