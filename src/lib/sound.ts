// เสียงน่ารักๆ ในแอป — สังเคราะห์สดด้วย Web Audio (ไม่ใช้ไฟล์เสียง ไม่ติดลิขสิทธิ์)
//  • เสียงเอฟเฟกต์: กดปุ่ม, สลับแท็บ, เปิดหน้าต่าง, บันทึก, ลบ, แตะตัวละคร, ตัวละครพูด
//  • เพลงประกอบ: กล่องดนตรีเบาๆ วนไปเรื่อยๆ (เริ่มหลังแตะหน้าจอครั้งแรก ตามกฎของ iPhone)
// หมายเหตุ iPhone: ถ้าเปิดโหมดเงียบ (สวิตช์ข้างเครื่อง) จะไม่มีเสียง
import { createStore, useStore } from './signal';

// ---------- การตั้งค่า (จำไว้ในเครื่อง) ----------
interface Prefs { music: boolean; sfx: boolean }
const loadPrefs = (): Prefs => {
  try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem('soundPrefs') || '{}') }; }
  catch { return { music: true, sfx: true }; }
};
const prefs = createStore<Prefs>(loadPrefs());
export const useSoundPrefs = () => useStore(prefs);
export function setSoundPrefs(p: Partial<Prefs>) {
  prefs.set({ ...prefs.get(), ...p });
  try { localStorage.setItem('soundPrefs', JSON.stringify(prefs.get())); } catch { /* ignore */ }
  if (p.music !== undefined) (p.music ? startMusic() : stopMusic());
}

// ---------- เครื่องเสียง ----------
let ctx: AudioContext | undefined;
let sfxBus: GainNode, musicBus: GainNode;

function audio(): AudioContext | undefined {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return undefined;
    ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  }
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
  return ctx;
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** เสียงโน้ตเดียว มีเสียงขึ้นเร็ว-ลงนุ่ม */
function tone(dest: AudioNode, freq: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine', glideTo?: number) {
  const c = ctx!;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}
/** เสียงแบบกล่องดนตรี (เสียงหลัก + ฮาร์โมนิกใสๆ) */
function bell(dest: AudioNode, freq: number, t: number, vol: number, dur = 1.2) {
  tone(dest, freq, t, dur, vol);
  tone(dest, freq * 2, t, dur * 0.45, vol * 0.28);
  tone(dest, freq * 3, t, dur * 0.18, vol * 0.08, 'triangle');
}

// ---------- เสียงเอฟเฟกต์ ----------
export type Sfx = 'tap' | 'tab' | 'open' | 'save' | 'delete' | 'boop' | 'sparkle';
let lastTap = 0;

export function sfx(kind: Sfx) {
  if (!prefs.get().sfx) return;
  const c = audio();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + 0.01;
  switch (kind) {
    case 'tap': {
      if (t - lastTap < 0.05) return; // กันเสียงซ้อน
      lastTap = t;
      tone(sfxBus, 920, t, 0.09, 0.09, 'sine', 640);
      break;
    }
    case 'tab':
      bell(sfxBus, hz(79), t, 0.08, 0.4);
      bell(sfxBus, hz(84), t + 0.07, 0.08, 0.5);
      break;
    case 'open':
      tone(sfxBus, 520, t, 0.16, 0.06, 'triangle', 880);
      break;
    case 'save':
      [72, 76, 79, 84].forEach((m, i) => bell(sfxBus, hz(m + 12), t + i * 0.07, 0.07, 0.6));
      break;
    case 'delete':
      bell(sfxBus, hz(76), t, 0.07, 0.35);
      bell(sfxBus, hz(69), t + 0.09, 0.07, 0.45);
      break;
    case 'boop':
      tone(sfxBus, 480, t, 0.14, 0.1, 'sine', 820);
      break;
    case 'sparkle':
      [96, 100, 103, 108].forEach((m, i) => bell(sfxBus, hz(m), t + i * 0.05, 0.035, 0.4));
      break;
  }
}

/** เสียง "พูด" ทีละตัวอักษร แบบตัวละครในเกม (เสียงของแต่ละคนสูงต่ำต่างกัน) */
export function blip(voice: 'ploy' | 'dream') {
  if (!prefs.get().sfx) return;
  const c = audio();
  if (!c || c.state !== 'running') return;
  const base = voice === 'ploy' ? 430 : 610;
  const f = base * (0.9 + Math.random() * 0.3);
  tone(sfxBus, f, c.currentTime + 0.005, 0.06, 0.045, 'triangle', f * 0.94);
}

// ---------- เพลงกล่องดนตรี ----------
// คอร์ด C – Am – F – G (8 ห้อง) จังหวะช้า 76 BPM
const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
const MELODY = [
  [76, 79, 76, 72], [72, 76, 81, 79], [81, 79, 77, 76], [74, 79, 77, 74],
  [76, 79, 84, 79], [81, 79, 76, 72], [77, 81, 79, 77], [76, 74, 72, 0],
];
const ARP = [0, 2, 1, 2, 0, 2, 1, 2]; // ลำดับเสียงในคอร์ด (ทีละ 1/8)
const EIGHTH = 60 / 76 / 2;
let musicTimer: ReturnType<typeof setInterval> | undefined;
let step = 0;
let nextTime = 0;

function scheduleMusic() {
  const c = ctx!;
  while (nextTime < c.currentTime + 0.5) {
    const bar = Math.floor(step / 8) % 8, e = step % 8;
    const chord = CHORDS[bar];
    bell(musicBus, hz(chord[ARP[e]] + (e % 2 ? 12 : 0)), nextTime, 0.022, 1.0);
    if (e === 0) tone(musicBus, hz(chord[0] - 12), nextTime, EIGHTH * 7, 0.035);
    if (e % 2 === 0) {
      const m = MELODY[bar][e / 2];
      if (m) bell(musicBus, hz(m), nextTime, 0.05, 1.5);
    }
    nextTime += EIGHTH;
    step++;
  }
}

function startMusic() {
  if (!prefs.get().music || musicTimer) return;
  const c = audio();
  if (!c || c.state !== 'running') return;
  nextTime = c.currentTime + 0.1;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, c.currentTime);
  musicBus.gain.linearRampToValueAtTime(1, c.currentTime + 2.5); // ค่อยๆ ดังขึ้น
  scheduleMusic();
  musicTimer = setInterval(scheduleMusic, 150);
}
function stopMusic() {
  if (!musicTimer || !ctx) return;
  clearInterval(musicTimer);
  musicTimer = undefined;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
}

// ---------- เริ่มระบบเสียง ----------
export function initSound() {
  // iPhone อนุญาตให้เล่นเสียงได้หลังผู้ใช้แตะหน้าจอเท่านั้น
  document.addEventListener('pointerdown', e => {
    const c = audio();
    if (!c) return;
    const go = () => {
      startMusic();
      const el = (e.target as Element | null)?.closest('button, a, label, select, input[type=checkbox]');
      if (el && !el.closest('.tabbar, .char-wrap')) sfx('tap');
    };
    if (c.state === 'running') go(); else c.resume().then(go).catch(() => {});
  }, true);

  // พักเสียงเมื่อออกจากแอป (ประหยัดแบต) แล้วเล่นต่อเมื่อกลับมา
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { stopMusic(); ctx.suspend().catch(() => {}); }
    else ctx.resume().then(() => startMusic()).catch(() => {});
  });
}
