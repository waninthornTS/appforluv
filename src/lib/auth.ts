// เข้าสู่ระบบแบบง่าย: เลือกว่าเครื่องนี้เป็น Ploy หรือ Dream แล้วจำไว้ในเครื่อง (localStorage) จนกว่าจะกดออกจากระบบ
// ไม่มีรหัสผ่าน — ใช้แยกว่าใครเป็นคนเขียน/ส่ง/เล่น เท่านั้น
import { createStore, useStore } from './signal';
import type { Who } from './types';

const KEY = 'me';
const read = (): Who | null => {
  try { const v = localStorage.getItem(KEY); return v === 'A' || v === 'B' ? v : null; } catch { return null; }
};

const me = createStore<Who | null>(read());

/** คนที่ใช้เครื่องนี้อยู่ (null = ยังไม่ได้เข้าสู่ระบบ) */
export const useMe = () => useStore(me);
/** ใช้ในหน้าที่ต้องเข้าสู่ระบบแล้วเท่านั้น (แอปจะไม่แสดงหน้าอื่นจนกว่าจะเลือก) */
export const useMeSure = (): Who => useStore(me) ?? 'A';
export const getMe = (): Who => me.get() ?? 'A';
export const otherOf = (w: Who): Who => (w === 'A' ? 'B' : 'A');

export function login(w: Who) {
  try { localStorage.setItem(KEY, w); } catch { /* เครื่องไม่ให้เก็บ ก็ใช้ได้จนกว่าจะปิดแอป */ }
  me.set(w);
}
export function logout() {
  try { localStorage.removeItem(KEY); } catch { /* ไม่เป็นไร */ }
  me.set(null);
}
