// ซิงก์ข้อมูลระหว่าง 2 เครื่องผ่าน Supabase
// หลักการ (offline-first):
//  1) ทุกการบันทึกเขียนลงเครื่องก่อนเสมอ (เร็ว ใช้ได้แม้ไม่มีเน็ต) แล้วต่อคิว "outbox"
//  2) มีเน็ตเมื่อไหร่ ส่งคิวขึ้นเซิร์ฟเวอร์ตามลำดับ
//  3) ดึงของใหม่จากเซิร์ฟเวอร์ (pull) + ฟังการเปลี่ยนแปลงแบบเรียลไทม์จากอีกเครื่อง
//  ถ้าแก้รายการเดียวกันพร้อมกัน — อันที่บันทึกทีหลังชนะ
//  ไม่ต้องเข้าสู่ระบบ: เปิดแอปแล้วซิงก์ทันที (สิทธิ์อยู่ใน supabase/no-login.sql)
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { CLOUD } from '../cloud.config';
import { db } from './db';
import { createStore, notifyChange, useStore } from './signal';
import type { CollectionName, PhotoRec } from './types';

export const cloudEnabled = !!(CLOUD.url && CLOUD.anonKey);
const COLLS: CollectionName[] = ['memories', 'events', 'trips', 'about'];

// ---------- สถานะสำหรับแสดงบนหน้าจอ ----------
export interface SyncState {
  mode: 'local' | 'cloud';
  status: 'idle' | 'syncing' | 'offline' | 'error';
  pending: number;
  lastSync?: number;
}
const state = createStore<SyncState>({ mode: cloudEnabled ? 'cloud' : 'local', status: 'idle', pending: 0 });
const patch = (p: Partial<SyncState>) => state.set({ ...state.get(), ...p });
export const useSync = () => useStore(state);

// ---------- คิวรอส่ง (เก็บใน IndexedDB ไม่หายแม้ปิดแอป) ----------
type Op =
  | { kind: 'upsert'; coll: CollectionName; id: string; data: unknown }
  | { kind: 'delete'; coll: CollectionName; id: string }
  | { kind: 'photo'; id: string }
  | { kind: 'photoDel'; id: string };
const opKey = (o: Op) => (o.kind === 'photo' || o.kind === 'photoDel' ? `p:${o.id}` : `i:${o.id}`);

let outbox: Op[] = [];
let outboxLoaded: Promise<void> | undefined;
const loadOutbox = () => (outboxLoaded ??= db.get<{ value: Op[] }>('kv', 'outbox').then(r => { outbox = r?.value || []; patch({ pending: outbox.length }); }));
const saveOutbox = () => { patch({ pending: outbox.length }); return db.put('kv', { key: 'outbox', value: outbox }); };

async function queue(op: Op) {
  if (!cloudEnabled) return;
  await loadOutbox();
  outbox = [...outbox.filter(o => opKey(o) !== opKey(op)), op];
  await saveOutbox();
  scheduleFlush();
}
export const queueUpsert = (coll: CollectionName, item: { id: string }) => queue({ kind: 'upsert', coll, id: item.id, data: item });
export const queueDelete = (coll: CollectionName, id: string) => queue({ kind: 'delete', coll, id });
export const queuePhoto = (id: string) => queue({ kind: 'photo', id });
export const queuePhotoDelete = (id: string) => queue({ kind: 'photoDel', id });

// ---------- Supabase client (โหลดเฉพาะเมื่อเปิดใช้) ----------
let client: SupabaseClient | undefined;
async function sb() {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(CLOUD.url, CLOUD.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
const photoPath = (id: string) => `${id}.jpg`;

// ---------- ส่งคิวขึ้นเซิร์ฟเวอร์ ----------
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushing: Promise<void> | undefined;
function scheduleFlush(delay = 400) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flush(); }, delay);
}

async function runOp(c: SupabaseClient, op: Op) {
  if (op.kind === 'upsert' || op.kind === 'delete') {
    const row = op.kind === 'upsert' ? { id: op.id, coll: op.coll, data: op.data, deleted: false } : { id: op.id, coll: op.coll, data: {}, deleted: true };
    const { error } = await c.from('items').upsert(row);
    if (error) throw error;
  } else if (op.kind === 'photo') {
    const rec = await db.get<PhotoRec>('photos', op.id);
    let body: Blob | undefined;
    if (rec?.data) body = new Blob([rec.data], { type: rec.type || 'image/jpeg' });
    else if (rec?.blob) body = new Blob([await rec.blob.arrayBuffer().catch(() => new ArrayBuffer(0))], { type: 'image/jpeg' });
    if (!body || !body.size) return; // รูปถูกลบหรือเสียไปแล้ว ข้ามได้
    const { error } = await c.storage.from('photos').upload(photoPath(op.id), body, { upsert: true, contentType: 'image/jpeg' });
    if (error) throw error;
  } else {
    const { error } = await c.storage.from('photos').remove([photoPath(op.id)]);
    if (error) throw error;
  }
}

export function flush(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve();
  flushing ??= (async () => {
    await loadOutbox();
    const c = await sb();
    patch({ status: 'syncing' });
    try {
      while (outbox.length) {
        const op = outbox[0];
        await runOp(c, op);
        outbox = outbox.filter(o => o !== op);
        await saveOutbox();
      }
      patch({ status: 'idle', lastSync: Date.now() });
    } catch (e) {
      console.warn('sync: ส่งข้อมูลไม่สำเร็จ จะลองใหม่', e);
      patch({ status: navigator.onLine ? 'error' : 'offline' });
      scheduleFlush(15_000);
    }
  })().finally(() => { flushing = undefined; });
  return flushing;
}

// ---------- ดึงของใหม่จากเซิร์ฟเวอร์ ----------
interface Row { id: string; coll: CollectionName; data: Record<string, unknown>; deleted: boolean; updated_at: string }

async function applyRemote(rows: Row[]) {
  await loadOutbox();
  const pendingIds = new Set(outbox.filter(o => o.kind === 'upsert' || o.kind === 'delete').map(o => o.id));
  let changed = false;
  for (const r of rows) {
    if (!COLLS.includes(r.coll) || pendingIds.has(r.id)) continue; // ของในเครื่องที่ยังไม่ได้ส่ง ใหม่กว่า
    if (r.deleted) await db.del(r.coll, r.id);
    else await db.put(r.coll, { ...r.data, id: r.id });
    changed = true;
  }
  if (changed) notifyChange();
}

let pulling: Promise<void> | undefined;
export function pull(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve();
  pulling ??= (async () => {
    const c = await sb();
    const cursor = (await db.get<{ value: string }>('kv', 'syncCursor'))?.value;
    // ถอยเวลา 5 วินาที กันรายการที่บันทึกพร้อมกันหลุด (ใส่ซ้ำได้ ไม่เป็นไร)
    const since = cursor ? new Date(new Date(cursor).getTime() - 5000).toISOString() : undefined;
    let max = cursor;
    for (let from = 0; ; from += 1000) {
      let q = c.from('items').select('id, coll, data, deleted, updated_at').order('updated_at').range(from, from + 999);
      if (since) q = q.gt('updated_at', since);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data || []) as Row[];
      await applyRemote(rows);
      if (rows.length) max = rows[rows.length - 1].updated_at;
      if (rows.length < 1000) break;
    }
    if (max) await db.put('kv', { key: 'syncCursor', value: max });
    patch({ lastSync: Date.now(), status: outbox.length ? state.get().status : 'idle' });
  })().catch(e => {
    console.warn('sync: ดึงข้อมูลไม่สำเร็จ', e);
    patch({ status: navigator.onLine ? 'error' : 'offline' });
  }).finally(() => { pulling = undefined; });
  return pulling;
}

/** ดาวน์โหลดรูปที่อีกเครื่องอัปไว้ แล้วเก็บไว้ในเครื่อง */
export async function downloadPhoto(id: string): Promise<Blob | null> {
  if (!cloudEnabled) return null;
  const c = await sb();
  const { data, error } = await c.storage.from('photos').download(photoPath(id));
  if (error || !data) return null;
  // เก็บเป็น ArrayBuffer (Safari บน iPhone เก็บ Blob ใน IndexedDB ไม่เสถียร)
  const buf = await data.arrayBuffer();
  await db.put('photos', { id, data: buf, type: 'image/jpeg', createdAt: Date.now() } satisfies PhotoRec);
  return new Blob([buf], { type: 'image/jpeg' });
}

// ---------- ครั้งแรกที่เปิดซิงก์: ส่งข้อมูลเดิมในเครื่องขึ้นออนไลน์ ----------
async function migrateLocalOnce() {
  if ((await db.get<{ value: boolean }>('kv', 'cloudMigrated'))?.value) return;
  for (const coll of COLLS) {
    for (const item of await db.all<{ id: string }>(coll)) await queueUpsert(coll, item);
  }
  for (const p of await db.all<PhotoRec>('photos')) await queuePhoto(p.id);
  await db.put('kv', { key: 'cloudMigrated', value: true });
}

// ---------- เริ่มซิงก์ ----------
let channel: RealtimeChannel | undefined;

export async function initSync() {
  if (!cloudEnabled || channel) return;
  const c = await sb();
  await migrateLocalOnce();
  channel = c.channel('items-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
      if (payload.new && 'id' in payload.new) applyRemote([payload.new as Row]);
    })
    .subscribe(status => { if (status === 'SUBSCRIBED') pull(); });

  addEventListener('online', () => { patch({ status: 'idle' }); flush(); pull(); });
  addEventListener('offline', () => patch({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { flush(); pull(); } });
  // กันพลาด: ดึงของใหม่ทุก 1 นาทีตอนเปิดแอปอยู่ (เผื่อการเชื่อมต่อเรียลไทม์หลุด)
  setInterval(() => { if (!document.hidden) { flush(); pull(); } }, 60_000);

  await flush();
  await pull();
}
