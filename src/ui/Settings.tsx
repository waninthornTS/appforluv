// เมนูแฮมเบอร์เกอร์มุมซ้ายบน → เมนูสไลด์ออกมาจากทางซ้าย (ตั้งค่า: รีเฟรช/อัปเดตแอป, เชื่อมต่อ Spotify)
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { connectSpotify, disconnectSpotify, spotifyReady, useSpotifyAuth } from '../lib/spotify';
import { refreshApp } from '../lib/update';
import { confirmSheet, toast } from './overlays';

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M7 9.6c3.4-1 7.2-.7 10.2 1M7.6 12.7c2.8-.8 5.9-.5 8.4.9M8.2 15.6c2.2-.6 4.5-.4 6.5.7" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>
);

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
        <SpotifyRow />
      </nav>
    </div>
  );
}

/** เชื่อม Spotify ครั้งเดียว (เครื่องไหนก็ได้) แล้วทั้งสองเครื่องค้นหาเพลงได้ */
function SpotifyRow() {
  const auth = useSpotifyAuth();
  if (!spotifyReady && !import.meta.env.DEV) return null;
  if (auth) {
    const off = async () => {
      if (await confirmSheet({ title: 'ยกเลิกการเชื่อม Spotify?', message: 'ทั้งสองเครื่องจะค้นหาเพลงไม่ได้ จนกว่าจะเชื่อมใหม่', emoji: '🎵', ok: 'ยกเลิกการเชื่อม' })) await disconnectSpotify();
    };
    return (
      <button className="set-row" onClick={off}>
        <span className="ico spotify"><SpotifyIcon /></span>
        <span className="txt"><b>Spotify เชื่อมต่อแล้ว ✓</b><small>ทั้งสองเครื่องค้นหาเพลงได้ · แตะเพื่อยกเลิก</small></span>
      </button>
    );
  }
  return (
    <button className="set-row" onClick={() => (spotifyReady ? connectSpotify() : toast('ยังไม่ได้ใส่ Client ID ของ Spotify ในโค้ด'))}>
      <span className="ico spotify"><SpotifyIcon /></span>
      <span className="txt"><b>เชื่อมต่อ Spotify</b><small>เพื่อค้นหาเพลงใส่กระดานเพลง</small></span>
    </button>
  );
}
