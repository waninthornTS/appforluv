// ตัวละคร Ploy / Dream
// ใส่ไฟล์รูปตัวละครแบบ 3D (PNG หรือ WebP พื้นหลังโปร่งใส) ไว้ที่ src/assets/characters/
//   ploy.png  และ  dream.png   → แอปจะใช้รูปนั้นอัตโนมัติ
// ถ้ายังไม่มีไฟล์ จะใช้ตัวละคร SVG ที่วาดไว้แทน
import { useMemo } from 'react';
import { charSVG, type CharKey } from './svg';

const images = import.meta.glob<string>('../assets/characters/*.{png,webp}', { eager: true, query: '?url', import: 'default' });
const imageOf = (key: CharKey) => Object.entries(images).find(([path]) => path.split('/').pop()!.startsWith(`${key}.`))?.[1];

export const hasCharacterImages = () => !!imageOf('ploy') && !!imageOf('dream');

export function Character({ who, className = '' }: { who: CharKey; className?: string }) {
  const img = imageOf(who);
  const svg = useMemo(() => (img ? '' : charSVG(who)), [who, img]);
  if (img) return <img className={`char char-img ${className}`} src={img} alt={who} draggable={false} decoding="async" />;
  return <span className={`char-holder ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export { HEART_SVG } from './svg';
