-- =========================================================
-- กระดานเพลง (หน้าแรก): อนุญาตให้ตาราง items เก็บเพลงที่เลือก (coll = 'songs')
-- และการเชื่อม Spotify สำหรับค้นหาเพลง (coll = 'spotify')
-- ไม่แตะข้อมูลเดิมเลย แค่เพิ่ม 'songs', 'spotify' เข้าไปในรายการที่อนุญาต
-- รันครั้งเดียว "ก่อน" อัปเวอร์ชันที่มีกระดานเพลงขึ้นเว็บ:
--   Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- =========================================================
alter table public.items drop constraint if exists items_coll_check;
alter table public.items add constraint items_coll_check
  check (coll in ('memories', 'events', 'trips', 'about', 'dino', 'songs', 'spotify'));
