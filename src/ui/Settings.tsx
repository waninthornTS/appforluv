// เมนูแฮมเบอร์เกอร์มุมซ้ายบน → เมนูสไลด์ออกมาจากทางซ้าย (ตั้งค่า + รีเฟรช/อัปเดตแอป)
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { refreshApp } from '../lib/update';
import { toast } from './overlays';

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M20.5 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="menu-btn" onClick={() => setOpen(true)} aria-label="เมนู">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </button>
      {createPortal(<Drawer open={open} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [open, onClose]);
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    const r = await refreshApp(() => toast('มีเวอร์ชันใหม่ กำลังอัปเดต… ✨'));
    if (r === 'latest') { toast('อัปเดตล่าสุดแล้ว ✨'); setBusy(false); }
  };
  return (
    <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <nav className="drawer-panel" aria-label="เมนู">
        <div className="drawer-head"><h3>ตั้งค่า</h3><button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button></div>
        <button className="set-row" onClick={refresh} disabled={busy}>
          <span className={`ico ${busy ? 'spin' : ''}`}><RefreshIcon /></span>
          <span className="txt"><b>รีเฟรช / อัปเดตแอป</b><small>ดึงข้อมูลล่าสุด และอัปเดตเป็นเวอร์ชันใหม่</small></span>
        </button>
      </nav>
    </div>
  );
}
