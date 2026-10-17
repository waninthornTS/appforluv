// ปุ่มรีเฟรชข้างนาฬิกา: ดึงข้อมูลล่าสุด + อัปเดตแอปเป็นเวอร์ชันที่เพิ่งขึ้นเว็บ (ถ้ามี)
import { flush, pull } from './sync';

/** onFound = เจอเวอร์ชันใหม่ (กำลังโหลด แล้วแอปจะรีโหลดเอง) */
export async function refreshApp(onFound?: () => void): Promise<'updating' | 'latest'> {
  // ส่งของที่ค้างในเครื่อง แล้วดึงของใหม่จากอีกเครื่อง
  await Promise.all([flush(), pull()]).catch(() => {});
  const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (!reg) return 'latest';
  await reg.update().catch(() => {});
  const next = reg.installing || reg.waiting;
  if (!next) return 'latest';
  onFound?.();
  // มีเวอร์ชันใหม่: รอโหลดเสร็จแล้วรีโหลดแอป (ปกติแอปรีโหลดเองตอนเวอร์ชันใหม่เข้าควบคุม — ตรงนี้กันพลาด)
  await new Promise<void>(done => {
    if (next.state === 'activated') return done();
    next.addEventListener('statechange', () => { if (next.state === 'activated') done(); });
    setTimeout(done, 30_000);
  });
  location.reload();
  return 'updating';
}
