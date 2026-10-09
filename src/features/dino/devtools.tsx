// เครื่องมือทดสอบ — แสดงเฉพาะตอน npm run dev (ไม่ติดไปกับแอปจริง)
// สลับพันธุ์/วัยของไดโนในเครื่องนี้ เพื่อดูหน้าตาแต่ละพันธุ์ และกดคืนตัวเดิมได้
import { useState } from 'react';
import { coll } from '../../lib/store';
import type { Dino, DinoSpecies } from '../../lib/types';
import { openSheet } from '../../ui/overlays';
import { COMMON, RARE, SPECIES, STAGE_NAME, type Stage } from './species';
import { photo } from './Sprite';

const KEY = 'dino-dev-original';
const DAY = 864e5;
const AGO: Record<Exclude<Stage, 'egg'>, number> = { baby: 0, teen: 4, adult: 10 }; // ฟักมาแล้วกี่วัน → วันที่ 1 / 5 / 11
const POSES: [string, string][] = [['egg', 'ไข่'], ['baby', 'วัยเด็ก'], ['teen', 'วัยรุ่น'], ['adult', 'โต'], ['blink', 'กะพริบตา'],
  ['happy', 'ดีใจ'], ['eat', 'กิน'], ['sleep', 'นอน'], ['sick', 'ป่วย'], ['run', 'เดิน']];

interface Orig { id: string; species: DinoSpecies; hatchedAt?: number }
const readOrig = (): Orig | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

export function openDevSpecies(d: Dino) {
  openSheet({ title: '🧪 ลองพันธุ์อื่น', render: close => <DevSpecies d={d} close={close} /> });
}

function DevSpecies({ d, close }: { d: Dino; close: () => void }) {
  const [sp, setSp] = useState<DinoSpecies>(d.species);
  const orig = readOrig();
  const save = async (patch: Partial<Dino>) => {
    const cur = (await coll.get('dino', d.id)) || d;
    await coll.save('dino', { ...cur, ...patch });
    close();
  };
  const apply = (stage: Exclude<Stage, 'egg'>) => {
    // จำตัวเดิมไว้ครั้งแรกที่สลับ จะได้คืนได้
    if (!orig || orig.id !== d.id) try { localStorage.setItem(KEY, JSON.stringify({ id: d.id, species: d.species, hatchedAt: d.hatchedAt })); } catch { /* ไม่เป็นไร */ }
    return save({ species: sp, hatchedAt: Date.now() - AGO[stage] * DAY });
  };
  const restore = async () => {
    if (!orig) return;
    await save({ species: orig.species, hatchedAt: orig.hatchedAt });
    try { localStorage.removeItem(KEY); } catch { /* ไม่เป็นไร */ }
  };
  return (
    <div className="dev-sp">
      <div className="dev-sp-grid">
        {[...COMMON, ...RARE].map(s => (
          <button key={s} className={`dev-sp-chip ${s === sp ? 'on' : ''} ${SPECIES[s].rare ? 'rare' : ''}`} onClick={() => setSp(s)}>
            <img src={photo(s, 'adult')} alt="" draggable={false} />
            <span>{SPECIES[s].name}</span>
          </button>
        ))}
      </div>
      <h4>{SPECIES[sp].name} {SPECIES[sp].rare ? '✨' : ''}</h4>
      <div className="dev-sp-poses">
        {POSES.map(([k, t]) => (
          <div key={k} className="dev-sp-pose">
            {photo(sp, k) ? <img src={photo(sp, k)} alt="" draggable={false} /> : <i>—</i>}
            <span>{t}</span>
          </div>
        ))}
      </div>
      <p className="small muted center">ใส่ตัวนี้ลงในห้องเพื่อลองเล่นจริง · มีผลเฉพาะในเครื่องนี้</p>
      <div className="dev-sp-btns">
        {(['baby', 'teen', 'adult'] as const).map(st => (
          <button key={st} className="btn btn-primary" onClick={() => apply(st)}>{STAGE_NAME[st]}</button>
        ))}
      </div>
      {orig?.id === d.id && (
        <button className="btn btn-ghost btn-block" onClick={restore}>↩️ คืนตัวเดิม ({SPECIES[orig.species].name})</button>
      )}
    </div>
  );
}
