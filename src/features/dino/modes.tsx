// กิจกรรม: ให้อาหาร (ลากอาหารไปป้อนถึงปาก) / อาบน้ำ (ถูสบู่ → ฝักบัวล้าง → สะบัดตัว) / เข้านอน (แตะโคม → เดินไปนอนบนเตียง)
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import type { Dino, DinoSpecies } from '../../lib/types';
import { burstHearts } from '../../ui/overlays';
import type { Mood } from './art';
import { wakeAt } from './logic';
import { Actor, FoodPic, foodPicUrl, Room, useActor, useWander } from './rooms';
import { FOODS, foodGain, taste, type Food, type Stage } from './species';
import { sfx } from './sfx';
import type { Pose } from './Sprite';

const hhmm = (t: number) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** ตำแหน่งปากในรูปท่ากินของตัวโต [ห่างจากด้านหน้า, ห่างจากด้านบน] เป็นสัดส่วนของกรอบ (รูปหันซ้าย) */
const MOUTH: Partial<Record<DinoSpecies, [number, number]>> = {
  trex: [.22, .42], styra: [.27, .56], pachy: [.3, .49], galli: [.25, .29], diplo: [.12, .5], elas: [.12, .27],
  ptero: [.22, .47], flame: [.15, .55], galaxy: [.25, .5], phoenix: [.25, .42], crystal: [.12, .62], lava: [.1, .72],
};
const mouthAt = (sp: DinoSpecies, stage: Stage): [number, number] => (stage === 'adult' && MOUTH[sp]) || [.24, .44];

/** จุดปากของไดโนบนจอ */
function mouthOf(root: HTMLElement | null, face: 'left' | 'right', m: [number, number]) {
  const el = root?.querySelector('.actor-body .dino-sprite');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: face === 'left' ? r.left + r.width * m[0] : r.right - r.width * m[0], y: r.top + r.height * m[1], r };
}

// ---------- ให้อาหาร ----------
export function FeedScene({ d, stage, night, onEat }: { d: Dino; stage: Stage; night: boolean; onEat: (f: Food) => Promise<boolean> }) {
  const room = useRef<HTMLDivElement>(null);
  const { a, walkTo, face } = useActor({ x: 52, depth: .25 });
  const [busy, setBusy] = useState(false);
  const [pose, setPose] = useState<Pose | undefined>();
  const [mood, setMood] = useState<Mood>('normal');
  const mp = mouthAt(d.species, stage);
  const [ghost, setGhost] = useState<{ f: Food; x: number; y: number; s: number; fly?: boolean; o?: number } | null>(null);
  const [crumbs, setCrumbs] = useState(0);
  const [chewing, setChewing] = useState(false);
  const near = useRef(false);
  useWander(walkTo, !busy && !ghost);

  const eat = async (f: Food, at: { x: number; y: number }) => {
    setBusy(true);
    if (!(await onEat(f))) { setGhost(null); setPose(undefined); setBusy(false); return; }
    const t = taste(d.species, f);
    setGhost({ f, x: at.x, y: at.y, s: .9 });
    setCrumbs(Date.now());
    // เคี้ยว: ใช้รูปท่ากินรูปเดียว แล้วขยับงับๆ ด้วย CSS (ไม่สลับรูป จะได้ไม่กระพริบ) อาหารค่อยๆ หมด
    setPose('eat');
    setChewing(true);
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) sfx.chomp();
      setGhost(g => (g ? { ...g, s: Math.max(0, .75 - i * .15), o: i < 4 ? 1 : 0 } : g));
      await wait(260);
    }
    setChewing(false);
    setGhost(null);
    if (t === -1) sfx.yuck(); else sfx.yum(t === 1);
    setPose(t === -1 ? undefined : 'happy');
    setMood(t === -1 ? 'sad' : 'happy');
    if (t === 1) {
      const m = mouthOf(room.current, a.face, mp);
      if (m) burstHearts(m.x, m.y - 20, 9);
    }
    await wait(1400);
    setPose(undefined); setMood('normal'); setBusy(false);
  };

  // ลากอาหารจากถาด
  const startDrag = (f: Food, e: RPointerEvent<HTMLButtonElement>) => {
    if (busy) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    sfx.pop();
    setGhost({ f, x: sx, y: sy, s: 1 });
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) moved = true;
      setGhost({ f, x: ev.clientX, y: ev.clientY, s: 1 });
      const m = mouthOf(room.current, a.face, mp);
      if (!m) return;
      // หันหาอาหาร + อ้าปากรอเมื่อเข้ามาใกล้
      const body = m.r.left + m.r.width / 2;
      if (Math.abs(ev.clientX - body) > m.r.width * .25) face(ev.clientX > body ? 'right' : 'left');
      const dist = Math.hypot(ev.clientX - m.x, ev.clientY - m.y);
      const isNear = near.current ? dist < m.r.width * .7 : dist < m.r.width * .5;
      if (isNear !== near.current) { near.current = isNear; setPose(isNear ? 'eat' : undefined); }
    };
    const up = async (ev: PointerEvent) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      const m = mouthOf(room.current, a.face, mp);
      if (!moved) { await feedByTap(f, ev.clientX, ev.clientY); return; }
      if (m && Math.hypot(ev.clientX - m.x, ev.clientY - m.y) < m.r.width * .55) { near.current = false; await eat(f, m); return; }
      near.current = false; setPose(undefined); setGhost(null); // ปล่อยไกลปาก = อาหารกลับถาด
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  };
  // แตะเฉยๆ = อาหารลอยไปเข้าปากเอง
  const feedByTap = async (f: Food, x: number, y: number) => {
    const m0 = mouthOf(room.current, a.face, mp);
    if (!m0) return;
    face(x > m0.r.left + m0.r.width / 2 ? 'right' : 'left');
    await wait(60);
    const m = mouthOf(room.current, x > m0.r.left + m0.r.width / 2 ? 'right' : 'left', mp)!;
    setPose('eat');
    setGhost({ f, x, y, s: 1 });
    await wait(20);
    setGhost({ f, x: m.x, y: m.y, s: .9, fly: true });
    await wait(480);
    await eat(f, m);
  };

  return (
    <>
      <Room kind="home" night={night} onFloorTap={(x, dep) => { if (!busy && !ghost) walkTo(x, dep); }}>
        <div ref={room} className="actor-layer">
          <Actor a={a} species={d.species} stage={stage} mood={mood} pose={pose} react={chewing ? 'chew' : mood === 'happy' ? 'joy' : ''}>
            {crumbs > 0 && busy && <span className="crumbs mouth" key={crumbs} style={{ [a.face === 'left' ? 'left' : 'right']: `${Math.round(mp[0] * 100) - 8}%`, top: `${Math.round(mp[1] * 100) + 2}%` } as CSSProperties}><i /><i /><i /><i /><i /></span>}
          </Actor>
        </div>
        {!busy && !ghost && <div className="room-hint">ลากอาหารไปป้อนที่ปาก หรือแตะเมนูเลย 🍽️</div>}
      </Room>
      {ghost && (
        <div className={`food-ghost ${ghost.fly ? 'fly' : ''}`} style={{ left: ghost.x, top: ghost.y, transform: `translate(-50%, -50%) scale(${ghost.s})`, opacity: ghost.o ?? 1 }}>
          {foodPicUrl(ghost.f) ? <img src={foodPicUrl(ghost.f)} alt="" draggable={false} /> : <span>{ghost.f.e}</span>}
        </div>
      )}
      <div className="food-grid">
        {FOODS.map(f => {
          const g = foodGain(d.species, f), tt = taste(d.species, f);
          return (
            <button key={f.id} className={`food-card ${tt === 1 ? 'fav' : tt === -1 ? 'meh' : ''} ${ghost?.f.id === f.id && !ghost.fly ? 'lifted' : ''}`}
              onPointerDown={e => startDrag(f, e)} disabled={busy} style={{ touchAction: 'none' }}>
              {tt === 1 && <span className="badge">ชอบ 💖</span>}
              {tt === -1 && <span className="badge meh">ไม่ค่อยชอบ</span>}
              <span className="fe"><FoodPic f={f} /></span>
              <span className="fn">{f.name}</span>
              <span className="fg">🍖{sign(g.food)} 💗{sign(g.fun)}{g.energy ? ` ⚡${sign(g.energy)}` : ''}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------- อาบน้ำ: ยืนบนพรม ถูสบู่ให้ฟองเต็ม → เปิดฝักบัวล้าง → สะบัดตัว ----------
const FOAM_FULL = 18;
export function BathScene({ d, stage, onDone }: { d: Dino; stage: Stage; onDone: () => void }) {
  const room = useRef<HTMLDivElement>(null);
  const { a } = useActor({ x: 50, depth: .12 });
  const [foam, setFoam] = useState<{ x: number; y: number; s: number; k: number }[]>([]);
  const [phase, setPhase] = useState<'scrub' | 'rinse' | 'shake' | 'done'>('scrub');
  const [rubbing, setRubbing] = useState(false);
  const [soap, setSoap] = useState<{ x: number; y: number } | null>(null);
  const last = useRef(0);
  const stopRub = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(stopRub.current), []);
  const pct = Math.min(100, Math.round((foam.length / FOAM_FULL) * 100));

  /** ถูที่จุดนี้ (พิกัดจอ) — ถ้าโดนตัวไดโนให้เกิดฟอง */
  const rubAt = (x: number, y: number) => {
    if (phase !== 'scrub') return;
    const el = room.current?.querySelector('.actor-body .dino-sprite');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (x - r.left) / r.width, py = (y - r.top) / r.height;
    if (px < .08 || px > .92 || py < .05 || py > .95) return;
    setRubbing(true);
    clearTimeout(stopRub.current);
    stopRub.current = setTimeout(() => setRubbing(false), 1200);
    const now = performance.now();
    if (now - last.current < 70) return;
    last.current = now;
    setFoam(f => (f.length >= 34 ? f : [...f, { x: px * 100, y: py * 100, s: 16 + Math.random() * 18, k: now }]));
    sfx.bubble();
  };
  const dragSoap = (e: RPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'scrub') return;
    e.preventDefault();
    setSoap({ x: e.clientX, y: e.clientY });
    const move = (ev: PointerEvent) => { setSoap({ x: ev.clientX, y: ev.clientY }); rubAt(ev.clientX, ev.clientY); };
    const up = () => { setSoap(null); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };
  const shower = async () => {
    if (phase !== 'scrub' || pct < 100) return;
    setPhase('rinse');
    sfx.shower(1.7);
    await wait(1700);
    setFoam([]);
    setPhase('shake');
    sfx.shake();
    await wait(1100);
    setPhase('done');
    sfx.sparkle();
    const r = room.current?.querySelector('.actor-body .dino-sprite')?.getBoundingClientRect();
    if (r) burstHearts(r.left + r.width / 2, r.top + r.height * .3, 7, ['✨', '🫧', '💖']);
    await wait(900);
    onDone();
  };
  const pose: Pose | undefined = phase === 'rinse' ? 'blink' : rubbing || phase === 'done' ? 'happy' : undefined;
  return (
    <>
      <Room kind="bath" className={`bath-${phase}`}>
        <div ref={room} className="actor-layer" onPointerDown={e => rubAt(e.clientX, e.clientY)} onPointerMove={e => { if (e.buttons || e.pointerType !== 'mouse') rubAt(e.clientX, e.clientY); }}>
          <Actor a={a} species={d.species} stage={stage} pose={pose} mood={pose === 'happy' ? 'happy' : 'normal'} react={rubbing ? 'giggle' : phase === 'shake' ? 'shake' : ''}>
            {foam.map(f => <span key={f.k} className="foam" style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s }} />)}
            {phase === 'shake' && <div className="splash">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg` } as CSSProperties} />)}</div>}
          </Actor>
        </div>
        <div className={`m-shower ${phase === 'rinse' ? 'on' : ''}`}><span className="pipe" /><span className="head" /><div className="water">{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ left: `${4 + i * 9}%`, animationDelay: `${(i % 5) * -.09}s` }} />)}</div></div>
        {phase === 'scrub' && !foam.length && <div className="room-hint">🧼 ลากสบู่ถูตัวไดโนให้ฟองเต็ม</div>}
      </Room>
      {soap && <span className="soap-ghost" style={{ left: soap.x, top: soap.y }}>🧼</span>}
      <div className="card dino-mode-panel bath-tools">
        <button className={`tool ${phase !== 'scrub' ? 'off' : ''}`} onPointerDown={dragSoap} style={{ touchAction: 'none' }}><span>🧼</span>สบู่</button>
        <div className="grow">
          <div className="dino-bar"><div className="k">🫧 ฟอง <span>{pct}%</span></div><div className="track"><div className="fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#9ADBFF,#5CB6EC)' }} /></div></div>
        </div>
        <button className={`tool shower-btn ${pct >= 100 && phase === 'scrub' ? 'ready' : 'off'}`} onClick={shower}><span>🚿</span>ฝักบัว</button>
      </div>
    </>
  );
}

// ---------- เข้านอน: แตะโคมไฟ → ไดโนเดินไปที่เตียง ขึ้นนอนห่มผ้า → ไฟค่อยๆ ดับ ----------
export function BedScene({ d, stage, sleeping, onSleep, onWake }: { d: Dino; stage: Stage; sleeping: boolean; onSleep: () => Promise<void>; onWake: () => Promise<boolean> }) {
  const { a, walkTo, place, face } = useActor(sleeping ? { x: 66, depth: .12 } : { x: 34, depth: .25 });
  const [inBed, setInBed] = useState(sleeping);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (sleeping) { setInBed(true); place(66, .12); face('left'); } }, [sleeping, place, face]);
  // หลับอยู่ = กรนเบาๆ เป็นระยะ (ถ้าเปิดเสียง)
  useEffect(() => {
    if (!sleeping) return;
    const t = setInterval(sfx.snore, 4200);
    return () => clearInterval(t);
  }, [sleeping]);
  const lamp = async () => {
    if (busy) return;
    setBusy(true);
    sfx.lamp();
    if (!sleeping) {
      await walkTo(58, .1);        // เดินไปข้างเตียง
      setInBed(true);               // ปีนขึ้นเตียง หัวหนุนหมอน
      place(66, .12);
      face('left');
      await wait(500);
      await onSleep();              // ไฟดับ
    } else if (await onWake()) {
      setInBed(false);
      place(58, .1);
      await walkTo(36, .3);
    }
    setBusy(false);
  };
  return (
    <Room kind="bed" night dark={sleeping} onFloorTap={(x, dep) => { if (!inBed && !busy) walkTo(x, dep); }}>
      <div className="m-bed no-walk"><span className="frame" /><span className="mattress" /><span className="pillow" /></div>
      <div className={`actor-layer ${inBed ? 'in-bed' : ''}`}>
        <Actor a={a} species={d.species} stage={stage} size={inBed ? 138 : 165} mood={inBed ? 'sleep' : 'normal'} pose={inBed ? 'sleep' : undefined} className={inBed ? 'sleeper' : ''} />
      </div>
      <div className={`m-blanket no-walk ${inBed ? 'on' : ''}`} />
      <button className={`m-lamp ${sleeping ? 'off' : ''}`} onClick={lamp} aria-label={sleeping ? 'เปิดไฟ' : 'ปิดไฟ'}><span className="glow" /><span className="shade" /><span className="stem" /><span className="table" /></button>
      {sleeping
        ? <><span className="zzz z1">z</span><span className="zzz z2">z</span><span className="zzz z3">Z</span>
            <div className="room-hint dark">ฝันดีนะ 🌙 · ตื่น {hhmm(wakeAt(d.sleep!.since))} น.</div></>
        : <div className="room-hint">💡 แตะโคมไฟ แล้วไดโนจะไปนอนเอง</div>}
    </Room>
  );
}
