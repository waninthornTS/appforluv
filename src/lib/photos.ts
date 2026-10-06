// รูปภาพ: ย่อขนาดก่อนเก็บ (ประหยัดพื้นที่ iPhone) แล้วเก็บใน IndexedDB
// ⚠️ เก็บเป็น ArrayBuffer ไม่ใช่ Blob — Safari บน iPhone มีบั๊กเก็บ Blob ใน IndexedDB
//    (บันทึกไม่ได้ / เปิดแอปใหม่แล้วรูปเสีย) ArrayBuffer ใช้ได้เสถียรทุกเครื่อง
import { useEffect, useState } from 'react';
import { db, uid } from './db';
import { useDataVersion } from './signal';
import { downloadPhoto, queuePhoto, queuePhotoDelete } from './sync';
import type { PhotoRec } from './types';

const MAX_SIDE = 1400;
const QUALITY = 0.82;
const urlCache = new Map<string, string>();

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านรูปไม่ได้')); };
    img.src = url;
  });
}

export async function compressImage(file: Blob, max = MAX_SIDE): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error('แปลงรูปไม่ได้'))), 'image/jpeg', QUALITY));
}

/** เก็บรูปลงเครื่องเป็น ArrayBuffer */
export async function storePhoto(id: string, blob: Blob, createdAt = Date.now()) {
  const data = await blob.arrayBuffer();
  await db.put('photos', { id, data, type: blob.type || 'image/jpeg', createdAt } satisfies PhotoRec);
}

/** อ่านรูปจากเครื่อง (รองรับข้อมูลแบบเก่าที่เก็บเป็น Blob ด้วย และแปลงให้อัตโนมัติ) */
export async function getPhotoBlob(id: string): Promise<Blob | null> {
  const rec = await db.get<PhotoRec>('photos', id);
  if (!rec) return null;
  if (rec.data) return new Blob([rec.data], { type: rec.type || 'image/jpeg' });
  if (rec.blob) {
    try {
      const data = await rec.blob.arrayBuffer();
      await db.put('photos', { id, data, type: rec.blob.type || 'image/jpeg', createdAt: rec.createdAt } satisfies PhotoRec);
      return new Blob([data], { type: rec.blob.type || 'image/jpeg' });
    } catch {
      return null; // รูปเก่าในเครื่องเสีย → ให้ไปโหลดจากออนไลน์แทน
    }
  }
  return null;
}

export async function savePhoto(file: File): Promise<string> {
  let blob: Blob;
  try {
    blob = await compressImage(file);
  } catch (e) {
    // ย่อรูปไม่ได้ (เช่น ไฟล์แปลกๆ) → ใช้ไฟล์เดิมถ้าเป็นรูปที่เบราว์เซอร์แสดงได้
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.type) && file.size < 15 * 1024 * 1024) blob = file;
    else throw e;
  }
  const id = uid();
  await storePhoto(id, blob);
  queuePhoto(id);
  return id;
}

export async function photoURL(id: string): Promise<string> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const blob = (await getPhotoBlob(id)) ?? (await downloadPhoto(id)); // ยังไม่มีในเครื่อง → โหลดจากออนไลน์
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

/** รูปแสดงไม่ขึ้น → ทิ้งของในเครื่อง แล้วโหลดใหม่จากออนไลน์ (ครั้งเดียวต่อรูป กันวนซ้ำ) */
const repaired = new Set<string>();
export async function repairPhoto(id: string): Promise<string> {
  if (repaired.has(id)) return '';
  repaired.add(id);
  const u = urlCache.get(id);
  if (u) { URL.revokeObjectURL(u); urlCache.delete(id); }
  const blob = await downloadPhoto(id);
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export async function deletePhotos(ids: string[] = []) {
  for (const id of ids) {
    await db.del('photos', id);
    queuePhotoDelete(id);
    const u = urlCache.get(id);
    if (u) { URL.revokeObjectURL(u); urlCache.delete(id); }
  }
}

export function usePhotoURL(id?: string) {
  const v = useDataVersion(); // ถ้ารูปยังโหลดไม่ได้ จะลองใหม่เมื่อข้อมูลซิงก์เข้ามา
  const [url, setUrl] = useState(() => (id && urlCache.get(id)) || '');
  useEffect(() => {
    let alive = true;
    if (id) photoURL(id).then(u => { if (alive) setUrl(u); }).catch(() => {});
    else setUrl('');
    return () => { alive = false; };
  }, [id, url ? 0 : v]);
  // เรียกเมื่อ <img> แสดงไม่ขึ้น
  const repair = () => { if (id) repairPhoto(id).then(u => { if (u) setUrl(u); }).catch(() => {}); };
  return { url, repair };
}
