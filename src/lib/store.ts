// ข้อมูลของเรา + collections แบบ reactive (บันทึกแล้วทุกหน้าที่ใช้ข้อมูลนั้นอัปเดตเอง)
import { useEffect, useState } from 'react';
import { db, uid } from './db';
import { notifyChange, useDataVersion } from './signal';
import { queueDelete, queueUpsert } from './sync';
import type { Base, CollectionName, Collections } from './types';

// บันทึกไว้ในโค้ดเลย ไม่ต้องกรอกเอง
export const PROFILE = {
  nameA: 'Ploy', // ใส่แว่น ยืนซ้าย
  nameB: 'Dream', // กอดตุ๊กตาหมี ยืนขวา
  startDate: '2026-08-22', // วันครบรอบ
  birthA: '1997-11-04',
  birthB: '2001-08-18',
} as const;
export const nameOf = (who: 'A' | 'B') => (who === 'A' ? PROFILE.nameA : PROFILE.nameB);

export { notifyChange, useDataVersion };

/** โหลดทั้ง collection และโหลดใหม่อัตโนมัติเมื่อมีการบันทึก (undefined = กำลังโหลด) */
export function useCollection<N extends CollectionName>(name: N): Collections[N][] | undefined {
  const v = useDataVersion();
  const [items, setItems] = useState<Collections[N][]>();
  useEffect(() => {
    let alive = true;
    db.all<Collections[N]>(name).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [name, v]);
  return items;
}

/** โหลดรายการเดียว (null = ไม่พบ / ถูกลบแล้ว, undefined = กำลังโหลด) */
export function useItem<N extends CollectionName>(name: N, id: string): Collections[N] | null | undefined {
  const v = useDataVersion();
  const [item, setItem] = useState<Collections[N] | null>();
  useEffect(() => {
    let alive = true;
    db.get<Collections[N]>(name, id).then(r => { if (alive) setItem(r ?? null); });
    return () => { alive = false; };
  }, [name, id, v]);
  return item;
}

export const coll = {
  get: <N extends CollectionName>(name: N, id: string) => db.get<Collections[N]>(name, id),
  async save<N extends CollectionName>(name: N, item: Omit<Collections[N], keyof Base> & Partial<Base>): Promise<Collections[N]> {
    const now = Date.now();
    const rec = { ...item, id: item.id || uid(), createdAt: item.createdAt || now, updatedAt: now } as Collections[N];
    await db.put(name, rec);
    notifyChange();
    queueUpsert(name, rec);
    return rec;
  },
  async remove(name: CollectionName, id: string) {
    await db.del(name, id);
    notifyChange();
    queueDelete(name, id);
  },
};
