// ตั้งค่าการซิงก์ออนไลน์ (Supabase) — ดูวิธีตั้งค่าใน SUPABASE_SETUP.md
// เอาค่าจาก Supabase Dashboard → Project Settings → API
//   url     = Project URL         เช่น https://abcdefgh.supabase.co
//   anonKey = anon / public key   (ห้ามใช้ service_role key)
// ถ้าเว้นว่างไว้ แอปจะเก็บข้อมูลในเครื่องอย่างเดียว (ไม่ซิงก์)
export const CLOUD = {
  url: 'https://hlyrrbfqztgdluopglni.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXJyYmZxenRnZGx1b3BnbG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDcyNjMsImV4cCI6MjEwNjg4MzI2M30.DP82icuKHS685-KtD0n_8qUv75efzjYaRRcZ9C4zqZ4', // ← วาง anon public key (ขึ้นต้นด้วย eyJ...) หรือ publishable key (ขึ้นต้นด้วย sb_publishable_...)
};
