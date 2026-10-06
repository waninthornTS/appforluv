// หน้าต่างลอยทั้งหมดของแอป: bottom sheet, ยืนยัน, toast, ดูรูปเต็มจอ, หัวใจลอย
// เรียกใช้แบบ imperative ได้จากทุกที่ เช่น openSheet({...}), toast('...'), confirmSheet({...})
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { T } from '../lib/i18n';
import { createStore, useStore } from '../lib/signal';
import { usePhotoURL } from '../lib/photos';


// ---------- bottom sheet ----------
interface SheetEntry { id: number; title: string; render: (close: () => void) => ReactNode; onClose?: () => void; closing?: boolean }
const sheets = createStore<SheetEntry[]>([]);
let sheetId = 0;

export function openSheet(opts: { title: string; render: (close: () => void) => ReactNode; onClose?: () => void }) {
  const id = ++sheetId;
  sheets.set([...sheets.get(), { id, ...opts }]);
  return () => closeSheet(id);
}
function closeSheet(id: number) {
  const entry = sheets.get().find(s => s.id === id);
  if (!entry || entry.closing) return;
  sheets.set(sheets.get().map(s => (s.id === id ? { ...s, closing: true } : s)));
  entry.onClose?.();
  setTimeout(() => sheets.set(sheets.get().filter(s => s.id !== id)), 320);
}

function Sheet({ entry }: { entry: SheetEntry }) {
  const [shown, setShown] = useState(false);
  useLayoutEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true))); return () => cancelAnimationFrame(r); }, []);
  const close = () => closeSheet(entry.id);
  return (
    <div className={`sheet-wrap ${shown && !entry.closing ? 'open' : ''}`}>
      <div className="sheet-backdrop" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={entry.title}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>{entry.title}</h3><button className="icon-btn" onClick={close} aria-label={T('ปิด', 'Close')}>✕</button></div>
        <div className="sheet-body">{entry.render(close)}</div>
      </div>
    </div>
  );
}

export function confirmSheet({ title = T('แน่ใจนะ?', 'Are you sure?'), message = '', emoji = '🥺', ok = T('ยืนยัน', 'Confirm'), danger = true }) {
  return new Promise<boolean>(resolve => {
    let answer = false;
    openSheet({
      title,
      onClose: () => resolve(answer),
      render: close => (
        <div className="confirm-box">
          <div className="big">{emoji}</div>
          <p>{message}</p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={close}>{T('ยกเลิก', 'Cancel')}</button>
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { answer = true; close(); }}>{ok}</button>
          </div>
        </div>
      ),
    });
  });
}

// ---------- toast ----------
const toastStore = createStore({ msg: '', n: 0 });
export const toast = (msg: string) => toastStore.set({ msg, n: toastStore.get().n + 1 });

function Toast() {
  const { msg, n } = useStore(toastStore);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!n) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [n]);
  return <div className={`toast ${show ? 'show' : ''}`} role="status" aria-live="polite">{msg}</div>;
}

// ---------- ดูรูปเต็มจอ ----------
const lightbox = createStore<{ ids: string[]; index: number } | null>(null);
export const openLightbox = (ids: string[], index = 0) => lightbox.set({ ids, index });

function LightImg({ id }: { id: string }) {
  const url = usePhotoURL(id);
  return url ? <img src={url} alt="" /> : <div />;
}
function Lightbox() {
  const lb = useStore(lightbox);
  const track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (lb && track.current) track.current.scrollLeft = track.current.clientWidth * lb.index; }, [lb]);
  if (!lb) return null;
  const close = () => lightbox.set(null);
  return (
    <div className="lightbox">
      <div className="track" ref={track} onClick={e => { if (e.target === track.current) close(); }}>
        {lb.ids.map(id => <LightImg key={id} id={id} />)}
      </div>
      <button className="close" onClick={close} aria-label={T('ปิด', 'Close')}>✕</button>
    </div>
  );
}

// ---------- หัวใจลอย ----------
const HEARTS = ['💗', '💖', '💕', '💞', '🩷', '✨'];
export function burstHearts(x: number, y: number, n = 8, pool = HEARTS) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span');
    h.className = 'float-heart';
    h.textContent = pool[Math.floor(Math.random() * pool.length)];
    h.style.left = `${x - 11 + (Math.random() - 0.5) * 30}px`;
    h.style.top = `${y - 11}px`;
    h.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
    h.style.setProperty('--rot', `${(Math.random() - 0.5) * 60}deg`);
    h.style.animationDelay = `${i * 50}ms`;
    h.style.fontSize = `${16 + Math.random() * 14}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1500 + i * 50);
  }
}
export const burstCenter = (n?: number, pool?: string[]) => burstHearts(innerWidth / 2, innerHeight / 2, n, pool);

// ---------- host ----------
export function OverlayHost() {
  const list = useStore(sheets);
  useEffect(() => { document.body.style.overflow = list.length ? 'hidden' : ''; }, [list.length]);
  return (
    <>
      {list.map(e => <Sheet key={e.id} entry={e} />)}
      <Lightbox />
      <Toast />
    </>
  );
}
