// ชนิดข้อมูลทั้งหมดของแอป
export type Who = 'A' | 'B'; // A = Ploy, B = Dream

export interface Base {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export type MemoryCat = 'movie' | 'food' | 'date' | 'other';
export interface Memory extends Base {
  cat: MemoryCat;
  title: string;
  date: string; // YYYY-MM-DD
  place?: string;
  picker?: '' | Who | 'both';
  rating?: number; // 0..5
  note?: string;
  photos: string[];
}

export type EventType = 'date' | 'special' | 'other';
export interface CalEvent extends Base {
  type: EventType;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  place?: string;
  note?: string;
}

export type TripScope = 'domestic' | 'international';
export type TripStatus = 'wish' | 'planned' | 'done';
export interface CheckItem { id: string; text: string; done: boolean }
export interface Trip extends Base {
  scope: TripScope;
  status: TripStatus;
  place: string;
  province?: string;
  country?: string;
  countryOther?: string;
  startDate?: string;
  endDate?: string;
  budget?: number | '';
  note?: string;
  photos: string[];
  checklist?: CheckItem[]; // เลิกใช้แล้ว (เก็บไว้ให้ข้อมูลเก่าอ่านได้)
}

export type AboutCat = 'likeDo' | 'dislikeDo' | 'likeEat' | 'dislikeEat';
export interface AboutItem extends Base {
  who: Who;
  cat: AboutCat;
  text: string;
}

/** รูปในเครื่อง: data (ArrayBuffer) คือรูปแบบใหม่, blob คือรูปแบบเก่า */
export interface PhotoRec { id: string; data?: ArrayBuffer; type?: string; blob?: Blob; createdAt: number }

// ---------- เลี้ยงไดโน (เลี้ยงด้วยกันตัวเดียว ซิงก์สองเครื่อง) ----------
export type DinoSpecies = 'trex' | 'styra' | 'pachy' | 'galli' | 'diplo' | 'elas' | 'ptero' | 'flame' | 'galaxy' | 'phoenix' | 'crystal' | 'lava';
/** ค่าพลัง ณ เวลา at (0..100) แล้วค่อยๆ ลดลงตามเวลาจริง */
export interface Meter { v: number; at: number }
export interface Dino extends Base {
  species: DinoSpecies;
  name?: string;
  status: 'egg' | 'alive' | 'grown' | 'star'; // star = จากไปเป็นดาวแล้ว
  warm: { A: number; B: number }; // (แบบเก่า) อุ่นไข่แยกคน — ตอนนี้นับรวมด้วย taps
  taps?: number; // แตะไข่ไปแล้วกี่ครั้ง (รวมทั้งสองคน)
  hatchedAt?: number;
  endedAt?: number; // เวลาที่โตครบ หรือกลายเป็นดาว
  food: Meter;
  fun: Meter;
  bath: Meter;
  energy: Meter;
  poops: number[]; // เวลาที่อึจะโผล่ (ms)
  sleep?: { since: number; until?: number } | null; // until = ตื่นเองตอนพลังงานเต็ม (ไม่มี = กติกาเก่า)
  sickSince?: number | null;
  curedAt?: number;
  everSick?: boolean;
  bathDays: string[]; // YYYY-MM-DD ที่ได้อาบน้ำ
  workoutDays: string[]; // YYYY-MM-DD ที่ได้ออกกำลัง
  pantry?: Record<string, number>; // คลังอาหาร (ได้จากมินิเกมวิ่ง) — ไม่มี = ของเริ่มต้น
  games?: { A?: GameStat; B?: GameStat }; // สถิติมินิเกมของแต่ละคน
}
export interface GameStat { plays: number; best: number; total: number; food: number }

/** เพลงบนกระดานเพลง (หน้าแรก) — ลิงก์จาก Spotify, เลือกละ 1 รายการ สองเครื่องเห็นเหมือนกัน */
export type SpotifyKind = 'track' | 'album' | 'playlist' | 'episode' | 'show';
export interface SongPick extends Base {
  kind: SpotifyKind;
  sid: string; // id ของ Spotify
  who: Who;
  title?: string;
  artist?: string;
  cover?: string;
}
/** การเชื่อม Spotify (ใช้ค้นหาเพลงอย่างเดียว ไม่ขอสิทธิ์อะไรในบัญชี) — มีรายการเดียว id = 'spotify' ใช้ร่วมกันทั้งสองเครื่อง */
export interface SpotifyAuth extends Base {
  access: string;
  expiresAt: number;
  refresh: string;
}

/** จดหมายในตู้จดหมาย (หน้าแรก) — ล็อกไว้จนถึงวันเปิดอ่าน, ส่งแล้วแก้ไม่ได้ (ลบได้) */
export interface LetterDoc extends Base {
  from: Who;
  openDate: string; // YYYY-MM-DD เปิดอ่านได้ตั้งแต่วันนี้
  message: string;
  photos: string[];
}

export interface Collections {
  memories: Memory;
  events: CalEvent;
  trips: Trip;
  about: AboutItem;
  dino: Dino;
  songs: SongPick;
  spotify: SpotifyAuth;
  letters: LetterDoc;
}
export type CollectionName = keyof Collections;

export type Color = 'pink' | 'blue' | 'yellow' | 'mint' | 'lav' | 'red';
