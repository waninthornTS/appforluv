// หน้า "เรา": โปรไฟล์ Ploy & Dream + สิ่งที่ชอบ/ไม่ชอบ + สำรอง/กู้คืน/รวมข้อมูล
import { getProfile, coll } from '../store.js';
import { db, STORES } from '../db.js';
import { charSVG } from '../characters.js';
import { $, $$, esc, todayStr, diffDays, fmtDate, nextYearly, countdown, ymd, confirmSheet, toast, refresh } from '../utils.js';

export const ABOUT_CATS = {
  likeDo: { label: 'ชอบทำ', emoji: '💖', color: 'pink', ph: 'เช่น ดูหนัง, ถ่ายรูป, เดินคาเฟ่' },
  dislikeDo: { label: 'ไม่ชอบทำ', emoji: '🙅‍♀️', color: 'lav', ph: 'เช่น ตื่นเช้า, รอคิวนาน' },
  likeEat: { label: 'ชอบกิน', emoji: '😋', color: 'mint', ph: 'เช่น ชาบู, ชานมไข่มุก' },
  dislikeEat: { label: 'ไม่ชอบกิน', emoji: '🤢', color: 'yellow', ph: 'เช่น ผักชี, ขิง' },
};
let who = 'A';

export async function render(el) {
  const [p, about] = await Promise.all([getProfile(), coll.all('about')]);
  const today = todayStr();
  const name = who === 'A' ? p.nameA : p.nameB;
  const birth = who === 'A' ? p.birthA : p.birthB;
  const bdLeft = diffDays(today, nextYearly(birth, today));
  const age = ymd(birth, today).y;
  const days = diffDays(p.startDate, today) + 1;
  const mine = about.filter(a => a.who === who).sort((x, y) => x.createdAt - y.createdAt);

  let usage = '';
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage) usage = `ใช้พื้นที่ไป ${(est.usage / 1048576).toFixed(1)} MB`;
  } catch { /* ignore */ }

  const aboutCard = ([k, c]) => {
    const items = mine.filter(a => a.cat === k);
    return `<section class="card about-card">
      <div class="about-head"><span class="about-emo ${c.color}">${c.emoji}</span><h3>${esc(name)} ${c.label}</h3><span class="small muted">${items.length || ''}</span></div>
      <div class="tags">${items.length
        ? items.map(a => `<span class="tag ${c.color}">${esc(a.text)}<button data-del="${esc(a.id)}" aria-label="ลบ ${esc(a.text)}">✕</button></span>`).join('')
        : '<span class="small muted">ยังไม่มี เพิ่มกันเลย</span>'}</div>
      <form class="add-check" data-cat="${k}"><input class="input" name="text" maxlength="40" placeholder="${c.ph}" autocomplete="off"><button class="btn btn-sm">เพิ่ม</button></form>
    </section>`;
  };

  el.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">ครบรอบ ${fmtDate(p.startDate, { long: true })} · คบกันมาแล้ว ${days.toLocaleString()} วัน</p><h1>เราสองคน 💞</h1></div></header>

    <div class="seg" id="who"><button data-v="A">👓 ${esc(p.nameA)}</button><button data-v="B">🧸 ${esc(p.nameB)}</button></div>

    <section class="card profile-card">
      <div class="pc-char">${charSVG(who === 'A' ? p.charA : p.charB)}</div>
      <div class="grow">
        <h2>${esc(name)}</h2>
        <div class="small muted">🎂 เกิด ${fmtDate(birth, { long: true })}</div>
        <div class="small muted">อายุ ${age} ปี</div>
        <span class="chip ${bdLeft <= 30 ? 'pink' : 'lav'}" style="margin-top:8px">${bdLeft === 0 ? 'วันนี้วันเกิด! 🎉' : `วันเกิดอีก ${bdLeft} วัน`}</span>
      </div>
    </section>

    ${Object.entries(ABOUT_CATS).map(aboutCard).join('')}

    <section class="section">
      <div class="section-title"><h2>ข้อมูลในเครื่อง</h2><span class="small muted">${usage}</span></div>
      <div class="card menu" style="padding:0">
        <button data-act="export"><span class="e">📦</span><span>สำรองข้อมูล (Backup)<span class="sub">บันทึกเป็นไฟล์ .json รวมรูปภาพ เก็บไว้ใน Files / iCloud</span></span></button>
        <label><span class="e">🔄</span><span>รวมข้อมูลจากอีกเครื่อง<span class="sub">นำไฟล์ backup ของอีกเครื่องมารวมกัน (ไม่ลบของเดิม)</span></span>
          <input type="file" accept="application/json,.json" data-act="merge"></label>
        <label><span class="e">📥</span><span>กู้คืนจากไฟล์<span class="sub">แทนที่ข้อมูลทั้งหมดในเครื่องนี้</span></span>
          <input type="file" accept="application/json,.json" data-act="restore"></label>
        <button data-act="reset" style="color:#E0405F"><span class="e">🧹</span><span>ล้างข้อมูลทั้งหมด</span></button>
      </div>
      <p class="small muted" style="margin:10px 6px 0">ข้อมูลทั้งหมดเก็บอยู่ในเครื่องนี้เท่านั้น ส่งไฟล์ backup ให้อีกคนแล้วกด “รวมข้อมูล” เพื่อซิงก์กันได้ และควรสำรองไว้เป็นระยะนะ</p>
    </section>

    <p class="center small muted" style="margin-top:28px">Our Little World · ${esc(p.nameA)} 💗 ${esc(p.nameB)}</p>
  `;

  const seg = $('#who', el);
  $$('button', seg).forEach(b => b.classList.toggle('active', b.dataset.v === who));
  seg.onclick = e => {
    const b = e.target.closest('[data-v]');
    if (b && b.dataset.v !== who) { who = b.dataset.v; render(el); }
  };

  $$('form[data-cat]', el).forEach(form => form.onsubmit = async e => {
    e.preventDefault();
    const text = form.elements.text.value.trim();
    if (!text) return;
    if (mine.some(a => a.cat === form.dataset.cat && a.text === text)) return toast('มีอยู่แล้วน้า');
    await coll.save('about', { who, cat: form.dataset.cat, text });
    toast(`เพิ่ม “${text}” แล้ว 💕`);
    refresh();
  });
  $$('[data-del]', el).forEach(b => b.onclick = async () => {
    await coll.remove('about', b.dataset.del);
    refresh();
  });

  $('[data-act=export]', el).onclick = exportBackup;
  $$('input[type=file][data-act]', el).forEach(inp => inp.onchange = () => { const f = inp.files[0]; inp.value = ''; if (f) importBackup(f, inp.dataset.act); });
  $('[data-act=reset]', el).onclick = async () => {
    if (!await confirmSheet({ title: 'ล้างข้อมูลทั้งหมด?', message: 'ความทรงจำ รูป นัด ทริป และสิ่งที่ชอบ/ไม่ชอบทั้งหมดในเครื่องนี้จะหายไป ลองสำรองข้อมูลก่อนนะ', emoji: '😱', ok: 'ล้างเลย' })) return;
    for (const s of STORES) await db.clear(s);
    toast('ล้างข้อมูลแล้ว');
    location.hash = '#home';
    refresh();
  };
}

// ---------- backup / restore ----------
const blobToDataURL = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
const dataURLToBlob = async url => (await fetch(url)).blob();

async function exportBackup() {
  toast('กำลังเตรียมไฟล์...');
  const out = { app: 'our-little-world', version: 1, exportedAt: new Date().toISOString(), data: {} };
  for (const s of STORES) {
    const rows = await db.all(s);
    out.data[s] = s === 'photos'
      ? await Promise.all(rows.map(async r => ({ id: r.id, createdAt: r.createdAt, dataURL: await blobToDataURL(r.blob) })))
      : rows;
  }
  const file = new File([JSON.stringify(out)], `our-world-backup-${todayStr()}.json`, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Our Little World backup' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function importBackup(file, mode) {
  let json;
  try { json = JSON.parse(await file.text()); } catch { return toast('ไฟล์ไม่ถูกต้อง 😢'); }
  if (json?.app !== 'our-little-world' || !json.data) return toast('ไม่ใช่ไฟล์ backup ของแอปนี้');
  const replace = mode === 'restore';
  if (!await confirmSheet({
    title: replace ? 'กู้คืนข้อมูล?' : 'รวมข้อมูล?',
    message: replace ? 'ข้อมูลในเครื่องนี้จะถูกแทนที่ด้วยข้อมูลในไฟล์' : 'รายการที่ใหม่กว่าจะถูกอัปเดต รายการใหม่จะถูกเพิ่มเข้ามา',
    emoji: replace ? '📥' : '🔄', ok: replace ? 'กู้คืน' : 'รวมเลย', danger: replace,
  })) return;

  let added = 0;
  for (const s of STORES) {
    if (replace) await db.clear(s);
    const key = s === 'kv' ? 'key' : 'id';
    for (const row of json.data[s] || []) {
      if (!replace) {
        const existing = await db.get(s, row[key]);
        if (existing && (s === 'photos' || (existing.updatedAt || 0) >= (row.updatedAt || 0))) continue;
      }
      const rec = s === 'photos' ? { id: row.id, createdAt: row.createdAt, blob: await dataURLToBlob(row.dataURL) } : row;
      await db.put(s, rec);
      if (s !== 'photos' && s !== 'kv') added++;
    }
  }
  toast(replace ? 'กู้คืนเรียบร้อย ✨' : `รวมข้อมูลแล้ว (${added} รายการ) 💞`);
  refresh();
}
