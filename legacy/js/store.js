// ชั้นข้อมูลระดับสูง: โปรไฟล์คู่รัก, collections
import { db, uid } from './db.js';
import { PLOY, DREAM } from './characters.js';

// ข้อมูลของเรา (บันทึกไว้ในโค้ดเลย ไม่ต้องกรอกเอง)
// A = Ploy (ใส่แว่น) อยู่ซ้าย, B = Dream (กอดตุ๊กตาหมี) อยู่ขวา
export const PROFILE = {
  nameA: 'Ploy',
  nameB: 'Dream',
  startDate: '2026-08-22', // วันครบรอบ
  birthA: '1997-11-04',    // วันเกิด Ploy
  birthB: '2001-08-18',    // วันเกิด Dream
};

export async function getProfile() {
  return { ...PROFILE, charA: PLOY, charB: DREAM };
}

export async function getKV(key, fallback) {
  const rec = await db.get('kv', key);
  return rec ? rec.value : fallback;
}
export const setKV = (key, value) => db.put('kv', { key, value, updatedAt: Date.now() });

export const coll = {
  all: (name) => db.all(name),
  get: (name, id) => db.get(name, id),
  async save(name, item) {
    item.id ||= uid();
    item.createdAt ||= Date.now();
    item.updatedAt = Date.now();
    await db.put(name, item);
    return item;
  },
  remove: (name, id) => db.del(name, id),
};
