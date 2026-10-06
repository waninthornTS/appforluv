-- =========================================================
-- Ploy & Dream — เปิดให้แอปซิงก์ได้โดยไม่ต้องเข้าสู่ระบบ
-- ใช้หลังจากรัน schema.sql แล้ว
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- =========================================================

-- ข้อมูล (ไดอารี่ นัด ทริป ชอบ/ไม่ชอบ)
drop policy if exists "members can read" on public.items;
drop policy if exists "members can insert" on public.items;
drop policy if exists "members can update" on public.items;
drop policy if exists "app can read" on public.items;
drop policy if exists "app can insert" on public.items;
drop policy if exists "app can update" on public.items;
create policy "app can read"   on public.items for select to anon, authenticated using (true);
create policy "app can insert" on public.items for insert to anon, authenticated with check (true);
create policy "app can update" on public.items for update to anon, authenticated using (true) with check (true);

-- ไม่มีการล็อกอินแล้ว จึงไม่ต้องเก็บว่าใครแก้
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- รูปภาพ
drop policy if exists "members read photos" on storage.objects;
drop policy if exists "members upload photos" on storage.objects;
drop policy if exists "members update photos" on storage.objects;
drop policy if exists "members delete photos" on storage.objects;
drop policy if exists "app read photos" on storage.objects;
drop policy if exists "app upload photos" on storage.objects;
drop policy if exists "app update photos" on storage.objects;
drop policy if exists "app delete photos" on storage.objects;
create policy "app read photos"   on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
create policy "app upload photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "app update photos" on storage.objects for update to anon, authenticated using (bucket_id = 'photos');
create policy "app delete photos" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');
