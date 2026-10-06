// รองรับ 2 ภาษา: ไทย / English
// ใช้แบบ T('ข้อความไทย', 'English text') ตรงที่แสดงผลเลย อ่านง่าย แก้ง่าย
import { createStore, useStore } from './signal';

export type Lang = 'th' | 'en';

const initial = (): Lang => {
  try { return localStorage.getItem('lang') === 'en' ? 'en' : 'th'; } catch { return 'th'; }
};
const langStore = createStore<Lang>(initial());
document.documentElement.lang = langStore.get();

export const getLang = () => langStore.get();
export const useLang = () => useStore(langStore);
export function setLang(l: Lang) {
  langStore.set(l);
  document.documentElement.lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
}

/** เลือกข้อความตามภาษาปัจจุบัน */
export const T = (th: string, en: string) => (langStore.get() === 'en' ? en : th);
export const isEn = () => langStore.get() === 'en';
