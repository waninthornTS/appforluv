-- =========================================================
-- Ploy & Dream — ฐานข้อมูลออนไลน์ (Supabase)
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- =========================================================

-- ตารางเดียวเก็บทุกอย่าง (ไดอารี่ นัด ทริป ชอบ/ไม่ชอบ) เป็น JSON
create table if not exists public.items (
  id          text primary key,
  coll        text not null check (coll in ('memories', 'events', 'trips', 'about')),
  data        jsonb not null default '{}'::jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists items_updated_at_idx on public.items (updated_at);

-- เวลาที่แก้ไขล่าสุดใช้เวลาของเซิร์ฟเวอร์เสมอ (ใช้สำหรับซิงก์)
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists items_touch on public.items;
create trigger items_touch before insert or update on public.items
  for each row execute function public.touch_updated_at();

-- แอปอ่าน/เขียนได้เลย ไม่ต้องเข้าสู่ระบบ
alter table public.items enable row level security;
drop policy if exists "app can read" on public.items;
drop policy if exists "app can insert" on public.items;
drop policy if exists "app can update" on public.items;
create policy "app can read"   on public.items for select to anon, authenticated using (true);
create policy "app can insert" on public.items for insert to anon, authenticated with check (true);
create policy "app can update" on public.items for update to anon, authenticated using (true) with check (true);

-- ส่งการเปลี่ยนแปลงแบบเรียลไทม์ไปอีกเครื่อง
do $$ begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null; end $$;

-- ที่เก็บรูป (ส่วนตัว ไม่เปิดสาธารณะ)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "app read photos" on storage.objects;
drop policy if exists "app upload photos" on storage.objects;
drop policy if exists "app update photos" on storage.objects;
drop policy if exists "app delete photos" on storage.objects;
create policy "app read photos"   on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
create policy "app upload photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "app update photos" on storage.objects for update to anon, authenticated using (bucket_id = 'photos');
create policy "app delete photos" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');
