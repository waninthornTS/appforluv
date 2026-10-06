// ตัวละครสำรองแบบ SVG (ใช้เมื่อยังไม่มีไฟล์รูป PNG ใน src/assets/characters/)
// Ploy : ผมบ็อบหน้าม้าสีดำ ใส่แว่นกลม เสื้อเชิ้ตยีนส์ + กางเกงยีนส์ + กระเป๋าหนังสะพายข้าง
// Dream: ผมยาวสีดำแสกข้าง เดรสชมพูแขนพอง กอดตุ๊กตาหมี
export type CharKey = 'ploy' | 'dream';

const SKIN = '#FFDCC8';
const INK = '#24161A';
let uidN = 0;

// ---------- ส่วนที่ใช้ร่วมกัน ----------
const commonDefs = (u: string) => `
  <radialGradient id="${u}sk" cx=".45" cy=".36" r=".72"><stop offset="0" stop-color="#FFF4EC"/><stop offset=".55" stop-color="#FFE1CF"/><stop offset="1" stop-color="#F0BCA2"/></radialGradient>
  <radialGradient id="${u}bl"><stop offset="0" stop-color="#FF8DA6" stop-opacity=".6"/><stop offset="1" stop-color="#FF8DA6" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u}ir" cx=".5" cy=".66" r=".62"><stop offset="0" stop-color="#C08B60"/><stop offset=".5" stop-color="#714329"/><stop offset="1" stop-color="#2C1810"/></radialGradient>
  <linearGradient id="${u}hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C4356"/><stop offset=".4" stop-color="#27222D"/><stop offset="1" stop-color="#141117"/></linearGradient>
  <radialGradient id="${u}sh"><stop offset="0" stop-color="#2A1530" stop-opacity=".3"/><stop offset="1" stop-color="#2A1530" stop-opacity="0"/></radialGradient>`;

function eye(u: string, cx: number, cy: number, side: number) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="9.2" ry="10.6" fill="url(#${u}ir)"/>
    <ellipse cx="${cx}" cy="${cy + 1.2}" rx="4.8" ry="5.6" fill="#1A0E0A"/>
    <circle cx="${cx + 3.6}" cy="${cy - 4.2}" r="3.5" fill="#fff"/>
    <circle cx="${cx - 3.4}" cy="${cy + 4.8}" r="1.7" fill="#fff" opacity=".9"/>
    <ellipse cx="${cx}" cy="${cy}" rx="9.2" ry="10.6" fill="none" stroke="#3A2218" stroke-width="1.1" opacity=".7"/>
    <path d="M${cx - 10.2} ${cy - 1.5} Q${cx - 1} ${cy - 14.8} ${cx + 10.2} ${cy - 1.5}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${cx + side * 9.6} ${cy - 3.2} l${side * 3} -1 M${cx + side * 7.6} ${cy - 7} l${side * 2.6} -2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
}
const heartEye = (cx: number, cy: number) => `<path transform="translate(${cx} ${cy + 6}) scale(1.25)" d="M0 0 c-6-4-8-7-8-9.5 0-2.6 2-4 4-4 1.7 0 3 .9 4 2.4 1-1.5 2.3-2.4 4-2.4 2 0 4 1.4 4 4 0 2.5-2 5.5-8 9.5z"/>`;

function headSVG(u: string) {
  return `
    <ellipse cx="21" cy="75" rx="7.5" ry="9.5" fill="url(#${u}sk)"/><ellipse cx="119" cy="75" rx="7.5" ry="9.5" fill="url(#${u}sk)"/>
    <ellipse cx="22" cy="76" rx="3.5" ry="5" fill="#EFAE94" opacity=".55"/><ellipse cx="118" cy="76" rx="3.5" ry="5" fill="#EFAE94" opacity=".55"/>
    <ellipse cx="70" cy="66" rx="49" ry="45" fill="url(#${u}sk)"/>
    <ellipse cx="70" cy="104" rx="26" ry="6" fill="#F0BCA2" opacity=".35"/>
    <ellipse cx="41" cy="87" rx="13" ry="8.5" fill="url(#${u}bl)"/><ellipse cx="99" cy="87" rx="13" ry="8.5" fill="url(#${u}bl)"/>
    <path d="M44 57 Q51 53.5 58 56 M82 56 Q89 53.5 96 57" fill="none" stroke="#6B4636" stroke-width="2" stroke-linecap="round" opacity=".75"/>
    <g class="eyes">${eye(u, 52, 73, -1)}${eye(u, 88, 73, 1)}</g>
    <g class="heart-eyes" fill="#FF5C8A">${heartEye(52, 73)}${heartEye(88, 73)}</g>
    <ellipse cx="70" cy="85" rx="2.5" ry="1.7" fill="#EBA088" opacity=".8"/>
    <path d="M64.5 92 Q70 97 75.5 92" fill="none" stroke="#A4474F" stroke-width="2.2" stroke-linecap="round"/>`;
}

// ---------- Ploy ----------
function ploy(u: string) {
  const defs = `
    <linearGradient id="${u}sht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B4D4F4"/><stop offset="1" stop-color="#729FD6"/></linearGradient>
    <linearGradient id="${u}jn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3F5F8F"/><stop offset=".5" stop-color="#5E82B6"/><stop offset="1" stop-color="#3F5F8F"/></linearGradient>
    <linearGradient id="${u}bag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B98257"/><stop offset="1" stop-color="#7C4D2D"/></linearGradient>`;
  const back = `<path d="M18 66 Q14 11 70 10 Q126 11 122 66 Q125 92 122 109 Q118 119 106 115 L34 115 Q22 119 18 109 Q15 92 18 66Z" fill="url(#${u}hr)"/>`;
  const shoe = (x: number) => `<path d="M${x - 8.5} 167 Q${x - 8.5} 158 ${x} 158 Q${x + 8.5} 158 ${x + 8.5} 167Z" fill="#fff"/>
    <rect x="${x - 8.8}" y="165" width="17.6" height="4.5" rx="2.2" fill="#C9A27E"/><path d="M${x - 4} 161 h8" stroke="#D9C4B0" stroke-width="1.5"/>`;
  const body = `
    <rect x="56" y="130" width="12.5" height="31" rx="5" fill="url(#${u}jn)"/><rect x="71.5" y="130" width="12.5" height="31" rx="5" fill="url(#${u}jn)"/>
    <rect x="54.5" y="153" width="15.5" height="7" rx="3" fill="#8AABD6"/><rect x="70" y="153" width="15.5" height="7" rx="3" fill="#8AABD6"/>
    ${shoe(62)}${shoe(78)}
    <rect x="49" y="127" width="42" height="11" rx="4.5" fill="url(#${u}jn)"/>
    <path d="M50 106 Q70 102 90 106 Q95 108 95 115 L93 132 Q70 136 47 132 L45 115 Q45 108 50 106Z" fill="url(#${u}sht)"/>
    <path d="M70 112 V132" stroke="#6690C6" stroke-width="1.2"/>
    <circle cx="70" cy="118" r="1.4" fill="#fff"/><circle cx="70" cy="125" r="1.4" fill="#fff"/>
    <path d="M57 105 L70 112.5 L64.5 119Z M83 105 L70 112.5 L75.5 119Z" fill="#C3DDF6" stroke="#6690C6" stroke-width=".9" stroke-linejoin="round"/>
    <ellipse cx="45" cy="113" rx="8.5" ry="8" fill="url(#${u}sht)"/><ellipse cx="95" cy="113" rx="8.5" ry="8" fill="url(#${u}sht)"/>
    <path d="M38 117 Q45 121 52 117 M88 117 Q95 121 102 117" stroke="#6690C6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M41 119 Q37 127 38 134 M99 119 Q104 127 103 134" stroke="${SKIN}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="136" r="5.6" fill="${SKIN}"/><circle cx="103" cy="136" r="5.6" fill="${SKIN}"/>
    <path d="M53 107 L87 128" stroke="#6E4127" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="79" y="125" width="22" height="16.5" rx="4.5" fill="url(#${u}bag)"/>
    <path d="M79 129.5 Q79 125 83.5 125 H96.5 Q101 125 101 129.5 V134 Q90 138.5 79 134Z" fill="#8E5B37"/>
    <rect x="88" y="132.5" width="4" height="4.5" rx="1.2" fill="#E9C47C"/>
    <path d="M82 127.5 Q90 126.5 98 127.5" stroke="#fff" stroke-width="1.2" opacity=".25" fill="none"/>`;
  const front = `
    <path d="M23 67 Q18 15 70 14 Q122 15 117 67 Q115 58 112 53 Q100 57.5 88 53 Q76 57.5 70 54 Q64 57.5 52 53 Q40 57.5 28 53 Q25 58 23 67Z" fill="url(#${u}hr)"/>
    <path d="M46 22 Q42 38 44 52 M59 18 Q56 36 58 53 M81 18 Q84 36 82 53 M95 22 Q99 38 97 52" stroke="#0D0A0F" stroke-width="1.3" fill="none" opacity=".55"/>
    <path d="M38 31 Q56 18 84 19" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".28"/>
    <path d="M91 22 Q101 25 107 33" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".2"/>
    <g fill="rgba(255,255,255,.1)" stroke="#3A2C2C" stroke-width="2.3"><circle cx="52" cy="73" r="15"/><circle cx="88" cy="73" r="15"/></g>
    <path d="M67 71 Q70 68.5 73 71 M37 70 L25 67 M103 70 L115 67" stroke="#3A2C2C" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    <path d="M42.5 65 Q46.5 60.5 52 60 M78.5 65 Q82.5 60.5 88 60" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".65"/>`;
  return { defs, back, body, front };
}

// ---------- Dream ----------
function dream(u: string) {
  const defs = `
    <linearGradient id="${u}dr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD3E1"/><stop offset="1" stop-color="#F296B6"/></linearGradient>
    <radialGradient id="${u}pf" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE3EC"/><stop offset="1" stop-color="#F4A3C0"/></radialGradient>
    <radialGradient id="${u}br" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#C99366"/><stop offset="1" stop-color="#83532F"/></radialGradient>`;
  const back = `<path d="M17 66 Q13 10 70 9 Q127 10 123 66 L127 140 Q120 151 107 145 L70 134 L33 145 Q20 151 13 140Z" fill="url(#${u}hr)"/>`;
  const shoe = (x: number) => `<path d="M${x - 9.5} 167 Q${x - 9.5} 159 ${x} 159 Q${x + 9.5} 159 ${x + 9.5} 167Z" fill="#3B2830"/>
    <path d="M${x - 5} 160.5 h10" stroke="#3B2830" stroke-width="2.2"/><ellipse cx="${x - 3}" cy="162" rx="3" ry="1.2" fill="#fff" opacity=".3"/>`;
  const B = `url(#${u}br)`;
  const bear = `
    <ellipse cx="62" cy="151" rx="5.5" ry="4.2" fill="${B}"/><ellipse cx="78" cy="151" rx="5.5" ry="4.2" fill="${B}"/>
    <ellipse cx="70" cy="140" rx="12.5" ry="11" fill="${B}"/><ellipse cx="70" cy="143" rx="7.2" ry="6.2" fill="#E3BD97"/>
    <circle cx="59.5" cy="113.5" r="4.8" fill="${B}"/><circle cx="80.5" cy="113.5" r="4.8" fill="${B}"/>
    <circle cx="59.5" cy="113.5" r="2.4" fill="#E3BD97"/><circle cx="80.5" cy="113.5" r="2.4" fill="#E3BD97"/>
    <circle cx="70" cy="123" r="11.2" fill="${B}"/>
    <ellipse cx="70" cy="127.2" rx="5.4" ry="4.1" fill="#EAC9A4"/><ellipse cx="70" cy="125.8" rx="2.1" ry="1.5" fill="#24150F"/>
    <path d="M68 128.6 Q70 130.2 72 128.6" stroke="#24150F" stroke-width="1" fill="none" stroke-linecap="round"/>
    <circle cx="65.3" cy="121" r="1.6" fill="#1A0E0A"/><circle cx="74.7" cy="121" r="1.6" fill="#1A0E0A"/>
    <circle cx="65.8" cy="120.4" r=".55" fill="#fff"/><circle cx="75.2" cy="120.4" r=".55" fill="#fff"/>
    <g transform="translate(70 134)"><path d="M0 0 L-5 -3 L-5 3Z M0 0 L5 -3 L5 3Z" fill="#FF7EA8"/><circle r="1.5" fill="#F2548A"/></g>`;
  const body = `
    <rect x="57" y="140" width="10" height="21" rx="4" fill="${SKIN}"/><rect x="73" y="140" width="10" height="21" rx="4" fill="${SKIN}"/>
    <rect x="56.5" y="152" width="11" height="8.5" rx="3" fill="#fff"/><rect x="72.5" y="152" width="11" height="8.5" rx="3" fill="#fff"/>
    ${shoe(62)}${shoe(78)}
    <path d="M52 106 Q70 102 88 106 Q94 108 94 115 L97 129 L106 149 Q70 157 34 149 L43 129 L46 115 Q46 108 52 106Z" fill="url(#${u}dr)"/>
    <path d="M45 128 Q70 132 95 128" stroke="#E5859F" stroke-width="1.5" fill="none"/>
    <path d="M36 148 Q70 155.5 104 148" stroke="#fff" stroke-width="2.2" stroke-dasharray="1 4.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="63" cy="107.5" rx="7.5" ry="4" fill="#fff" transform="rotate(12 63 107.5)"/><ellipse cx="77" cy="107.5" rx="7.5" ry="4" fill="#fff" transform="rotate(-12 77 107.5)"/>
    ${bear}
    <ellipse cx="45" cy="113" rx="10" ry="8.5" fill="url(#${u}pf)"/><ellipse cx="95" cy="113" rx="10" ry="8.5" fill="url(#${u}pf)"/>
    <path d="M37 118 Q45 122 53 118 M87 118 Q95 122 103 118" stroke="#E5859F" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M43 120 Q47 128 57 130 M97 120 Q93 128 83 130" stroke="${SKIN}" stroke-width="8.5" fill="none" stroke-linecap="round"/>
    <circle cx="58" cy="130.5" r="5.3" fill="${SKIN}"/><circle cx="82" cy="130.5" r="5.3" fill="${SKIN}"/>`;
  const front = `
    <path d="M20 86 Q13 20 60 12 Q49 25 41 43 Q34 62 35 86Z" fill="url(#${u}hr)"/>
    <path d="M57 12 Q125 11 120 86 Q117 60 106 46 Q90 31 63 30 Q58 22 57 12Z" fill="url(#${u}hr)"/>
    <path d="M24 72 Q17 104 25 136 Q33 125 37 94Z M116 72 Q123 104 115 136 Q107 125 103 94Z" fill="url(#${u}hr)"/>
    <path d="M70 18 Q92 26 106 46 M50 22 Q40 34 36 52 M27 92 Q25 112 28 128" stroke="#0D0A0F" stroke-width="1.3" fill="none" opacity=".5"/>
    <path d="M66 19 Q88 20 102 32" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".28"/>
    <path d="M30 40 Q34 30 44 24" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".2"/>`;
  return { defs, back, body, front };
}

export function charSVG(key: CharKey, cls = '') {
  const u = `c${++uidN}`;
  const parts = (key === 'dream' ? dream : ploy)(u);
  return `<svg class="char ${cls}" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${commonDefs(u)}${parts.defs}</defs>
    <ellipse cx="70" cy="171" rx="38" ry="7" fill="url(#${u}sh)"/>
    ${parts.back}${parts.body}${headSVG(u)}${parts.front}
  </svg>`;
}

export const HEART_SVG = `<svg viewBox="0 0 32 30" aria-hidden="true"><defs>
  <radialGradient id="hg" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#FFF0F6"/><stop offset=".35" stop-color="#FFC2D8"/><stop offset=".8" stop-color="#F58BB2"/><stop offset="1" stop-color="#E86D9B"/></radialGradient></defs>
  <path d="M16 29C6 22 1 16 1 9.6 1 4.8 4.7 1 9.3 1c2.8 0 5.2 1.4 6.7 3.6C17.5 2.4 19.9 1 22.7 1 27.3 1 31 4.8 31 9.6 31 16 26 22 16 29z" fill="url(#hg)"/>
  <ellipse cx="9.5" cy="8" rx="4" ry="2.4" fill="#fff" opacity=".7" transform="rotate(-30 9.5 8)"/>
  <ellipse cx="23" cy="20" rx="2.5" ry="1.2" fill="#fff" opacity=".35" transform="rotate(-40 23 20)"/></svg>`;
