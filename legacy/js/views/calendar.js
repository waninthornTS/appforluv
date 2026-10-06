// ปฏิทิน: นัดหมาย, ทริป, วันครบรอบ, วันเกิด, ไดอารี่ — รวมไว้ในที่เดียว
import { getProfile, coll } from '../store.js';
import { $, $$, esc, todayStr, toStr, parse, addDays, diffDays, fmtDate, fmtRange, countdown, TH_MONTHS, TH_DAYS_S, openSheet, confirmSheet, toast, refresh, bindSeg, formData } from '../utils.js';
import { openTripForm, openTripDetail, tripFlag } from './travel.js';
import { openMemoryDetail, MEM_CATS } from './diary.js';

export const EVENT_TYPES = {
  date: { label: 'นัดเดท', emoji: '💕', color: 'pink' },
  special: { label: 'วันสำคัญ', emoji: '⭐', color: 'yellow' },
  other: { label: 'อื่นๆ', emoji: '📌', color: 'blue' },
};

const now = new Date();
let cur = { y: now.getFullYear(), m: now.getMonth() };
let sel = todayStr();

// รวบรวมทุกอย่างที่ต้องแสดงในช่วงวันที่ [from, to]
function collect({ p, events, trips, memories }, from, to) {
  const map = new Map();
  const add = (date, item) => {
    if (date < from || date > to) return;
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(item);
  };
  const eachDay = (a, b, fn) => { for (let d = a < from ? from : a; d <= b && d <= to; d = addDays(d, 1)) fn(d); };

  for (const e of events) {
    const t = EVENT_TYPES[e.type] || EVENT_TYPES.other;
    eachDay(e.date, e.endDate || e.date, d => add(d, { kind: 'event', id: e.id, emo: t.emoji, color: t.color, title: e.title, sub: [e.time, e.place].filter(Boolean).join(' · '), sort: e.time || '' }));
  }
  for (const t of trips) {
    if (!t.startDate) continue;
    const end = t.endDate || t.startDate;
    eachDay(t.startDate, end, d => add(d, {
      kind: 'trip', id: t.id, emo: tripFlag(t), color: 'mint', title: `ทริป ${t.place}`, trip: true,
      tripStart: d === t.startDate, tripEnd: d === end, sub: fmtRange(t.startDate, t.endDate),
    }));
  }
  for (const m of memories) {
    const c = MEM_CATS[m.cat] || MEM_CATS.other;
    if (m.date) add(m.date, { kind: 'memory', id: m.id, emo: c.emoji, color: 'lav', title: m.title, sub: `ไดอารี่ · ${c.label}` });
  }
  // วันครบรอบรายปี + รายเดือน + ทุก 100 วัน
  if (p.startDate) {
    const s = parse(p.startDate);
    const fy = +from.slice(0, 4), ty = +to.slice(0, 4);
    for (let y = fy; y <= ty; y++) {
      for (let mo = 0; mo < 12; mo++) {
        const d = new Date(y, mo, s.getDate());
        if (d.getDate() !== s.getDate()) continue; // เช่น วันที่ 31 ในเดือนที่ไม่มี
        const ds = toStr(d);
        const months = (y - s.getFullYear()) * 12 + (mo - s.getMonth());
        if (months <= 0) continue;
        if (months % 12 === 0) add(ds, { kind: 'anniv', emo: '💍', color: 'red', title: `ครบรอบ ${months / 12} ปี`, special: true });
        else add(ds, { kind: 'anniv', emo: '💗', color: 'red', title: `ครบ ${months} เดือน`, sub: 'วันครบเดือน' });
      }
    }
    const startN = Math.max(1, Math.ceil((diffDays(p.startDate, from) + 1) / 100));
    for (let k = startN; ; k++) {
      const d = addDays(p.startDate, k * 100 - 1);
      if (d > to) break;
      add(d, { kind: 'anniv', emo: '💯', color: 'red', title: `ครบ ${(k * 100).toLocaleString()} วัน`, special: true });
    }
  }
  for (const [who, b] of [[p.nameA, p.birthA], [p.nameB, p.birthB]]) {
    if (!b) continue;
    const bd = parse(b);
    for (let y = +from.slice(0, 4); y <= +to.slice(0, 4); y++) {
      add(toStr(new Date(y, bd.getMonth(), bd.getDate())), { kind: 'birthday', emo: '🎂', color: 'yellow', title: `วันเกิด ${who}`, special: true });
    }
  }
  for (const list of map.values()) list.sort((a, b) => (a.sort || '').localeCompare(b.sort || ''));
  return map;
}

export async function render(el) {
  const [p, events, trips, memories] = await Promise.all([getProfile(), coll.all('events'), coll.all('trips'), coll.all('memories')]);
  const data = { p, events, trips, memories };
  const today = todayStr();

  const first = new Date(cur.y, cur.m, 1);
  const gridStart = addDays(toStr(first), -first.getDay());
  const gridEnd = addDays(gridStart, 41);
  const map = collect(data, gridStart, gridEnd);

  const lastWeekNeeded = new Date(cur.y, cur.m + 1, 0).getDate() + first.getDay() > 35 ? 42 : 35;
  const cells = Array.from({ length: lastWeekNeeded }, (_, i) => addDays(gridStart, i));

  const selItems = collect(data, sel, sel).get(sel) || [];
  const upcomingMap = collect(data, today, addDays(today, 60));
  const upcoming = [...upcomingMap].flatMap(([d, items]) => items.filter(i => i.kind !== 'memory' && !(i.kind === 'trip' && !i.tripStart)).map(i => ({ ...i, date: d }))).slice(0, 6);

  el.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">นัดกันไว้แล้วนะ</p><h1>ปฏิทินของเรา 🗓️</h1></div></header>
    <section class="card">
      <div class="cal-head">
        <button class="icon-btn" data-nav="-1" aria-label="เดือนก่อน">‹</button>
        <div class="center"><h2>${TH_MONTHS[cur.m]} ${cur.y + 543}</h2>
          <button class="link today-btn" data-today>กลับไปวันนี้</button></div>
        <button class="icon-btn" data-nav="1" aria-label="เดือนถัดไป">›</button>
      </div>
      <div class="cal-grid" id="grid">
        ${TH_DAYS_S.map(d => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map(d => {
          const items = map.get(d) || [];
          const dt = parse(d);
          const trip = items.find(i => i.trip);
          const spec = items.find(i => i.special);
          const dots = [...new Set(items.filter(i => !i.trip).map(i => i.color))].slice(0, 3);
          const cls = ['cal-day', dt.getMonth() !== cur.m && 'out', dt.getDay() === 0 && 'sun', d === today && 'today', d === sel && 'sel',
            trip && 'trip', trip?.tripStart && 'trip-s', trip?.tripEnd && 'trip-e'].filter(Boolean).join(' ');
          return `<button class="${cls}" data-d="${d}">${dt.getDate()}${spec ? `<span class="spec">${spec.emo}</span>` : ''}
            <span class="dots">${dots.map(c => `<i class="dot-${c}"></i>`).join('')}</span></button>`;
        }).join('')}
      </div>
      <div class="legend">
        <span><i class="dot-pink"></i>นัดเดท</span><span><i class="dot-mint"></i>ทริป</span><span><i class="dot-red"></i>ครบรอบ</span>
        <span><i class="dot-yellow"></i>วันสำคัญ/วันเกิด</span><span><i class="dot-lav"></i>ไดอารี่</span>
      </div>
    </section>

    <section class="section">
      <div class="section-title"><h2>${fmtDate(sel, { weekday: true })}</h2><span class="chip">${countdown(diffDays(today, sel))}</span></div>
      ${selItems.length ? `<div class="list">${selItems.map(itemHTML).join('')}</div>` : `<div class="card empty" style="padding:18px"><p>ยังไม่มีอะไรในวันนี้</p></div>`}
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-add="event">💕 เพิ่มนัด</button>
        <button class="btn" data-add="trip" style="background:var(--mint-l);color:#1F9A72">✈️ เพิ่มทริป</button>
      </div>
    </section>

    <section class="section">
      <div class="section-title"><h2>60 วันข้างหน้า</h2></div>
      ${upcoming.length ? `<div class="list">${upcoming.map(i => itemHTML(i, true)).join('')}</div>` : `<div class="card empty" style="padding:18px"><p>ว่างเลย ชวนกันไปเดทหน่อยมั้ย 👀</p></div>`}
    </section>
  `;

  $$('[data-nav]', el).forEach(b => b.onclick = () => {
    cur.m += +b.dataset.nav;
    if (cur.m < 0) { cur.m = 11; cur.y--; }
    if (cur.m > 11) { cur.m = 0; cur.y++; }
    render(el);
  });
  $('[data-today]', el).onclick = () => { const n = new Date(); cur = { y: n.getFullYear(), m: n.getMonth() }; sel = todayStr(); render(el); };
  $('#grid', el).onclick = e => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    sel = b.dataset.d;
    const d = parse(sel);
    if (d.getMonth() !== cur.m) cur = { y: d.getFullYear(), m: d.getMonth() };
    render(el);
  };
  $('[data-add=event]', el).onclick = () => openEventForm(null, { date: sel });
  $('[data-add=trip]', el).onclick = () => openTripForm(null, { startDate: sel });
  $$('[data-kind]', el).forEach(b => b.onclick = () => {
    const { kind, id } = b.dataset;
    if (kind === 'event') openEventDetail(id);
    else if (kind === 'trip') openTripDetail(id);
    else if (kind === 'memory') openMemoryDetail(id);
  });
}

function itemHTML(i, withDate = false) {
  const clickable = ['event', 'trip', 'memory'].includes(i.kind);
  const tag = clickable ? 'button' : 'div';
  const left = withDate ? `<div class="datebox"><b>${+i.date.slice(8)}</b><span>${fmtDate(i.date, { year: false }).split(' ')[1]}</span></div>` : `<div class="ico ${i.color === 'red' ? 'pink' : i.color}">${i.emo}</div>`;
  return `<${tag} class="card item" ${clickable ? `data-kind="${i.kind}" data-id="${esc(i.id)}"` : ''}>
    ${left}
    <div class="grow"><div class="t ellipsis">${withDate ? i.emo + ' ' : ''}${esc(i.title)}</div>${i.sub ? `<div class="s ellipsis">${esc(i.sub)}</div>` : ''}</div>
    ${withDate ? `<span class="chip">${countdown(diffDays(todayStr(), i.date))}</span>` : ''}
  </${tag}>`;
}

export const fab = () => openEventForm(null, { date: sel });

async function openEventDetail(id) {
  const e = await coll.get('events', id);
  if (!e) return;
  const t = EVENT_TYPES[e.type] || EVENT_TYPES.other;
  openSheet({
    title: `${t.emoji} ${t.label}`,
    body: `<h2 class="detail-title">${esc(e.title)}</h2>
      <dl class="kv">
        <dt>📅 วันที่</dt><dd>${e.endDate && e.endDate !== e.date ? fmtRange(e.date, e.endDate) : fmtDate(e.date, { long: true, weekday: true })}</dd>
        ${e.time ? `<dt>⏰ เวลา</dt><dd>${esc(e.time)} น.</dd>` : ''}
        ${e.place ? `<dt>📍 ที่ไหน</dt><dd>${esc(e.place)}</dd>` : ''}
        <dt>⏳ นับถอยหลัง</dt><dd>${countdown(diffDays(todayStr(), e.date))}</dd>
      </dl>
      ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
      <div class="btn-row" style="margin-top:18px">
        <button class="btn btn-danger" data-del>🗑️ ลบ</button>
        <button class="btn btn-primary" data-edit>✏️ แก้ไข</button>
      </div>`,
    onMount(body, close) {
      $('[data-edit]', body).onclick = () => { close(); openEventForm(e); };
      $('[data-del]', body).onclick = async () => {
        if (!await confirmSheet({ message: `ลบนัด “${e.title}”?`, ok: 'ลบนัด' })) return;
        await coll.remove('events', e.id);
        close(); toast('ลบนัดแล้ว'); refresh();
      };
    },
  });
}

export function openEventForm(e = null, preset = {}) {
  const isNew = !e;
  e = e ? { ...e } : { type: 'date', date: todayStr(), ...preset };
  openSheet({
    title: isNew ? 'เพิ่มนัดหมาย 💕' : 'แก้ไขนัดหมาย',
    body: `<form id="ef" autocomplete="off">
      <div class="seg" id="type" style="margin-bottom:14px">${Object.entries(EVENT_TYPES).map(([k, t]) => `<button type="button" data-v="${k}">${t.emoji} ${t.label}</button>`).join('')}</div>
      <label class="field"><span>นัดอะไรกัน</span><input name="title" required maxlength="100" value="${esc(e.title || '')}" placeholder="เช่น ไปกินชาบู, ไปคาเฟ่แมว"></label>
      <div class="field-row">
        <label class="field"><span>วันที่</span><input type="date" name="date" required value="${esc(e.date || '')}"></label>
        <label class="field"><span>เวลา</span><input type="time" name="time" value="${esc(e.time || '')}"></label>
      </div>
      <label class="field"><span>ถึงวันที่ (ถ้าหลายวัน)</span><input type="date" name="endDate" value="${esc(e.endDate || '')}"></label>
      <label class="field"><span>สถานที่</span><input name="place" maxlength="80" value="${esc(e.place || '')}" placeholder="เช่น สยามพารากอน"></label>
      <label class="field"><span>โน้ต</span><textarea name="note" maxlength="1000" placeholder="แต่งตัวธีมสีชมพู, จองโต๊ะไว้แล้ว...">${esc(e.note || '')}</textarea></label>
      <div class="sheet-actions"><button class="btn btn-primary btn-block" type="submit">💾 บันทึกนัด</button></div>
    </form>`,
    onMount(body, close) {
      const form = $('#ef', body);
      const getType = bindSeg($('#type', body), e.type);
      form.onsubmit = async ev => {
        ev.preventDefault();
        const d = formData(form);
        if (!d.title || !d.date) return toast('ใส่ชื่อนัดกับวันที่ก่อนน้า');
        if (d.endDate && d.endDate < d.date) return toast('วันสิ้นสุดต้องไม่ก่อนวันเริ่มน้า');
        Object.assign(e, d, { type: getType() });
        await coll.save('events', e);
        sel = e.date;
        const dt = parse(e.date);
        cur = { y: dt.getFullYear(), m: dt.getMonth() };
        close();
        toast(isNew ? 'เพิ่มนัดแล้ว อย่าลืมน้า 💕' : 'แก้ไขนัดแล้ว');
        refresh();
      };
    },
  });
}
