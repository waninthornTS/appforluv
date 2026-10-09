// วาดไดโนเป็นเวกเตอร์ แบบนุ่มนูน 3D (คมชัดทุกขนาด + ขยับตา/ปาก/หาง/ขาได้)
// แต่ละสายพันธุ์มีโครงร่างของตัวเองให้ดูเป็นไดโนจริง ทุกตัวหันซ้าย กรอบ 200×200 เท้าแตะพื้นที่ y≈188
import type { DinoSpecies } from '../../lib/types';

export type Mood = 'normal' | 'happy' | 'sleep' | 'sick' | 'eat' | 'sad';
export type ArtStage = 'baby' | 'teen' | 'adult';

interface Look { light: string; base: string; dark: string; belly: string; accent: string; accent2: string; spot: string; iris?: string; glow?: string }
export const LOOKS: Record<DinoSpecies, Look> = {
  trex: { light: '#FFD08A', base: '#F5A94E', dark: '#D9822E', belly: '#FFE6B8', accent: '#F27C6B', accent2: '#FFB6A3', spot: '#EE7E63' },
  styra: { light: '#F2E97A', base: '#D9CE45', dark: '#B0A42C', belly: '#FFF6C4', accent: '#4FB8B0', accent2: '#BFEDE6', spot: '#5BBFB4' },
  pachy: { light: '#E2CCFF', base: '#C2A3EE', dark: '#9D7CD3', belly: '#F4EAFF', accent: '#8F6CCB', accent2: '#FFE68A', spot: '#FFFFFF' },
  galli: { light: '#F0DB7E', base: '#D7B84A', dark: '#AF902C', belly: '#FFF2C2', accent: '#B98E33', accent2: '#E9C873', spot: '#B28A2E' },
  diplo: { light: '#A9A6F2', base: '#7F7BDB', dark: '#5E59B9', belly: '#C9C6FA', accent: '#5C55C4', accent2: '#FFFFFF', spot: '#E9E6FF' },
  elas: { light: '#93E0D6', base: '#56BCB0', dark: '#3A9488', belly: '#D2F5EE', accent: '#7C8BE0', accent2: '#B9C3FF', spot: '#8E9AE8' },
  ptero: { light: '#D6DDFF', base: '#AEB8F2', dark: '#8591D6', belly: '#F0F2FF', accent: '#9F8BE6', accent2: '#E2D6FF', spot: '#FFFFFF' },
  flame: { light: '#FF9C88', base: '#EC6B5A', dark: '#C94C3F', belly: '#FFD3C2', accent: '#FFA24A', accent2: '#FFD66B', spot: '#FFD66B' },
  galaxy: { light: '#6F7CF0', base: '#4A4FC8', dark: '#2E2D8F', belly: '#8FD3F7', accent: '#B36BF0', accent2: '#5AD1F2', spot: '#FFFFFF', iris: '#5AD1F2', glow: '#9FA8FF' },
  phoenix: { light: '#FFB27A', base: '#F2704A', dark: '#C9472E', belly: '#FFE0A8', accent: '#FF8A3D', accent2: '#FFD36B', spot: '#FFD36B', glow: '#FFC77A' },
  crystal: { light: '#F4FBFF', base: '#BFE2F6', dark: '#86B3DE', belly: '#FFFFFF', accent: '#C9A2F5', accent2: '#8FE3D6', spot: '#FFFFFF', iris: '#7A8CE0', glow: '#CFE9FF' },
  lava: { light: '#5A4A52', base: '#3B2F36', dark: '#241C21', belly: '#5E4C55', accent: '#FF7A2E', accent2: '#FFC04A', spot: '#FF8A3D', iris: '#FF9A4A', glow: '#FF8A3D' },
};

let uid = 0;

// ---------- ชิ้นส่วนที่ใช้ร่วมกัน ----------
interface Ctx { L: Look; B: string; A: string; m: Mood; glow: string; id: string }
const INK = '#2E2226', LIP = '#5B2A30', MOUTH = '#8C3B45', TONGUE = '#FF8FA3';

function eye(c: Ctx, x: number, y: number, r: number) {
  const m = c.m;
  if (m !== 'normal' && m !== 'eat' && m !== 'sad') r *= 1.1;
  const arc = (up: boolean) => `<path d="M${x - r} ${y + (up ? 2 : -1)} Q${x} ${y + (up ? -r * 1.05 : r * .95)} ${x + r} ${y + (up ? 2 : -1)}" fill="none" stroke="${INK}" stroke-width="${Math.max(2.6, r * .34)}" stroke-linecap="round"/>`;
  if (m === 'happy') return arc(true);
  if (m === 'sleep') return arc(false);
  if (m === 'sick') return `<path d="M${x - r * .8} ${y - r * .5} L${x + r * .8} ${y + r * .5} M${x - r * .8} ${y + r * .5} L${x + r * .8} ${y - r * .5}" stroke="${INK}" stroke-width="${Math.max(2.4, r * .3)}" stroke-linecap="round"/>`;
  r *= 1.16;
  const R = r * 1.08, ix = x - r * .14, iy = y + r * .1;
  const open = `<g class="dz-eye" style="transform-origin:${x}px ${y}px">` +
    `<ellipse cx="${x}" cy="${y}" rx="${R}" ry="${R * 1.12}" fill="url(#${c.id}sclera)" stroke="${c.L.dark}" stroke-opacity=".35" stroke-width="1.2"/>` +
    `<circle cx="${ix}" cy="${iy}" r="${r * .8}" fill="url(#${c.id}iris)"/><circle cx="${ix}" cy="${iy}" r="${r * .4}" fill="#1E120E"/>` +
    `<ellipse cx="${ix - r * .32}" cy="${iy - r * .36}" rx="${r * .3}" ry="${r * .24}" fill="#fff"/><circle cx="${ix + r * .34}" cy="${iy + r * .32}" r="${r * .13}" fill="#fff" opacity=".9"/>` +
    `<path d="M${x - R * 1.12} ${y - R * .66} C${x - R * .7} ${y - R * 1.95} ${x + R * .7} ${y - R * 1.95} ${x + R * 1.12} ${y - R * .66} C${x + R * .6} ${y - R * 1.16} ${x - R * .6} ${y - R * 1.16} ${x - R * 1.12} ${y - R * .66} Z" fill="${c.L.base}"/>` +
    `<path d="M${x - R * 1.02} ${y - R * .72} C${x - R * .5} ${y - R * 1.16} ${x + R * .5} ${y - R * 1.16} ${x + R * 1.02} ${y - R * .72}" fill="none" stroke="${c.L.dark}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
  return m === 'sad' ? open + `<path d="M${x - r * .2} ${y + r * 1.2} q${r * .35} ${r * .6} 0 ${r * .9} q${-r * .35} ${-r * .3} 0 ${-r * .9}z" fill="#8FD3F7"/>` : open;
}

interface FaceSpec { eyes: [number, number, number][]; mouth: [number, number, number, number]; blush: [number, number]; teeth?: boolean; beak?: string; nostril?: [number, number] }
function face(c: Ctx, f: FaceSpec) {
  const [x1, y1, x2, y2] = f.mouth;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  let mouth = '';
  if (f.beak) {
    mouth = `<path d="M${x1} ${y1} Q${mx} ${my + 2} ${x2} ${y2}" fill="none" stroke="${f.beak}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (c.m === 'happy' || c.m === 'eat') mouth += `<path class="${c.m === 'eat' ? 'dz-chomp' : ''}" style="transform-origin:${x2}px ${y2}px" d="M${x1 + (x2 - x1) * .2} ${y1 + 1} L${x2} ${y2} L${x1 + (x2 - x1) * .45} ${my + 8} Z" fill="${MOUTH}"/>`;
  } else if (c.m === 'eat') {
    const cx = x1 + (x2 - x1) * .38;
    mouth = `<g class="dz-chomp" style="transform-origin:${cx}px ${my}px"><ellipse cx="${cx}" cy="${my + 3}" rx="11" ry="9" fill="${MOUTH}"/><ellipse cx="${cx + 1}" cy="${my + 7}" rx="6" ry="3.5" fill="${TONGUE}"/></g>`;
  } else if (c.m === 'happy') {
    mouth = `<path d="M${x1} ${y1} Q${mx} ${my + 18} ${x2} ${y2} Z" fill="${MOUTH}" stroke="${LIP}" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="${mx}" cy="${my + 7}" rx="6" ry="3" fill="${TONGUE}"/>`;
  } else if (c.m === 'sick' || c.m === 'sad') {
    const w = (x2 - x1) / 4;
    mouth = `<path d="M${mx - w * 1.2} ${my + 4} q${w * .6} -5 ${w * 1.2} 0 t${w * 1.2} 0" fill="none" stroke="${LIP}" stroke-width="2.6" stroke-linecap="round"/>`;
  } else if (c.m === 'sleep') {
    mouth = `<ellipse cx="${mx}" cy="${my + 3}" rx="4" ry="3" fill="${MOUTH}"/>`;
  } else {
    mouth = `<path d="M${x1} ${y1} Q${mx} ${my + 10} ${x2} ${y2}" fill="none" stroke="${LIP}" stroke-width="2.8" stroke-linecap="round"/>`;
    if (f.teeth) mouth += [.3, .55, .78].map(t => { const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + 10 * 4 * t * (1 - t) * .5; return `<path d="M${x - 3} ${y} l3 5 l3 -5z" fill="#fff"/>`; }).join('');
  }
  const nostril = f.nostril ? `<ellipse cx="${f.nostril[0]}" cy="${f.nostril[1]}" rx="2.2" ry="1.6" fill="${c.L.dark}" opacity=".75"/>` : '';
  const blush = `<ellipse cx="${f.blush[0]}" cy="${f.blush[1]}" rx="9" ry="5.5" fill="#FF8FA8" opacity=".5"/>`;
  const sweat = c.m === 'sick' ? `<path d="M${f.eyes[f.eyes.length - 1][0] + 14} ${f.eyes[f.eyes.length - 1][1] - 16} q4 7 0 10 q-4 -3 0 -10z" fill="#8FD3F7"/>` : '';
  return blush + f.eyes.map(([x, y, r]) => eye(c, x, y, r)).join('') + nostril + mouth + sweat;
}
const gloss = (x: number, y: number, rx: number, ry: number, rot = -18) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".3" transform="rotate(${rot} ${x} ${y})"/>`;
const heart = (x: number, y: number, s: number, c: string) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4 C-8 -4 -14 4 0 12 C14 4 8 -4 0 4Z" fill="${c}" opacity=".85"/>`;
const star = (x: number, y: number, s: number, c = '#FFE68A') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 l1.8 3.8 4.1 .5 -3 2.8 .8 4.1 -3.7 -2 -3.7 2 .8 -4.1 -3 -2.8 4.1 -.5z" fill="${c}"/>`;
const dots = (pts: number[][], c: string) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
/** หมวกเปลือกไข่ของวัยเด็ก */
const hat = (x: number, y: number, w = 40) => {
  const h = w * .4, s = w / 8;
  let zig = `M${x - w / 2} ${y}`;
  for (let i = 1; i <= 8; i++) zig += ` L${x - w / 2 + s * i} ${y + (i % 2 ? -s * .9 : 0)}`;
  return `<path d="${zig} C${x + w / 2} ${y - h * 1.7} ${x - w / 2} ${y - h * 1.7} ${x - w / 2} ${y} Z" fill="#FFFDF6" stroke="#EADFC8" stroke-width="1.4" stroke-linejoin="round"/><circle cx="${x - w * .12}" cy="${y - h * .8}" r="${w * .06}" fill="#E9DCC3"/>`;
};
/** ขาสองขา (ต้นขา + เท้า) */
const bLeg = (c: Ctx, near: boolean, x: number, y: number, s = 1) => {
  const fill = near ? c.B : c.L.dark;
  return `<g class="dz-leg ${near ? 'dz-leg-a' : 'dz-leg-b'}" style="transform-origin:${x}px ${y - 12 * s}px"><ellipse cx="${x}" cy="${y}" rx="${16 * s}" ry="${18 * s}" fill="${fill}"/><ellipse cx="${x - 8 * s}" cy="${y + 17 * s}" rx="${15 * s}" ry="${6.5 * s}" fill="${fill}"/>` +
    (near ? [-18, -11, -4].map(dx => `<ellipse cx="${x + dx * s}" cy="${y + 20 * s}" rx="${2.6 * s}" ry="${1.8 * s}" fill="#fff" opacity=".85"/>`).join('') : '') + `</g>`;
};
/** ขาเสา (สัตว์สี่ขา) */
const qLeg = (c: Ctx, near: boolean, x: number, top: number, h = 36, w = 22) => {
  const fill = near ? c.B : c.L.dark;
  return `<g class="dz-leg ${near ? 'dz-leg-a' : 'dz-leg-b'}" style="transform-origin:${x}px ${top}px"><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="${w / 2.2}" fill="${fill}"/>` +
    (near ? [-6, 0, 6].map(dx => `<ellipse cx="${x + dx}" cy="${top + h - 2}" rx="2.8" ry="2" fill="#fff" opacity=".85"/>`).join('') : '') + `</g>`;
};

interface Parts { tail: string; far: string; back: string; body: string; near: string; head: string; pivot: [number, number] }

// ---------- แต่ละสายพันธุ์ ----------
const DRAW: Record<DinoSpecies, (c: Ctx, baby: boolean) => Parts> = {
  // ทีเร็กซ์: หัวโต ปากยาวฟันซี่เล็ก แขนจิ๋ว ยืนสองขา
  trex: (c, baby) => ({
    tail: `<path d="M126 132 C158 120 186 128 199 158 C184 164 160 164 134 158 Z" fill="${c.B}"/>${heart(168, 140, .8, c.L.spot)}`,
    far: bLeg(c, false, 136, 164),
    back: [[118, 98, 9], [134, 104, 10], [148, 116, 9], [162, 124, 8], [178, 132, 7], [190, 142, 6]].map(([x, y, s2]) => `<path d="M${x - s2} ${y + s2 * .6} Q${x - s2 * .2} ${y - s2 * 1.5} ${x + s2 * .4} ${y - s2 * 1.3} Q${x + s2} ${y - s2 * .4} ${x + s2} ${y + s2 * .6} Z" fill="${c.L.dark}"/>`).join(''),
    body: `<path d="M98 104 C124 92 154 110 154 142 C154 170 136 186 112 186 C90 186 76 168 78 144 C80 124 86 110 98 104 Z" fill="${c.B}"/>` +
      `<ellipse cx="103" cy="152" rx="20" ry="27" fill="${c.L.belly}"/><path d="M88 140 q15 5 30 0 M86 152 q17 5 34 0 M88 164 q15 5 30 0" stroke="${c.L.dark}" stroke-width="1.6" fill="none" opacity=".22"/>` +
      heart(138, 118, 1, c.L.spot) + heart(146, 140, .75, c.L.spot) + gloss(116, 116, 14, 7),
    near: bLeg(c, true, 114, 164) + `<path d="M86 124 C76 126 72 136 74 142 C80 140 86 136 92 133 Z" fill="${c.B}"/><path d="M73 141 l-3 3 M77 141 l-1 4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
    head: `<path d="M96 88 C104 98 114 104 122 112 L98 120 C94 110 90 100 86 94 Z" fill="${c.B}"/>` +
      [[80, 24, 7], [96, 24, 8], [110, 30, 7]].map(([x, y, s2]) => `<path d="M${x - s2} ${y + s2} Q${x - s2 * .2} ${y - s2 * 1.4} ${x + s2 * .4} ${y - s2 * 1.2} Q${x + s2} ${y - s2 * .3} ${x + s2} ${y + s2} Z" fill="${c.L.dark}"/>`).join('') +
      `<path d="M122 66 C124 38 106 22 82 22 C60 22 42 30 30 42 C16 52 12 70 20 82 C30 96 56 100 82 100 C106 100 120 88 122 66 Z" fill="${c.B}"/>` +
      `<ellipse cx="44" cy="80" rx="26" ry="15" fill="${c.L.light}" opacity=".45"/>` + gloss(90, 36, 18, 8) +
      face(c, { eyes: [[70, 52, 9], [98, 54, 11]], mouth: [20, 80, 80, 88], blush: [106, 76], teeth: true, nostril: [26, 62] }) + (baby ? hat(90, 26, 42) : ''),
    pivot: [100, 104],
  }),
  // สไตราโคซอรัส: สี่ขาตัวหนา แผงคอมีหนามยาว เขาจมูก ปากจะงอย
  styra: (c, baby) => {
    const spikes = [-168, -138, -110, -82, -54, -28].map(a => {
      const r = (a * Math.PI) / 180, cx = 70, cy = 92;
      return `<path d="M${cx + Math.cos(r - .16) * 38} ${cy + Math.sin(r - .16) * 38} L${cx + Math.cos(r) * 70} ${cy + Math.sin(r) * 70} L${cx + Math.cos(r + .16) * 38} ${cy + Math.sin(r + .16) * 38} Z" fill="${c.A}"/>`;
    }).join('');
    return {
      tail: `<path d="M160 128 C184 126 197 138 199 154 C184 158 168 156 154 150 Z" fill="${c.B}"/>`,
      far: qLeg(c, false, 152, 150, 34) + qLeg(c, false, 94, 150, 34),
      back: '',
      body: `<ellipse cx="128" cy="134" rx="56" ry="38" fill="${c.B}"/><ellipse cx="122" cy="156" rx="40" ry="14" fill="${c.L.belly}"/>` +
        dots([[146, 112, 7], [164, 130, 5], [128, 104, 5], [150, 146, 4], [112, 118, 4]], c.L.spot) + gloss(120, 112, 18, 8),
      near: qLeg(c, true, 140, 152, 36, 24) + qLeg(c, true, 104, 152, 36, 24),
      head: spikes + `<circle cx="70" cy="92" r="42" fill="${c.L.accent}"/><circle cx="70" cy="92" r="32" fill="${c.L.accent2}" opacity=".6"/>` +
        dots([[52, 62, 4], [70, 56, 4], [88, 62, 4], [100, 78, 3.5]], '#fff') +
        `<path d="M80 104 C82 84 66 74 50 76 C32 78 18 92 16 108 C14 124 28 136 48 134 C66 132 78 122 80 104 Z" fill="${c.B}"/>` +
        `<path d="M20 106 C10 108 4 116 6 124 C14 124 20 120 26 116 Z" fill="${c.L.dark}"/>` +
        `<path d="M30 92 C22 72 24 54 30 42 C38 58 42 76 46 92 Z" fill="#FFF6DE"/><path d="M58 80 L64 64 L70 82 Z" fill="#FFF6DE"/>` + gloss(54, 86, 12, 6) +
        face(c, { eyes: [[38, 98, 7], [58, 100, 9.5]], mouth: [12, 120, 40, 126], blush: [64, 116], nostril: [20, 100] }) + (baby ? hat(52, 80, 34) : ''),
      pivot: [80, 124],
    };
  },
  // แพคีเซฟาโลซอรัส: หัวโดมแข็ง มีปุ่มรอบโดม ยืนสองขาตัวกลม
  pachy: (c, baby) => ({
    tail: `<path d="M130 140 C160 132 184 140 196 162 C180 166 156 164 134 160 Z" fill="${c.B}"/>`,
    far: bLeg(c, false, 134, 166, .9),
    back: '',
    body: `<ellipse cx="114" cy="148" rx="38" ry="37" fill="${c.B}"/><ellipse cx="104" cy="156" rx="22" ry="25" fill="${c.L.belly}"/>` +
      dots([[140, 130, 3], [132, 116, 2.4], [146, 150, 2.4]], '#fff') + gloss(112, 124, 14, 7),
    near: bLeg(c, true, 110, 168, .95) + `<ellipse cx="86" cy="140" rx="6" ry="11" fill="${c.B}" transform="rotate(-30 86 140)"/>`,
    head: `<path d="M120 86 C120 62 102 48 80 48 C58 48 40 60 36 78 C26 82 22 94 26 104 C32 116 50 118 64 116 C86 122 120 112 120 86 Z" fill="${c.B}"/>` +
      `<path d="M44 66 C42 24 114 14 124 62 C104 52 66 52 44 66 Z" fill="${c.L.accent}"/>` + gloss(74, 34, 16, 7) +
      dots([[44, 66, 4.2], [54, 56, 4.2], [68, 50, 4.2], [84, 49, 4.2], [100, 52, 4.2], [114, 58, 4.2], [123, 66, 3.6]], c.L.light) + star(84, 34, 1.3, c.L.accent2) +
      face(c, { eyes: [[64, 78, 8], [88, 80, 10.5]], mouth: [24, 98, 52, 104], blush: [98, 98], nostril: [28, 88] }) + (baby ? hat(84, 26, 30) : ''),
    pivot: [94, 114],
  }),
  // แกลลิไมมัส: ตัวเพรียวคล้ายนกกระจอกเทศ คอยาว ขายาว
  galli: (c, baby) => {
    const leg = (near: boolean, x: number, y: number) => `<g class="dz-leg ${near ? 'dz-leg-a' : 'dz-leg-b'}" style="transform-origin:${x}px ${y - 12}px"><ellipse cx="${x}" cy="${y}" rx="${near ? 13 : 11}" ry="16" fill="${near ? c.B : c.L.dark}"/><path d="M${x} ${y + 10} L${x - 4} ${y + 36}" stroke="${near ? c.L.base : c.L.dark}" stroke-width="${near ? 11 : 10}" stroke-linecap="round"/><ellipse cx="${x - 10}" cy="${y + 38}" rx="12" ry="5" fill="${near ? c.L.base : c.L.dark}"/></g>`;
    return {
      tail: `<path d="M148 112 C170 104 190 100 199 104 C194 114 172 122 152 130 Z" fill="${c.B}"/><path d="M166 108 l4 12 M180 104 l3 12" stroke="${c.L.spot}" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
      far: leg(false, 136, 136),
      back: '',
      body: `<ellipse cx="126" cy="122" rx="34" ry="25" fill="${c.B}"/><ellipse cx="118" cy="132" rx="20" ry="12" fill="${c.L.belly}"/>` +
        [0, 1, 2].map(i => `<path d="M${124 + i * 10} ${100 + i} q5 10 2 22" stroke="${c.L.spot}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`).join('') + gloss(118, 108, 12, 6),
      near: leg(true, 118, 140) + `<path d="M100 120 C92 124 88 132 90 138 C94 134 98 130 104 128 Z" fill="${c.B}"/>`,
      head: `<path d="M110 112 C92 96 82 74 76 54 L94 48 C98 70 108 90 122 104 Z" fill="${c.B}"/>` +
        `<path d="M100 44 C100 30 88 22 74 23 C58 24 44 30 32 38 C22 45 24 56 36 58 C52 62 74 62 88 60 C98 58 100 52 100 44 Z" fill="${c.B}"/>` + gloss(78, 32, 12, 5) +
        face(c, { eyes: [[64, 38, 6.5], [84, 40, 8.5]], mouth: [28, 50, 60, 55], blush: [88, 52], nostril: [32, 44] }) + (baby ? hat(80, 26, 28) : ''),
      pivot: [104, 110],
    };
  },
  // ดิปโพลโดคัส: คอยาว หางยาว หัวเล็ก ขาเป็นเสา
  diplo: (c, baby) => ({
    tail: `<path d="M168 132 C186 130 198 118 199 96 C196 124 188 148 162 156 Z" fill="${c.B}"/>`,
    far: qLeg(c, false, 158, 150, 36, 20) + qLeg(c, false, 108, 150, 36, 20),
    back: [116, 134, 152].map((x, i) => `<path d="M${x - 8} ${110 + i * 2} L${x} ${96 + i * 2} L${x + 8} ${110 + i * 2} Z" fill="${c.L.accent}"/>`).join(''),
    body: `<ellipse cx="134" cy="136" rx="50" ry="33" fill="${c.B}"/><ellipse cx="128" cy="154" rx="34" ry="12" fill="${c.L.belly}"/>` +
      `<path d="M118 128 L134 120 L150 126 L162 138" stroke="${c.L.spot}" stroke-width="1.4" fill="none" opacity=".7"/>` + dots([[118, 128, 2.4], [134, 120, 2.4], [150, 126, 2.4], [162, 138, 2]], '#fff') + gloss(128, 116, 16, 7),
    near: qLeg(c, true, 146, 152, 36, 22) + qLeg(c, true, 116, 152, 36, 22),
    head: `<path d="M112 132 C94 104 82 72 76 44 L96 38 C100 68 112 98 132 116 Z" fill="${c.B}"/>` +
      `<path d="M100 38 C100 24 88 16 74 17 C58 18 46 26 42 36 C38 46 46 54 60 54 C76 56 100 54 100 38 Z" fill="${c.B}"/>` + gloss(76, 24, 10, 5) +
      face(c, { eyes: [[64, 32, 6.5], [84, 34, 8.5]], mouth: [42, 44, 64, 48], blush: [88, 44], nostril: [46, 32] }) + (baby ? hat(78, 20, 26) : ''),
    pivot: [104, 128],
  }),
  // เอลาสโมซอรัส: สัตว์ทะเลคอยาว ตัวกลม มีครีบ 4 ครีบ
  elas: (c, baby) => ({
    tail: `<path d="M168 146 C184 146 195 152 199 164 C186 166 174 162 164 158 Z" fill="${c.B}"/>`,
    far: `<g class="dz-leg dz-leg-b" style="transform-origin:150px 164px"><ellipse cx="158" cy="170" rx="22" ry="8" fill="${c.L.dark}" transform="rotate(24 158 170)"/></g><ellipse cx="96" cy="170" rx="20" ry="8" fill="${c.L.dark}" transform="rotate(-24 96 170)"/>`,
    back: '',
    body: `<ellipse cx="132" cy="150" rx="48" ry="31" fill="${c.B}"/><ellipse cx="126" cy="164" rx="34" ry="12" fill="${c.L.belly}"/>` +
      dots([[146, 132, 6], [162, 146, 4.5], [130, 126, 4], [150, 156, 3.5]], c.L.spot) + gloss(126, 130, 16, 7) +
      `<path d="M66 186 q16 -6 32 0 t32 0 t32 0 t32 0" stroke="#9ADBFF" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`,
    near: `<g class="dz-leg dz-leg-a" style="transform-origin:150px 168px"><ellipse cx="152" cy="178" rx="24" ry="9" fill="${c.B}" transform="rotate(14 152 178)"/></g><ellipse cx="104" cy="178" rx="24" ry="9" fill="${c.B}" transform="rotate(-14 104 178)"/>`,
    head: `<path d="M108 146 C90 122 76 92 74 64 L94 60 C96 90 110 118 128 134 Z" fill="${c.B}"/>` +
      `<path d="M102 54 C102 38 90 30 74 30 C58 30 44 40 42 52 C40 64 52 72 70 72 C88 72 102 66 102 54 Z" fill="${c.B}"/>` + gloss(78, 38, 11, 5) +
      face(c, { eyes: [[64, 48, 7], [86, 50, 9]], mouth: [44, 60, 66, 64], blush: [90, 62], nostril: [48, 50] }) + (baby ? hat(76, 32, 28) : ''),
    pivot: [104, 142],
  }),
  // เทอโรซอร์: ปีกกว้าง จะงอยปากยาว หงอนยาวไปด้านหลัง
  ptero: (c, baby) => ({
    tail: `<path d="M134 158 C150 160 160 166 166 174 C154 174 144 170 134 166 Z" fill="${c.B}"/>`,
    far: `<g class="dz-leg dz-leg-b" style="transform-origin:126px 168px"><ellipse cx="126" cy="178" rx="7" ry="10" fill="${c.L.dark}"/><ellipse cx="122" cy="187" rx="9" ry="3.5" fill="${c.L.dark}"/></g>`,
    back: `<g class="dz-wing" style="transform-origin:104px 128px"><path d="M104 120 C84 70 40 52 6 66 C22 78 32 90 36 102 C44 98 54 100 62 106 C66 118 80 128 100 134 Z" fill="${c.A}"/><path d="M98 120 C78 96 52 80 22 72 M96 126 C76 108 58 100 40 100" stroke="${c.L.dark}" stroke-width="1.6" fill="none" opacity=".35"/></g>` +
      `<g class="dz-wing dz-wing-b" style="transform-origin:128px 124px"><path d="M126 118 C148 70 186 58 199 70 C190 82 184 94 182 106 C174 104 164 106 158 112 C154 122 142 128 128 132 Z" fill="${c.L.accent}" opacity=".9"/></g>`,
    body: `<ellipse cx="116" cy="146" rx="27" ry="29" fill="${c.B}"/><ellipse cx="110" cy="152" rx="16" ry="19" fill="${c.L.belly}"/>` + gloss(112, 128, 9, 5),
    near: `<g class="dz-leg dz-leg-a" style="transform-origin:108px 168px"><ellipse cx="108" cy="178" rx="8" ry="10" fill="${c.B}"/><ellipse cx="102" cy="187" rx="10" ry="3.5" fill="${c.B}"/></g>`,
    head: `<path d="M120 86 C138 68 162 58 186 62 C168 72 148 86 130 98 Z" fill="${c.A}"/>` +
      `<path d="M76 96 C52 92 22 98 2 108 C22 114 50 114 78 110 Z" fill="#FFD27A"/>` +
      `<path d="M130 98 C130 80 116 70 100 70 C84 70 72 80 70 94 C68 108 80 118 96 118 C114 118 130 112 130 98 Z" fill="${c.B}"/>` + gloss(104, 80, 11, 5) +
      face(c, { eyes: [[88, 90, 7.5], [108, 92, 9.5]], mouth: [6, 108, 74, 104], blush: [116, 104], beak: '#C9962E' }) + (baby ? hat(102, 72, 30) : ''),
    pivot: [110, 122],
  }),
  // ไดเมโทรดอน: ตัวเตี้ยยาว ขาสั้นกาง ใบเรือใหญ่บนหลัง
  flame: (c, baby) => ({
    tail: `<path d="M160 148 C184 148 197 158 199 172 C184 172 168 168 154 162 Z" fill="${c.B}"/>`,
    far: `<ellipse cx="150" cy="172" rx="10" ry="13" fill="${c.L.dark}"/><ellipse cx="96" cy="172" rx="10" ry="13" fill="${c.L.dark}"/>`,
    back: `<path d="M80 140 C76 70 104 34 132 38 C156 42 168 80 164 140 Z" fill="${c.A}"/>` +
      [92, 108, 124, 140, 154].map(x => `<path d="M${x} 138 C${x - 2} ${110} ${x + 2} ${70} ${x + 6} ${x < 100 ? 70 : x > 150 ? 62 : 44}" stroke="${c.L.accent2}" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>`).join('') +
      `<path d="M104 118 C100 100 112 90 118 98 C122 86 136 92 132 108 C128 118 108 124 104 118 Z" fill="#FFF2B8" opacity=".9"/>`,
    body: `<ellipse cx="122" cy="150" rx="52" ry="25" fill="${c.B}"/><ellipse cx="118" cy="164" rx="38" ry="9" fill="${c.L.belly}"/>` + gloss(116, 136, 18, 6, -8),
    near: `<g class="dz-leg dz-leg-a" style="transform-origin:136px 166px"><ellipse cx="136" cy="176" rx="12" ry="12" fill="${c.B}"/><ellipse cx="130" cy="186" rx="12" ry="4" fill="${c.B}"/></g><g class="dz-leg dz-leg-b" style="transform-origin:98px 166px"><ellipse cx="98" cy="176" rx="12" ry="12" fill="${c.B}"/><ellipse cx="92" cy="186" rx="12" ry="4" fill="${c.B}"/></g>`,
    head: `<path d="M88 138 C88 120 72 112 54 114 C36 116 18 122 8 134 C2 144 8 154 20 156 C40 160 66 160 80 156 C86 152 88 146 88 138 Z" fill="${c.B}"/>` + gloss(58, 122, 12, 5) +
      face(c, { eyes: [[46, 128, 7], [66, 130, 9]], mouth: [8, 146, 58, 152], blush: [72, 146], teeth: true, nostril: [14, 136] }) + (baby ? hat(58, 116, 30) : ''),
    pivot: [80, 150],
  }),
  // พาราซอโรโลฟัสกาแล็กซี: ปากเป็ด หงอนเป็นท่อยาวไปด้านหลัง ลายดาว
  galaxy: (c, baby) => ({
    tail: `<path d="M140 128 C168 120 190 128 199 150 C184 156 162 156 142 150 Z" fill="${c.B}"/>${star(176, 140, .8, '#fff')}`,
    far: bLeg(c, false, 138, 164),
    back: '',
    body: `<path d="M92 112 C114 96 158 106 158 138 C158 166 136 186 112 186 C88 186 76 166 78 142 C80 128 84 118 92 112 Z" fill="${c.B}"/>` +
      `<ellipse cx="104" cy="152" rx="20" ry="27" fill="${c.L.belly}" opacity=".9"/>` + dots([[136, 120, 2.4], [148, 138, 1.8], [128, 108, 1.8], [144, 156, 2]], '#fff') + star(140, 128, 1.1) + gloss(118, 116, 14, 7),
    near: bLeg(c, true, 116, 164) + `<ellipse cx="88" cy="134" rx="6" ry="12" fill="${c.B}" transform="rotate(-25 88 134)"/>`,
    head: `<path d="M86 92 C96 102 104 110 112 118 L92 126 C88 114 82 104 78 98 Z" fill="${c.B}"/><path d="M98 56 C112 26 142 8 172 10 C184 12 184 24 172 26 C148 28 128 42 114 66 Z" fill="${c.A}"/>` + dots([[150, 16, 2], [164, 18, 1.4], [134, 28, 1.6]], '#fff') +
      `<path d="M114 78 C114 58 100 48 84 48 C68 48 56 56 50 66 C38 68 26 74 22 84 C20 94 30 100 44 100 C60 102 82 102 96 100 C110 96 114 90 114 78 Z" fill="${c.B}"/>` +
      `<path d="M22 84 C20 94 30 100 44 100 L52 88 C42 84 32 82 22 84 Z" fill="${c.L.belly}" opacity=".9"/>` + gloss(86, 56, 12, 5) +
      dots([[104, 64, 1.6], [96, 92, 1.4]], '#fff') +
      face(c, { eyes: [[72, 66, 8], [94, 70, 10.5]], mouth: [24, 92, 52, 96], blush: [102, 86], nostril: [28, 84] }) + (baby ? hat(86, 50, 32) : ''),
    pivot: [96, 114],
  }),
  // เทอโรซอร์ฟีนิกซ์: ขนเป็นเปลวไฟ หงอนไฟ ปีกขนนก
  phoenix: (c, baby) => {
    const wing = (flip: boolean) => {
      const p = 'M100 124 C82 92 60 76 28 74 C38 82 42 88 44 94 C32 92 22 96 16 104 C30 104 40 108 46 114 C38 118 34 124 32 132 C54 128 78 130 98 138 Z';
      return flip ? `<g class="dz-wing dz-wing-b" style="transform-origin:130px 126px"><path transform="translate(230 0) scale(-1 1)" d="${p}" fill="${c.A}" opacity=".9"/></g>` : `<g class="dz-wing" style="transform-origin:100px 126px"><path d="${p}" fill="${c.A}"/></g>`;
    };
    return {
      tail: `<path d="M136 152 C160 156 178 170 188 190 C172 184 160 176 150 172 C160 182 162 190 160 197 C148 186 138 172 132 162 Z" fill="${c.A}"/>`,
      far: `<g class="dz-leg dz-leg-b" style="transform-origin:124px 168px"><path d="M124 168 L122 184" stroke="#E8A23A" stroke-width="4" stroke-linecap="round"/><path d="M114 186 h14" stroke="#E8A23A" stroke-width="4" stroke-linecap="round"/></g>`,
      back: wing(false) + wing(true),
      body: `<ellipse cx="114" cy="146" rx="28" ry="30" fill="${c.B}"/><ellipse cx="108" cy="152" rx="17" ry="20" fill="${c.L.belly}"/>` +
        `<path d="M100 140 q4 6 8 0 q4 6 8 0 M98 152 q4 6 8 0 q4 6 8 0" stroke="${c.L.accent}" stroke-width="1.8" fill="none" opacity=".6"/>` + gloss(110, 128, 9, 5),
      near: `<g class="dz-leg dz-leg-a" style="transform-origin:108px 170px"><path d="M108 170 L106 186" stroke="#F2B544" stroke-width="5" stroke-linecap="round"/><path d="M96 188 h16" stroke="#F2B544" stroke-width="5" stroke-linecap="round"/></g>`,
      head: `<path d="M82 76 C76 50 90 36 98 42 C96 52 104 54 110 42 C118 36 126 44 120 58 C130 52 138 60 130 72 C122 80 98 82 82 76 Z" fill="${c.A}"/>` +
        `<path d="M126 100 C126 80 112 70 96 70 C80 70 68 80 66 96 C64 112 76 122 94 122 C112 122 126 116 126 100 Z" fill="${c.B}"/>` +
        `<path d="M70 96 C58 96 48 102 48 110 C56 110 66 108 74 106 Z" fill="#FFC94A"/>` + gloss(100, 82, 10, 5) +
        face(c, { eyes: [[84, 94, 7.5], [104, 96, 9.5]], mouth: [50, 108, 72, 104], blush: [112, 108], beak: '#C98A1E' }) + (baby ? hat(96, 72, 30) : ''),
      pivot: [104, 124],
    };
  },
  // ไดโนคริสตัล: หลังมีแผ่นคริสตัลสองแถวแบบสเตโกซอรัส หางมีหนามคริสตัล
  crystal: (c, baby) => {
    const plate = (x: number, y: number, h: number, w = 16) => `<path d="M${x - w / 2} ${y} L${x - w * .15} ${y - h} L${x + w * .35} ${y - h + 4} L${x + w / 2} ${y} Z" fill="${c.A}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x - w * .1} ${y - 2} L${x} ${y - h + 6}" stroke="#fff" stroke-width="1.4" opacity=".8"/>`;
    return {
      tail: `<path d="M158 130 C182 126 195 138 199 154 C184 158 168 156 152 150 Z" fill="${c.B}"/>` + plate(186, 140, 18, 10) + plate(194, 150, 14, 8),
      far: qLeg(c, false, 154, 150, 34, 20) + qLeg(c, false, 100, 150, 34, 20),
      back: plate(92, 116, 24) + plate(108, 106, 32, 18) + plate(126, 102, 38, 20) + plate(144, 106, 32, 18) + plate(160, 116, 24),
      body: `<ellipse cx="126" cy="136" rx="50" ry="33" fill="${c.B}"/><ellipse cx="120" cy="154" rx="36" ry="12" fill="${c.L.belly}"/>` +
        `<path d="M100 126 l16 -10 l14 14 M140 130 l12 -8" stroke="#fff" stroke-width="2" fill="none" opacity=".85"/>` + gloss(118, 116, 16, 7),
      near: qLeg(c, true, 142, 152, 36, 22) + qLeg(c, true, 108, 152, 36, 22),
      head: `<path d="M84 128 C84 112 70 104 56 106 C38 108 24 116 18 128 C14 138 22 146 36 146 C54 148 72 146 80 140 C84 136 84 132 84 128 Z" fill="${c.B}"/>` + gloss(56, 114, 10, 4) +
        face(c, { eyes: [[46, 122, 7], [66, 124, 9]], mouth: [20, 138, 44, 142], blush: [72, 136], nostril: [22, 128] }) + (baby ? hat(56, 108, 28) : ''),
      pivot: [82, 136],
    };
  },
  // แองคิโลซอรัสลาวา: ตัวกว้างเตี้ย เกราะหนามทั้งตัว หางเป็นกระบอง รอยร้าวเรืองแสง
  lava: (c, baby) => ({
    tail: `<path d="M168 150 C180 148 188 152 190 158" stroke="${c.L.base}" stroke-width="13" fill="none" stroke-linecap="round"/><ellipse cx="192" cy="158" rx="12" ry="10" fill="${c.L.dark}"/><path d="M186 156 l6 4 6 -4" stroke="${c.L.accent}" stroke-width="2.2" fill="none" filter="url(#${c.glow})"/>`,
    far: `<ellipse cx="160" cy="172" rx="11" ry="14" fill="${c.L.dark}"/><ellipse cx="88" cy="172" rx="11" ry="14" fill="${c.L.dark}"/>`,
    back: '',
    body: `<path d="M62 162 C62 114 100 98 128 98 C160 98 188 118 188 162 Z" fill="${c.B}"/>` +
      [[86, 132], [108, 116], [132, 110], [156, 118], [176, 136], [98, 150], [122, 138], [146, 140], [168, 154]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="${c.L.light}"/><path d="M${x - 5} ${y - 3} L${x} ${y - 12} L${x + 5} ${y - 3} Z" fill="${c.L.dark}"/>`).join('') +
      [70, 92, 116, 140, 164, 184].map(x => `<path d="M${x - 6} 160 L${x} 170 L${x + 6} 160 Z" fill="${c.L.dark}"/>`).join('') +
      `<path d="M96 124 l8 10 -4 10 M136 122 l-6 12 8 8 M160 132 l-6 10" fill="none" stroke="${c.L.spot}" stroke-width="2.6" stroke-linecap="round" filter="url(#${c.glow})"/>` + gloss(116, 108, 18, 6, -6),
    near: `<g class="dz-leg dz-leg-a" style="transform-origin:146px 164px"><rect x="134" y="160" width="24" height="26" rx="10" fill="${c.B}"/></g><g class="dz-leg dz-leg-b" style="transform-origin:100px 164px"><rect x="88" y="160" width="24" height="26" rx="10" fill="${c.B}"/></g>`,
    head: `<path d="M80 144 C80 128 66 120 52 122 C36 124 22 132 18 144 C14 154 22 162 36 162 C52 164 70 160 76 154 C80 150 80 148 80 144 Z" fill="${c.B}"/>` +
      `<path d="M30 128 C40 120 64 118 78 130 L72 124 L78 116 L66 120 Z" fill="${c.L.light}"/><path d="M76 132 L88 126 L80 140 Z" fill="${c.L.dark}"/>` +
      `<path d="M48 126 l6 8 -4 6" stroke="${c.L.spot}" stroke-width="2" fill="none" filter="url(#${c.glow})"/>` +
      face(c, { eyes: [[40, 140, 7], [60, 142, 9]], mouth: [18, 154, 42, 158], blush: [66, 154], nostril: [22, 146] }) + (baby ? hat(52, 124, 28) : ''),
    pivot: [80, 150],
  }),
};

/** SVG ของไดโน 1 ตัว */
export function dinoSvg(species: DinoSpecies, stage: ArtStage, mood: Mood = 'normal') {
  const L = LOOKS[species];
  const id = `dz${++uid}`;
  const g = (k: string) => `${id}${k}`;
  const c: Ctx = { L, B: `url(#${g('body')})`, A: `url(#${g('acc')})`, m: mood, glow: g('glow'), id };
  const p = DRAW[species](c, stage === 'baby');
  // วัยเด็กหัวโต วัยรุ่นหัวโตนิดๆ
  const hs = stage === 'baby' ? 1.16 : stage === 'teen' ? 1.06 : 1;
  const [px, py] = p.pivot;
  const headT = `translate(${px} ${py}) scale(${hs}) translate(${-px} ${-py})`;
  const sick = '';
  const defs = `<defs>
<radialGradient id="${g('body')}" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="${L.light}"/><stop offset=".55" stop-color="${L.base}"/><stop offset="1" stop-color="${L.dark}"/></radialGradient>
<linearGradient id="${g('acc')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L.accent2}"/><stop offset="1" stop-color="${L.accent}"/></linearGradient>
<filter id="${g('glow')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="${g('aura')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
<radialGradient id="${g('sclera')}" cx="40%" cy="35%" r="70%"><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#E4E0EA"/></radialGradient>
<radialGradient id="${g('iris')}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${L.iris ? '#fff' : '#C98A52'}"/><stop offset=".35" stop-color="${L.iris || '#A0582E'}"/><stop offset="1" stop-color="#3A1C10"/></radialGradient>
<filter id="${g('toy')}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="4.5" result="blur"/>
<feSpecularLighting in="blur" surfaceScale="4" specularConstant=".55" specularExponent="20" lighting-color="#ffffff" result="spec"><fePointLight x="30" y="-40" z="140"/></feSpecularLighting>
<feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
<feDiffuseLighting in="blur" surfaceScale="3.5" diffuseConstant="1.18" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="230" elevation="58"/></feDiffuseLighting>
<feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
<feBlend in="SourceGraphic" in2="diffIn" mode="multiply" result="shaded"/>
<feComposite in="specIn" in2="shaded" operator="arithmetic" k1="0" k2=".38" k3="1" k4="0"/>
</filter>
</defs>`;
  const aura = L.glow ? `<ellipse cx="114" cy="124" rx="76" ry="62" fill="${L.glow}" opacity=".32" filter="url(#${g('aura')})"/>` : '';
  return `<svg class="dz dz-${species} dz-${stage} dz-m-${mood}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}
<ellipse class="dz-shadow" cx="116" cy="190" rx="64" ry="7" fill="#000" opacity=".13"/>${aura}
<g class="dz-all"${species === 'crystal' ? ' opacity=".94"' : ''}>
<g class="dz-tail" style="transform-origin:150px 145px"><g filter="url(#${g('toy')})">${p.tail}</g></g>
<g filter="url(#${g('toy')})">${p.far}${p.back}</g>
<g class="dz-bodyg" style="transform-origin:120px 186px"><g filter="url(#${g('toy')})">${p.body}</g></g>
<g filter="url(#${g('toy')})">${p.near}</g>
<g class="dz-headg" style="transform-origin:${px}px ${py}px"><g transform="${headT}"><g filter="url(#${g('toy')})">${p.head}</g></g></g>
${sick}</g></svg>`;
}

// ---------- ไข่ ----------
const EGG = 'M100 18 C138 18 162 86 162 122 C162 162 134 188 100 188 C66 188 38 162 38 122 C38 86 62 18 100 18 Z';
const EGG_LOOK: Record<DinoSpecies, { a: string; b: string; c: string; pat: string; nest?: boolean; glow?: string }> = {
  trex: { a: '#FFF6E2', b: '#F1DDB6', c: '#C9A06A', pat: 'spots' },
  styra: { a: '#F7F2B4', b: '#DCCF62', c: '#4FB8B0', pat: 'spots' },
  pachy: { a: '#D9F0FF', b: '#9CCBEB', c: '#C2A3EE', pat: 'blobs' },
  galli: { a: '#FFE89A', b: '#E3BE48', c: '#C99A2E', pat: 'zigzag' },
  diplo: { a: '#8E8CE8', b: '#5654BE', c: '#DDE4FF', pat: 'clouds' },
  elas: { a: '#9BE6DA', b: '#4FAFA4', c: '#E4FBF6', pat: 'clouds' },
  ptero: { a: '#E6E4FF', b: '#B3B5EE', c: '#8E96E0', pat: 'spots' },
  flame: { a: '#FF9E7E', b: '#E2604A', c: '#FFC94A', pat: 'flame', nest: true },
  galaxy: { a: '#6A5FE0', b: '#2C2A86', c: '#FFFFFF', pat: 'galaxy', glow: '#9FA8FF' },
  phoenix: { a: '#FFD27A', b: '#F07A3A', c: '#FFF2B8', pat: 'flame', nest: true, glow: '#FFC77A' },
  crystal: { a: '#FFFFFF', b: '#C6E6F7', c: '#E8C8FF', pat: 'facets', glow: '#CFE9FF' },
  lava: { a: '#5A4A52', b: '#2A2026', c: '#FF7A2E', pat: 'cracks', nest: true, glow: '#FF8A3D' },
};

/** SVG ของไข่ crack = 0 ปกติ, 1 ร้าว, 2 ร้าวมาก */
export function eggSvg(species: DinoSpecies, crack = 0) {
  const E = EGG_LOOK[species];
  const id = `eg${++uid}`;
  const g = (k: string) => `${id}${k}`;
  const pats: Record<string, string> = {
    spots: [[78, 70, 9], [118, 92, 12], [84, 128, 11], [126, 146, 8], [104, 50, 6], [64, 104, 6], [140, 118, 6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .8}" fill="${E.c}" opacity=".6"/>`).join(''),
    blobs: `<path d="M50 96 C70 80 92 104 116 92 C138 82 150 100 160 110 L160 140 C140 126 118 148 96 136 C76 126 60 140 42 132 Z" fill="${E.c}" opacity=".7"/><path d="M70 50 C84 40 100 56 116 48 L124 60 C108 70 90 60 74 66 Z" fill="${E.c}" opacity=".6"/>`,
    zigzag: [74, 112, 150].map(y => `<path d="M38 ${y} l20 -18 l20 18 l20 -18 l20 18 l20 -18 l20 18 l20 -18" stroke="${E.c}" stroke-width="8" fill="none" stroke-linejoin="round" opacity=".55"/>`).join(''),
    clouds: [[76, 80], [124, 116], [80, 150], [120, 54]].map(([x, y]) => `<path d="M${x - 18} ${y + 6} a10 10 0 0 1 8 -14 a12 12 0 0 1 22 0 a9 9 0 0 1 8 14 Z" fill="${E.c}" opacity=".55"/>`).join(''),
    flame: `<path d="M100 172 C70 168 62 140 76 118 C80 132 88 134 90 126 C86 106 96 88 110 80 C108 98 120 106 126 98 C140 118 138 168 100 172 Z" fill="${E.c}" opacity=".85"/><path d="M100 168 C86 164 84 148 92 138 C96 146 102 146 104 140 C112 148 114 164 100 168Z" fill="#FFF2B8"/>`,
    galaxy: `<path d="M40 120 C70 90 110 140 160 96 L160 130 C120 160 80 120 40 150 Z" fill="#B36BF0" opacity=".55"/><path d="M50 80 C80 70 110 100 150 70 L154 86 C120 110 86 84 46 98 Z" fill="#5AD1F2" opacity=".45"/>` +
      [[70, 60], [126, 76], [90, 112], [136, 140], [64, 150], [110, 160], [100, 40]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.6}" fill="#fff"/>`).join(''),
    facets: `<path d="M100 18 L70 80 L100 120 L130 80 Z M70 80 L40 122 L100 120 M130 80 L160 122 L100 120 M100 120 L66 182 M100 120 L134 182 M40 122 L100 188 L160 122" fill="none" stroke="#fff" stroke-width="2.4" opacity=".9"/><path d="M100 18 L70 80 L100 120 Z" fill="${E.c}" opacity=".35"/><path d="M130 80 L160 122 L100 120Z" fill="#B6F0E8" opacity=".4"/>`,
    cracks: `<path d="M70 60 l14 20 -8 16 14 18 M130 80 l-10 18 12 14 -6 18 M86 150 l16 -8 12 12" stroke="${E.c}" stroke-width="3.4" fill="none" stroke-linecap="round" filter="url(#${g('glow')})"/>`,
  };
  const cracks = crack >= 1 ? `<path d="M64 98 l12 8 l8 -10 l10 10 l10 -8 l8 10" stroke="#5B4636" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const cracks2 = crack >= 2 ? `<path d="M118 60 l6 12 -8 8 6 10 M84 140 l10 6 -2 10" stroke="#5B4636" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : '';
  const nest = E.nest ? `<path d="M28 160 C40 190 160 190 172 160 C176 176 150 196 100 196 C50 196 24 176 28 160 Z" fill="#C8955A"/><path d="M34 168 C70 178 130 178 166 168 M40 178 C80 186 120 186 160 178" stroke="#A9773F" stroke-width="3" fill="none"/>` : '';
  const aura = E.glow ? `<ellipse cx="100" cy="110" rx="76" ry="86" fill="${E.glow}" opacity=".35" filter="url(#${g('aura')})"/>` : '';
  return `<svg class="dz dz-egg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs>
<radialGradient id="${g('e')}" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="${E.a}"/><stop offset="1" stop-color="${E.b}"/></radialGradient>
<clipPath id="${g('clip')}"><path d="${EGG}"/></clipPath>
<filter id="${g('glow')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="${g('aura')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<ellipse cx="100" cy="192" rx="56" ry="6" fill="#000" opacity=".12"/>${aura}
<path d="${EGG}" fill="url(#${g('e')})"${species === 'crystal' ? ' opacity=".92"' : ''}/>
<g clip-path="url(#${g('clip')})">${pats[E.pat]}</g>
<ellipse cx="78" cy="58" rx="14" ry="22" fill="#fff" opacity=".38" transform="rotate(20 78 58)"/>
${cracks}${cracks2}${nest}</svg>`;
}
