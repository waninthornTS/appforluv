-- =========================================================
-- ตู้จดหมาย (หน้าแรก): อนุญาตให้ตาราง items เก็บจดหมาย (coll = 'letters')
-- ไม่แตะข้อมูลเดิมเลย แค่เพิ่ม 'letters' เข้าไปในรายการที่อนุญาต (รวมทุกค่าเดิมไว้ครบ)
-- รันครั้งเดียว "ก่อน" อัปเวอร์ชันที่มีตู้จดหมายขึ้นเว็บ (รันแทน songs.sql ได้เลย ครอบคลุมกว่า):
--   Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- =========================================================
begin;
alter table public.items drop constraint if exists items_coll_check;
alter table public.items add constraint items_coll_check
  check (coll in ('memories', 'events', 'trips', 'about', 'dino', 'songs', 'spotify', 'letters'));
commit;
