// มินิเกม "วิ่งหาอาหาร" แบบเกมไดโนกระโดดของ Chrome — ใช้ไดโนตัวที่เลี้ยงอยู่วิ่งเอง แตะจอเพื่อกระโดดหลบสิ่งกีดขวาง
// วิ่งจบได้อาหารแบบสุ่มเข้าคลัง (ยิ่งไกลยิ่งได้เยอะ) · เลือกก่อนว่าใครเล่น แล้วเก็บสถิติแยกคน
import { useEffect, useRef, useState } from 'react';
import { Character } from '../../characters/Character';
import { PROFILE } from '../../lib/store';
import type { DinoSpecies, GameStat } from '../../lib/types';
import { toast } from '../../ui/overlays';
import { prizeFor } from './logic';
import { FoodPic } from './rooms';
import { FOODS, type FoodId, type Stage } from './species';
import { sfx } from './sfx';
import { DinoSprite } from './Sprite';

type Who = 'A' | 'B';
const nameOf = (w: Who) => (w === 'A' ? PROFILE.nameA : PROFILE.nameB);

export function RunnerMode({ species, stage, stats, canPlay, onFinish }: {
  species: DinoSpecies; stage: Stage; stats: Record<Who, GameStat>;
  canPlay: () => string | null;
  onFinish: (who: Who, score: number, prize: FoodId[]) => Promise<boolean>;
}) {
  const [phase, setPhase] = useState<'pick' | 'play' | 'over'>('pick');
  const [who, setWho] = useState<Who>('A');
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ score: number; prize: FoodId[]; best: boolean; saved: boolean } | null>(null);

  const start = (w: Who) => {
    const no = canPlay();
    if (no) { toast(no); return; }
    sfx.click();
    setWho(w); setResult(null); setRound(r => r + 1); setPhase('play');
  };
  const over = async (score: number) => {
    const prize = prizeFor(score);
    const best = score > stats[who].best && stats[who].plays > 0;
    const saved = await onFinish(who, score, prize);
    if (saved) sfx.sparkle();
    setResult({ score, prize, best, saved });
    setPhase('over');
  };

  if (phase === 'play') return <Runner key={round} species={species} stage={stage} who={who} hi={Math.max(stats.A.best, stats.B.best)} onOver={over} />;

  if (phase === 'over' && result) {
    const counts = FOODS.map(f => ({ f, n: result.prize.filter(id => id === f.id).length })).filter(x => x.n);
    return (
      <div className="card run-result">
        <div className="run-score-big">{result.score}</div>
        <div className="small muted">คะแนนของ {nameOf(who)}{result.best && <b className="new-best"> · สถิติใหม่! 🏆</b>}</div>
        {result.saved ? <>
          <h4>ได้อาหารเข้าคลัง 🎁</h4>
          <div className="run-prize">{counts.map(({ f, n }, i) => (
            <span key={f.id} className="prize" style={{ animationDelay: `${i * .12}s` }}><FoodPic f={f} />{n > 1 && <i>×{n}</i>}</span>
          ))}</div>
        </> : <p className="small muted">รอบนี้ไม่ได้อาหารนะ</p>}
        <div className="run-btns">
          <button className="btn btn-primary" onClick={() => start(who)}>🔁 วิ่งอีกรอบ</button>
          <button className="btn btn-ghost" onClick={() => setPhase('pick')}>เปลี่ยนคนเล่น</button>
        </div>
      </div>
    );
  }

  // เลือกคนเล่น + สถิติ
  const lead: Who | null = stats.A.best === stats.B.best ? null : stats.A.best > stats.B.best ? 'A' : 'B';
  return (
    <>
      <div className="card run-pick">
        <b>เลือกผู้เล่น</b>
        <div className="run-who">
          {(['A', 'B'] as const).map(w => (
            <button key={w} className={`run-who-btn ${w}`} onClick={() => start(w)}>
              <span className="pic"><Character who={w === 'A' ? 'ploy' : 'dream'} /></span>
              <span className="nm">{nameOf(w)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card run-stats">
        <b>📊 สถิติ</b>
        <div className="run-table">
          <span /><span>สูงสุด</span><span>เล่น</span><span>อาหาร</span>
          {(['A', 'B'] as const).map(w => (
            <div key={w} className={`row ${lead === w ? 'lead' : ''}`}>
              <span className="nm">{lead === w && '👑 '}{nameOf(w)}</span>
              <span className="hi">{stats[w].best}</span>
              <span>{stats[w].plays} รอบ</span>
              <span>{stats[w].food} ชิ้น</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------- ตัวเกม ----------
// ทุกอย่างขยับด้วย requestAnimationFrame + transform (ไม่ render React ทุกเฟรม จะได้ลื่น)
interface Obs { x: number; w: number; h: number; el: HTMLElement }
const KINDS = [
  { e: '🌵', size: 34, w: 24, h: 32 },
  { e: '🌵', size: 46, w: 32, h: 44 },
  { e: '🌵🌵', size: 32, w: 50, h: 30 },
  { e: '🪨', size: 30, w: 30, h: 22 },
];
const GROUND = 34; // ความสูงพื้นจากขอบล่าง (px)
const DINO_X = 30;
const GRAVITY = 2100, JUMP = 680, CUT = 280;

function Runner({ species, stage, who, hi, onOver }: { species: DinoSpecies; stage: Stage; who: Who; hi: number; onOver: (score: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const me = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const g = useRef({ y: 0, vy: 0, holding: false, started: false, dead: false });
  const size = 92; // ความสูงตัวโต (วัยเด็ก/วัยรุ่นตัวเล็กลงเอง)

  const jump = () => {
    const s = g.current;
    if (s.dead) return;
    if (!s.started) { s.started = true; setStarted(true); }
    s.holding = true;
    if (s.y <= 0) { s.vy = JUMP; sfx.jump(); }
  };
  const release = () => {
    const s = g.current;
    s.holding = false;
    if (s.vy > CUT) s.vy = CUT; // ปล่อยเร็ว = กระโดดเตี้ย
  };

  useEffect(() => {
    const s = g.current;
    const obs: Obs[] = [];
    let raf = 0, last = 0, speed = 270, dist = 0, nextAt = 320, shown = -1, ground = 0;
    const W = () => box.current?.clientWidth || 360;
    // ขนาดตัวจริงของไดโนในเกม (ใช้ทำกล่องชน หดเข้ามานิดนึงให้ไม่โหดเกิน)
    const meBox = () => {
      const r = me.current?.querySelector('.dino-sprite')?.getBoundingClientRect();
      return { w: (r?.width || 70) * .5, h: (r?.height || 70) * .72 };
    };
    let mb = meBox();
    const spawn = () => {
      const k = KINDS[Math.floor(Math.random() * (speed > 380 ? KINDS.length : 2))];
      const el = document.createElement('span');
      el.className = 'run-obs';
      el.textContent = k.e;
      el.style.fontSize = `${k.size}px`;
      layer.current?.appendChild(el);
      obs.push({ x: W() + 10, w: k.w, h: k.h, el });
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(.04, (now - last) / 1000) : 0;
      last = now;
      if (!s.started || s.dead) return;
      if (shown < 0) mb = meBox();
      speed = Math.min(640, speed + 7 * dt);
      dist += speed * dt;
      // กระโดด
      if (s.y > 0 || s.vy > 0) {
        s.vy -= GRAVITY * (s.holding && s.vy > 0 ? .78 : 1) * dt;
        s.y = Math.max(0, s.y + s.vy * dt);
        if (s.y === 0) s.vy = 0;
      }
      if (me.current) {
        me.current.style.transform = `translateY(${-s.y}px)`;
        me.current.classList.toggle('air', s.y > 0);
      }
      // พื้นเลื่อน
      ground = (ground + speed * dt) % 48;
      if (floor.current) floor.current.style.backgroundPositionX = `${-ground}px`;
      // สิ่งกีดขวาง
      nextAt -= speed * dt;
      if (nextAt <= 0) {
        spawn();
        nextAt = speed * (.62 + Math.random() * .9) + 60;
      }
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i];
        o.x -= speed * dt;
        o.el.style.transform = `translateX(${o.x}px)`;
        if (o.x < -80) { o.el.remove(); obs.splice(i, 1); continue; }
        // ชนไหม (กล่องตัวไดโนอยู่กลางตัว กว้างครึ่งเดียว)
        const dx0 = DINO_X + mb.w * .5, dx1 = dx0 + mb.w;
        const ox0 = o.x + o.w * .18, ox1 = o.x + o.w * .82;
        if (dx1 > ox0 && dx0 < ox1 && s.y < o.h * .8) {
          s.dead = true;
          setDead(true);
          sfx.bonk();
          setTimeout(() => onOver(Math.floor(dist / 12)), 900);
          return;
        }
      }
      const sc = Math.floor(dist / 12);
      if (sc !== shown) {
        if (Math.floor(sc / 100) > Math.floor(Math.max(0, shown) / 100) && sc > 0) { sfx.ding(); scoreEl.current?.classList.remove('flash'); void scoreEl.current?.offsetWidth; scoreEl.current?.classList.add('flash'); }
        shown = sc;
        if (scoreEl.current) scoreEl.current.textContent = String(sc).padStart(5, '0');
      }
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
      e.preventDefault();
      if (e.type === 'keydown' && !e.repeat) jump(); else if (e.type === 'keyup') release();
    };
    addEventListener('keydown', key);
    addEventListener('keyup', key);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); obs.forEach(o => o.el.remove()); };
  }, []);

  return (
    <div ref={box} className={`runner ${started ? 'go' : ''} ${dead ? 'dead' : ''}`}
      onPointerDown={e => { e.preventDefault(); jump(); }} onPointerUp={release} onPointerCancel={release} onPointerLeave={release}>
      <i className="run-cloud c1" /><i className="run-cloud c2" /><i className="run-cloud c3" />
      <div className="run-hud"><span className="who">{nameOf(who)}</span>{hi > 0 && <span className="hi">HI {String(hi).padStart(5, '0')}</span>}<span ref={scoreEl} className="sc">00000</span></div>
      <div ref={floor} className="run-floor" style={{ height: GROUND }} />
      <div ref={layer} className="run-layer" style={{ bottom: GROUND - 4 }} />
      <div ref={me} className="run-me" style={{ left: DINO_X, bottom: GROUND - 6 }}>
        <div className="run-bob"><DinoSprite species={species} stage={stage} size={size} mood={dead ? 'sick' : 'normal'} anim="none" flip /></div>
      </div>
      {!started && <div className="run-tip">แตะจอเพื่อเริ่มวิ่ง 🏃<small>แตะ = กระโดด · แตะค้าง = กระโดดสูง</small></div>}
      {dead && <div className="run-tip over">โดนแล้ว! 💥</div>}
    </div>
  );
}
