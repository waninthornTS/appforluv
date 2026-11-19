// จานอาหารในห้อง: แตะจาน → เลือกอาหารใส่ไว้ หิวเมื่อไหร่ไดโนเดินมากินเอง (อยู่ได้ครึ่งวันแล้วเน่า ต้องใส่ใหม่)
// เผื่อวันที่ไม่มีเวลาเข้ามาป้อนเอง
import { coll } from '../../lib/store';
import type { Dino } from '../../lib/types';
import { openSheet, toast } from '../../ui/overlays';
import { BOWL_FRESH, BOWL_HUNGRY, bowlBite, bowlFood, bowlMeals, bowlState, HOUR, actions, pantryOf } from './logic';
import { FoodPic } from './rooms';
import { FOODS, taste, type Food } from './species';
import { sfx } from './sfx';


/** จานบนพื้นห้อง */
export function BowlProp({ d, now, onTap, className = '' }: { d: Dino; now: number; onTap: () => void; className?: string }) {
  const st = bowlState(d, now);
  // อาหารพูนในจาน (ไม่ต้องบอกว่าเป็นอะไร) — เน่าแล้วสีหม่นเขียวๆ
  const c = st === 'spoiled' ? { base: '#A3A86B', dark: '#7F8650', lite: '#C2C48E', spot: '#6B7340' } : { base: '#EBA562', dark: '#D4834A', lite: '#F7C891', spot: '' };
  return (
    <button className={`food-bowl no-walk ${st} ${className}`} onPointerDown={e => { e.stopPropagation(); onTap(); }}
      aria-label={st === 'empty' ? 'จานอาหาร (ว่าง) แตะเพื่อใส่อาหาร' : st === 'spoiled' ? 'อาหารในจานเน่าแล้ว แตะเพื่อเปลี่ยน' : 'จานอาหาร'}>
      <svg className="bowl-dish" viewBox="0 0 64 40" aria-hidden="true">
        <ellipse cx="32" cy="37" rx="27" ry="3.5" fill="rgba(110,70,40,.18)" />
        <path d="M4 19h56c0 10-10 18-28 18S4 29 4 19z" fill="#FF9EBB" />
        <path d="M4 19h56c-1 3-3 6-6 8H10c-3-2-5-5-6-8z" fill="#FFB8CD" />
        <ellipse cx="32" cy="19" rx="28" ry="5" fill="#FFD6E3" />
        <ellipse cx="32" cy="19" rx="22" ry="3.2" fill={st === 'empty' ? '#F3C3D2' : '#E8A9BC'} />
        {st !== 'empty' && <g className="bowl-heap">
          <path d="M10 19C10 10 19 4 32 4s22 6 22 15a22 3.2 0 0 1-44 0z" fill={c.base} />
          <path d="M15 12c3-4 9-6.5 17-6.5" fill="none" stroke={c.lite} strokeWidth="2.6" strokeLinecap="round" />
          {[[18, 16, 2.6], [25, 11, 2.4], [33, 9, 2.6], [41, 12, 2.4], [47, 17, 2.4], [29, 16, 2.2], [38, 17, 2.4], [22, 20, 2.2], [43, 21, 2.2], [32, 21, 2.2]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 1 ? c.lite : c.dark} />
          ))}
          {c.spot && [[21, 13], [36, 13], [44, 18], [27, 19]].map(([x, y], i) => <circle key={`s${i}`} cx={x} cy={y} r="1.6" fill={c.spot} />)}
        </g>}
        <path d="M4 19a28 5 0 0 0 56 0h-6a22 3.2 0 0 1-44 0z" fill="#FFD6E3" />
        <circle cx="20" cy="29" r="1.8" fill="#fff" opacity=".8" /><circle cx="32" cy="31" r="1.8" fill="#fff" opacity=".8" /><circle cx="44" cy="29" r="1.8" fill="#fff" opacity=".8" />
      </svg>
      {st === 'spoiled' && <><span className="stink-lines bowl-stink"><i /><i /><i /></span><span className="bowl-fly">🪰</span></>}
      {st === 'empty' && <span className="bowl-plus">+</span>}
      {st === 'spoiled' && <span className="bowl-tag bad">เน่าแล้ว</span>}
    </button>
  );
}

/** แตะจาน → ชีตเลือกอาหาร */
export function openBowlSheet(d: Dino, onFilled?: (r: Dino) => void) {
  sfx.click();
  openSheet({ title: 'จานอาหาร 🥣', render: close => <BowlSheet id={d.id} d={d} close={close} onFilled={onFilled} /> });
}

function BowlSheet({ id, d, close, onFilled }: { id: string; d: Dino; close: () => void; onFilled?: (r: Dino) => void }) {
  const now = Date.now();
  const st = bowlState(d, now);
  const cur = bowlFood(d);
  const pantry = pantryOf(d);

  const save = async (fn: (x: Dino, t: number) => Dino | string) => {
    const x = await coll.get('dino', id);
    if (!x) return null;
    const r = fn(x, Date.now());
    if (typeof r === 'string') { toast(r); return null; }
    await coll.save('dino', r);
    return r;
  };
  const fill = async (f: Food) => {
    const r = await save((x, t) => actions.fillBowl(x, t, f));
    if (!r) return;
    sfx.pop();
    close();
    toast(`ใส่${f.name}ในจานแล้ว หิวเมื่อไหร่จะมากินเองน้า (อยู่ได้ ${BOWL_FRESH / HOUR} ชม.) 🥣`);
    onFilled?.(r);
  };
  const dump = async () => {
    if (!(await save(actions.emptyBowl))) return;
    sfx.sweep();
    close();
    toast('เทอาหารในจานทิ้งแล้ว');
  };

  return (
    <div className="bowl-sheet">
      <div className={`bowl-now ${st}`}>
        {st === 'empty' && <><b>จานว่างอยู่</b><span>ใส่อาหารไว้ หิวเมื่อไหร่ไดโนจะเดินมากินเอง อยู่ได้ครึ่งวัน ({BOWL_FRESH / HOUR} ชม.) แล้วจะเน่า ต้องใส่ใหม่</span></>}
        {st === 'fresh' && cur && <><b>มี{cur.name}อยู่ในจาน</b><span>หิวเมื่อไหร่จะมากินเอง · กินไปแล้ว {bowlMeals(d, now)} รอบ</span></>}
        {st === 'spoiled' && cur && <><b>{cur.name}ในจานเน่าแล้ว 🤢</b><span>ไดโนไม่กินแล้ว เลือกอาหารใหม่ใส่แทนได้เลย</span></>}
      </div>
      <p className="small muted bowl-hint">หิวถึง {BOWL_HUNGRY}% จะเดินมากินเอง (ตอนหลับไม่กิน) · ใส่ใหม่จะใช้อาหาร 1 ชิ้นจากคลัง{st === 'fresh' ? ' ของเดิมในจานจะถูกทิ้ง' : ''}</p>
      <div className="food-grid bowl-grid">
        {FOODS.map(f => {
          const n = pantry[f.id] || 0, tt = taste(d.species, f);
          return (
            <button key={f.id} className={`food-card ${tt === 1 ? 'fav' : tt === -1 ? 'meh' : ''} ${n ? '' : 'empty'}`} disabled={!n} onClick={() => fill(f)}>
              <span className="count">×{n}</span>
              {tt === 1 && <span className="badge">ชอบ 💖</span>}
              {tt === -1 && <span className="badge meh">ไม่ค่อยชอบ</span>}
              <span className="fe"><FoodPic f={f} /></span>
              <span className="fn">{f.name}</span>
              <span className="fg">🍖+{bowlBite(d, f)} ต่อรอบ</span>
            </button>
          );
        })}
      </div>
      {Object.values(pantry).every(n => !n) && <p className="small muted bowl-hint">อาหารในคลังหมดแล้ว กด "เล่นด้วย" ไปยิงไข่หาอาหารกันน้า 🥚</p>}
      {st !== 'empty' && <button className="btn btn-ghost btn-block" onClick={dump} style={{ marginTop: 10 }}>เทอาหารในจานทิ้ง</button>}
    </div>
  );
}
