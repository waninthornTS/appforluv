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

// ใช้งานออฟไลน์ได้ + อัปเดตเวอร์ชันใหม่อัตโนมัติ
registerSW({ immediate: true });
// ขอให้เบราว์เซอร์เก็บข้อมูลแบบถาวร (ลดโอกาสโดนล้าง)
navigator.storage?.persist?.().catch(() => {});
