// รูปภาพ: ย่อขนาดก่อนเก็บ (ประหยัดพื้นที่ iPhone), เก็บเป็น Blob ใน IndexedDB
import { db, uid } from './db.js';
import { $, $$, esc, toast } from './utils.js';

const MAX_SIDE = 1400;
const QUALITY = 0.82;
const urlCache = new Map();

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านรูปไม่ได้')); };
    img.src = url;
  });
}

export async function compressImage(file, max = MAX_SIDE) {
  const img = await loadImage(file);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', QUALITY));
}

export async function savePhoto(file) {
  const blob = await compressImage(file);
  const id = uid();
  await db.put('photos', { id, blob, createdAt: Date.now() });
  return id;
}

export async function photoURL(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  const rec = await db.get('photos', id);
  if (!rec) return '';
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export async function deletePhotos(ids = []) {
  for (const id of ids) {
    await db.del('photos', id);
    const u = urlCache.get(id);
    if (u) { URL.revokeObjectURL(u); urlCache.delete(id); }
  }
}

// แทน <img data-photo="id"> ด้วย URL จริง
export async function hydrate(root) {
  await Promise.all($$('img[data-photo]', root).map(async img => {
    const url = await photoURL(img.dataset.photo);
    if (url) img.src = url; else img.remove();
  }));
}

/**
 * ตัวเลือกรูปในฟอร์ม
 * - รูปที่เพิ่มใหม่จะถูกบันทึกทันที ถ้ากดยกเลิกจะลบทิ้ง (rollback)
 * - รูปเดิมที่กดลบ จะลบจริงตอนกดบันทึก (commit)
 */
export function photoPicker(el, { ids = [], max = 6, label = 'เพิ่มรูป', coverHint = false } = {}) {
  let current = [...ids];
  const added = new Set();
  const removed = new Set();
  let loading = 0;

  const paint = () => {
    el.innerHTML = `<div class="photo-grid">
      ${current.map((id, i) => `<div class="photo-tile ${coverHint && i === 0 ? 'cover' : ''}">
        <img data-photo="${esc(id)}" alt=""><button type="button" class="rm" data-rm="${esc(id)}" aria-label="ลบรูป">✕</button></div>`).join('')}
      ${Array.from({ length: loading }, () => '<div class="photo-tile loading"><div class="spinner"></div></div>').join('')}
      ${current.length + loading < max ? `<label class="photo-add"><b>＋</b>${esc(label)}
        <input type="file" accept="image/*" ${max - current.length > 1 ? 'multiple' : ''}></label>` : ''}
    </div>`;
    hydrate(el);
    const input = $('input[type=file]', el);
    if (input) input.onchange = () => addFiles([...input.files]);
  };

  async function addFiles(files) {
    files = files.slice(0, max - current.length - loading);
    loading += files.length;
    paint();
    for (const f of files) {
      try {
        const id = await savePhoto(f);
        added.add(id);
        current.push(id);
      } catch (e) {
        toast('อัปโหลดรูปไม่สำเร็จ 😢');
      }
      loading--;
      paint();
    }
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-rm]');
    if (!b) return;
    const id = b.dataset.rm;
    current = current.filter(x => x !== id);
    if (added.has(id)) { added.delete(id); deletePhotos([id]); } else removed.add(id);
    paint();
  });
  paint();

  return {
    get ids() { return [...current]; },
    get busy() { return loading > 0; },
    async commit() { await deletePhotos([...removed]); added.clear(); removed.clear(); },
    async rollback() { await deletePhotos([...added]); added.clear(); },
  };
}

export async function openLightbox(ids, index = 0) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `<div class="track">${ids.map(id => `<img data-photo="${esc(id)}" alt="">`).join('')}</div>
    <button class="close" aria-label="ปิด">✕</button>`;
  document.body.appendChild(box);
  await hydrate(box);
  const track = $('.track', box);
  track.scrollLeft = track.clientWidth * index;
  const close = () => box.remove();
  $('.close', box).onclick = close;
  track.onclick = e => { if (e.target === track) close(); };
}
