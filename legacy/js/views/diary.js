// ไดอารี่: บันทึกหนังที่ดู / กินข้าว / เดท พร้อมรูป
import { getProfile, coll } from '../store.js';
import { hydrate, photoPicker, deletePhotos, openLightbox } from '../photos.js';
import { $, $$, esc, todayStr, fmtDate, TH_MONTHS, openSheet, confirmSheet, toast, refresh, bindSeg, heartsInput, heartsText, formData, burstHearts } from '../utils.js';

export const MEM_CATS = {
  movie: { label: 'ดูหนัง', emoji: '🎬', color: 'lav' },
  food: { label: 'กินข้าว', emoji: '🍜', color: 'yellow' },
  date: { label: 'เดท', emoji: '🌸', color: 'pink' },
  other: { label: 'อื่นๆ', emoji: '💌', color: 'blue' },
};
let filter = 'all';

export async function render(el) {
  const [p, all] = await Promise.all([getProfile(), coll.all('memories')]);
  all.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
  const list = filter === 'all' ? all : all.filter(m => m.cat === filter);
  const movieCount = all.filter(m => m.cat === 'movie').length;
  const photoCount = all.reduce((n, m) => n + (m.photos?.length || 0), 0);

  // จัดกลุ่มตามเดือน
  const groups = new Map();
  for (const m of list) {
    const key = (m.date || '').slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  el.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">บันทึกความทรงจำของ ${esc(p.nameA)} & ${esc(p.nameB)}</p><h1>ไดอารี่ของเรา 📔</h1></div></header>
    <div class="stats">
      <div class="card stat"><b>${movieCount}</b><span>🎬 หนังที่ดูด้วยกัน</span></div>
      <div class="card stat"><b>${all.length}</b><span>💌 ความทรงจำ</span></div>
      <div class="card stat"><b>${photoCount}</b><span>📸 รูปภาพ</span></div>
    </div>
    <div class="chips" style="margin-top:16px">
      <button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-f="all">ทั้งหมด</button>
      ${Object.entries(MEM_CATS).map(([k, c]) => `<button class="filter-chip ${filter === k ? 'active' : ''}" data-f="${k}">${c.emoji} ${c.label}</button>`).join('')}
    </div>
    ${list.length ? [...groups].map(([key, items]) => `
      <div class="month-label">${key ? `${TH_MONTHS[+key.slice(5, 7) - 1]} ${+key.slice(0, 4) + 543}` : 'ไม่ระบุวันที่'}</div>
      <div class="polaroids">${items.map(m => `
        <button class="polaroid" data-id="${esc(m.id)}">
          <div class="ph">${m.photos?.length ? `<img data-photo="${esc(m.photos[0])}" alt="">${m.photos.length > 1 ? `<span class="count">📷 ${m.photos.length}</span>` : ''}` : (MEM_CATS[m.cat]?.emoji || '💌')}</div>
          <div class="cap">
            <div class="t">${MEM_CATS[m.cat]?.emoji || ''} ${esc(m.title)}</div>
            <div class="d">${fmtDate(m.date)}</div>
            ${m.rating ? `<div class="hearts">${heartsText(m.rating)}</div>` : ''}
          </div>
        </button>`).join('')}
      </div>`).join('') : `
      <div class="card empty" style="margin-top:14px">
        <div class="emo">${filter === 'movie' || filter === 'all' ? '🍿' : MEM_CATS[filter].emoji}</div>
        <p>ยังไม่มีบันทึก${filter === 'all' ? '' : 'หมวดนี้'}<br>กดปุ่ม ＋ ด้านล่างเพื่อเพิ่มความทรงจำแรกกัน</p>
      </div>`}
  `;
  hydrate(el);

  $$('[data-f]', el).forEach(b => b.onclick = () => { filter = b.dataset.f; render(el); });
  $$('.polaroid[data-id]', el).forEach(b => b.onclick = () => openMemoryDetail(b.dataset.id));
}

export const fab = () => openMemoryForm();

export async function openMemoryDetail(id) {
  const [m, p] = await Promise.all([coll.get('memories', id), getProfile()]);
  if (!m) return;
  const cat = MEM_CATS[m.cat] || MEM_CATS.other;
  const picker = { A: p.nameA, B: p.nameB, both: 'เลือกด้วยกัน' }[m.picker];
  openSheet({
    title: `${cat.emoji} ${cat.label}`,
    body: `
      ${m.photos?.length ? `<div class="gallery ${m.photos.length > 1 ? 'multi' : ''}">${m.photos.map((ph, i) => `<img data-photo="${esc(ph)}" data-i="${i}" alt="">`).join('')}</div>` : ''}
      <span class="chip ${cat.color}">${cat.emoji} ${cat.label}</span>
      <h2 class="detail-title">${esc(m.title)}</h2>
      ${m.rating ? `<div class="hearts" style="font-size:20px">${heartsText(m.rating)}</div>` : ''}
      <dl class="kv">
        <dt>📅 วันที่</dt><dd>${fmtDate(m.date, { long: true, weekday: true })}</dd>
        ${m.place ? `<dt>📍 ที่ไหน</dt><dd>${esc(m.place)}</dd>` : ''}
        ${picker ? `<dt>🙋 ใครเลือก</dt><dd>${esc(picker)}</dd>` : ''}
      </dl>
      ${m.note ? `<div class="note">${esc(m.note)}</div>` : ''}
      <div class="btn-row" style="margin-top:18px">
        <button class="btn btn-danger" data-del>🗑️ ลบ</button>
        <button class="btn btn-primary" data-edit>✏️ แก้ไข</button>
      </div>`,
    onMount(body, close) {
      hydrate(body);
      $$('.gallery img', body).forEach(img => img.onclick = () => openLightbox(m.photos, +img.dataset.i));
      $('[data-edit]', body).onclick = () => { close(); openMemoryForm(m); };
      $('[data-del]', body).onclick = async () => {
        if (!await confirmSheet({ message: `ลบ “${m.title}” ออกจากไดอารี่?`, ok: 'ลบเลย' })) return;
        await deletePhotos(m.photos || []);
        await coll.remove('memories', m.id);
        close(); toast('ลบแล้ว'); refresh();
      };
    },
  });
}

export async function openMemoryForm(m = null, preset = {}) {
  const p = await getProfile();
  const isNew = !m;
  m = m ? { ...m } : { cat: 'movie', date: todayStr(), rating: 0, photos: [], picker: '', ...preset };
  let saved = false, pk;

  openSheet({
    title: isNew ? 'เพิ่มความทรงจำ ✨' : 'แก้ไขความทรงจำ',
    body: `<form id="mf" autocomplete="off">
      <div class="seg" id="cat" style="margin-bottom:14px">
        ${Object.entries(MEM_CATS).map(([k, c]) => `<button type="button" data-v="${k}">${c.emoji} ${c.label}</button>`).join('')}
      </div>
      <label class="field"><span id="title-lbl">ชื่อหนัง</span><input name="title" required maxlength="120" value="${esc(m.title || '')}" placeholder="เช่น Your Name"></label>
      <div class="field-row">
        <label class="field"><span>วันที่</span><input type="date" name="date" required value="${esc(m.date || '')}"></label>
        <label class="field"><span id="place-lbl">โรงหนัง</span><input name="place" maxlength="80" value="${esc(m.place || '')}" placeholder="เช่น Paragon"></label>
      </div>
      <div class="field" id="picker-field"><span>ใครเป็นคนเลือกเรื่องนี้</span>
        <div class="seg" id="picker"><button type="button" data-v="A">${esc(p.nameA)}</button><button type="button" data-v="B">${esc(p.nameB)}</button><button type="button" data-v="both">ด้วยกัน</button></div>
      </div>
      <div class="field"><span>ให้กี่หัวใจ</span><div class="hearts-input" id="rating"></div></div>
      <label class="field"><span>บันทึกเล็กๆ</span><textarea name="note" maxlength="2000" placeholder="ฉากที่ชอบ, ร้องไห้ตรงไหน, กินป๊อปคอร์นรสอะไร...">${esc(m.note || '')}</textarea></label>
      <div class="field"><span>รูปภาพ (สูงสุด 6 รูป)</span><div id="photos"></div></div>
      <div class="sheet-actions"><button class="btn btn-primary btn-block" type="submit">💾 บันทึก</button></div>
    </form>`,
    onMount(body, close) {
      const form = $('#mf', body);
      const updateLabels = cat => {
        const movie = cat === 'movie';
        $('#title-lbl', body).textContent = movie ? 'ชื่อหนัง' : 'หัวข้อ';
        form.elements.title.placeholder = movie ? 'เช่น Your Name' : cat === 'food' ? 'เช่น ชาบูร้านโปรด' : 'วันนี้ทำอะไรกัน';
        $('#place-lbl', body).textContent = movie ? 'โรงหนัง' : 'สถานที่';
        $('#picker-field', body).hidden = !movie;
      };
      const getCat = bindSeg($('#cat', body), m.cat, updateLabels);
      const getPicker = bindSeg($('#picker', body), m.picker || '');
      const getRating = heartsInput($('#rating', body), m.rating || 0);
      pk = photoPicker($('#photos', body), { ids: m.photos || [], max: 6 });
      updateLabels(m.cat);

      form.onsubmit = async e => {
        e.preventDefault();
        if (pk.busy) return toast('รอรูปอัปโหลดแป๊บนึงน้า');
        const d = formData(form);
        if (!d.title) return toast('ใส่ชื่อก่อนน้า');
        Object.assign(m, d, { cat: getCat(), picker: getCat() === 'movie' ? getPicker() : '', rating: getRating(), photos: pk.ids });
        await pk.commit();
        await coll.save('memories', m);
        saved = true;
        close();
        toast(isNew ? 'บันทึกความทรงจำแล้ว 💕' : 'แก้ไขแล้ว');
        if (isNew) burstHearts(innerWidth / 2, innerHeight / 2, 12);
        refresh();
      };
    },
    onClose: () => { if (!saved) pk?.rollback(); },
  });
}
