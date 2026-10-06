// จุดเริ่มแอป: router แบบ hash (#home, #diary, ...) + ลงทะเบียน service worker
import { $, $$, bus } from './utils.js';
import { startSky } from './sky.js';
import * as home from './views/home.js';
import * as diary from './views/diary.js';
import * as calendar from './views/calendar.js';
import * as travel from './views/travel.js';
import * as me from './views/me.js';

const routes = { home, diary, calendar, travel, me };
const view = $('#view');
const fab = $('#fab');
let current = '';

async function route() {
  const name = location.hash.slice(1) in routes ? location.hash.slice(1) : 'home';
  const page = routes[name];
  const same = name === current;
  const scroll = window.scrollY;
  current = name;

  $$('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === name));
  fab.hidden = !page.fab;
  fab.onclick = page.fab || null;

  if (!same) view.style.animation = 'none';
  await page.render(view);
  if (same) window.scrollTo(0, scroll);
  else {
    window.scrollTo(0, 0);
    void view.offsetWidth;
    view.style.animation = '';
  }
}

window.addEventListener('hashchange', route);
bus.addEventListener('refresh', route);
startSky();
route();

// ขอให้เบราว์เซอร์เก็บข้อมูลแบบถาวร (ลดโอกาสโดนล้าง)
navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
