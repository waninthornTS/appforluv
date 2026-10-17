// รูปประกอบเรื่องเล่า (เจนจาก Gemini) ใน src/assets/story/<ชื่อ>.webp — ไม่มีรูปก็คืน undefined แล้วใช้ภาพสำรองแทน
const FILES = import.meta.glob('../../assets/story/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const story = (name: string) => Object.entries(FILES).find(([p]) => p.endsWith(`/${name}.webp`))?.[1];
