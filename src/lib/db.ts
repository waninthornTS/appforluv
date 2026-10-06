// IndexedDB — ข้อมูลทั้งหมดอยู่ในเครื่อง (รวมรูปเป็น Blob)
// ใช้ชื่อฐานข้อมูลเดียวกับเวอร์ชันก่อน ข้อมูลเดิมจึงย้ายมาได้เลย
// ถ้าอยากเปลี่ยนไปใช้ cloud (Firebase / Supabase) ให้แก้ไฟล์นี้ไฟล์เดียว
const DB_NAME = 'our-little-world';
const DB_VERSION = 2;
export const STORES = ['kv', 'memories', 'events', 'trips', 'photos', 'about'] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: name === 'kv' ? 'key' : 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const db = {
  get: <T>(store: StoreName, key: IDBValidKey) => run<T | undefined>(store, 'readonly', s => s.get(key)),
  all: <T>(store: StoreName) => run<T[]>(store, 'readonly', s => s.getAll()),
  put: (store: StoreName, value: unknown) => run<void>(store, 'readwrite', s => { s.put(value); }),
  del: (store: StoreName, key: IDBValidKey) => run<void>(store, 'readwrite', s => { s.delete(key); }),
  clear: (store: StoreName) => run<void>(store, 'readwrite', s => { s.clear(); }),
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
