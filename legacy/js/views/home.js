import { getProfile, coll } from '../store.js';
import { charSVG, HEART_SVG } from '../characters.js';
import { hydrate } from '../photos.js';
import { $, $$, esc, todayStr, diffDays, addDays, ymd, fmtDate, nextYearly, countdown } from '../utils.js';
import { EVENT_TYPES } from './calendar.js';
import { openMemoryDetail, MEM_CATS } from './diary.js';
import { period as skyMode } from '../sky.js';

// คำพูดเวลาแตะตัวละคร ({o} = ชื่ออีกคน)
// ดาวสีทองในฉาก
const GOLD_STARS = [[8, 30], [30, 12], [62, 22], [86, 40], [48, 8]].map(([x, y], i) =>
  `<svg class="gstar" style="left:${x}%;top:${y}%;animation-delay:${i * .5}s" viewBox="0 0 10 10"><path d="M5 0 L6.2 3.6 L10 3.8 L7 6.1 L8 10 L5 7.7 L2 10 L3 6.1 L0 3.8 L3.8 3.6Z" fill="#FFE08A"/></svg>`).join('');

const LINES = {
  A: ['วันนี้กินข้าวยัง?', 'เดี๋ยวจัดการให้เอง 😎', 'วางแผนทริปไว้แล้วนะ ✈️', '{o} น่ารักจัง', 'วันนี้เหนื่อยมั้ย?', 'ไปดูหนังกันมั้ย 🎬', 'อย่านอนดึกนะ', 'รักนะ 💕'],
  B: ['{o}~ 🥺', 'น้องหมีคิดถึง {o} 🧸', 'ไปกินขนมกันน้า 🍰', 'ง่วงแล้ววว 😴', 'อยากไปเที่ยวด้วยกัน ✈️', 'หิวชานมไข่มุก 🧋', 'คิดถึงจัง~', 'รักนะ 💕'],
};

function greeting(h = new Date().getHours()) {
  if (h < 5) return 'ดึกแล้ว นอนได้แล้วน้า 🌙';
  if (h < 11) return 'อรุณสวัสดิ์ ☀️';
  if (h < 16) return 'สวัสดีตอนบ่าย 🌤️';
  if (h < 19) return 'สวัสดีตอนเย็น 🌇';
  return 'ราตรีสวัสดิ์ 🌙';
}

function milestones(p, today) {
  const list = [];
  if (p.startDate) {
    const days = diffDays(p.startDate, today) + 1; // วันแรกที่คบ = วันที่ 1
    const n100 = Math.max(100, Math.ceil(days / 100) * 100);
    list.push({ emo: '💯', t: `ครบ ${n100.toLocaleString()} วัน`, date: addDays(p.startDate, n100 - 1) });
    const ann = nextYearly(p.startDate, today);
    const years = +ann.slice(0, 4) - +p.startDate.slice(0, 4);
    if (years > 0) list.push({ emo: '💍', t: `ครบรอบ ${years} ปี`, date: ann });
    const n1000 = Math.ceil(days / 1000) * 1000;
    if (n1000 > n100) list.push({ emo: '🏆', t: `ครบ ${n1000.toLocaleString()} วัน`, date: addDays(p.startDate, n1000 - 1) });
  }
  if (p.birthA) list.push({ emo: '🎂', t: `วันเกิด ${p.nameA}`, date: nextYearly(p.birthA, today) });
  if (p.birthB) list.push({ emo: '🎂', t: `วันเกิด ${p.nameB}`, date: nextYearly(p.birthB, today) });
  for (const m of list) m.left = diffDays(today, m.date);
  return list.sort((a, b) => a.left - b.left);
}

export async function render(el) {
  const today = todayStr();
  const [p, memories, events, trips] = await Promise.all([
    getProfile(), coll.all('memories'), coll.all('events'), coll.all('trips'),
  ]);
  const days = p.startDate ? diffDays(p.startDate, today) + 1 : 0;
  const span = p.startDate ? ymd(p.startDate, today) : null;
  const sky = skyMode();

  const upcoming = [
    ...events.filter(e => (e.endDate || e.date) >= today).map(e => ({
      date: e.date, title: e.title, emo: EVENT_TYPES[e.type]?.emoji || '📌', color: EVENT_TYPES[e.type]?.color || 'pink',
      sub: [e.time, e.place].filter(Boolean).join(' · '), href: '#calendar',
    })),
    ...trips.filter(t => t.startDate && (t.endDate || t.startDate) >= today && t.status !== 'done').map(t => ({
      date: t.startDate, title: `ทริป ${t.place}`, emo: '✈️', color: 'mint', sub: t.scope === 'international' ? 'ต่างประเทศ' : 'ในประเทศ', href: '#travel',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const recent = [...memories].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let hideHint = false;
  try { hideHint = localStorage.getItem('hideInstallHint') === '1'; } catch { /* private mode */ }

  el.innerHTML = `
    ${isIOS && !standalone && !hideHint ? `
    <div class="card install-hint">
      <div style="font-size:30px">📲</div>
      <div class="small">ติดตั้งเป็นแอป: กดปุ่ม <b>แชร์</b> <span style="font-size:16px">⎋</span> ด้านล่าง แล้วเลือก <b>“เพิ่มไปยังหน้าจอโฮม”</b></div>
      <button class="x" id="hint-x" aria-label="ปิด">✕</button>
    </div>` : ''}

    <header class="page-head">
      <div class="grow">
        <p class="eyebrow">${greeting()}</p>
        <h1 class="ellipsis">${esc(p.nameA)} <span class="amp">♥</span> ${esc(p.nameB)}</h1>
      </div>
    </header>

    <section class="scene sky-${sky}" aria-label="ตัวละครของเรา">
      <div class="sun"></div>
      ${sky === 'night' ? Array.from({ length: 14 }, (_, i) => `<i class="star" style="left:${(i * 37) % 100}%;top:${(i * 23) % 55 + 4}%;animation-delay:${i * .3}s"></i>`).join('') : ''}
      <div class="cloud c1"></div><div class="cloud c2"></div>
      <div class="ground"></div>
      ${GOLD_STARS}
      <svg class="bench" viewBox="0 0 60 38" aria-hidden="true"><rect x="3" y="3" width="54" height="7" rx="2.5" fill="#B5784A"/><rect x="3" y="12" width="54" height="7" rx="2.5" fill="#A56B40"/><rect x="1" y="21" width="58" height="6" rx="2.5" fill="#8C5A36"/><rect x="7" y="26" width="5" height="12" rx="1.5" fill="#6E4127"/><rect x="48" y="26" width="5" height="12" rx="1.5" fill="#6E4127"/></svg>
      <svg class="flower" style="left:5%;bottom:34px" viewBox="0 0 20 26"><path d="M10 12 V26" stroke="#3F8F4A" stroke-width="2"/><circle cx="10" cy="5.5" r="4" fill="#FFB3CB" transform="rotate(0 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFB3CB" transform="rotate(72 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFB3CB" transform="rotate(144 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFB3CB" transform="rotate(216 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFB3CB" transform="rotate(288 10 10)"/><circle cx="10" cy="10" r="2.8" fill="#FFD66B"/></svg><svg class="flower" style="left:13%;bottom:18px;width:15px" viewBox="0 0 20 26"><path d="M10 12 V26" stroke="#3F8F4A" stroke-width="2"/><circle cx="10" cy="5.5" r="4" fill="#E9D8FF" transform="rotate(0 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#E9D8FF" transform="rotate(72 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#E9D8FF" transform="rotate(144 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#E9D8FF" transform="rotate(216 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#E9D8FF" transform="rotate(288 10 10)"/><circle cx="10" cy="10" r="2.8" fill="#FFD66B"/></svg><svg class="flower" style="right:4%;bottom:12px" viewBox="0 0 20 26"><path d="M10 12 V26" stroke="#3F8F4A" stroke-width="2"/><circle cx="10" cy="5.5" r="4" fill="#FFC9DA" transform="rotate(0 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFC9DA" transform="rotate(72 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFC9DA" transform="rotate(144 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFC9DA" transform="rotate(216 10 10)"/><circle cx="10" cy="5.5" r="4" fill="#FFC9DA" transform="rotate(288 10 10)"/><circle cx="10" cy="10" r="2.8" fill="#FFD66B"/></svg>
      <svg class="sprout" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 22 V11" stroke="#3F8F4A" stroke-width="2.2"/><path d="M12 12 Q4 12 3 4 Q11 4 12 12Z M12 10 Q19 9 21 2 Q13 2 12 10Z" fill="#6CC46A"/></svg>
      <div class="couple" id="couple">
        <button class="char-wrap" data-who="A" aria-label="${esc(p.nameA)}">
          <div class="bubble"></div>${charSVG(p.charA)}<span class="name-tag">${esc(p.nameA)}</span>
        </button>
        <div class="center-heart">${HEART_SVG}<div class="dday">${days ? `D+${days.toLocaleString()}` : '♥'}</div></div>
        <button class="char-wrap" data-who="B" aria-label="${esc(p.nameB)}">
          <div class="bubble"></div>${charSVG(p.charB)}<span class="name-tag">${esc(p.nameB)}</span>
        </button>
      </div>
    </section>

    ${p.startDate ? `
    <section class="card counter">
      <div class="label">เรารักกันมาแล้ว</div>
      <div class="num">${days.toLocaleString()} <small>วัน</small></div>
      <div class="ymd">
        <div><b>${span.y}</b><span>ปี</span></div><div><b>${span.m}</b><span>เดือน</span></div><div><b>${span.d}</b><span>วัน</span></div>
      </div>
      <p class="small muted" style="margin-top:10px;position:relative">ตั้งแต่ ${fmtDate(p.startDate, { long: true, weekday: true })}</p>
    </section>` : `
    <a href="#me" class="card counter" style="display:block">
      <div class="num" style="font-size:40px">💌</div>
      <div style="font-weight:700;position:relative">ตั้งค่าวันที่เริ่มคบกันก่อนน้า</div>
      <p class="small muted" style="position:relative">แตะเพื่อไปตั้งค่าชื่อ วันครบรอบ และวันเกิด</p>
    </a>`}

    ${milestones(p, today).length ? `
    <section class="section">
      <div class="section-title"><h2>วันสำคัญที่กำลังมา</h2></div>
      <div class="hscroll">
        ${milestones(p, today).map(m => `
          <div class="card milestone">
            <div class="emo">${m.emo}</div><div class="t">${esc(m.t)}</div><div class="d">${fmtDate(m.date)}</div>
            <div class="cd"><span class="chip ${m.left <= 7 ? 'pink' : 'lav'}">${countdown(m.left)}</span></div>
          </div>`).join('')}
      </div>
    </section>` : ''}

    <section class="section">
      <div class="section-title"><h2>นัดถัดไปของเรา</h2><a href="#calendar">ดูปฏิทิน</a></div>
      ${upcoming.length ? `<div class="list">${upcoming.map(u => `
        <a class="card item" href="${u.href}">
          <div class="ico ${u.color}">${u.emo}</div>
          <div class="grow"><div class="t ellipsis">${esc(u.title)}</div><div class="s">${fmtDate(u.date, { weekday: true })}${u.sub ? ' · ' + esc(u.sub) : ''}</div></div>
          <span class="chip">${countdown(diffDays(today, u.date))}</span>
        </a>`).join('')}</div>` : `
        <a class="card empty" href="#calendar" style="display:block"><div class="emo">🗓️</div><p>ยังไม่มีนัดเลย ลองเพิ่มนัดเดทดูสิ</p></a>`}
    </section>

    <section class="section">
      <div class="section-title"><h2>ความทรงจำล่าสุด</h2><a href="#diary">ทั้งหมด</a></div>
      ${recent.length ? `<div class="hscroll" style="padding-top:14px">${recent.map(m => `
        <button class="polaroid mini" data-mem="${esc(m.id)}">
          <div class="tape"></div>
          <div class="ph">${m.photos?.[0] ? `<img data-photo="${esc(m.photos[0])}" alt="">` : (MEM_CATS[m.cat]?.emoji || '💌')}</div>
          <div class="cap"><div class="t">${esc(m.title)}</div><div class="d">${fmtDate(m.date)}</div></div>
        </button>`).join('')}</div>` : `
        <a class="card empty" href="#diary" style="display:block"><div class="emo">🎬</div><p>วันนี้ไปดูหนังเรื่องอะไรมา? มาจดไว้กัน</p></a>`}
    </section>
  `;

  hydrate(el);

  $('#hint-x', el)?.addEventListener('click', e => {
    try { localStorage.setItem('hideInstallHint', '1'); } catch { /* ignore */ }
    e.currentTarget.closest('.install-hint').remove();
  });

  // ---------- แตะตัวละครเพื่อให้พูด ----------
  const couple = $('#couple', el);
  $$('.char-wrap', couple).forEach(w => w.addEventListener('click', () => {
    const svg = $('.char', w), bubble = $('.bubble', w);
    const who = w.dataset.who, other = who === 'A' ? p.nameB : p.nameA;
    const pool = LINES[who];
    w.classList.remove('jump'); void w.offsetWidth; w.classList.add('jump');
    svg.classList.add('love');
    bubble.textContent = pool[Math.floor(Math.random() * pool.length)].replace('{o}', other);
    bubble.classList.add('show');
    clearTimeout(w._t);
    w._t = setTimeout(() => { svg.classList.remove('love'); bubble.classList.remove('show'); w.classList.remove('jump'); }, 1900);
  }));

  $$('[data-mem]', el).forEach(b => b.onclick = () => openMemoryDetail(b.dataset.mem));
}
