import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { useLang } from './lib/i18n';
import { initSync } from './lib/sync';
import { OverlayHost } from './ui/overlays';
import { SkyBackground, TopBar } from './ui/Sky';
import { TabBar, type Tab, TABS } from './ui/TabBar';

// โหลดแต่ละหน้าเมื่อเปิดเท่านั้น (แอปเปิดเร็วขึ้น)
const pages: Record<Tab, LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import('./features/home/HomePage')),
  diary: lazy(() => import('./features/diary/DiaryPage')),
  calendar: lazy(() => import('./features/calendar/CalendarPage')),
  travel: lazy(() => import('./features/travel/TravelPage')),
  me: lazy(() => import('./features/me/MePage')),
};

const readTab = (): Tab => {
  const h = location.hash.slice(1) as Tab;
  return TABS.includes(h) ? h : 'home';
};

initSync();

export default function App() {
  const lang = useLang(); // เปลี่ยนภาษาแล้ววาดใหม่ทั้งแอป
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
      import('./features/travel/TravelPage'); import('./features/me/MePage');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const Page = pages[tab];
  return (
    <>
      <SkyBackground />
      <TopBar key={`top-${lang}`} />
      <main className="view" key={`${tab}-${lang}`}>
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
          <Page />
        </Suspense>
      </main>
      <TabBar key={`tabs-${lang}`} active={tab} />
      <OverlayHost />
    </>
  );
}
