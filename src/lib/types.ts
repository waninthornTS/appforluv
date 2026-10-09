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
  warm: { A: number; B: number }; // อุ่นไข่ ต้องครบทั้งสองคน
  hatchedAt?: number;
  endedAt?: number; // เวลาที่โตครบ หรือกลายเป็นดาว
  food: Meter;
  fun: Meter;
  bath: Meter;
  energy: Meter;
  poops: number[]; // เวลาที่อึจะโผล่ (ms)
  sleep?: { since: number } | null;
  sickSince?: number | null;
  curedAt?: number;
  everSick?: boolean;
  bathDays: string[]; // YYYY-MM-DD ที่ได้อาบน้ำ
  workoutDays: string[]; // YYYY-MM-DD ที่ได้ออกกำลัง
}

export interface Collections {
  memories: Memory;
  events: CalEvent;
  trips: Trip;
  about: AboutItem;
  dino: Dino;
}
export type CollectionName = keyof Collections;

export type Color = 'pink' | 'blue' | 'yellow' | 'mint' | 'lav' | 'red';
