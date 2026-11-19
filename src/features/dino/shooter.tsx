// มินิเกม "ยิงไข่ไดโน" — เล็งแล้วยิงไข่ให้ไปติดกับไข่สีเดียวกัน ครบ 3 ใบขึ้นไปแตก → มีอาหารร่วงลงตะกร้า
// ไข่ที่ห้อยอยู่โดยไม่ติดเพดานจะร่วงตามไปด้วย (ได้คะแนนเพิ่ม) · ยิงพลาดหลายครั้งเพดานจะเลื่อนลงมาอีกแถว
// ไข่ลงมาถึงเส้นประ = จบเกม · ล้างจอหมด = ขึ้นด่านใหม่ · เลือกก่อนว่าใครเล่น แล้วเก็บสถิติแยกคน
import { useEffect, useRef, useState } from 'react';
import { Character } from '../../characters/Character';
import { PROFILE } from '../../lib/store';
import type { DinoSpecies, GameStat } from '../../lib/types';
import { toast } from '../../ui/overlays';
import type { Mood } from './art';
import { randomFood } from './logic';
import { FoodPic, foodPicUrl } from './rooms';
import { FOODS, type FoodId, type Stage } from './species';
import { sfx } from './sfx';
import { DinoSprite } from './Sprite';

type Who = 'A' | 'B';
const nameOf = (w: Who) => (w === 'A' ? PROFILE.nameA : PROFILE.nameB);

export function ShooterMode({ species, stage, stats, canPlay, onFinish }: {
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
  const over = async (score: number, prize: FoodId[]) => {
    const best = score > stats[who].best && stats[who].plays > 0;
    const saved = await onFinish(who, score, prize);
    if (saved && prize.length) sfx.sparkle();
    setResult({ score, prize, best, saved });
    setPhase('over');
  };

  if (phase === 'play') return <EggShooter key={round} species={species} stage={stage} who={who} hi={Math.max(stats.A.best, stats.B.best)} onOver={over} />;

  if (phase === 'over' && result) {
    const counts = FOODS.map(f => ({ f, n: result.prize.filter(id => id === f.id).length })).filter(x => x.n);
    return (
      <div className="card run-result">
        <div className="run-score-big">{result.score}</div>
        <div className="small muted">คะแนนของ {nameOf(who)}{result.best && <b className="new-best"> · สถิติใหม่! 🏆</b>}</div>
        {result.saved && counts.length > 0 ? <>
          <h4>ได้อาหารเข้าคลัง {result.prize.length} ชิ้น 🎁</h4>
          <div className="run-prize">{counts.map(({ f, n }, i) => (
            <span key={f.id} className="prize" style={{ animationDelay: `${i * .12}s` }}><FoodPic f={f} />{n > 1 && <i>×{n}</i>}</span>
          ))}</div>
        </> : <p className="small muted">{result.saved ? 'รอบนี้ยังไม่ได้อาหาร ลองยิงให้ติดสีเดียวกัน 3 ใบนะ' : 'รอบนี้ไม่ได้อาหารนะ'}</p>}
        <div className="run-btns">
          <button className="btn btn-primary" onClick={() => start(who)}>🔁 ยิงอีกรอบ</button>
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
        <b>📊 สถิติยิงไข่</b>
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

// ---------- ตัวเกม (วาดบน canvas ทุกเฟรม ไม่ render React ทุกเฟรม จะได้ลื่น) ----------
const EGG = [
  { base: '#FF8FB1', dark: '#E2557F', lite: '#FFD6E3' }, // ชมพู
  { base: '#6EC3F4', dark: '#3A93D2', lite: '#D6F0FF' }, // ฟ้า
  { base: '#FFD54F', dark: '#E2A50E', lite: '#FFF3BF' }, // เหลือง
  { base: '#7DD87D', dark: '#3FA94A', lite: '#DAF6D3' }, // เขียว
  { base: '#B794F6', dark: '#8460D6', lite: '#EADFFF' }, // ม่วง
  { base: '#FFA65C', dark: '#DE7224', lite: '#FFE3C9' }, // ส้ม
];
const COLS = 9;
const STICK = 1.76; // ระยะติด (เท่าของรัศมี) — น้อยกว่า 2 นิดหน่อย ลอดช่องได้ง่ายขึ้น
const colorsAt = (level: number) => Math.min(EGG.length, 3 + level); // ด่าน 1 = 4 สี
const rowEveryAt = (level: number) => Math.max(4, 8 - level); // ยิงพลาดกี่ครั้งเพดานเลื่อนลง

interface Anim { x: number; y: number; c: number; t: number; vx: number; vy: number; kind: 'pop' | 'drop' }
interface FoodFx { id: FoodId; x: number; y: number; vx: number; vy: number; t: number; sx: number; sy: number }

function EggShooter({ species, stage, who, hi, onOver }: { species: DinoSpecies; stage: Stage; who: Who; hi: number; onOver: (score: number, foods: FoodId[]) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const basketEl = useRef<HTMLSpanElement>(null);
  const levelEl = useRef<HTMLSpanElement>(null);
  const bannerEl = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<Mood>('normal');
  const meEl = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const api = useRef<{ stop: () => void }>({ stop: () => {} });

  useEffect(() => {
    const canvas = cv.current!, ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // ---------- ขนาด ----------
    let W = 0, H = 0, R = 0, rowH = 0, ox = 0, sx = 0, sy = 0, dl = 0, bx = 0, by = 0;
    const sprites: HTMLCanvasElement[] = [];
    const layout = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      R = Math.min(W / (2 * COLS + 1), H / 23);
      rowH = R * Math.sqrt(3);
      ox = (W - R * (2 * COLS + 1)) / 2; // กระดานอยู่กลาง (จอกว้างมีขอบสองข้าง)
      sx = W / 2; sy = H - R * 2.4;
      dl = sy - R * 2.3; // เส้นตาย
      bx = W - 38; by = H - 100; // ตะกร้าเล็กเหนือปุ่มมือ
      sprites.length = 0;
      EGG.forEach(c => sprites.push(eggSprite(c, R, dpr)));
    };
    layout();
    const foodImg: Partial<Record<FoodId, HTMLImageElement>> = {};
    for (const f of FOODS) { const u = foodPicUrl(f); if (u) { const im = new Image(); im.src = u; foodImg[f.id] = im; } }

    // ---------- สถานะเกม ----------
    let grid: number[][] = [];
    let parity = 0, level = 1, score = 0, miss = 0, slide = 0, ended = false, clearing = 0;
    const foods: FoodId[] = [];
    let cur = 0, next = 0;
    let aim = -Math.PI / 2, aiming = false;
    let ball: { x: number; y: number; vx: number; vy: number; c: number } | null = null;
    const anims: Anim[] = [];
    const flying: FoodFx[] = [];
    let arrived = 0;

    const off = (r: number) => ((r + parity) & 1) === 1;
    const cx = (r: number, c: number) => ox + R + c * 2 * R + (off(r) ? R : 0);
    const cy = (r: number) => R + r * rowH + 2;
    const at = (r: number, c: number) => (r >= 0 && c >= 0 && c < COLS && grid[r] ? grid[r][c] : -1);
    const nb = (r: number, c: number): [number, number][] => (off(r)
      ? [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]]
      : [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]]
    ).filter(([a, b]) => a >= 0 && b >= 0 && b < COLS) as [number, number][];
    const each = (fn: (r: number, c: number, v: number) => void) => grid.forEach((row, r) => row.forEach((v, c) => { if (v >= 0) fn(r, c, v); }));
    const present = () => { const s = new Set<number>(); each((_r, _c, v) => s.add(v)); return [...s]; };
    const pick = () => { const p = present(); return p.length ? p[Math.floor(Math.random() * p.length)] : Math.floor(Math.random() * colorsAt(level)); };
    const empty = () => present().length === 0;
    const randomRow = (n: number, above?: number[]) => Array.from({ length: COLS }, (_, c) => {
      // จับกลุ่มสีให้ยิงง่าย: มีโอกาสใช้สีเดียวกับข้างๆ
      if (above && Math.random() < .18 && above[c] >= 0) return above[c];
      return Math.floor(Math.random() * n);
    }).map((v, c, arr) => (c > 0 && Math.random() < .22 ? arr[c - 1] : v));
    const newBoard = () => {
      grid = [];
      parity = 0;
      const rows = Math.min(8, 4 + level);
      for (let r = 0; r < rows; r++) grid.push(randomRow(colorsAt(level), grid[r - 1]));
      miss = 0;
      cur = pick(); next = pick();
    };
    const pushRow = () => {
      parity ^= 1;
      grid.unshift(randomRow(colorsAt(level), grid[0]));
      slide = rowH; // เลื่อนลงแบบนุ่มๆ
    };
    const trim = () => { while (grid.length && grid[grid.length - 1].every(v => v < 0)) grid.pop(); };
    const hud = () => {
      if (scoreEl.current) scoreEl.current.textContent = String(score);
      if (levelEl.current) levelEl.current.textContent = `ด่าน ${level}`;
    };
    const banner = (text: string) => {
      const el = bannerEl.current; if (!el) return;
      el.textContent = text;
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    };
    newBoard(); hud();

    // ---------- ยิง ----------
    const SPEED = () => R * 40;
    const shoot = () => {
      if (ball || ended || clearing) return;
      ball = { x: sx, y: sy, vx: Math.cos(aim) * SPEED(), vy: Math.sin(aim) * SPEED(), c: cur };
      cur = next; next = pick();
      sfx.pop();
      const me = meEl.current; if (me) { me.classList.remove("hop"); void me.offsetWidth; me.classList.add("hop"); }
    };
    const swap = () => { if (ball || ended) return; [cur, next] = [next, cur]; sfx.click(); };
    const hits = (x: number, y: number) => {
      if (y <= cy(0) - slide) return true;
      const r0 = Math.floor((y - 2) / rowH);
      for (let r = Math.max(0, r0 - 1); r <= r0 + 1; r++) for (let c = 0; c < COLS; c++)
        if (at(r, c) >= 0 && Math.hypot(cx(r, c) - x, cy(r) - slide - y) < R * STICK) return true;
      return false;
    };
    const stick = (b: NonNullable<typeof ball>) => {
      const r0 = Math.max(0, Math.round((b.y + slide - R - 2) / rowH));
      let best: [number, number] | null = null, bd = Infinity;
      for (let r = Math.max(0, r0 - 1); r <= r0 + 1; r++) for (let c = 0; c < COLS; c++) {
        if (at(r, c) >= 0) continue;
        if (r > 0 && !nb(r, c).some(([a, b2]) => at(a, b2) >= 0)) continue;
        const dd = Math.hypot(cx(r, c) - b.x, cy(r) - slide - b.y);
        if (dd < bd) { bd = dd; best = [r, c]; }
      }
      if (!best) best = [r0, Math.max(0, Math.min(COLS - 1, Math.round((b.x - ox - R - (off(r0) ? R : 0)) / (2 * R))))];
      const [r, c] = best;
      while (grid.length <= r) grid.push(Array(COLS).fill(-1));
      grid[r][c] = b.c;
      resolve(r, c);
    };
    const resolve = (r: number, c: number) => {
      const col = grid[r][c];
      const seen = new Set<string>([`${r},${c}`]), group: [number, number][] = [[r, c]];
      for (let i = 0; i < group.length; i++) for (const [a, b] of nb(...group[i])) {
        const k = `${a},${b}`;
        if (!seen.has(k) && at(a, b) === col) { seen.add(k); group.push([a, b]); }
      }
      if (group.length >= 3) {
        let mx = 0, my = 0;
        for (const [a, b] of group) {
          anims.push({ x: cx(a, b), y: cy(a), c: grid[a][b], t: 0, vx: 0, vy: 0, kind: 'pop' });
          mx += cx(a, b); my += cy(a);
          grid[a][b] = -1;
        }
        // ไข่ที่ไม่ได้ติดเพดานแล้ว → ร่วง
        const keep = new Set<string>(), q: [number, number][] = [];
        (grid[0] || []).forEach((v, c2) => { if (v >= 0) { keep.add(`0,${c2}`); q.push([0, c2]); } });
        for (let i = 0; i < q.length; i++) for (const [a, b] of nb(...q[i])) {
          const k = `${a},${b}`;
          if (!keep.has(k) && at(a, b) >= 0) { keep.add(k); q.push([a, b]); }
        }
        let dropped = 0;
        each((a, b, v) => {
          if (keep.has(`${a},${b}`)) return;
          anims.push({ x: cx(a, b), y: cy(a), c: v, t: 0, vx: (Math.random() - .5) * R * 4, vy: -R * (2 + Math.random() * 3), kind: 'drop' });
          grid[a][b] = -1; dropped++;
        });
        const combo = group.length + dropped;
        score += group.length * 10 + dropped * 20 + (combo >= 6 ? combo * 5 : 0);
        sfx.ding();
        // อาหารร่วง: ยิงแตก 1 ครั้ง = 1 ชิ้น (ไม่จำกัด เก็บได้เรื่อยๆ จนกว่าจะกด "พอแค่นี้")
        {
          const id = randomFood();
          foods.push(id);
          const fx = mx / group.length, fy = my / group.length;
          flying.push({ id, x: fx, y: fy, sx: fx, sy: fy, vx: (Math.random() - .5) * R * 5, vy: -R * 9, t: 0 });
        }
        setMood('happy'); setTimeout(() => setMood('normal'), 900);
        trim();
        if (empty()) {
          score += 300 * level;
          level++;
          clearing = 1;
          banner(`ล้างจอแล้ว! +${300 * (level - 1)} · ด่าน ${level} 🎉`);
          sfx.sparkle();
          setTimeout(() => { newBoard(); clearing = 0; hud(); }, 1300);
        } else {
          const p = present();
          if (!p.includes(cur)) cur = pick();
          if (!p.includes(next)) next = pick();
        }
      } else {
        miss++;
        if (miss >= rowEveryAt(level)) { miss = 0; pushRow(); }
      }
      hud();
      // ไข่ลงมาถึงเส้นตาย = จบ
      let low = false;
      each(a => { if (cy(a) + R * .6 > dl) low = true; });
      if (low) end();
    };
    const end = () => {
      if (ended) return;
      ended = true;
      setOver(true); setMood('sick');
      sfx.bonk();
      setTimeout(() => onOver(score, foods), 1500);
    };
    api.current.stop = () => { if (ended) return; ended = true; onOver(score, foods); };

    // ---------- วาด ----------
    const drawEgg = (c: number, x: number, y: number, s = 1, a = 1) => {
      const sp = sprites[c]; if (!sp) return;
      const w = 2 * R * s;
      ctx.globalAlpha = a;
      ctx.drawImage(sp, x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = 1;
    };
    const aimPath = () => {
      const pts: [number, number][] = [];
      let x = sx, y = sy, vx = Math.cos(aim), vy = Math.sin(aim), d = 0;
      const step = R * .45, L = ox + R, Rt = ox + R * (2 * COLS + 1) - R;
      for (let i = 0; i < 400; i++) {
        x += vx * step; y += vy * step; d += step;
        if (x < L) { x = 2 * L - x; vx = -vx; }
        if (x > Rt) { x = 2 * Rt - x; vx = -vx; }
        if (hits(x, y)) break;
        if (d > R * 1.15) { d = 0; pts.push([x, y]); }
      }
      return pts;
    };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // ผนังข้าง (จอกว้าง)
      if (ox > 2) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, ox, H); ctx.fillRect(W - ox, 0, ox, H); }
      // เส้นตาย
      ctx.setLineDash([R * .5, R * .4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(226,85,127,.45)';
      ctx.beginPath(); ctx.moveTo(ox, dl); ctx.lineTo(W - ox, dl); ctx.stroke(); ctx.setLineDash([]);
      // ไข่บนกระดาน (ใกล้เส้นตายแล้วสั่นเตือน)
      const near = grid.length && cy(grid.length - 1) + R > dl - rowH * 1.2;
      const wob = near && !ended ? Math.sin(performance.now() / 45) * R * .06 : 0;
      each((r, c, v) => drawEgg(v, cx(r, c) + wob, cy(r) - slide));
      // เส้นเล็ง
      if (!ball && !ended && !clearing) {
        const pts = aimPath();
        pts.forEach(([x, y], i) => {
          ctx.globalAlpha = Math.max(.12, .85 - i * .035);
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(x, y, R * (aiming ? .17 : .13), 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      // ปืนยิงไข่
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(aim + Math.PI / 2);
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#F2A5C0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-R * .62, -R * 2.05, R * 1.24, R * 1.9, R * .5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFD6E3'; ctx.beginPath(); ctx.roundRect(-R * .62, -R * 2.05, R * 1.24, R * .5, R * .25); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#FFE3EC'; ctx.strokeStyle = '#F2A5C0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy + R * .35, R * 1.25, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!clearing) drawEgg(cur, sx, sy, 1.02);
      // ไข่ลูกถัดไป (แตะเพื่อสลับ)
      const nx = sx - R * 3.4, ny = sy + R * .5;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(nx, ny, R * .95, 0, Math.PI * 2); ctx.fill();
      drawEgg(next, nx, ny, .78);
      ctx.fillStyle = '#7A6A86'; ctx.font = `700 ${Math.max(10, R * .5)}px Mali, Itim, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('ถัดไป', nx, ny + R * 1.55);
      // ลูกที่กำลังบิน
      if (ball) drawEgg(ball.c, ball.x, ball.y);
      // ไข่แตก / ร่วง
      for (const a of anims) {
        if (a.kind === 'pop') {
          const k = a.t / .28;
          drawEgg(a.c, a.x, a.y, 1 + k * .5, 1 - k);
          ctx.strokeStyle = EGG[a.c].lite; ctx.lineWidth = 3; ctx.globalAlpha = 1 - k;
          ctx.beginPath(); ctx.arc(a.x, a.y, R * (1 + k * 1.2), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        } else drawEgg(a.c, a.x, a.y, 1, Math.max(0, 1 - a.t / 1.1));
      }
      // อาหารร่วงลงตะกร้า
      for (const f of flying) {
        const im = foodImg[f.id], s = R * 2.3;
        if (im?.complete && im.naturalWidth) ctx.drawImage(im, f.x - s / 2, f.y - s / 2, s, s);
        else { ctx.font = `${R * 1.6}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(FOODS.find(x => x.id === f.id)!.e, f.x, f.y); ctx.textBaseline = 'alphabetic'; }
      }
    };

    // ---------- เดินเกม ----------
    let raf = 0, last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(.035, (now - last) / 1000) : 0;
      last = now;
      if (slide > 0) slide = Math.max(0, slide - rowH * dt * 5);
      if (ball) {
        const b = ball, dist = SPEED() * dt, n = Math.max(1, Math.ceil(dist / (R * .35)));
        const L = ox + R, Rt = ox + R * (2 * COLS + 1) - R;
        for (let i = 0; i < n && ball; i++) {
          b.x += (b.vx * dt) / n; b.y += (b.vy * dt) / n;
          if (b.x < L) { b.x = 2 * L - b.x; b.vx = -b.vx; }
          if (b.x > Rt) { b.x = 2 * Rt - b.x; b.vx = -b.vx; }
          if (hits(b.x, b.y)) { ball = null; stick(b); }
        }
      }
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i];
        a.t += dt;
        if (a.kind === 'drop') { a.vy += R * 40 * dt; a.x += a.vx * dt; a.y += a.vy * dt; }
        if ((a.kind === 'pop' && a.t > .28) || (a.kind === 'drop' && (a.t > 1.1 || a.y > H + R))) anims.splice(i, 1);
      }
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i];
        f.t += dt;
        if (f.t < .45) { f.vy += R * 36 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.sx = f.x; f.sy = f.y; } // เด้งขึ้นแล้วตก
        else {
          const k = Math.min(1, (f.t - .45) / .5), e = k * k * (3 - 2 * k);
          f.x = f.sx + (bx - f.sx) * e; f.y = f.sy + (by - f.sy) * e - Math.sin(k * Math.PI) * R * 2;
          if (k >= 1) {
            flying.splice(i, 1); arrived++;
            if (basketEl.current) { basketEl.current.textContent = String(arrived); const p = basketEl.current.parentElement; p?.classList.remove("bump"); void basketEl.current.offsetWidth; p?.classList.add("bump"); }
            sfx.chomp();
          }
        }
      }
      draw();
    };
    raf = requestAnimationFrame(tick);

    // ---------- แตะ / ลากเพื่อเล็ง ปล่อยนิ้วเพื่อยิง ----------
    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const setAim = (x: number, y: number) => {
      const a = Math.atan2(Math.min(y - sy, -R * .5), x - sx);
      aim = Math.max(-Math.PI + .14, Math.min(-.14, a));
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      const p = pos(e);
      if (Math.hypot(p.x - (sx - R * 3.4), p.y - (sy + R * .5)) < R * 1.4) { swap(); return; }
      aiming = true; canvas.setPointerCapture(e.pointerId); setAim(p.x, p.y);
    };
    const move = (e: PointerEvent) => { if (aiming || e.pointerType === 'mouse') { const p = pos(e); setAim(p.x, p.y); } };
    const up = (e: PointerEvent) => { if (!aiming) return; aiming = false; const p = pos(e); setAim(p.x, p.y); shoot(); };
    const cancel = () => { aiming = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    const key = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') aim = Math.max(-Math.PI + .14, aim - .06);
      else if (e.code === 'ArrowRight') aim = Math.min(-.14, aim + .06);
      else if (e.code === 'Space' || e.code === 'ArrowUp') shoot();
      else if (e.code === 'KeyS' || e.code === 'ArrowDown') swap();
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', key);
    const ro = new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight; if (w !== W || h !== H) layout(); });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ได้อาหารพอแล้ว → กดตะกร้าเพื่อจบเกม เก็บอาหารเข้าคลังเลย
  const stop = () => { if (!over) { sfx.click(); api.current.stop(); } };

  return (
    <div ref={box} className={`shooter ${over ? 'dead' : ''}`}>
      <div className="shoot-hud">
        <span className="who">{nameOf(who)}</span>
        <span ref={levelEl} className="lv">ด่าน 1</span>
        {hi > 0 && <span className="hi">HI {hi}</span>}
        <span ref={scoreEl} className="sc">0</span>
      </div>
      <canvas ref={cv} className="shoot-cv" />
      <div ref={meEl} className="shoot-me"><DinoSprite species={species} stage={stage} size={78} mood={mood} pose={mood === 'happy' ? 'happy' : undefined} anim="none" flip /></div>
      <div className="shoot-basket" aria-label="อาหารที่เก็บได้"><span className="b">🧺</span><span ref={basketEl} className="n">0</span></div>
      <button className="shoot-enough" onClick={stop} disabled={over} aria-label="พอแค่นี้ เก็บอาหารเข้าคลัง" title="พอแค่นี้">✋</button>
      <div ref={bannerEl} className="shoot-banner" />
      {over && <div className="run-tip over">ไข่ลงมาถึงเส้นแล้ว! 💥</div>}
    </div>
  );
}

/** วาดไข่ไดโนลายจุด 1 ใบไว้ล่วงหน้า (ใช้ซ้ำทุกเฟรม) */
function eggSprite(c: { base: string; dark: string; lite: string }, R: number, dpr: number) {
  const s = Math.ceil(2 * R * dpr), cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  g.scale(s / 2, s / 2); // พิกัด -1..1 → 0..2
  g.translate(1, 1);
  const shape = () => {
    g.beginPath();
    g.ellipse(0, .1, .8, .96, 0, Math.PI, Math.PI * 2);
    g.ellipse(0, .1, .8, .78, 0, 0, Math.PI);
    g.closePath();
  };
  shape();
  const grd = g.createRadialGradient(-.3, -.35, .1, 0, .1, 1.05);
  grd.addColorStop(0, c.lite); grd.addColorStop(.45, c.base); grd.addColorStop(1, c.dark);
  g.fillStyle = grd; g.fill();
  g.save(); shape(); g.clip();
  g.fillStyle = c.dark; g.globalAlpha = .55;
  for (const [x, y, rx, ry] of [[.32, -.2, .14, .11], [-.25, .3, .12, .09], [.2, .45, .1, .08], [-.45, -.15, .08, .07], [.05, .05, .07, .06], [.5, .25, .07, .06]]) {
    g.beginPath(); g.ellipse(x, y, rx, ry, .4, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  g.globalAlpha = .8; g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(-.3, -.45, .16, .1, -.6, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1; g.lineWidth = .06; g.strokeStyle = 'rgba(80,50,70,.25)'; shape(); g.stroke();
  return cv;
}
