import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/mali/thai-400.css';
import '@fontsource/mali/thai-600.css';
import '@fontsource/mali/thai-700.css';
import '@fontsource/mali/latin-400.css';
import '@fontsource/mali/latin-600.css';
import '@fontsource/mali/latin-700.css';
import './styles/app.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ใช้งานออฟไลน์ได้ + อัปเดตเวอร์ชันใหม่อัตโนมัติ (เจอเวอร์ชันใหม่ แอปรีโหลดเอง)
// แอปบนหน้าจอโฮมที่สลับกลับมาจากพื้นหลังจะไม่โหลดใหม่ เลยต้องเช็กเองตอนกลับมาที่แอป + ทุก 30 นาที
// เช็กเฉพาะตอนว่าง (ไม่ได้พิมพ์ค้าง/เปิดชีต/เล่นเกมวิ่ง/อ่านจดหมาย) ของที่ทำค้างจะได้ไม่หายตอนรีโหลด
const busy = () =>
  !!document.querySelector('.sheet-wrap, .an-show, .runner.go:not(.dead)') ||
  /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (!busy()) reg.update().catch(() => {}); };
    setInterval(check, 30 * 60_000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  },
});
// ขอให้เบราว์เซอร์เก็บข้อมูลแบบถาวร (ลดโอกาสโดนล้าง)
navigator.storage?.persist?.().catch(() => {});
