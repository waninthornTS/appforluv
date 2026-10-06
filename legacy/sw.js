// Service worker: ทำให้แอปเปิดได้แม้ไม่มีเน็ต
// - ไฟล์ของแอป: network-first (ออนไลน์ได้เวอร์ชันล่าสุดเสมอ, ออฟไลน์ใช้ของใน cache)
// - ฟอนต์ Google: cache-first
// เมื่อเพิ่มไฟล์ใหม่ ให้เพิ่มใน ASSETS และเปลี่ยน VERSION
const VERSION = 'v1.3.0';
const CACHE = `olw-${VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/db.js',
  'js/store.js',
  'js/utils.js',
  'js/sky.js',
  'js/photos.js',
  'js/characters.js',
  'js/data/places.js',
  'js/views/home.js',
  'js/views/diary.js',
  'js/views/calendar.js',
  'js/views/travel.js',
  'js/views/me.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('olw-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
