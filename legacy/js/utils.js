// ฟังก์ชันช่วยทั่วไป: วันที่ภาษาไทย, escape, toast, bottom sheet, หัวใจลอย
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);

// ---------- วันที่ (เก็บเป็น 'YYYY-MM-DD' ตามเวลาท้องถิ่นเสมอ) ----------
export const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const TH_MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const TH_DAYS_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const pad = n => String(n).padStart(2, '0');
export const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date());
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toStr(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

export function fmtDate(s, { long = false, weekday = false, year = true } = {}) {
  if (!s) return '';
  const d = parse(s);
  let out = `${d.getDate()} ${(long ? TH_MONTHS : TH_MONTHS_S)[d.getMonth()]}`;
  if (year) out += ` ${d.getFullYear() + 543}`;
  if (weekday) out = `วัน${TH_DAYS[d.getDay()]}ที่ ${out}`;
  return out;
}
export function fmtRange(a, b) {
  if (!a) return '';
  if (!b || b === a) return fmtDate(a);
  const A = parse(a), B = parse(b);
  if (A.getFullYear() === B.getFullYear()) {
    if (A.getMonth() === B.getMonth()) return `${A.getDate()}–${B.getDate()} ${TH_MONTHS_S[A.getMonth()]} ${A.getFullYear() + 543}`;
    return `${A.getDate()} ${TH_MONTHS_S[A.getMonth()]} – ${fmtDate(b)}`;
  }
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}
export function countdown(n) {
  if (n === 0) return 'วันนี้!';
  if (n === 1) return 'พรุ่งนี้';
  return n > 0 ? `อีก ${n} วัน` : `${-n} วันที่แล้ว`;
}
// จำนวน ปี/เดือน/วัน ระหว่างสองวัน
export function ymd(start, end) {
  const s = parse(start), e = parse(end);
  let y = e.getFullYear() - s.getFullYear(), m = e.getMonth() - s.getMonth(), d = e.getDate() - s.getDate();
  if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}
// วันครบรอบถัดไป (วัน/เดือนเดียวกับ s) ที่ >= from
export function nextYearly(s, from = todayStr()) {
  const d = parse(s), f = parse(from);
  let n = new Date(f.getFullYear(), d.getMonth(), d.getDate());
  if (n < f) n = new Date(f.getFullYear() + 1, d.getMonth(), d.getDate());
  return toStr(n);
}

// ---------- รีเฟรชหน้าปัจจุบันหลังบันทึกข้อมูล ----------
export const bus = new EventTarget();
export const refresh = () => bus.dispatchEvent(new Event('refresh'));

// ---------- toast ----------
let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- bottom sheet ----------
export function openSheet({ title = '', body = '', onMount, onClose }) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-backdrop"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-handle"></div>
      <div class="sheet-head"><h3>${esc(title)}</h3><button class="icon-btn sheet-x" aria-label="ปิด">✕</button></div>
      <div class="sheet-body">${body}</div>
    </div>`;
  $('#sheet-root').appendChild(wrap);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove('open');
    setTimeout(() => {
      wrap.remove();
      if (!$('#sheet-root').children.length) document.body.style.overflow = '';
    }, 320);
    onClose?.();
  };
  $('.sheet-backdrop', wrap).onclick = close;
  $('.sheet-x', wrap).onclick = close;
  onMount?.($('.sheet-body', wrap), close);
  return close;
}

export function confirmSheet({ title = 'แน่ใจนะ?', message = '', emoji = '🥺', ok = 'ยืนยัน', danger = true }) {
  return new Promise(resolve => {
    let answer = false;
    openSheet({
      title,
      body: `<div class="confirm-box"><div class="big">${emoji}</div><p>${esc(message)}</p>
        <div class="btn-row"><button class="btn btn-ghost" data-no>ยกเลิก</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(ok)}</button></div></div>`,
      onMount(el, close) {
        $('[data-no]', el).onclick = close;
        $('[data-yes]', el).onclick = () => { answer = true; close(); };
      },
      onClose: () => resolve(answer),
    });
  });
}

// ---------- หัวใจลอย ----------
const HEART_EMOJI = ['💗', '💖', '💕', '💞', '🩷', '✨'];
export function burstHearts(x, y, n = 8, pool = HEART_EMOJI) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span');
    h.className = 'float-heart';
    h.textContent = pool[Math.floor(Math.random() * pool.length)];
    h.style.left = `${x - 11 + (Math.random() - .5) * 30}px`;
    h.style.top = `${y - 11}px`;
    h.style.setProperty('--dx', `${(Math.random() - .5) * 140}px`);
    h.style.setProperty('--rot', `${(Math.random() - .5) * 60}deg`);
    h.style.animationDelay = `${i * 50}ms`;
    h.style.fontSize = `${16 + Math.random() * 14}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1500 + i * 50);
  }
}
export function burstFrom(el, n, pool) {
  const r = el.getBoundingClientRect();
  burstHearts(r.left + r.width / 2, r.top + r.height / 3, n, pool);
}

// ---------- form helpers ----------
export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    out[el.name] = typeof el.value === 'string' ? el.value.trim() : el.value;
  }
  return out;
}
// segmented control: <div class="seg" data-name="x"><button data-v="a">..</button></div>
export function bindSeg(seg, value, onChange) {
  const set = v => {
    seg.dataset.value = v;
    $$('button', seg).forEach(b => b.classList.toggle('active', b.dataset.v === v));
  };
  set(value);
  seg.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    e.preventDefault();
    set(b.dataset.v);
    onChange?.(b.dataset.v);
  });
  return () => seg.dataset.value;
}
export function heartsInput(el, value = 0) {
  el.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-i="${i}" aria-label="${i} หัวใจ">💗</button>`).join('');
  const set = v => { value = v; $$('button', el).forEach(b => b.classList.toggle('on', +b.dataset.i <= v)); };
  set(value);
  el.onclick = e => { const b = e.target.closest('button'); if (b) set(+b.dataset.i === value ? 0 : +b.dataset.i); };
  return () => value;
}
export const heartsText = n => n ? '♥'.repeat(n) + '<span style="opacity:.25">' + '♥'.repeat(5 - n) + '</span>' : '';
