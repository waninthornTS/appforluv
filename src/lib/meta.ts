// ป้ายชื่อ อีโมจิ และสีของแต่ละหมวด
import type { AboutCat, Color, EventType, MemoryCat, TripStatus } from './types';

type Meta = { label: string; emoji: string; color: Color };

export const MEM_CATS: Record<MemoryCat, Meta> = {
  movie: { label: 'ดูหนัง', emoji: '🎬', color: 'lav' },
  food: { label: 'กินข้าว', emoji: '🍜', color: 'yellow' },
  date: { label: 'เดท', emoji: '🌸', color: 'pink' },
  other: { label: 'อื่นๆ', emoji: '💌', color: 'blue' },
};

export const EVENT_TYPES: Record<EventType, Meta> = {
  date: { label: 'นัดเดท', emoji: '💕', color: 'pink' },
  special: { label: 'วันสำคัญ', emoji: '⭐', color: 'yellow' },
  other: { label: 'อื่นๆ', emoji: '📌', color: 'blue' },
};

export const TRIP_STATUS: Record<TripStatus, Meta> = {
  wish: { label: 'อยากไป', emoji: '💭', color: 'lav' },
  planned: { label: 'วางแผนแล้ว', emoji: '🗓️', color: 'blue' },
  done: { label: 'ไปแล้ว', emoji: '✅', color: 'mint' },
};

export const ABOUT_CATS: Record<AboutCat, Meta & { ph: string }> = {
  likeDo: { label: 'ชอบทำ', emoji: '💖', color: 'pink', ph: 'เช่น ดูหนัง, ถ่ายรูป, เดินคาเฟ่' },
  dislikeDo: { label: 'ไม่ชอบทำ', emoji: '🙅‍♀️', color: 'lav', ph: 'เช่น ตื่นเช้า, รอคิวนาน' },
  likeEat: { label: 'ชอบกิน', emoji: '😋', color: 'mint', ph: 'เช่น ชาบู, ชานมไข่มุก' },
  dislikeEat: { label: 'ไม่ชอบกิน', emoji: '🤢', color: 'yellow', ph: 'เช่น ผักชี, ขิง' },
};

// คำแนะนำให้แตะเพิ่มได้เร็วๆ ในหน้า "เรา"
export const ABOUT_SUGGEST: Record<AboutCat, string[]> = {
  likeDo: ['ดูหนัง', 'เดินคาเฟ่', 'ถ่ายรูป', 'เล่นเกม', 'ไปทะเล', 'ดูซีรีส์', 'ช้อปปิ้ง', 'ทำอาหาร', 'ฟังเพลง', 'นอนกลางวัน', 'เที่ยวต่างประเทศ', 'อ่านหนังสือ'],
  dislikeDo: ['ตื่นเช้า', 'รอคิวนาน', 'ที่คนเยอะ', 'ออกกำลังกาย', 'อากาศร้อน', 'ขับรถไกล', 'ฝนตก', 'ทำงานบ้าน', 'นั่งรถนาน', 'เสียงดัง'],
  likeEat: ['ชาบู', 'หมูกระทะ', 'ชานมไข่มุก', 'ซูชิ', 'ส้มตำ', 'ไอติม', 'เค้ก', 'ราเมง', 'ไก่ทอด', 'พิซซ่า', 'ปิ้งย่าง', 'กาแฟ'],
  dislikeEat: ['ผักชี', 'ขิง', 'มะระ', 'ตับ', 'ต้นหอม', 'เผ็ดมาก', 'นมวัว', 'ทุเรียน', 'ผักบุ้ง', 'อาหารทะเล'],
};

export const entries = <K extends string, V>(o: Record<K, V>) => Object.entries(o) as [K, V][];
