// วันที่ภาษาไทย (พ.ศ.) — เก็บเป็น 'YYYY-MM-DD' ตามเวลาท้องถิ่นเสมอ
export const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const TH_MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const TH_DAYS_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date());
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return toStr(d); };
export const diffDays = (a: string, b: string) => Math.round((+parse(b) - +parse(a)) / 864e5);

export function fmtDate(s?: string, { long = false, weekday = false, year = true } = {}) {
  if (!s) return '';
  const d = parse(s);
  let out = `${d.getDate()} ${(long ? TH_MONTHS : TH_MONTHS_S)[d.getMonth()]}`;
  if (year) out += ` ${d.getFullYear() + 543}`;
  if (weekday) out = `วัน${TH_DAYS[d.getDay()]}ที่ ${out}`;
  return out;
}

export function fmtRange(a?: string, b?: string) {
  if (!a) return '';
  if (!b || b === a) return fmtDate(a);
  const A = parse(a), B = parse(b);
  if (A.getFullYear() === B.getFullYear()) {
    if (A.getMonth() === B.getMonth()) return `${A.getDate()}–${B.getDate()} ${TH_MONTHS_S[A.getMonth()]} ${A.getFullYear() + 543}`;
    return `${A.getDate()} ${TH_MONTHS_S[A.getMonth()]} – ${fmtDate(b)}`;
  }
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

export function countdown(n: number) {
  if (n === 0) return 'วันนี้!';
  if (n === 1) return 'พรุ่งนี้';
  return n > 0 ? `อีก ${n} วัน` : `${-n} วันที่แล้ว`;
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

export const monthLabel = (key: string) => `${TH_MONTHS[+key.slice(5, 7) - 1]} ${+key.slice(0, 4) + 543}`;
