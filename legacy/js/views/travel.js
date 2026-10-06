// Travel mode: ทริปในประเทศ / ต่างประเทศ, สถานะ อยากไป → วางแผน → ไปแล้ว, เช็คลิสต์, แสตมป์พาสปอร์ต
import { coll } from '../store.js';
import { uid } from '../db.js';
import { hydrate, photoPicker, deletePhotos, openLightbox } from '../photos.js';
import { PROVINCES, COUNTRIES, CHECKLIST_PRESETS, flag, countryName } from '../data/places.js';
import { $, $$, esc, todayStr, diffDays, fmtRange, countdown, openSheet, confirmSheet, toast, refresh, bindSeg, formData, burstHearts } from '../utils.js';

export const TRIP_STATUS = {
  wish: { label: 'อยากไป', emoji: '💭', color: 'lav' },
  planned: { label: 'วางแผนแล้ว', emoji: '🗓️', color: 'blue' },
  done: { label: 'ไปแล้ว', emoji: '✅', color: 'mint' },
};
let scopeFilter = 'all';
let statusFilter = 'all';

export const tripFlag = t => t.scope === 'international' ? flag(t.country) : '🇹🇭';
export const tripWhere = t => t.scope === 'international'
  ? (t.country === 'ZZ' ? (t.countryOther || 'ต่างประเทศ') : countryName(t.country))
  : (t.province || 'ประเทศไทย');

export async function render(el) {
  const today = todayStr();
  const all = await coll.all('trips');
  const order = { planned: 0, wish: 1, done: 2 };
  all.sort((a, b) => order[a.status] - order[b.status]
    || (a.status === 'done' ? (b.startDate || '').localeCompare(a.startDate || '') : (a.startDate || '9').localeCompare(b.startDate || '9')));

  const done = all.filter(t => t.status === 'done');
  const countries = new Set(done.filter(t => t.scope === 'international').map(t => t.country === 'ZZ' ? t.countryOther : t.country).filter(Boolean));
  const provinces = new Set(done.filter(t => t.scope === 'domestic' && t.province).map(t => t.province));
  const list = all.filter(t => (scopeFilter === 'all' || t.scope === scopeFilter) && (statusFilter === 'all' || t.status === statusFilter));

  el.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Travel Mode</p><h1>ทริปของเรา ✈️</h1></div></header>

    <section class="card passport">
      <div class="lbl">OUR TRAVEL PASSPORT</div>
      <h2>ไปมาแล้วด้วยกัน</h2>
      <div class="pstats">
        <div><b>${countries.size}</b><span>🌏 ประเทศ</span></div>
        <div><b>${provinces.size}</b><span>🇹🇭 จังหวัด</span></div>
        <div><b>${all.filter(t => t.status !== 'done').length}</b><span>🧳 รอไป</span></div>
      </div>
    </section>

    ${done.length ? `
    <section class="section">
      <div class="section-title"><h2>แสตมป์ของเรา</h2><span class="small muted">${done.length} ทริป</span></div>
      <div class="hscroll" style="padding-top:8px;padding-bottom:14px">
        ${done.map(t => `<button class="stamp" data-id="${esc(t.id)}"><div class="f">${tripFlag(t)}</div><div class="n">${esc(t.place)}</div><div class="y">${t.startDate ? +t.startDate.slice(0, 4) + 543 : ''}</div></button>`).join('')}
      </div>
    </section>` : ''}

    <div class="seg" id="scope" style="margin-top:18px">
      <button data-v="all">ทั้งหมด</button><button data-v="domestic">🇹🇭 ในประเทศ</button><button data-v="international">🌏 ต่างประเทศ</button>
    </div>
    <div class="chips" style="margin-top:10px">
      <button class="filter-chip ${statusFilter === 'all' ? 'active' : ''}" data-s="all">ทุกสถานะ</button>
      ${Object.entries(TRIP_STATUS).map(([k, s]) => `<button class="filter-chip ${statusFilter === k ? 'active' : ''}" data-s="${k}">${s.emoji} ${s.label} (${all.filter(t => t.status === k).length})</button>`).join('')}
    </div>

    ${list.length ? `<div class="trips" style="margin-top:8px">${list.map(t => {
      const st = TRIP_STATUS[t.status];
      const left = t.startDate && t.status !== 'done' ? diffDays(today, t.startDate) : null;
      return `<button class="card trip-card ${t.scope === 'international' ? 'intl' : ''}" data-id="${esc(t.id)}">
        <div class="cover">${t.photos?.[0] ? `<img data-photo="${esc(t.photos[0])}" alt="">` : tripFlag(t)}
          <span class="chip ${st.color}">${st.emoji} ${st.label}</span>
          ${left !== null && left >= 0 ? `<span class="chip cd">${countdown(left)}</span>` : ''}
        </div>
        <div class="body">
          <div class="t">${tripFlag(t)} ${esc(t.place)}</div>
          <div class="s">${esc(tripWhere(t))}${t.startDate ? ' · ' + fmtRange(t.startDate, t.endDate) : ' · ยังไม่กำหนดวัน'}</div>
          ${t.checklist?.length ? `<div class="s" style="margin-top:4px">☑️ เตรียมของ ${t.checklist.filter(c => c.done).length}/${t.checklist.length}</div>` : ''}
        </div>
      </button>`;
    }).join('')}</div>` : `
    <div class="card empty" style="margin-top:12px"><div class="emo">🗺️</div><p>ยังไม่มีทริปในหมวดนี้<br>อยากไปไหนด้วยกัน กด ＋ จดไว้เลย!</p></div>`}
  `;
  hydrate(el);

  bindSeg($('#scope', el), scopeFilter, v => { scopeFilter = v; render(el); });
  $$('[data-s]', el).forEach(b => b.onclick = () => { statusFilter = b.dataset.s; render(el); });
  $$('[data-id]', el).forEach(b => b.onclick = () => openTripDetail(b.dataset.id));
}

export const fab = () => openTripForm();

export async function openTripDetail(id) {
  const t = await coll.get('trips', id);
  if (!t) return;
  const today = todayStr();
  const st = TRIP_STATUS[t.status];
  t.checklist ||= [];

  openSheet({
    title: `${tripFlag(t)} ${t.place}`,
    body: `
      ${t.photos?.length ? `<div class="gallery ${t.photos.length > 1 ? 'multi' : ''}">${t.photos.map((ph, i) => `<img data-photo="${esc(ph)}" data-i="${i}" alt="">`).join('')}</div>` : ''}
      <div class="row" style="flex-wrap:wrap;gap:6px">
        <span class="chip ${st.color}">${st.emoji} ${st.label}</span>
        <span class="chip ${t.scope === 'international' ? 'pink' : 'mint'}">${t.scope === 'international' ? '🌏 ต่างประเทศ' : '🇹🇭 ในประเทศ'}</span>
        ${t.startDate && t.status !== 'done' && diffDays(today, t.startDate) >= 0 ? `<span class="chip yellow">⏳ ${countdown(diffDays(today, t.startDate))}</span>` : ''}
      </div>
      <h2 class="detail-title">${esc(t.place)}</h2>
      <dl class="kv">
        <dt>📍 ที่ไหน</dt><dd>${tripFlag(t)} ${esc(tripWhere(t))}</dd>
        <dt>📅 วันที่</dt><dd>${t.startDate ? fmtRange(t.startDate, t.endDate) + (t.endDate && t.endDate !== t.startDate ? ` (${diffDays(t.startDate, t.endDate) + 1} วัน)` : '') : 'ยังไม่กำหนด'}</dd>
        ${t.budget ? `<dt>💰 งบ</dt><dd>฿${Number(t.budget).toLocaleString()}</dd>` : ''}
      </dl>
      ${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}

      <div class="section-title" style="margin-top:18px"><h2>☑️ เช็คลิสต์</h2><span class="small muted" id="ck-count"></span></div>
      <div class="checklist" id="ck"></div>
      <form class="add-check" id="ck-add"><input class="input" name="text" placeholder="เพิ่มรายการ เช่น ครีมกันแดด" maxlength="80"><button class="btn btn-sm">เพิ่ม</button></form>

      ${t.status !== 'done' ? `<button class="btn btn-primary btn-block" data-done style="margin-top:18px">✅ ไปมาแล้ว! ปั๊มแสตมป์</button>` : ''}
      <div class="btn-row" style="margin-top:10px">
        <button class="btn btn-danger" data-del>🗑️ ลบ</button>
        <button class="btn btn-ghost" data-edit>✏️ แก้ไข</button>
      </div>`,
    onMount(body, close) {
      hydrate(body);
      $$('.gallery img', body).forEach(img => img.onclick = () => openLightbox(t.photos, +img.dataset.i));

      const paintChecks = () => {
        $('#ck', body).innerHTML = t.checklist.map(c => `
          <label class="check ${c.done ? 'done' : ''}"><input type="checkbox" data-c="${esc(c.id)}" ${c.done ? 'checked' : ''}><span>${esc(c.text)}</span>
          <button type="button" class="del" data-x="${esc(c.id)}" aria-label="ลบรายการ">✕</button></label>`).join('')
          || '<p class="small muted center">ยังไม่มีรายการ</p>';
        $('#ck-count', body).textContent = t.checklist.length ? `${t.checklist.filter(c => c.done).length}/${t.checklist.length}` : '';
      };
      const saveChecks = async () => { await coll.save('trips', t); paintChecks(); refresh(); };
      paintChecks();
      $('#ck', body).addEventListener('change', e => {
        const c = t.checklist.find(x => x.id === e.target.dataset.c);
        if (c) { c.done = e.target.checked; saveChecks(); }
      });
      $('#ck', body).addEventListener('click', e => {
        const x = e.target.closest('[data-x]');
        if (!x) return;
        e.preventDefault();
        t.checklist = t.checklist.filter(c => c.id !== x.dataset.x);
        saveChecks();
      });
      $('#ck-add', body).onsubmit = e => {
        e.preventDefault();
        const input = e.target.elements.text;
        if (!input.value.trim()) return;
        t.checklist.push({ id: uid(), text: input.value.trim(), done: false });
        input.value = '';
        saveChecks();
      };

      $('[data-done]', body)?.addEventListener('click', async () => {
        t.status = 'done';
        t.startDate ||= today;
        await coll.save('trips', t);
        close();
        burstHearts(innerWidth / 2, innerHeight / 2, 14, ['🎉', '✈️', '💖', '📸', tripFlag(t)]);
        toast(`ปั๊มแสตมป์ ${t.place} แล้ว! 🎉`);
        refresh();
      });
      $('[data-edit]', body).onclick = () => { close(); openTripForm(t); };
      $('[data-del]', body).onclick = async () => {
        if (!await confirmSheet({ message: `ลบทริป “${t.place}”?`, ok: 'ลบทริป' })) return;
        await deletePhotos(t.photos || []);
        await coll.remove('trips', t.id);
        close(); toast('ลบทริปแล้ว'); refresh();
      };
    },
  });
}

export function openTripForm(t = null, preset = {}) {
  const isNew = !t;
  t = t ? { ...t } : { scope: 'domestic', status: preset.startDate ? 'planned' : 'wish', photos: [], checklist: [], country: 'JP', ...preset };
  let saved = false, pk;

  openSheet({
    title: isNew ? 'เพิ่มทริปใหม่ 🧳' : 'แก้ไขทริป',
    body: `<form id="tf" autocomplete="off">
      <div class="seg" id="scope-f" style="margin-bottom:14px"><button type="button" data-v="domestic">🇹🇭 ในประเทศ</button><button type="button" data-v="international">🌏 ต่างประเทศ</button></div>
      <label class="field"><span>จะไปที่ไหน</span><input name="place" required maxlength="80" value="${esc(t.place || '')}" placeholder="เช่น ดอยอินทนนท์, โตเกียว"></label>
      <label class="field" id="f-prov"><span>จังหวัด</span><input name="province" list="provinces" value="${esc(t.province || '')}" placeholder="พิมพ์ชื่อจังหวัด">
        <datalist id="provinces">${PROVINCES.map(p => `<option value="${p}">`).join('')}</datalist></label>
      <label class="field" id="f-country"><span>ประเทศ</span><select name="country">
        ${COUNTRIES.map(c => `<option value="${c.code}" ${t.country === c.code ? 'selected' : ''}>${flag(c.code)} ${c.name}</option>`).join('')}</select></label>
      <label class="field" id="f-country-other"><span>ชื่อประเทศ</span><input name="countryOther" maxlength="60" value="${esc(t.countryOther || '')}"></label>
      <div class="field"><span>สถานะ</span><div class="seg" id="status-f">
        ${Object.entries(TRIP_STATUS).map(([k, s]) => `<button type="button" data-v="${k}">${s.emoji} ${s.label}</button>`).join('')}</div></div>
      <div class="field-row">
        <label class="field"><span>วันไป</span><input type="date" name="startDate" value="${esc(t.startDate || '')}"></label>
        <label class="field"><span>วันกลับ</span><input type="date" name="endDate" value="${esc(t.endDate || '')}"></label>
      </div>
      <label class="field"><span>งบประมาณ (บาท)</span><input type="number" inputmode="numeric" name="budget" min="0" value="${esc(t.budget || '')}" placeholder="เช่น 20000"></label>
      <label class="field"><span>โน้ต / ที่อยากไป / ของที่อยากกิน</span><textarea name="note" maxlength="2000" placeholder="คาเฟ่ริมทะเล, ทะเลหมอก, ร้านราเมงเจ้าดัง...">${esc(t.note || '')}</textarea></label>
      <div class="field"><span>รูปทริป (รูปแรกเป็นปก)</span><div id="photos"></div></div>
      <div class="sheet-actions"><button class="btn btn-primary btn-block" type="submit">💾 บันทึกทริป</button></div>
    </form>`,
    onMount(body, close) {
      const form = $('#tf', body);
      const sync = () => {
        const intl = getScope() === 'international';
        $('#f-prov', body).hidden = intl;
        $('#f-country', body).hidden = !intl;
        $('#f-country-other', body).hidden = !intl || form.elements.country.value !== 'ZZ';
      };
      const getScope = bindSeg($('#scope-f', body), t.scope, sync);
      const getStatus = bindSeg($('#status-f', body), t.status);
      form.elements.country.onchange = sync;
      sync();
      pk = photoPicker($('#photos', body), { ids: t.photos || [], max: 9, coverHint: true });

      form.onsubmit = async e => {
        e.preventDefault();
        if (pk.busy) return toast('รอรูปอัปโหลดแป๊บนึงน้า');
        const d = formData(form);
        if (!d.place) return toast('ใส่ชื่อสถานที่ก่อนน้า');
        if (d.endDate && d.startDate && d.endDate < d.startDate) return toast('วันกลับต้องไม่ก่อนวันไปน้า');
        if (d.endDate && !d.startDate) d.startDate = d.endDate;
        Object.assign(t, d, { scope: getScope(), status: getStatus(), photos: pk.ids, budget: d.budget ? Number(d.budget) : '' });
        if (t.scope === 'domestic') { delete t.country; delete t.countryOther; } else delete t.province;
        if (isNew && !t.checklist.length) {
          t.checklist = CHECKLIST_PRESETS[t.scope].map(text => ({ id: uid(), text, done: false }));
        }
        await pk.commit();
        await coll.save('trips', t);
        saved = true;
        close();
        toast(isNew ? 'เพิ่มทริปแล้ว ไปเที่ยวกัน! ✈️' : 'แก้ไขทริปแล้ว');
        refresh();
      };
    },
    onClose: () => { if (!saved) pk?.rollback(); },
  });
}
