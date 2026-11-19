// ธีมของทั้งแอป — 'xmas' = ธีมคริสต์มาส (หิมะตก ไฟประดับ สีแดง-เขียว-ทอง ต้นคริสต์มาสในห้องไดโน)
// เปลี่ยนเป็น 'default' เพื่อกลับไปเป็นธีมพาสเทลชมพูแบบเดิม
export type Theme = 'default' | 'xmas';
export const THEME = 'xmas' as Theme;
export const isXmas = THEME === 'xmas';

/** ใส่ data-theme ที่ <html> ให้ CSS เปลี่ยนสีตามธีม */
export function applyTheme() {
  document.documentElement.dataset.theme = THEME;
}
