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

export interface PhotoRec { id: string; blob: Blob; createdAt: number }

export interface Collections {
  memories: Memory;
  events: CalEvent;
  trips: Trip;
  about: AboutItem;
}
export type CollectionName = keyof Collections;

export type Color = 'pink' | 'blue' | 'yellow' | 'mint' | 'lav' | 'red';
