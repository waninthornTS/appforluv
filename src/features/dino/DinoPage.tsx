// เกมเลี้ยงไดโน — เลี้ยงด้วยกันตัวเดียว ซิงก์สองเครื่อง
import { useEffect, useRef, useState } from 'react';
import { useNow } from '../../lib/sky';
import { coll, PROFILE, useCollection } from '../../lib/store';
import type { Dino } from '../../lib/types';
import { burstCenter, burstHearts, confirmSheet, toast } from '../../ui/overlays';
import { actions, activeDino, HATCH_TAPS, lastEnded, needs, needsPersist, newEgg, settle, view, type DinoView } from './logic';
import type { Mood } from './art';
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

type Mode = 'room' | 'feed' | 'bath' | 'bed';
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
let hatchedHere = ''; // ฟักที่เครื่องนี้ → ชวนตั้งชื่อ (อีกเครื่องแค่ฉลอง)

function need(v: DinoView, t: number): string {
  const n = needs(v, t);
  if (v.sick === 2) return 'ไม่ไหวแล้ว… ช่วยด้วย 🤒';
  if (v.sick) return 'ไม่สบาย… ขอยาหน่อย 💊';
  if (v.dirt === 2) return 'ห้องเละไปหมดแล้ว 😭';
  if (v.m.food < 20) return 'หิวมากกก 🍖';
  if (n.feed) return 'หิวแล้ววว 🍖';
  if (v.dirt === 1) return 'เหม็นอึจัง 💩';
  if (n.clean) return 'อึแล้ว เก็บให้หน่อย 💩';
  if (n.bed) return v.m.energy < 20 ? 'เหนื่อยจัง อยากนอน 😮‍💨' : 'ง่วงแล้ว พาไปนอนหน่อย 😴';
  if (n.bath) return 'ตัวเหนียวแล้ว อยากอาบน้ำ 🛁';
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

  // ตื่นเอง / เริ่มป่วย / โตครบ — บันทึกให้อีกเครื่องเห็นด้วย
  useEffect(() => { if (d && needsPersist(d, now)) run(d.id, (x, t) => (needsPersist(x, t) ? settle(x, t) : null)); }, [d, now]);

  if (!all) return <div className="page-loading"><div className="spinner" /></div>;
  if (!d) {
    const last = lastEnded(all);
    return last ? <EndedView d={last} v={view(last, now)} all={all} /> : <NoDino />;
  }
  return <DinoHome key={d.id} d={d} all={all} now={now} />;
}

function Head({ d, title, sub }: { d?: Dino; title: string; sub?: string }) {
  const sound = useSound();
  const len = [...title].length;
  return (
    <header className="dino-head">
      <a className="round" href="#home" aria-label="กลับหน้าแรก">‹</a>
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
  const [ball, setBall] = useState<{ x: number; k: number; kick?: boolean } | null>(null);
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
  useWander(walkTo, mode === 'room' && !fx && !ball && v.status === 'alive' && !v.sleeping && !v.sick);

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

  const stage = v.stage;
  const sub = `${info.name} · ${STAGE_NAME[stage]} วันที่ ${v.day}/14`;
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

  if (mode === 'bath') {
    return (
      <div className="dino-page">
        <Head d={d} title="อาบน้ำ 🛁" sub={nameOf(d)} />
        <BathScene d={d} stage={stage} onDone={async () => { setMode('room'); if (await run(d.id, actions.bath)) { play('sparkle', 2400); sfx.sparkle(); } }} />
        <button className="btn btn-ghost btn-block dino-back" onClick={() => setMode('room')}>ไว้ทีหลัง</button>
      </div>
    );
  }

  const bubble = fx || ball ? '' : need(v, now);
  const sweeping = fx?.kind === 'sweep';
  const poops = Math.min(POOP_POS.length, sweeping ? fx.n : v.dirt === 2 ? v.poops * 2 + 2 : v.poops);
  const spoonBitter = fx?.kind === 'spoon' && Date.now() - fx.k < 1300;
  const mood: Mood = spoonBitter ? 'sad' : fx && !v.sick ? 'happy' : v.sick ? 'sick' : v.m.fun < 30 || v.dirt === 2 || v.m.food < 15 ? 'sad' : 'normal';
  const pose = fx && !v.sick && fx.kind !== 'sweep' && !spoonBitter ? 'happy' as const : undefined;

  // เล่นด้วย: โยนลูกบอล → ไดโนวิ่งไปเตะ
  const playBall = async () => {
    if (!(await run(d.id, actions.play))) return;
    const x = a.x > 50 ? 20 + Math.random() * 15 : 65 + Math.random() * 15;
    setBall({ x, k: Date.now() });
    await new Promise(r => setTimeout(r, 450));
    await walkTo(x + (x > a.x ? -9 : 9), .15, 1.6);
    setBall(b => (b ? { ...b, kick: true } : b));
    sfx.kick();
    play('cheer', 1600);
    setTimeout(() => setBall(null), 1300);
  };

  return (
    <div className="dino-page">
      <Head d={d} title={nameOf(d)} sub={sub} />

      <Room kind="home" night={night} className={v.dirt ? `dirt${v.dirt}` : ''} onFloorTap={(x, dep) => { if (!ball) walkTo(x, dep); }}>
        <span className="stage-tag">{STAGE_EMOJI[stage]} {STAGE_NAME[stage]}</span>
        {import.meta.env.DEV && <button className="dev-chip" onClick={() => openDevSpecies(d)}>🧪 ลองพันธุ์อื่น</button>}
        {v.dirt === 2 && !sweeping && [[12, 8, 60], [62, 4, 80], [36, 12, 50], [80, 10, 44]].map(([l, b, w], i) => <span key={i} className="stain" style={{ left: `${l}%`, bottom: `${b}%`, width: w, height: w * 0.4 }} />)}
        {Array.from({ length: poops }, (_, i) => (
          <span key={`poo${i}`} className={`poo ${sweeping ? 'swept' : ''}`} style={{ left: `${POOP_POS[i][0]}%`, bottom: `${POOP_POS[i][1] / 2 + 4}%`, animationDelay: sweeping ? `${.25 + (POOP_POS[i][0] / 100) * .9}s` : undefined }}>💩
            {v.dirt > 0 && !sweeping && i < 3 && <i className="stink" />}
          </span>
        ))}
        {v.dirt > 0 && !sweeping && <><span className="fly f1">🪰</span>{v.dirt === 2 && <span className="fly f2">🪰</span>}</>}
        {bubble && <div className="dino-bubble" key={`say${bubble}`}>{bubble}</div>}
        <div className="actor-layer">
          <Actor a={a} species={d.species} stage={stage} mood={mood} pose={pose} react={fx?.kind === 'hug' ? 'squish' : fx?.kind === 'pet' ? 'joy' : ''}
            onTap={() => { if (!fx) { play('pet', 1300); sfx.pet(); } }}>
            {fx?.kind === 'pet' && <span className="pet-hearts" key={`p${fx.k}`}><i>💗</i><i>💕</i><i>💗</i></span>}
            {fx?.kind === 'hug' && <div className="hug-ring" key={`h${fx.k}`}><span className="big-heart">💗</span>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--a': `${i * 30}deg`, '--d': `${(i % 3) * .12}s` } as React.CSSProperties}>{['💗', '💖', '💕'][i % 3]}</i>)}</div>}
            {fx?.kind === 'spoon' && <span className={`fx-spoon ${a.face}`} key={`s${fx.k}`}><i />🥄</span>}
            {(fx?.kind === 'sparkle' || fx?.kind === 'cheer') && <div className="fx-sparkles" key={`sp${fx.k}`}>{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ left: `${10 + i * 15}%`, animationDelay: `${(i % 3) * .15}s` }}>✨</i>)}</div>}
          </Actor>
        </div>
        {ball && <span className={`toy-ball ${ball.kick ? 'kick' : ''} ${ball.x < 50 ? 'to-left' : 'to-right'}`} key={ball.k} style={{ left: `${ball.x}%` }}>⚽</span>}
        {fx?.kind === 'sweep' && <span className="fx-broom" key={`br${fx.k}`}>🧹</span>}
        {fx?.kind === 'sweep' && <div className="fx-sparkles floor" key={`sw${fx.k}`}>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${10 + i * 11}%`, animationDelay: `${1.2 + (i % 4) * .15}s` }}>✨</i>)}</div>}
      </Room>

      {v.dirt > 0 && (
        <div className="dino-warn">⚠️ <span>{v.dirt === 2 ? (v.sick ? <><b>ห้องเละมาก</b> จนไดโนป่วยแล้ว ทำความสะอาดแล้วให้ยาด้วยนะ</> : <><b>ห้องเละมาก</b> รีบทำความสะอาดก่อนไดโนป่วยนะ</>) : <>ห้องเริ่มเหม็นแล้ว ถ้าทิ้งไว้เกิน <b>8 ชม.</b> ไดโนอาจป่วย</>}</span></div>
      )}
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
        <Act e="⚽" t="เล่นด้วย" onClick={() => { if (!ball) playBall(); }} />
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

// ---------- ไข่: ต้องช่วยกันอุ่นทั้งสองคน ----------
function EggView({ d }: { d: Dino }) {
  const [wobble, setWobble] = useState(0);
  const warm = async (who: 'A' | 'B', el: HTMLElement) => {
    if (d.warm[who] >= HATCH_TAPS) { toast(`${who === 'A' ? PROFILE.nameA : PROFILE.nameB} อุ่นครบแล้ว รออีกคนน้า 🥺`); return; }
    const r = el.getBoundingClientRect();
    burstHearts(r.left + r.width / 2, r.top, 5);
    setWobble(w => w + 1);
    sfx.knock();
    await run(d.id, (x, t) => {
      const r = actions.warm(x, who, t);
      if (typeof r === 'object' && r.status === 'alive') hatchedHere = d.id;
      return r;
    });
  };
  const total = d.warm.A + d.warm.B;
  const cracked = total >= HATCH_TAPS * 2 - 3 ? 2 : total >= HATCH_TAPS ? 1 : 0;
  return (
    <div className="dino-page">
      <Head d={d} title={nameOf(d)} sub="ไข่ปริศนา · ช่วยกันฟักนะ" />
      <Room kind="home" night={isNight()} className="egg-room">
        <div className="egg" key={`egg${wobble}`}><DinoSprite species={d.species} stage="egg" size={230} crack={cracked} anim="none" /></div>
      </Room>
      <div className="card dino-egg-card">
        <b>แตะเพื่อให้ความอบอุ่น 💗</b>
        <p className="small muted">ต้องช่วยกันทั้งสองคน คนละ {HATCH_TAPS} ครั้ง ไข่ถึงจะฟัก</p>
        <div className="warm-row">
          {(['A', 'B'] as const).map(w => (
            <button key={w} className={`warm-btn ${w} ${d.warm[w] >= HATCH_TAPS ? 'done' : ''}`} onClick={e => warm(w, e.currentTarget)}>
              <span className="who">{w === 'A' ? PROFILE.nameA : PROFILE.nameB}</span>
              <span className="hearts">{Array.from({ length: HATCH_TAPS }, (_, i) => <i key={i} className={i < d.warm[w] ? 'on' : ''}>♥</i>)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- โตครบ / กลายเป็นดาว ----------
function EndedView({ d, v, all }: { d: Dino; v: DinoView; all: Dino[] }) {
  const grown = v.status === 'grown';
  const start = async () => {
    await startEgg(all);
  };
  return (
    <div className="dino-page">
      <Head title={nameOf(d)} sub={`${SPECIES[d.species].name} · เลี้ยงด้วยกัน ${v.day} วัน`} />
      <Room kind="home" night={!grown} className={`ended ${grown ? 'end-grown' : 'end-star'}`}>
        {grown && <span className="crown">👑</span>}
        <div className="pet"><DinoSprite species={d.species} stage={v.stage} size={185} mood={grown ? 'happy' : 'sleep'} className={grown ? '' : 'is-star'} /></div>
        {!grown && <span className="big-star">⭐</span>}
      </Room>
      <div className="card dino-end-card">
        {grown
          ? <><div className="big">🎉</div><b>{nameOf(d)} โตเต็มวัยแล้ว!</b><p className="small muted">เลี้ยงด้วยกันครบ 14 วัน ย้ายไปอยู่ในสมุดไดโนแล้วน้า</p></>
          : <><div className="big">🌙</div><b>{nameOf(d)} กลายเป็นดาวแล้ว…</b><p className="small muted">เลี้ยงด้วยกันมา {v.day} วัน ยังอยู่ในสมุดไดโนเสมอนะ</p></>}
        <button className="btn btn-primary btn-block" onClick={start} style={{ marginTop: 12 }}>🥚 รับไข่ใบใหม่</button>
        <button className="btn btn-ghost btn-block" onClick={() => openBook(all)} style={{ marginTop: 10 }}>📖 สมุดไดโน</button>
      </div>
    </div>
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
        <p className="small muted">ช่วยกันฟัก ให้อาหาร อาบน้ำ พาเข้านอน จนโตเต็มวัยใน 14 วัน</p>
        <button className="btn btn-primary btn-block" onClick={start} style={{ marginTop: 12 }}>🥚 รับไข่ใบแรก</button>
      </div>
    </div>
  );
}
