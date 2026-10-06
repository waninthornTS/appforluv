// สัญญาณ "ข้อมูลเปลี่ยนแล้ว" — ทุกหน้าที่ใช้ useCollection/useItem จะโหลดใหม่เอง
import { useSyncExternalStore } from 'react';

let version = 0;
const listeners = new Set<() => void>();
export function notifyChange() {
  version++;
  listeners.forEach(l => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useDataVersion = () => useSyncExternalStore(subscribe, () => version);

/** store เล็กๆ แบบ subscribe ได้ */
export function createStore<T>(initial: T) {
  let state = initial;
  const ls = new Set<() => void>();
  return {
    get: () => state,
    set: (next: T) => { state = next; ls.forEach(l => l()); },
    subscribe: (l: () => void) => { ls.add(l); return () => { ls.delete(l); }; },
  };
}
export const useStore = <T,>(s: ReturnType<typeof createStore<T>>) => useSyncExternalStore(s.subscribe, s.get);
