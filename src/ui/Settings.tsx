// ปุ่มแฮมเบอร์เกอร์มุมซ้ายบน → ชีตตั้งค่า (มีปุ่มรีเฟรช/อัปเดตแอป)
import { useState } from 'react';
import { useSync } from '../lib/sync';
import { refreshApp } from '../lib/update';
import { openSheet, toast } from './overlays';

declare const __BUILD_TIME__: string; // ใส่ตอน build (vite.config.ts define)

const hhmm = (t: number) => new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const BUILT = new Date(__BUILD_TIME__);
const builtText = `${BUILT.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${hhmm(+BUILT)} น.`;

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M20.5 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MenuButton() {
  return (
    <button className="menu-btn" onClick={() => openSheet({ title: 'ตั้งค่า', render: () => <Settings /> })} aria-label="ตั้งค่า">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
    </button>
  );
}

function Settings() {
  const sync = useSync();
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    const r = await refreshApp(() => toast('มีเวอร์ชันใหม่ กำลังอัปเดต… ✨'));
    if (r === 'latest') { toast('อัปเดตล่าสุดแล้ว ✨'); setBusy(false); }
  };
  return (
    <div className="settings">
      <button className="set-row" onClick={refresh} disabled={busy}>
        <span className={`ico ${busy ? 'spin' : ''}`}><RefreshIcon /></span>
        <span className="txt"><b>รีเฟรช / อัปเดตแอป</b><small>ดึงข้อมูลล่าสุด และอัปเดตเป็นเวอร์ชันใหม่</small></span>
      </button>
      <p className="set-info">เวอร์ชัน {builtText}{sync.lastSync ? ` · ซิงก์ล่าสุด ${hhmm(sync.lastSync)} น.` : ''}</p>
    </div>
  );
}
