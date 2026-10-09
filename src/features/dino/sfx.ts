// เสียงในเกมไดโน — สังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง) ค่าเริ่มต้นปิดไว้ กดปุ่ม 🔇 ที่หัวหน้าเพื่อเปิด
// จำค่าเปิด/ปิดไว้ในเครื่องนี้ (localStorage)
import { useEffect, useState } from 'react';

const KEY = 'dino-sound';
let on = (() => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } })();
const subs = new Set<(v: boolean) => void>();

export function setSound(v: boolean) {
  on = v;
  try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* ไม่เป็นไร */ }
  subs.forEach(f => f(v));
  if (v) { audio(); sfx.wake(); }
}
export function useSound() {
  const [v, setV] = useState(on);
  useEffect(() => { subs.add(setV); return () => { subs.delete(setV); }; }, []);
  return v;
}

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = .55;
    out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

interface ToneOpt { type?: OscillatorType; vol?: number; to?: number; attack?: number }
/** เสียงโน้ตหนึ่งตัว (เริ่มหลังจากนี้ at วินาที) */
function tone(freq: number, at: number, dur: number, { type = 'sine', vol = .2, to, attack = .008 }: ToneOpt = {}) {
  const c = audio(); if (!c || !out) return;
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + .02);
}

let noiseBuf: AudioBuffer | null = null;
interface NoiseOpt { filter?: BiquadFilterType; freq?: number; to?: number; q?: number; vol?: number; fade?: number }
/** เสียงซ่า (น้ำ, ไม้กวาด, เคี้ยวกรุบ) */
function noise(at: number, dur: number, { filter = 'bandpass', freq = 1200, to, q = 1, vol = .2, fade = .01 }: NoiseOpt = {}) {
  const c = audio(); if (!c || !out) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + at;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; s.loop = true;
  f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(fade, dur / 2));
  g.gain.setValueAtTime(vol, t + Math.max(fade, dur - fade));
  g.gain.linearRampToValueAtTime(0, t + dur);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}

const notes = (fs: number[], gap: number, dur: number, o?: ToneOpt) => fs.forEach((f, i) => tone(f, i * gap, dur, o));
let lastBubble = 0;

/** เล่นเสียงเฉพาะตอนเปิดเสียงไว้ */
const play = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => { if (on) try { fn(...a); } catch { /* เบราว์เซอร์ไม่รองรับ */ } };

export const sfx = {
  /** กดปุ่มกิจกรรม */
  click: play(() => tone(1400, 0, .05, { type: 'triangle', vol: .08, to: 1800 })),
  /** แตะตัวไดโน */
  pet: play(() => { tone(660, 0, .12, { type: 'triangle', vol: .16, to: 990 }); tone(1320, .09, .14, { vol: .1 }); }),
  /** กอด — คอร์ดอุ่นๆ */
  hug: play(() => notes([523, 659, 784, 1047], .07, .55, { vol: .12 })),
  /** หยิบอาหาร / ฟองป๊อก */
  pop: play(() => tone(500, 0, .08, { vol: .18, to: 1100 })),
  /** งับ 1 คำ */
  chomp: play(() => { noise(0, .06, { freq: 2200, q: .8, vol: .22 }); tone(170, 0, .08, { vol: .2, to: 80 }); }),
  /** อร่อย (ชอบมาก = เสียงยาวขึ้น) */
  yum: play((big?: boolean) => notes(big ? [659, 784, 988, 1319] : [659, 880, 1047], .09, .25, { type: 'triangle', vol: .13 })),
  /** ไม่ชอบ */
  yuck: play(() => { tone(420, 0, .32, { type: 'triangle', vol: .14, to: 210 }); tone(300, .12, .3, { type: 'triangle', vol: .08, to: 180 }); }),
  /** ฟองสบู่ (จำกัดความถี่ ไม่ให้รัวเกิน) */
  bubble: play(() => {
    const n = performance.now(); if (n - lastBubble < 110) return; lastBubble = n;
    const f = 380 + Math.random() * 500; tone(f, 0, .07, { vol: .1, to: f * 2.2 });
  }),
  /** ฝักบัว */
  shower: play((sec: number) => { noise(0, sec, { filter: 'highpass', freq: 2600, vol: .13, fade: .25 }); noise(0, sec, { freq: 900, q: .6, vol: .05, fade: .25 }); }),
  /** สะบัดน้ำ */
  shake: play(() => { for (let i = 0; i < 6; i++) noise(i * .13, .09, { freq: 1500, q: 1.5, vol: .14 }); }),
  /** วิบวับ (สะอาด / เสร็จ) */
  sparkle: play(() => notes([1568, 2093, 2637, 3136], .07, .3, { vol: .07 })),
  /** กดโคมไฟ */
  lamp: play(() => { noise(0, .02, { filter: 'highpass', freq: 3000, vol: .2 }); tone(1900, 0, .03, { vol: .08 }); }),
  /** เพลงกล่อมสั้นๆ ตอนหลับ */
  lullaby: play(() => notes([784, 659, 587, 523, 392], .32, .6, { vol: .08 })),
  /** ตื่น / เปิดเสียง */
  wake: play(() => notes([523, 659, 784], .08, .2, { type: 'triangle', vol: .1 })),
  /** กรน ฟี้~ */
  snore: play(() => { noise(0, 1.1, { filter: 'lowpass', freq: 380, vol: .07, fade: .5 }); tone(95, .1, .9, { vol: .04, to: 80, attack: .4 }); }),
  /** กวาดห้อง */
  sweep: play(() => { for (let i = 0; i < 3; i++) noise(i * .35, .25, { freq: 700, to: 3200, q: .7, vol: .12, fade: .06 }); }),
  /** เตะบอล */
  kick: play(() => { tone(190, 0, .12, { vol: .25, to: 60 }); tone(330, .06, .3, { type: 'triangle', vol: .1, to: 660 }); }),
  /** ป้อนยา: อึก อึก แล้วขม */
  medicine: play(() => {
    tone(320, 0, .12, { vol: .14, to: 160 }); tone(320, .18, .12, { vol: .14, to: 160 });
    tone(420, .45, .32, { type: 'triangle', vol: .12, to: 210 });
  }),
  /** เคาะอุ่นไข่ */
  knock: play(() => { tone(720, 0, .05, { type: 'triangle', vol: .18 }); tone(1080, 0, .04, { vol: .08 }); }),
  /** ไข่ฟัก */
  hatch: play(() => notes([523, 659, 784, 1047, 1319], .1, .35, { type: 'triangle', vol: .12 })),
};
