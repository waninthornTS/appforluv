-- =========================================================
-- เกมเลี้ยงไดโน: อนุญาตให้ตาราง items เก็บข้อมูลไดโน (coll = 'dino')
-- ไม่แตะข้อมูลเดิมเลย แค่เพิ่ม 'dino' เข้าไปในรายการที่อนุญาต
-- รันครั้งเดียว "ก่อน" อัปเวอร์ชันที่มีเกมไดโนขึ้นเว็บ:
--   Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- =========================================================
alter table public.items drop constraint if exists items_coll_check;
alter table public.items add constraint items_coll_check
  check (coll in ('memories', 'events', 'trips', 'about', 'dino'));
