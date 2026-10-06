// วันที่ 2 ภาษา (ไทยใช้ พ.ศ. / อังกฤษใช้ ค.ศ.) — เก็บเป็น 'YYYY-MM-DD' ตามเวลาท้องถิ่นเสมอ
import { isEn, T } from './i18n';

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TH_DAYS_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_MONTHS_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_DAYS_S = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const monthsLong = () => (isEn() ? EN_MONTHS : TH_MONTHS);
export const monthsShort = () => (isEn() ? EN_MONTHS_S : TH_MONTHS_S);
export const daysLong = () => (isEn() ? EN_DAYS : TH_DAYS);
export const daysShort = () => (isEn() ? EN_DAYS_S : TH_DAYS_S);
/** ปีที่แสดง: ไทย = พ.ศ., อังกฤษ = ค.ศ. */
export const yearOf = (y: number) => (isEn() ? y : y + 543);

const pad = (n: number) => String(n).padStart(2, '0');
export const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date());
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return toStr(d); };
export const diffDays = (a: string, b: string) => Math.round((+parse(b) - +parse(a)) / 864e5);

export function fmtDate(s?: string, { long = false, weekday = false, year = true } = {}) {
  if (!s) return '';
  const d = parse(s);
  let out = `${d.getDate()} ${(long ? monthsLong() : monthsShort())[d.getMonth()]}`;
  if (year) out += ` ${yearOf(d.getFullYear())}`;
  if (weekday) out = isEn() ? `${EN_DAYS[d.getDay()]}, ${out}` : `วัน${TH_DAYS[d.getDay()]}ที่ ${out}`;
  return out;
}

export function fmtRange(a?: string, b?: string) {
  if (!a) return '';
  if (!b || b === a) return fmtDate(a);
  const A = parse(a), B = parse(b);
  const ms = monthsShort();
  if (A.getFullYear() === B.getFullYear()) {
    if (A.getMonth() === B.getMonth()) return `${A.getDate()}–${B.getDate()} ${ms[A.getMonth()]} ${yearOf(A.getFullYear())}`;
    return `${A.getDate()} ${ms[A.getMonth()]} – ${fmtDate(b)}`;
  }
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

export function countdown(n: number) {
  if (n === 0) return T('วันนี้!', 'Today!');
  if (n === 1) return T('พรุ่งนี้', 'Tomorrow');
  if (n > 0) return T(`อีก ${n} วัน`, `in ${n} days`);
  return T(`${-n} วันที่แล้ว`, `${-n} days ago`);
}

/** จำนวน ปี/เดือน/วัน ระหว่างสองวัน */
export function ymd(start: string, end: string) {
  const s = parse(start), e = parse(end);
  let y = e.getFullYear() - s.getFullYear(), m = e.getMonth() - s.getMonth(), d = e.getDate() - s.getDate();
  if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}

/** วันครบรอบรายปีถัดไป (วัน/เดือนเดียวกับ s) ที่ >= from */
export function nextYearly(s: string, from = todayStr()) {
  const d = parse(s), f = parse(from);
  let n = new Date(f.getFullYear(), d.getMonth(), d.getDate());
  if (n < f) n = new Date(f.getFullYear() + 1, d.getMonth(), d.getDate());
  return toStr(n);
}

export const monthLabel = (key: string) => `${monthsLong()[+key.slice(5, 7) - 1]} ${yearOf(+key.slice(0, 4))}`;
