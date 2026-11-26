// เอารูปไดโนใส่ชุดที่เจนจาก Gemini มาใช้ในแอป: ลบพื้นหลัง → ปรับขนาด/ตำแหน่งให้ตัวไดโนทับรูปเดิมพอดี → src/assets/dino-dressed/
//
// 1) เอารูปเดิมของไดโน (src/assets/dino/<พันธุ์>-<วัย>.webp เช่น trex-adult.webp) ไปให้ Gemini ใส่ชุด บนพื้นสีเขียวสด (#00FF00)
// 2) บันทึกรูปที่ได้เป็น scripts/.outfit-raw/dino/<ชื่อรูปเดิม>--<id ชุด>.png (หรือ .jpg/.webp) เช่น trex-adult--hat-santa.png
// 3) รัน  node scripts/dino-dress.mjs          (ทำทุกรูปที่วางไว้)
//         node scripts/dino-dress.mjs trex     (เฉพาะชื่อที่มีคำนี้)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RAW = `${ROOT}scripts/.outfit-raw/dino/`;
const BASE = `${ROOT}src/assets/dino/`;
const OUT = `${ROOT}src/assets/dino-dressed/`;
const META = `${ROOT}src/features/dino/dino-dressed.json`;
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });
const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {};
const filter = process.argv[2];

const raws = readdirSync(RAW).filter(f => /--.+\.(png|jpe?g|webp)$/i.test(f) && (!filter || f.includes(filter)));
if (!raws.length) console.log(`ยังไม่มีรูปใน ${RAW} (ตั้งชื่อแบบ trex-adult--hat-santa.png)`);

/** ลบพื้นหลัง (สีเดียวทั้งรูป เช่น เขียวสด) → RGBA ตัดขอบแล้ว */
async function cutout(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const edge = [];
  for (let x = 0; x < w; x += 3) edge.push(x * 4, ((h - 1) * w + x) * 4);
  for (let y = 0; y < h; y += 3) edge.push(y * w * 4, (y * w + w - 1) * 4);
  const med = c => edge.map(i => data[i + c]).sort((a, b) => a - b)[edge.length >> 1];
  const key = [med(0), med(1), med(2)];
  const dist = i => Math.hypot(data[i] - key[0], data[i + 1] - key[1], data[i + 2] - key[2]);
  const HARD = 95, SOFT = 155;
  const whiteBg = key.every(v => v > 225);
  const bg = new Uint8Array(w * h);
  if (whiteBg) {
    // พื้นขาว: ลบเฉพาะส่วนที่ต่อกับขอบรูป (ไม่ลบสีขาวบนตัว/ขนหมวก)
    const st = [];
    for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
    while (st.length) {
      const p = st.pop();
      if (bg[p] || dist(p * 4) > 40) continue;
      bg[p] = 1;
      const x = p % w;
      if (x > 0) st.push(p - 1); if (x < w - 1) st.push(p + 1);
      if (p >= w) st.push(p - w); if (p < w * (h - 1)) st.push(p + w);
    }
  } else {
    for (let p = 0; p < w * h; p++) if (dist(p * 4) <= HARD) bg[p] = 1;
  }
  const green = key[1] > 200 && key[0] < 120;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (bg[p]) { data[i + 3] = 0; continue; }
    if (green && data[i + 1] > Math.max(data[i], data[i + 2])) data[i + 1] = Math.max(data[i], data[i + 2]); // ล้างเงาสีเขียวที่สะท้อนติดตัว
    const x = p % w;
    const near = (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (p >= w && bg[p - w]) || (p < w * (h - 1) && bg[p + w]);
    if (near && !whiteBg) { const d = dist(i); if (d < SOFT) data[i + 3] = Math.round(255 * Math.max(.2, (d - HARD) / (SOFT - HARD))); }
  }
  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  return sharp(trimmed).raw().toBuffer({ resolveWithObject: true });
}

/** กรอบของส่วนทึบ และความกว้าง/จุดกึ่งกลางของแถบล่าง (ช่วง y0..y1) */
function alphaBox({ data, info: { width: w, height: h } }) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
}
function band(img, yFrom, yTo) {
  const { data, info: { width: w } } = img;
  let a = Infinity, b = -1;
  for (let y = Math.max(0, Math.floor(yFrom)); y <= Math.floor(yTo); y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 40) { if (x < a) a = x; if (x > b) b = x; }
  return { width: Math.max(1, b - a + 1), center: (a + b) / 2 };
}

for (const f of raws) {
  const key = f.replace(/\.(png|jpe?g|webp)$/i, '');
  const baseKey = key.split('--')[0];
  const baseFile = `${BASE}${baseKey}.webp`;
  if (!existsSync(baseFile)) { console.error(`✗ ${f}: ไม่มีรูปเดิม ${baseKey}.webp`); continue; }
  try {
    const base = await sharp(baseFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bb = alphaBox(base);
    const bodyH = bb.y1 - bb.y0;
    // เทียบด้วยแถบล่าง 45% ของตัว (หมวก/ของบนหัวไม่อยู่ในแถบนี้)
    const BAND = .45;
    const bBand = band(base, bb.y1 - bodyH * BAND, bb.y1);
    const dr = await cutout(`${RAW}${f}`);
    const dh = dr.info.height;
    let k = (bb.x1 - bb.x0) / dr.info.width;
    for (let i = 0; i < 6; i++) k = bBand.width / band(dr, dh - (bodyH * BAND) / k, dh - 1).width;
    const dBand = band(dr, dh - (bodyH * BAND) / k, dh - 1);
    // ตำแหน่งรูปใส่ชุด (หน่วยพิกเซลของรูปเดิม): เท้าชิดล่างเท่ารูปเดิม กึ่งกลางแถบล่างตรงกัน
    const W = Math.round(dr.info.width * k), H = Math.round(dh * k);
    const left = Math.round(bBand.center - dBand.center * k), top = Math.round(bb.y1 + 1 - H);
    const minX = Math.min(0, left), minY = Math.min(0, top);
    const cw = Math.max(base.info.width, left + W) - minX, ch = Math.max(base.info.height, top + H) - minY;
    const scaled = await sharp(dr.data, { raw: dr.info }).resize(W, H).png().toBuffer();
    const out = await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: scaled, left: left - minX, top: top - minY }]).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toBuffer();
    writeFileSync(`${OUT}${key}.webp`, out);
    meta[key] = { w: cw, h: ch, bw: base.info.width, bh: base.info.height, ox: -minX, oy: -minY };
    console.log(`✓ ${key} (${cw}×${ch}, ${(out.length / 1024).toFixed(0)} KB, ย่อ ${k.toFixed(2)}×)`);
  } catch (e) {
    console.error(`✗ ${f}: ${e.message}`);
  }
}
writeFileSync(META, JSON.stringify(Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n');
