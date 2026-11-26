// ตู้เสื้อผ้าไดโน (ไอคอนไม้แขวนเสื้อในห้อง / แตะตัวในสวน) — เลือกหมวก ชุด รองเท้า แยกชิ้นได้ ใส่แล้วบันทึกทันที สองเครื่องเห็นเหมือนกัน
import { useState } from 'react';
import { coll, useItem } from '../../lib/store';
import type { Dino, DinoOutfit } from '../../lib/types';
import { Seg } from '../../ui/controls';
import { openSheet, toast } from '../../ui/overlays';
import { CAT_NAME, hasDressed, OUTFIT_BY_ID, OUTFITS, OutfitThumb, wornItems, type OutfitCat } from './outfits';
import { nameOf } from './sheets';
import { sfx } from './sfx';
import { SPECIES, STAGE_NAME, type Stage } from './species';
import { DinoSprite, photoKeyOf } from './Sprite';

export function HangerIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 9a3 3 0 1 1 4.6 2.5c-1 .6-1.6 1.3-1.6 2.4v1.1" />
      <path d="M16 15L4.5 22.6c-1 .7-.5 2.4.8 2.4h21.4c1.3 0 1.8-1.7.8-2.4z" />
    </svg>
  );
}

/** ปุ่มไม้แขวนเสื้อในห้อง */
export function WardrobeButton({ d, stage }: { d: Dino; stage: Stage }) {
  return (
    <button className="wardrobe-btn no-walk" onClick={() => { sfx.click(); openWardrobe(d, stage); }} aria-label="แต่งตัวไดโน"><HangerIcon /></button>
  );
}

export function openWardrobe(d: Dino, stage: Stage) {
  openSheet({ title: `แต่งตัว${nameOf(d)} 👗`, render: () => <Wardrobe id={d.id} stage={stage} /> });
}

/** บันทึกชุดกับข้อมูลล่าสุดในเครื่อง (ไม่ทับค่าที่อีกเครื่องเพิ่งซิงก์มา) */
async function saveOutfit(id: string, change: (o: DinoOutfit) => DinoOutfit) {
  const cur = await coll.get('dino', id);
  if (!cur) return;
  const next = change({ ...(cur.outfit || {}) });
  (Object.keys(next) as (keyof DinoOutfit)[]).forEach(k => { if (!next[k]) delete next[k]; });
  await coll.save('dino', { ...cur, outfit: next });
}

const CATS: OutfitCat[] = ['hat', 'body', 'shoes'];
let lastCat: OutfitCat = 'hat';

function Wardrobe({ id, stage }: { id: string; stage: Stage }) {
  const d = useItem('dino', id);
  const [cat, setCatS] = useState<OutfitCat>(lastCat);
  const setCat = (c: OutfitCat) => { lastCat = c; setCatS(c); };
  if (!d) return null;
  const outfit = d.outfit || {};
  const worn = outfit[cat];
  const pick = async (itemId?: string) => {
    sfx.click();
    await saveOutfit(id, o => ({ ...o, [cat]: itemId }));
    if (itemId) toast(`ใส่${OUTFIT_BY_ID[itemId].name}แล้ว ✨`);
  };
  const clearAll = async () => { sfx.click(); await saveOutfit(id, () => ({})); toast('ถอดชุดหมดแล้ว'); };
  const items = OUTFITS.filter(o => o.cat === cat);
  const worn1 = wornItems(outfit)[0];
  // ใส่แล้วแต่ยังไม่มีรูปไดโนพันธุ์นี้/วัยนี้ใส่ชุดนั้น → บอกไว้ (ตัวไดโนจะยังไม่เห็นชุด)
  const missing = worn1 && !hasDressed(photoKeyOf(d.species, stage, ''), worn1);
  return (
    <div className="wardrobe">
      <div className="ward-stage">
        <DinoSprite species={d.species} stage={stage} size={stage === 'adult' ? 190 : stage === 'teen' ? 215 : 250} outfit={outfit} />
      </div>
      {missing && <p className="small muted ward-note">รูป{SPECIES[d.species].name}{STAGE_NAME[stage]}ใส่{OUTFIT_BY_ID[worn1].name}กำลังจะมาเร็วๆ นี้ ✨</p>}
      <Seg<OutfitCat> value={cat} onChange={setCat} options={CATS.map(c => [c, CAT_NAME[c]])} />
      <div className="ward-grid">
        <button className={`ward-item none ${!worn ? 'on' : ''}`} onClick={() => pick(undefined)}><span className="ofit-thumb emo">🚫</span><b>ไม่ใส่</b></button>
        {items.filter(it => !it.soon).map(it => (
          <button key={it.id} className={`ward-item ${worn === it.id ? 'on' : ''}`} onClick={() => pick(worn === it.id ? undefined : it.id)}>
            <OutfitThumb id={it.id} />
            <b>{it.name}</b>
          </button>
        ))}
        {/* ชิ้นใหม่กำลังจะมา — ช่องว่างช่องเดียวต่อท้าย */}
        <div className="ward-item soon-slot" aria-label="Coming soon"><span>Coming soon</span></div>
      </div>
      {worn1 && <button className="btn btn-ghost btn-block" onClick={clearAll}>ถอดทั้งหมด</button>}
    </div>
  );
}

