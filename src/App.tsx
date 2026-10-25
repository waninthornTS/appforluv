import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { handleSpotifyCallback } from './lib/spotify';
import { initSync } from './lib/sync';
import { OverlayHost, toast } from './ui/overlays';
import { SkyBackground, TopBar } from './ui/Sky';
import { TabBar, type Tab, TABS } from './ui/TabBar';

// โหลดแต่ละหน้าเมื่อเปิดเท่านั้น (แอปเปิดเร็วขึ้น)
type Route = Tab | 'dino';
const pages: Record<Route, LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import('./features/home/HomePage')),
  diary: lazy(() => import('./features/diary/DiaryPage')),
  calendar: lazy(() => import('./features/calendar/CalendarPage')),
  travel: lazy(() => import('./features/travel/TravelPage')),
  me: lazy(() => import('./features/me/MePage')),
  dino: lazy(() => import('./features/dino/DinoPage')), // เปิดจากไอคอนไดโนมุมขวาบนของหน้าแรก
};

const readTab = (): Route => {
  const h = location.hash.slice(1);
  return h === 'dino' || TABS.includes(h as Tab) ? (h as Route) : 'home';
};

initSync();
// กลับมาจากหน้าล็อกอิน Spotify (เชื่อมต่อเพื่อค้นหาเพลง)
handleSpotifyCallback().then(r => {
  if (r === 'ok') toast('เชื่อมต่อ Spotify แล้ว 🎵');
  else if (r === 'fail') toast('เชื่อม Spotify ไม่สำเร็จ ลองใหม่อีกครั้งนะ');
});

export default function App() {
  const [tab, setTab] = useState(readTab);
  useEffect(() => {
    const on = () => setTab(readTab());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [tab]);

  // โหลดหน้าอื่นไว้ล่วงหน้าตอนว่าง เพื่อให้กดสลับแท็บได้ทันที
  useEffect(() => {
    const t = setTimeout(() => {
      import('./features/diary/DiaryPage'); import('./features/calendar/CalendarPage');
      import('./features/travel/TravelPage'); import('./features/me/MePage'); import('./features/dino/DinoPage');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const Page = pages[tab];
  return (
    <>
      <SkyBackground />
      {tab !== 'dino' && <TopBar />}{/* หน้าเลี้ยงไดโนไม่ต้องมีแถบเวลา */}
      <main className="view" key={tab}>
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
          <Page />
        </Suspense>
      </main>
      <TabBar active={tab} />
      <OverlayHost />
    </>
  );
}
