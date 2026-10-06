// IndexedDB wrapper — ข้อมูลทั้งหมดเก็บในเครื่อง (รวมรูปภาพเป็น Blob)
// ถ้าอยากเปลี่ยนไปใช้ cloud (เช่น Firebase / Supabase) ให้แก้แค่ไฟล์นี้กับ store.js
const DB_NAME = 'our-little-world';
const DB_VERSION = 2;
export const STORES = ['kv', 'memories', 'events', 'trips', 'photos', 'about'];

let dbPromise;
function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: name === 'kv' ? 'key' : 'id' });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const db = {
  get: (store, key) => run(store, 'readonly', s => s.get(key)),
  all: (store) => run(store, 'readonly', s => s.getAll()),
  put: (store, value) => run(store, 'readwrite', s => s.put(value)),
  del: (store, key) => run(store, 'readwrite', s => s.delete(key)),
  clear: (store) => run(store, 'readwrite', s => s.clear()),
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
