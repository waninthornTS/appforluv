import type { CSSProperties, ReactElement } from 'react';

export const TABS = ['home', 'diary', 'calendar', 'travel', 'me'] as const;
export type Tab = (typeof TABS)[number];

// สีไอคอนแต่ละแท็บ (แบบแอปใน NookPhone)
const COLORS: Record<Tab, [string, string]> = {
  home: ['#FF9DB8', '#E2738F'], diary: ['#FFC857', '#DDA22A'], calendar: ['#7CC4F0', '#4E9CCB'],
  travel: ['#7DD58A', '#4FAA5C'], me: ['#B79CFF', '#8D6FE0'],
};

const ITEMS: { tab: Tab; label: string; icon: ReactElement }[] = [
  { tab: 'home', label: 'หน้าแรก', icon: <path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" /> },
  { tab: 'diary', label: 'ไดอารี่', icon: <><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z" /><path d="M12 9.4c.9-1.3 3-1 3 .6 0 1.5-3 3.2-3 3.2S9 11.5 9 10c0-1.6 2.1-1.9 3-.6z" /></> },
  { tab: 'calendar', label: 'ปฏิทิน', icon: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></> },
  { tab: 'travel', label: 'เที่ยว', icon: <><rect x="3.5" y="7" width="17" height="13" rx="3" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" /></> },
  { tab: 'me', label: 'เรา', icon: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /> },
];

export function TabBar({ active }: { active: Tab }) {
  return (
    <nav className="tabbar" aria-label="เมนูหลัก">
      {ITEMS.map(it => (
        <a key={it.tab} href={`#${it.tab}`} className={it.tab === active ? 'active' : ''} aria-current={it.tab === active ? 'page' : undefined}>
          <span className="app-ico" style={{ '--c': COLORS[it.tab][0], '--cd': COLORS[it.tab][1] } as CSSProperties}>
            <svg viewBox="0 0 24 24">{it.icon}</svg>
          </span>
          <span>{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

export const Fab = ({ onClick, label = 'เพิ่ม' }: { onClick: () => void; label?: string }) => (
  <button className="fab" onClick={onClick} aria-label={label}>
    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
  </button>
);
