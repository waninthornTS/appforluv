// เรื่องเล่าวันครบรอบ แบบเปิดดูรูปในความทรงจำ: รูปโพลารอยด์ค่อยๆ ล้างออกมาแล้ววางซ้อนกันทีละใบ
// โทรศัพท์สั่น → แชตแรก → เดตแรก (พาสต้า) → เดตสอง (ดูหนัง) → ร้านนม → ขอเป็นแฟน → จดหมาย
// แตะที่ว่างเพื่อข้ามไปฉากถัดไปได้ ฉากเลื่อนเองตามเวลา
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Character } from '../../characters/Character';
import { nameOf } from '../../lib/store';
import type { Who } from '../../lib/types';
import { burstCenter } from '../../ui/overlays';
import { Confetti, markOpened } from './Celebrate';
import { specialOf, titleOf } from './days';
import type { Letter } from './letter';
import { story } from './story';

type Scene = 'phone' | 'chat' | 'pasta' | 'cinema' | 'milk' | 'ask' | 'letter';
const SCENES: Scene[] = ['phone', 'chat', 'pasta', 'cinema', 'milk', 'ask', 'letter'];
const DUR: Record<Scene, number> = { phone: 3600, chat: 7000, pasta: 4400, cinema: 4400, milk: 4400, ask: 6400, letter: 0 };
const PHOTOS: Scene[] = ['phone', 'pasta', 'cinema', 'milk', 'ask']; // ฉากที่เป็นรูปถ่าย (วางซ้อนกันเป็นกองความทรงจำ)
const TILT: Partial<Record<Scene, number>> = { phone: -4, pasta: 3, cinema: -2.5, milk: 4, ask: -1.5 };
// แชตแรก: ขวา = เค้า (คนเขียนจดหมาย), ซ้าย = อีกคน
const CHAT: { side: 'me' | 'you'; text: string; at: number }[] = [
  { side: 'me', text: 'hi kaa :)', at: 700 },
  { side: 'you', text: 'ฮายค่าา', at: 2300 },
  { side: 'you', text: 'พลอยน้า', at: 3500 },
  { side: 'me', text: '…', at: 4900 },
];
const charOf = (w: Who) => (w === 'A' ? 'ploy' : 'dream');

export function AnnivShow({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [run, setRun] = useState(0);
  const scene = SCENES[i];
  const s = specialOf(letter.date);
  const title = s ? titleOf(s) : null;
  const me = letter.from, you: Who = letter.from === 'A' ? 'B' : 'A';
  const next = () => setI(n => Math.min(n + 1, SCENES.length - 1));
  useEffect(() => { markOpened([letter.id]); }, [letter.id]);
  // เลื่อนฉากเอง
  useEffect(() => {
    const d = DUR[scene];
    if (!d) return;
    const t = setTimeout(next, d);
    return () => clearTimeout(t);
  }, [scene, run]);
  useEffect(() => { if (scene === 'letter') burstCenter(16, ['💕', '💖', '✨', '🌸', '💗']); }, [scene]);
  const replay = () => { setI(0); setRun(n => n + 1); };
  const isPhoto = PHOTOS.includes(scene);
  const pile = PHOTOS.filter(p => SCENES.indexOf(p) < i).slice(-2); // รูปก่อนหน้าที่กองอยู่ข้างใต้

  return (
    <div className={`an-show sc-${scene}`} role="dialog" aria-label={title?.short ?? 'จดหมาย'} onClick={() => scene !== 'letter' && next()}>
      <FloatHearts />
      <button className="bd-x" onClick={e => { e.stopPropagation(); onClose(); }} aria-label="ปิด">✕</button>
      <div className="an-dots">{SCENES.map((_, k) => <i key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}</div>

      {scene !== 'letter' && (
        <div className="an-table">
          {isPhoto && pile.map(p => <div key={`pile-${p}-${run}`} className="an-polaroid pile" style={{ '--tilt': `${(TILT[p] ?? 0) * 2.2}deg` } as CSSProperties}><Shot scene={p} me={me} you={you} still /></div>)}
          <div className="an-slot" key={`${scene}-${run}`}>
            {scene === 'chat'
              ? <ChatScene you={you} />
              : <div className="an-polaroid" style={{ '--tilt': `${TILT[scene] ?? 0}deg` } as CSSProperties}><span className="tape" /><Shot scene={scene} me={me} you={you} /></div>}
          </div>
        </div>
      )}

      {scene === 'letter' && (
        <div className="an-stage an-letter" key={`letter-${run}`} onClick={e => e.stopPropagation()}>
          {s?.kind !== 'birthday' && <Confetti love />}
          <h1 className="cel-big">{title?.big ?? 'จดหมายถึงเธอ 💌'}</h1>
          <p className="cel-sub">{title?.sub}</p>
          <div className="cel-paper">
            <p>{letter.message}</p>
            <div className="from">— รักนะ, {nameOf(letter.from)} 💕</div>
          </div>
          <div className="bd-btns">
            <button className="an-again" onClick={replay}>ดูอีกครั้ง ↺</button>
            <button className="cel-close" onClick={onClose}>ไปหน้าแรก ✨</button>
          </div>
        </div>
      )}
      {scene !== 'letter' && <div className="an-skip">แตะเพื่อไปต่อ ›</div>}
    </div>
  );
}

/** รูปถ่ายของแต่ละฉาก (still = รูปเก่าในกอง ไม่ต้องเล่นแอนิเมชัน) */
function Shot({ scene, me, you, still }: { scene: Scene; me: Who; you: Who; still?: boolean }) {
  const img = (name: string, extra?: ReactNode) => (
    <div className={`an-photo ${still ? 'still' : ''}`}>
      {story(name) ? <img src={story(name)} alt="" draggable={false} /> : <span className="an-pic-fb"><Character who="ploy" /><Character who="dream" /></span>}
      {extra}
      <i className="grain" />
    </div>
  );
  switch (scene) {
    case 'phone': return img('anniv-phone', !still && <><span className="an-buzz l">((</span><span className="an-buzz r">))</span></>);
    case 'pasta': return img('anniv-pasta');
    case 'cinema': return img('anniv-cinema'); // จอหนังมีมินเนี่ยน (รูปที่ส่งมาให้ ใส่ลงในรูปฉากแล้ว)
    case 'milk': return img('anniv-milk-bg', (
      // ร้านนม: ใช้ตัวละครจากในแอปจริงๆ ยืนสองข้างโต๊ะ
      <div className="an-milk-chars">
        <span className="c a"><Character who={charOf(you)} /></span>
        <span className="c b"><Character who={charOf(me)} /></span>
      </div>
    ));
    case 'ask': return img('anniv-ask', !still && <AskOverlay />);
    default: return null;
  }
}

function AskOverlay() {
  const [yes, setYes] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setYes(true); burstCenter(14, ['💕', '💖', '💗', '✨']); }, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className="an-card">wanna be my girlfriend? <span>💌</span></div>
      {yes && <div className="an-yes">YES!! 💕</div>}
    </>
  );
}

function ChatScene({ you }: { you: Who }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setT(Date.now() - t0), 120);
    return () => clearInterval(id);
  }, []);
  const shown = CHAT.filter(m => t >= m.at);
  const typing = CHAT.find(m => t >= m.at - 900 && t < m.at);
  return (
    <div className="an-chat">
      <div className="an-chat-head"><span className="av"><Character who={charOf(you)} /></span><b>{nameOf(you)}</b><small>ออนไลน์</small></div>
      <div className="an-chat-body">
        {shown.map((m, k) => (
          <div key={k} className={`an-msg ${m.side}`}>
            {m.side === 'you' && <span className="av"><Character who={charOf(you)} /></span>}
            <span className="b">{m.text}</span>
          </div>
        ))}
        {typing && <div className={`an-msg ${typing.side} typing`}><span className="b"><i /><i /><i /></span></div>}
      </div>
    </div>
  );
}

function FloatHearts() {
  const h = useMemo(() => Array.from({ length: 14 }, () => ({ l: Math.random() * 100, d: Math.random() * 8, s: 12 + Math.random() * 14, dur: 7 + Math.random() * 5 })), []);
  return <div className="an-hearts" aria-hidden="true">{h.map((x, k) => <i key={k} style={{ left: `${x.l}%`, animationDelay: `${x.d}s`, fontSize: x.s, animationDuration: `${x.dur}s` } as CSSProperties}>♥</i>)}</div>;
}
