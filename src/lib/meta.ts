// ป้ายชื่อ อีโมจิ และสีของแต่ละหมวด (ป้ายชื่อเปลี่ยนตามภาษาอัตโนมัติ)
import { isEn, T } from './i18n';
import type { AboutCat, Color, EventType, MemoryCat, TripStatus } from './types';

type Meta = { readonly label: string; emoji: string; color: Color };
const m = (th: string, en: string, emoji: string, color: Color) => ({ get label() { return T(th, en); }, emoji, color });

export const MEM_CATS: Record<MemoryCat, Meta> = {
  movie: m('ดูหนัง', 'Movie', '🎬', 'lav'),
  food: m('กินข้าว', 'Food', '🍜', 'yellow'),
  date: m('เดท', 'Date', '🌸', 'pink'),
  other: m('อื่นๆ', 'Other', '💌', 'blue'),
};

export const EVENT_TYPES: Record<EventType, Meta> = {
  date: m('นัดเดท', 'Date', '💕', 'pink'),
  special: m('วันสำคัญ', 'Special', '⭐', 'yellow'),
  other: m('อื่นๆ', 'Other', '📌', 'blue'),
};

export const TRIP_STATUS: Record<TripStatus, Meta> = {
  wish: m('อยากไป', 'Wishlist', '💭', 'lav'),
  planned: m('วางแผนแล้ว', 'Planned', '🗓️', 'blue'),
  done: m('ไปแล้ว', 'Been there', '✅', 'mint'),
};

const a = (th: string, en: string, emoji: string, color: Color, phTh: string, phEn: string) => ({ ...m(th, en, emoji, color), get label() { return T(th, en); }, get ph() { return T(phTh, phEn); } });
export const ABOUT_CATS: Record<AboutCat, Meta & { readonly ph: string }> = {
  likeDo: a('ชอบทำ', 'Loves doing', '💖', 'pink', 'เช่น ดูหนัง, ถ่ายรูป, เดินคาเฟ่', 'e.g. movies, photos, cafés'),
  dislikeDo: a('ไม่ชอบทำ', "Doesn't like doing", '🙅‍♀️', 'lav', 'เช่น ตื่นเช้า, รอคิวนาน', 'e.g. waking up early, long queues'),
  likeEat: a('ชอบกิน', 'Loves eating', '😋', 'mint', 'เช่น ชาบู, ชานมไข่มุก', 'e.g. shabu, bubble tea'),
  dislikeEat: a('ไม่ชอบกิน', "Doesn't like eating", '🤢', 'yellow', 'เช่น ผักชี, ขิง', 'e.g. coriander, ginger'),
};

// คำแนะนำให้แตะเพิ่มได้เร็วๆ ในหน้า "เรา"
const SUGGEST_TH: Record<AboutCat, string[]> = {
  likeDo: ['ดูหนัง', 'เดินคาเฟ่', 'ถ่ายรูป', 'เล่นเกม', 'ไปทะเล', 'ดูซีรีส์', 'ช้อปปิ้ง', 'ทำอาหาร', 'ฟังเพลง', 'นอนกลางวัน', 'เที่ยวต่างประเทศ', 'อ่านหนังสือ'],
  dislikeDo: ['ตื่นเช้า', 'รอคิวนาน', 'ที่คนเยอะ', 'ออกกำลังกาย', 'อากาศร้อน', 'ขับรถไกล', 'ฝนตก', 'ทำงานบ้าน', 'นั่งรถนาน', 'เสียงดัง'],
  likeEat: ['ชาบู', 'หมูกระทะ', 'ชานมไข่มุก', 'ซูชิ', 'ส้มตำ', 'ไอติม', 'เค้ก', 'ราเมง', 'ไก่ทอด', 'พิซซ่า', 'ปิ้งย่าง', 'กาแฟ'],
  dislikeEat: ['ผักชี', 'ขิง', 'มะระ', 'ตับ', 'ต้นหอม', 'เผ็ดมาก', 'นมวัว', 'ทุเรียน', 'ผักบุ้ง', 'อาหารทะเล'],
};
const SUGGEST_EN: Record<AboutCat, string[]> = {
  likeDo: ['Movies', 'Café hopping', 'Taking photos', 'Gaming', 'Beach trips', 'Series', 'Shopping', 'Cooking', 'Music', 'Naps', 'Travelling abroad', 'Reading'],
  dislikeDo: ['Waking up early', 'Long queues', 'Crowds', 'Exercise', 'Hot weather', 'Long drives', 'Rain', 'Housework', 'Long rides', 'Loud places'],
  likeEat: ['Shabu', 'Thai BBQ', 'Bubble tea', 'Sushi', 'Som tam', 'Ice cream', 'Cake', 'Ramen', 'Fried chicken', 'Pizza', 'Yakiniku', 'Coffee'],
  dislikeEat: ['Coriander', 'Ginger', 'Bitter gourd', 'Liver', 'Spring onion', 'Very spicy', 'Cow milk', 'Durian', 'Morning glory', 'Seafood'],
};
export const aboutSuggest = (cat: AboutCat) => (isEn() ? SUGGEST_EN : SUGGEST_TH)[cat];

export const entries = <K extends string, V>(o: Record<K, V>) => Object.entries(o) as [K, V][];
