// สร้างไอคอน PNG (หัวใจหน้ายิ้ม) โดยไม่ต้องติดตั้งอะไรเพิ่ม: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BG_TOP = hex('#FFC2D6'), BG_BOT = hex('#FF7EA8');
const WHITE = [255, 255, 255], INK = hex('#5B4352'), BLUSH = hex('#FFB3CB');

// สีของจุด (u,v) ในพิกัดปกติ 0..1
function colorAt(u, v) {
  let col = mix(BG_TOP, BG_BOT, v);
  // หัวใจ: (x²+y²−1)³ − x²y³ ≤ 0
  const s = 0.29, x = (u - 0.5) / s, y = -(v - 0.53) / s;
  const heart = (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;
  if (!heart) return col;
  col = WHITE;
  const inEll = (cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  if (inEll(-0.62, -0.05, 0.19, 0.11) || inEll(0.62, -0.05, 0.19, 0.11)) col = BLUSH;
  for (const ex of [-0.4, 0.4]) {
    if (inEll(ex, 0.22, 0.12, 0.15)) col = inEll(ex + 0.04, 0.27, 0.045, 0.045) ? WHITE : INK;
  }
  const r = Math.hypot(x, y - 0.05);
  if (y < 0.0 && Math.abs(r - 0.2) < 0.05) col = INK;
  return col;
}

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 4;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const acc = [0, 0, 0];
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const c = colorAt((i + (sx + 0.5) / SS) / size, (j + (sy + 0.5) / SS) / size);
      acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
    }
    const o = (j * size + i) * 4;
    px[o] = acc[0] / SS / SS; px[o + 1] = acc[1] / SS / SS; px[o + 2] = acc[2] / SS / SS; px[o + 3] = 255;
  }
  return png(size, px);
}

const out = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  fs.writeFileSync(path.join(out, name), render(size));
  console.log('✓', name);
}
