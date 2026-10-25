// เกมเลี้ยงไดโน — เลี้ยงด้วยกันทีละตัว ซิงก์สองเครื่อง · โตครบแล้วย้ายไปวิ่งเล่นในสวนไดโน
import { useEffect, useRef, useState } from 'react';
import { createStore, useStore } from '../../lib/signal';
import { useNow } from '../../lib/sky';
import { coll, useCollection } from '../../lib/store';
import type { Dino } from '../../lib/types';
import { burstCenter, burstHearts, confirmSheet, toast } from '../../ui/overlays';
import { actions, activeDino, collection, eggTaps, gameStats, GROW_DAYS, HATCH_TAPS, lastEnded, needs, needsPersist, newEgg, settle, view, type DinoView } from './logic';
import type { Mood } from './art';
import { RunnerMode } from './game';
import { BathScene, BedScene, FeedScene } from './modes';
import { Actor, Room, useActor, useWander } from './rooms';
import { openDevSpecies } from './devtools';
import { nameOf, openBook, openNameSheet } from './sheets';
import { SPECIES, STAGE_EMOJI, STAGE_NAME } from './species';
import { setSound, sfx, useSound } from './sfx';
import { DinoSprite } from './Sprite';
import '@fontsource/itim/thai-400.css';
import '@fontsource/itim/latin-400.css';
import './dino.css';

type Mode = 'room' | 'feed' | 'bath' | 'bed' | 'game';
type FxKind = 'pet' | 'hug' | 'sweep' | 'spoon' | 'sparkle' | 'cheer';
interface Fx { kind: FxKind; k: number; n: number }
type Result = Dino | string | null;

/** ทำแอ็กชันกับข้อมูลล่าสุดในเครื่องเสมอ (ไม่ทับของที่อีกเครื่องเพิ่งซิงก์มา) — ข้อความ = ทำไม่ได้, null = ไม่ต้องทำอะไร */
async function run(id: string, fn: (d: Dino, t: number) => Result) {
  const cur = await coll.get('dino', id);
  if (!cur) return null;
  const r = fn(cur, Date.now());
  if (typeof r === 'string') toast(r);
  if (!r || typeof r === 'string') return null;
  await coll.save('dino', r);
  return r;
}
/** รับไข่ใบใหม่ (ถ้าอีกเครื่องรับไปแล้ว ใช้ใบเดิม ไม่ทับ) */
async function startEgg(all: Dino[]) {
  const egg = newEgg(all);
  if (!(await coll.get('dino', egg.id))) await coll.save('dino', egg);
}
// สวนไดโน (เปิดจากปุ่มมุมขวาล่างของห้อง) — สถานะหน้าจอในเครื่องนี้เท่านั้น ไม่บันทึก
const gardenOpen = createStore(false);
const GARDEN_BG = Object.values(import.meta.glob('../../assets/scenes/garden.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)[0];
const GardenButton = () => (
  <button className="garden-btn no-walk" onClick={() => { sfx.click(); gardenOpen.set(true); }} aria-label="สวนไดโน">🌳</button>
);
let hatchedHere = ''; // ฟักที่เครื่องนี้ → ชวนตั้งชื่อ (อีกเครื่องแค่ฉลอง)

function need(v: DinoView, t: number): string {
  const n = needs(v, t);
  if (v.sick === 2) return 'ไม่ไหวแล้ว… ช่วยด้วย 🤒';
  if (v.sick) return 'ไม่สบาย… ขอยาหน่อย 💊';
  if (v.dirt === 2) return 'ห้องเละไปหมดแล้ว 😭';
  if (v.m.food < 20) return 'หิวมากกก 🍖';
  if (n.feed) return 'หิวแล้ววว 🍖';
  if (v.m.bath <= 0) return 'ตัวเน่าแล้ว 🤢 อาบน้ำให้หน่อย';
  if (v.dirt === 1) return 'เหม็นอึจัง 💩';
  if (n.clean) return 'อึแล้ว เก็บให้หน่อย 💩';
  if (n.bed) return v.m.energy < 20 ? 'เหนื่อยจัง อยากนอน 😮‍💨' : 'ง่วงแล้ว พาไปนอนหน่อย 😴';
  if (n.bath) return 'ตัวมอมแมมแล้ว อยากอาบน้ำ 🛁';
  if (n.fun) return 'เหงาจัง กอดหน่อย 🥺';
  return '';
}

const isNight = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
// ตำแหน่งอึบนพื้น (คงที่)
const POOP_POS = [[18, 14], [74, 20], [32, 6], [84, 8], [8, 26], [58, 4], [44, 22], [92, 26], [24, 30], [66, 30], [4, 8], [52, 32]];

export default function DinoPage() {
  const all = useCollection('dino');
  const now = +useNow(15_000);
  const d = all && activeDino(all);
  const garden = useStore(gardenOpen);
  useEffect(() => () => gardenOpen.set(false), []); // ออกจากหน้าเกม = ปิดสวน

  // ตื่นเอง / เริ่มป่วย / โตครบ — บันทึกให้อีกเครื่องเห็นด้วย
  useEffect(() => { if (d && needsPersist(d, now)) run(d.id, (x, t) => (needsPersist(x, t) ? settle(x, t) : null)); }, [d, now]);

  if (!all) return <div className="page-loading"><div className="spinner" /></div>;
  if (garden) return <GardenView all={all} />;
  if (!d) {
    const last = lastEnded(all);
    return last ? <EndedView d={last} v={view(last, now)} all={all} /> : <NoDino />;
  }
  return <DinoHome key={d.id} d={d} all={all} now={now} />;
}

function Head({ d, title, sub, onBack }: { d?: Dino; title: string; sub?: string; onBack?: () => void }) {
  const sound = useSound();
  const len = [...title].length;
  return (
    <header className="dino-head">
      {onBack ? <button className="round" onClick={onBack} aria-label="กลับ">‹</button> : <a className="round" href="#home" aria-label="กลับหน้าแรก">‹</a>}
      <button className={`round snd ${sound ? 'on' : ''}`} onClick={() => setSound(!sound)} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'}>{sound ? '🔊' : '🔇'}</button>
      <div className="name-box"><div className="nm ellipsis" style={{ fontSize: len > 12 ? 20 : len > 8 ? 24 : undefined }}>{title}</div>{sub && <div className="sp ellipsis">{sub}</div>}</div>
      <span className="round ghost" />
      {d ? <button className="round pen" onClick={() => openNameSheet(d)} aria-label="ตั้งชื่อ">✏️</button> : <span className="round ghost" />}
    </header>
  );
}

function DinoHome({ d, all, now }: { d: Dino; all: Dino[]; now: number }) {
  const v = view(d, now);
  const [mode, setMode] = useState<Mode>('room');
  const [fx, setFx] = useState<Fx | null>(null);
  const [, tick] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hatched = useRef(d.status === 'alive');
  const { a, walkTo } = useActor({ x: 50, depth: .3 });
  const info = SPECIES[d.species];

  // ฟักแล้ว → ฉลอง + ชวนตั้งชื่อ
  useEffect(() => {
    if (d.status === 'alive' && !hatched.current) {
      hatched.current = true;
      burstCenter(16, ['🎉', '💖', '✨', '🥚', '🦖']);
      sfx.hatch();
      if (hatchedHere === d.id) setTimeout(() => openNameSheet(d), 900);
    }
  }, [d]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // อีกเครื่องเปิดไฟปลุกแล้ว → กลับมาที่ห้อง
  const wasAsleep = useRef(false);
  const asleepNow = d.status === 'alive' && view(d, now).sleeping;
  useEffect(() => {
    if (wasAsleep.current && !asleepNow) setMode('room');
    wasAsleep.current = asleepNow;
  }, [asleepNow]);
  useWander(walkTo, mode === 'room' && !fx && v.status === 'alive' && !v.sleeping && !v.sick, v.grownUp ? { range: [30, 75] } : undefined);

  /** เอฟเฟกต์ในห้อง (หัวใจรอบตัว, ไม้กวาด, ช้อนยา ...) */
  const play = (kind: FxKind, ms = 2200, n = 0) => {
    timers.current.forEach(clearTimeout);
    const k = Date.now();
    setFx({ kind, k, n });
    timers.current = [
      setTimeout(() => setFx(f => (f?.k === k ? null : f)), ms),
      setTimeout(() => tick(x => x + 1), 1300), // ยาขม → ยิ้ม
    ];
  };

  if (v.status === 'egg') return <EggView d={d} />;
  if (v.status === 'grown' || v.status === 'star') return <EndedView d={d} v={v} all={all} />;

  // โตครบแล้ว: มีไข่ใบใหม่มาส่งรออยู่ในห้อง แตะไข่ = รับเลี้ยง (ตัวนี้ย้ายไปสวน) — ระหว่างนี้ยังเลี้ยงตัวเดิมต่อได้ตามปกติ
  const retired = (x: Dino): Dino => ({ ...x, status: 'grown', endedAt: Date.now() });
  const nextEgg = v.grownUp ? newEgg(all.map(x => (x.id === d.id ? retired(x) : x))) : null;
  const adopt = async () => {
    sfx.knock();
    const ok = await confirmSheet({ title: 'รับเลี้ยงไข่ใบใหม่ไหม?', message: `${nameOf(d)} จะย้ายไปวิ่งเล่นในสวนไดโน 🌳`, emoji: '🥚', ok: 'รับเลี้ยง', danger: false });
    if (!ok) return;
    const r = await run(d.id, actions.retire);
    if (!r) return;
    await startEgg(all.map(x => (x.id === r.id ? r : x)));
    toast(`${nameOf(d)} ย้ายไปอยู่ในสวนแล้ว 🌳`);
  };

  const stage = v.stage;
  const sub = `${info.name} · ${STAGE_NAME[stage]}`;
  // วันที่เลี้ยง → ป้ายมุมขวาบนของห้อง (โตเต็มวัยแล้วนับวันที่อยู่ด้วยกันต่อ)
  const dayTag = v.grownUp ? `อยู่ด้วยกัน ${v.age} วัน` : `วันที่ ${v.day}/${GROW_DAYS}`;
  const sleeping = v.sleeping;
  const n = needs(v, now);
  const hour = new Date(now).getHours();
  const night = hour >= 19 || hour < 6;

  if (sleeping || mode === 'bed') {
    return (
      <div className="dino-page">
        <Head d={d} title={nameOf(d)} sub={sub} />
        <BedScene d={d} stage={stage} sleeping={sleeping}
          onSleep={async () => { if (await run(d.id, actions.sleep)) sfx.lullaby(); }}
          onWake={async () => {
            if (!(await confirmSheet({ title: 'ปลุกไดโนไหม?', message: 'กำลังหลับสบายเลย ถ้าปลุกตอนนี้จะงอนนิดนึงนะ', emoji: '😪', ok: 'เปิดไฟ', danger: false }))) return false;
            if (await run(d.id, actions.wake)) sfx.wake();
            return true;
          }} />
        {!sleeping && <button className="btn btn-ghost btn-block dino-back" onClick={() => setMode('room')}>ยังไม่นอน กลับไปเล่นก่อน</button>}
      </div>
    );
  }

  if (mode === 'feed') {
    return (
      <div className="dino-page">
        <Head d={d} title="ให้อาหาร 🍽️" sub={nameOf(d)} />
        <FeedScene d={d} stage={stage} night={night} onEat={async f => !!(await run(d.id, (x, t) => actions.feed(x, t, f)))} />
        <button className="btn btn-ghost btn-block dino-back" onClick={() => setMode('room')}>อิ่มแล้ว กลับไปเล่น</button>
      </div>
    );
  }

  if (mode === 'game') {
    return (
      <div className="dino-page">
        <Head d={d} title="วิ่งหาอาหาร 🏃" sub={nameOf(d)} onBack={() => setMode('room')} />
        <RunnerMode species={d.species} stage={stage} stats={gameStats(all)} canPlay={() => actions.canPlay(d, Date.now())}
          onFinish={async (who, score, prize) => !!(await run(d.id, (x, t) => actions.gameOver(x, t, who, score, prize)))} />
      </div>
    );
  }

  if (mode === 'bath') {
    return (
      <div className="dino-page">
        <Head d={d} title="อาบน้ำ 🛁" sub={nameOf(d)} />
        <BathScene d={d} stage={stage} onDone={async () => { setMode('room'); if (await run(d.id, actions.bath)) { play('sparkle', 2400); sfx.sparkle(); } }} />
        <button className="btn btn-ghost btn-block dino-back" onClick={() => setMode('room')}>ไว้ทีหลัง</button>
      </div>
    );
  }

  const bubble = fx ? '' : need(v, now);
  const sweeping = fx?.kind === 'sweep';
  const poops = Math.min(POOP_POS.length, sweeping ? fx.n : v.dirt === 2 ? v.poops * 2 + 2 : v.poops);
  const spoonBitter = fx?.kind === 'spoon' && Date.now() - fx.k < 1300;
  const mood: Mood = spoonBitter ? 'sad' : fx && !v.sick ? 'happy' : v.sick ? 'sick' : v.m.fun < 30 || v.dirt === 2 || v.m.food < 15 ? 'sad' : 'normal';
  const pose = fx && !v.sick && fx.kind !== 'sweep' && !spoonBitter ? 'happy' as const : undefined;

  return (
    <div className="dino-page">
      <Head d={d} title={nameOf(d)} sub={sub} />

      <Room kind="home" night={night} className={v.dirt ? `dirt${v.dirt}` : ''} onFloorTap={(x, dep) => walkTo(x, dep)}>
        <span className="stage-tag">🗓️ {dayTag}</span>
        <span className="stage-tag right">{STAGE_EMOJI[stage]} {STAGE_NAME[stage]}</span>
        {import.meta.env.DEV && <button className="dev-chip" onClick={() => openDevSpecies(d)}>🧪 ลองพันธุ์อื่น</button>}
        <GardenButton />
        {v.dirt === 2 && !sweeping && [[12, 8, 60], [62, 4, 80], [36, 12, 50], [80, 10, 44]].map(([l, b, w], i) => <span key={i} className="stain" style={{ left: `${l}%`, bottom: `${b}%`, width: w, height: w * 0.4 }} />)}
        {Array.from({ length: poops }, (_, i) => (
          <span key={`poo${i}`} className={`poo ${sweeping ? 'swept' : ''}`} style={{ left: `${POOP_POS[i][0]}%`, bottom: `${POOP_POS[i][1] / 2 + 4}%`, animationDelay: sweeping ? `${.25 + (POOP_POS[i][0] / 100) * .9}s` : undefined }}>💩
            {v.dirt > 0 && !sweeping && i < 3 && <i className="stink" />}
          </span>
        ))}
        {v.dirt > 0 && !sweeping && <><span className="fly f1">🪰</span>{v.dirt === 2 && <span className="fly f2">🪰</span>}</>}
        {bubble && <div className="dino-bubble" key={`say${bubble}`}>{bubble}</div>}
        {nextEgg && <button className="new-egg in-home no-walk" onClick={adopt} aria-label="รับเลี้ยงไข่ใบใหม่"><span className="new-egg-tag">ไข่ใบใหม่มาส่ง!</span><DinoSprite species={nextEgg.species} stage="egg" size={72} anim="none" /></button>}
        <div className="actor-layer">
          <Actor a={a} species={d.species} stage={stage} mood={mood} pose={pose} react={fx?.kind === 'hug' ? 'squish' : fx?.kind === 'pet' ? 'joy' : ''}
            className={fx?.kind === 'sparkle' ? '' : v.m.bath <= 0 ? 'grubby rotten' : v.m.bath < 30 ? 'grubby' : ''}
            onTap={() => { if (!fx) { play('pet', 1300); sfx.pet(); } }}>
            {v.m.bath <= 0 && fx?.kind !== 'sparkle' && <><span className="stink-lines"><i /><i /><i /></span><span className="body-fly">🪰</span></>}
            {fx?.kind === 'pet' && <span className="pet-hearts" key={`p${fx.k}`}><i>💗</i><i>💕</i><i>💗</i></span>}
            {fx?.kind === 'hug' && <div className="hug-ring" key={`h${fx.k}`}><span className="big-heart">💗</span>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--a': `${i * 30}deg`, '--d': `${(i % 3) * .12}s` } as React.CSSProperties}>{['💗', '💖', '💕'][i % 3]}</i>)}</div>}
            {fx?.kind === 'spoon' && <span className={`fx-spoon ${a.face}`} key={`s${fx.k}`}><i />🥄</span>}
            {(fx?.kind === 'sparkle' || fx?.kind === 'cheer') && <div className="fx-sparkles" key={`sp${fx.k}`}>{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ left: `${10 + i * 15}%`, animationDelay: `${(i % 3) * .15}s` }}>✨</i>)}</div>}
          </Actor>
        </div>
        {fx?.kind === 'sweep' && <span className="fx-broom" key={`br${fx.k}`}>🧹</span>}
        {fx?.kind === 'sweep' && <div className="fx-sparkles floor" key={`sw${fx.k}`}>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${10 + i * 11}%`, animationDelay: `${1.2 + (i % 4) * .15}s` }}>✨</i>)}</div>}
      </Room>

      {v.dirt > 0 && (
        <div className="dino-warn">⚠️ <span>{v.dirt === 2 ? (v.sick ? <><b>ห้องเละมาก</b> จนไดโนป่วยแล้ว ทำความสะอาดแล้วให้ยาด้วยนะ</> : <><b>ห้องเละมาก</b> รีบทำความสะอาดก่อนไดโนป่วยนะ</>) : <>ห้องเริ่มเหม็นแล้ว ถ้าทิ้งไว้เกิน <b>8 ชม.</b> ไดโนอาจป่วย</>}</span></div>
      )}
      {v.m.bath <= 0 && !v.sick && <div className="dino-warn">🤢 <span><b>ตัวเน่าแล้ว</b> ถ้าไม่อาบน้ำเกิน <b>12 ชม.</b> ไดโนจะป่วยนะ</span></div>}
      {v.sick === 2 && <div className="dino-warn red">🚑 <span><b>อาการหนัก!</b> ให้ยาด่วนเลย ไม่อย่างนั้นไดโนอาจจากไปเป็นดาว</span></div>}

      <div className="card dino-bars">
        <Bar label="🍖 อิ่ม" v={v.m.food} c="linear-gradient(90deg,#FFB37A,#F28B4B)" />
        <Bar label="💗 ความสุข" v={v.m.fun} c="linear-gradient(90deg,#FF9DBC,#F2548A)" />
        <Bar label="🫧 สะอาด" v={v.m.bath} c="linear-gradient(90deg,#9ADBFF,#5CB6EC)" />
        <Bar label="⚡ พลังงาน" v={v.m.energy} c="linear-gradient(90deg,#FFE27A,#F5B932)" />
      </div>

      <div className="dino-actions">
        <Act e="🍖" t="ให้อาหาร" need={n.feed} onClick={() => { const no = actions.canEat(d, Date.now()); if (no) toast(no); else setMode('feed'); }} />
        <Act e="🛁" t="อาบน้ำ" need={n.bath} onClick={() => setMode('bath')} />
        <Act e="🛏️" t="เข้านอน" need={n.bed} onClick={() => setMode('bed')} />
        <Act e="🧹" t="ทำความสะอาด" need={n.clean} onClick={async () => { const c = poops; if (await run(d.id, actions.clean)) { play('sweep', 2600, Math.max(1, c)); sfx.sweep(); setTimeout(sfx.sparkle, 1300); } }} />
        <Act e="🤗" t="กอด" need={n.fun} onClick={async () => { if (await run(d.id, actions.hug)) { play('hug', 2000); sfx.hug(); } }} />
        <Act e="🌵" t="เล่นด้วย" onClick={() => { const no = actions.canPlay(d, Date.now()); if (no) toast(no); else setMode('game'); }} />
        <Act e="💊" t="ให้ยา" need={n.medicine} onClick={async () => { if (await run(d.id, actions.medicine)) { play('spoon', 2600); sfx.medicine(); setTimeout(sfx.sparkle, 1400); } }} />
        <Act e="📖" t="สมุดไดโน" onClick={() => openBook(all)} />
      </div>
    </div>
  );
}

const Bar = ({ label, v, c }: { label: string; v: number; c: string }) => (
  <div className="dino-bar">
    <div className="k">{label} <span>{Math.round(v)}%</span></div>
    <div className="track"><div className={`fill ${v < 25 ? 'low' : ''}`} style={{ width: `${v}%`, background: c }} /></div>
  </div>
);

const Act = ({ e, t, need, onClick }: { e: string; t: string; need?: boolean; onClick: (ev: React.MouseEvent<HTMLButtonElement>) => void }) => (
  <button className={`dino-act ${need ? 'need' : ''}`} onClick={e => { sfx.click(); onClick(e); }}><span className="e">{e}</span>{t}</button>
);

// ---------- ไข่: แตะไข่รวม HATCH_TAPS ครั้งก็ฟัก (ใครแตะก็ได้) ----------
function EggView({ d }: { d: Dino }) {
  const egg = useRef<HTMLDivElement>(null);
  const queue = useRef(Promise.resolve()); // แตะรัวๆ ก็นับครบทุกครั้ง (บันทึกทีละครั้งตามลำดับ)
  const tap = (e: React.PointerEvent) => {
    burstHearts(e.clientX, e.clientY - 10, 4);
    sfx.knock();
    // โยกไข่ด้วย animation บนตัวเดิม (ไม่สร้างรูปใหม่ จะได้ไม่กระพริบ)
    egg.current?.animate([
      { transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(-50%) rotate(-7deg) scale(1.03, .97)' },
      { transform: 'translateX(-50%) rotate(6deg)' }, { transform: 'translateX(-50%) rotate(0)' },
    ], { duration: 380, easing: 'ease-out' });
    queue.current = queue.current.then(async () => {
      await run(d.id, (x, t) => {
        const r = actions.warm(x, t);
        if (typeof r === 'object' && r.status === 'alive') hatchedHere = d.id;
        return r;
      });
    });
  };
  const n = eggTaps(d);
  const cracked = n >= HATCH_TAPS - 5 ? 2 : n >= HATCH_TAPS / 2 ? 1 : 0;
  return (
    <div className="dino-page">
      <Head d={d} title={nameOf(d)} sub="ไข่ปริศนา · ช่วยกันฟักนะ" />
      <Room kind="home" night={isNight()} className="egg-room">
        <div ref={egg} className="egg tap no-walk" onPointerDown={tap}><DinoSprite species={d.species} stage="egg" size={230} crack={cracked} anim="none" /></div>
        <GardenButton />
      </Room>
    </div>
  );
}

// ---------- โตครบ (มีไข่ใบใหม่มาส่ง) / กลายเป็นดาว ----------
function EndedView({ d, v, all }: { d: Dino; v: DinoView; all: Dino[] }) {
  const grown = v.status === 'grown';
  const egg = newEgg(all);
  // โตแล้วก็วิ่งเล่นในห้องตามปกติ จนกว่าจะแตะไข่ที่มาส่งแล้วกดรับเลี้ยง
  const { a, walkTo } = useActor({ x: 40, depth: .3 });
  const [joy, setJoy] = useState(0);
  useWander(walkTo, grown && !joy, { range: [16, 68] });
  const pet = () => {
    if (joy) return;
    setJoy(Date.now()); sfx.pet();
    setTimeout(() => setJoy(0), 1400);
  };
  const adopt = async () => {
    sfx.knock();
    const ok = await confirmSheet({
      title: 'รับเลี้ยงไข่ใบใหม่ไหม?',
      message: grown ? `${nameOf(d)} จะย้ายไปวิ่งเล่นในสวนไดโน 🌳` : `${nameOf(d)} จะไปพักที่สุสานในสวนไดโน 🪦`,
      emoji: '🥚', ok: 'รับเลี้ยง', danger: false,
    });
    if (!ok) return;
    await startEgg(all);
    toast(grown ? `${nameOf(d)} ย้ายไปอยู่ในสวนแล้ว 🌳` : `${nameOf(d)} ไปพักที่สุสานในสวนแล้ว 🪦`);
  };
  return (
    <div className="dino-page">
      <Head title={nameOf(d)} sub={`${SPECIES[d.species].name} · เลี้ยงด้วยกัน ${v.day} วัน`} />
      <Room kind="home" night={!grown} className={`ended has-egg ${grown ? 'end-grown' : 'end-star'}`} onFloorTap={(x, dep) => { if (grown) walkTo(Math.min(68, x), dep); }}>
        {grown
          ? <div className="actor-layer">
              <Actor a={a} species={d.species} stage="adult" mood={joy ? 'happy' : 'normal'} pose={joy ? 'happy' : undefined} react={joy ? 'joy' : ''} onTap={pet}>
                {joy > 0 && <span className="pet-hearts" key={`p${joy}`}><i>💗</i><i>💕</i><i>💗</i></span>}
              </Actor>
            </div>
          : <><div className="pet"><DinoSprite species={d.species} stage={v.stage} size={170} mood="sleep" className="is-star" /></div><span className="big-star">⭐</span></>}
        <button className="new-egg no-walk" onClick={adopt} aria-label="รับเลี้ยงไข่ใบใหม่"><span className="new-egg-tag">ไข่ใบใหม่มาส่ง!</span><DinoSprite species={egg.species} stage="egg" size={72} anim="none" /></button>
      </Room>
    </div>
  );
}

// ---------- สวนไดโน: ตัวที่โตแล้ววิ่งเล่นกันเอง (ไม่ต้องดูแล ไม่บันทึกอะไร) ----------
function GardenView({ all }: { all: Dino[] }) {
  const mine = collection(all);
  const graves = all.filter(x => x.status === 'star').sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0));
  const back = () => gardenOpen.set(false);
  // ยิ่งเยอะยิ่งตัวเล็กลง จะได้วิ่งเล่นกันได้ไม่เบียด
  const size = mine.length <= 2 ? 150 : mine.length <= 4 ? 125 : mine.length <= 7 ? 105 : 90;
  return (
    <div className="dino-page">
      <Head title="สวนไดโน 🌳" onBack={back} />
      <div className={`dino-room garden ${GARDEN_BG ? 'has-bg' : ''}`}>
        {GARDEN_BG ? <img className="garden-bg" src={GARDEN_BG} alt="" draggable={false} /> : <div className="garden-css"><i className="g-hill" /><i className="g-tree t1" /><i className="g-tree t2" /></div>}
        <div className="actor-layer">
          {mine.map((d, i) => <GardenDino key={d.id} d={d} size={size} x={mine.length === 1 ? 45 : 16 + (i / (mine.length - 1)) * (graves.length ? 52 : 66)} depth={(i * .37) % .8} maxX={graves.length ? 68 : 90} />)}
        </div>
        {graves.length > 0 && <div className="graveyard">{graves.map((g, i) => (
          <button key={g.id} className="grave no-walk" style={graveAt(i, graves.length)}
            onClick={() => toast(`🪦 ${nameOf(g)} · ${SPECIES[g.species].name} · อยู่ด้วยกัน ${view(g, Date.now()).day} วัน`)}>
            <span className="stone"><i>✿</i></span><span className="g-name">{nameOf(g)}</span>
          </button>
        ))}</div>}
      </div>
    </div>
  );
}

/** สุสานอยู่มุมขวาล่างของสวน (ไดโนไม่เดินเข้าไป) แถวละ 3 หลุม ถ้าเยอะก็ซ้อนแถวไปข้างหลัง */
const graveAt = (i: number, n: number) => {
  const row = Math.floor(i / 3), inRow = Math.min(3, n - row * 3), k = i % 3;
  return { left: `${inRow === 1 ? 86 : 78 + k * (16 / (inRow - 1))}%`, bottom: `${4 + row * 7}%`, zIndex: 10 - row };
};

function GardenDino({ d, size, x, depth, maxX }: { d: Dino; size: number; x: number; depth: number; maxX: number }) {
  const { a, walkTo } = useActor({ x, depth });
  const [joy, setJoy] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useWander(walkTo, !joy, { gap: [700, 3800], speed: 1.15, range: [10, maxX] });
  const pet = () => {
    if (joy) return;
    const k = Date.now();
    setJoy(k);
    sfx.pet();
    timer.current = setTimeout(() => setJoy(0), 1400);
  };
  return (
    <Actor a={a} species={d.species} stage="adult" size={size} mood={joy ? 'happy' : 'normal'} pose={joy ? 'happy' : undefined} react={joy ? 'joy' : ''} onTap={pet}>
      {joy > 0 && <span className="pet-hearts" key={`p${joy}`}><i>💗</i><i>💕</i><i>💗</i></span>}
      <span className="g-name">{nameOf(d)}</span>
    </Actor>
  );
}

// ---------- ยังไม่เคยเลี้ยง ----------
function NoDino() {
  const start = () => startEgg([]);
  return (
    <div className="dino-page">
      <Head title="เลี้ยงไดโน" />
      <Room kind="home" night={isNight()} className="egg-room">
        <div className="egg mystery"><DinoSprite species="trex" stage="egg" size={230} anim="none" /></div>
      </Room>
      <div className="card dino-end-card">
        <div className="big">🦖</div>
        <b>มีไข่ไดโนมาส่งถึงบ้าน!</b>
        <p className="small muted">ช่วยกันฟัก ให้อาหาร อาบน้ำ พาเข้านอน จนโตเต็มวัยใน {GROW_DAYS} วัน</p>
        <button className="btn btn-primary btn-block" onClick={start} style={{ marginTop: 12 }}>🥚 รับไข่ใบแรก</button>
      </div>
    </div>
  );
}
