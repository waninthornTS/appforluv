// ชีตของเกมไดโน: ตั้งชื่อ, สมุดไดโน, รายละเอียดสายพันธุ์
import { useState } from 'react';
import { fmtDate, toStr } from '../../lib/date';
import { coll } from '../../lib/store';
import type { Dino, DinoSpecies } from '../../lib/types';
import { openSheet } from '../../ui/overlays';
import { view } from './logic';
import { COMMON, RARE, SPECIES, STAGE_EMOJI, STAGE_NAME, type Stage } from './species';
import { DinoSprite } from './Sprite';

export const DEFAULT_NAME = 'ไดโนจิ๋ว';
export const nameOf = (d: Dino) => d.name?.trim() || DEFAULT_NAME;

export function openNameSheet(d: Dino) {
  openSheet({ title: 'ตั้งชื่อไดโน', render: close => <NameForm d={d} close={close} /> });
}
function NameForm({ d, close }: { d: Dino; close: () => void }) {
  const [name, setName] = useState(d.name || '');
  const save = async () => {
    const cur = (await coll.get('dino', d.id)) || d; // ใช้ข้อมูลล่าสุด ไม่ทับค่าที่อีกเครื่องเพิ่งอัปเดต
    await coll.save('dino', { ...cur, name: name.trim() });
    close();
  };
  return (
    <form className="dino-name-form" onSubmit={e => { e.preventDefault(); save(); }}>
      <div className="dino-name-pic"><DinoSprite species={d.species} stage={d.status === 'egg' ? 'egg' : 'baby'} size={110} /></div>
      <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={DEFAULT_NAME} maxLength={20} autoFocus />
      <button className="btn btn-primary btn-block" type="submit">บันทึก</button>
    </form>
  );
}

const STAGES: Stage[] = ['egg', 'baby', 'teen', 'adult'];
const STAGE_DAYS: Record<Stage, string> = { egg: 'ฟักด้วยกัน', baby: 'วันที่ 1–3', teen: 'วันที่ 4–9', adult: 'วันที่ 10–14' };
const seenSpecies = (all: Dino[]) => new Set(all.filter(d => d.status !== 'egg').map(d => d.species));
const ended = (all: Dino[]) => all.filter(d => d.status === 'grown' || d.status === 'star').sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));

export function openBook(all: Dino[]) {
  openSheet({ title: 'สมุดไดโน 📖', render: () => <Book all={all} /> });
}
function Book({ all }: { all: Dino[] }) {
  const seen = seenSpecies(all);
  const past = ended(all);
  const card = (s: DinoSpecies) => {
    const has = seen.has(s);
    return (
      <button key={s} className={`dino-card ${SPECIES[s].rare ? 'rare' : ''} ${has ? '' : 'locked'}`} onClick={() => openSpecies(s, all)}>
        <div className="pic"><DinoSprite species={s} stage="adult" size={58} /></div>
        <div className="n">{has ? SPECIES[s].name : '???'}</div>
      </button>
    );
  };
  return (
    <div className="dino-book">
      <div className="dino-prog">🦕 สะสมแล้ว {seen.size}/{COMMON.length + RARE.length}
        <div className="track"><div className="fill" style={{ width: `${(seen.size / (COMMON.length + RARE.length)) * 100}%` }} /></div>
      </div>
      <h4>🌿 ธรรมดา</h4>
      <div className="dino-grid">{COMMON.map(card)}</div>
      <h4>✨ หายาก</h4>
      <div className="dino-grid">{RARE.map(card)}</div>
      <h4>📜 ประวัติการเลี้ยง</h4>
      {past.length ? <div className="list">{past.map(d => <HistoryRow key={d.id} d={d} />)}</div>
        : <p className="small muted center">ยังไม่มี เลี้ยงตัวแรกให้โตก่อนน้า</p>}
    </div>
  );
}

function HistoryRow({ d }: { d: Dino }) {
  const v = view(d, Date.now());
  return (
    <div className="card dino-hist">
      <DinoSprite species={d.species} stage={v.stage} size={46} className={d.status === 'star' ? 'is-star' : ''} />
      <div className="grow">
        <div className="t ellipsis">{nameOf(d)} {d.status === 'grown' ? '👑' : '⭐'}</div>
        <div className="s">{SPECIES[d.species].name} · เลี้ยงด้วยกัน {v.day} วัน{d.endedAt ? ` · ${fmtDate(toStr(new Date(d.endedAt)))}` : ''}</div>
      </div>
    </div>
  );
}

function openSpecies(s: DinoSpecies, all: Dino[]) {
  const info = SPECIES[s];
  const has = seenSpecies(all).has(s);
  const mine = ended(all).filter(d => d.species === s);
  openSheet({
    title: has ? info.name : '???',
    render: () => (
      <div className="dino-species">
        <div className={`hero ${info.rare ? 'rare' : ''} ${has ? '' : 'locked'}`}>
          <span className="hero-tag">{info.rare ? '✨ หายาก' : '🌿 ธรรมดา'}</span>
          <DinoSprite species={s} stage="adult" size={150} />
        </div>
        <div className={`steps ${has ? '' : 'locked'}`}>
          {STAGES.map(st => (
            <div key={st} className="step">
              <div className="pic"><DinoSprite species={s} stage={st} size={66} /></div>
              <b>{STAGE_EMOJI[st]} {st === 'adult' ? 'โตแล้ว' : STAGE_NAME[st]}</b>
              <span>{STAGE_DAYS[st]}</span>
            </div>
          ))}
        </div>
        <div className="how"><span>{info.rare ? '🗝️' : '🎲'}</span><div><b>วิธีได้:</b> {info.how}</div></div>
        {mine.length > 0 && <div className="list" style={{ marginTop: 12 }}>{mine.map(d => <HistoryRow key={d.id} d={d} />)}</div>}
      </div>
    ),
  });
}
