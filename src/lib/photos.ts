// รูปภาพ: ย่อขนาดก่อนเก็บ (ประหยัดพื้นที่ iPhone) แล้วเก็บเป็น Blob ใน IndexedDB
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

export async function savePhoto(file: Blob): Promise<string> {
  const blob = await compressImage(file);
  const id = uid();
  await db.put('photos', { id, blob, createdAt: Date.now() } satisfies PhotoRec);
  queuePhoto(id);
  return id;
}

export async function photoURL(id: string): Promise<string> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const rec = await db.get<PhotoRec>('photos', id);
  const blob = rec?.blob ?? await downloadPhoto(id); // ยังไม่มีในเครื่อง → โหลดจากออนไลน์
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
    if (id) photoURL(id).then(u => { if (alive) setUrl(u); });
    else setUrl('');
    return () => { alive = false; };
  }, [id, url ? 0 : v]);
  return url;
}
