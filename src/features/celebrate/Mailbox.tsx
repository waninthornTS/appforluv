// ตู้จดหมาย (มุมขวาบนหน้าแรก): เห็นเฉพาะจดหมายที่อีกคนส่งถึงเรา (ของที่เราส่งเองไม่ขึ้น)
// แบ่ง 2 แท็บ: "จดหมายใหม่" = ยังไม่เปิดอ่าน (รวมที่ยังล็อกอยู่) · "จดหมายเก่า" = เปิดอ่านแล้ว + จดหมายทุกฉบับก่อนมีระบบล็อกอิน
// เขียนจดหมายใหม่ได้ (ใส่รูปได้) เลือกวันที่เปิดอ่านได้ — ก่อนถึงวันจะล็อกไว้, ส่งแล้วแก้ไม่ได้ แต่ลบทิ้งได้
import { useEffect, useRef, useState } from 'react';
import { otherOf, useMeSure } from '../../lib/auth';
import { countdown, diffDays, fmtDate } from '../../lib/date';
import { deletePhotos } from '../../lib/photos';
import { coll, nameOf, useCollection } from '../../lib/store';
import type { LetterDoc, Who } from '../../lib/types';
import { Photo, PhotoPicker, Seg, usePhotoDraft } from '../../ui/controls';
import { burstCenter, confirmSheet, openLightbox, openSheet, toast } from '../../ui/overlays';
import { LETTER } from './letter';
import './celebrate.css';

/** รายการในตู้: จดหมายครบรอบ (ในโค้ด) + จดหมายที่เขียนในแอป — ใหม่สุดอยู่บน */
interface Item { id: string; from: Who; openDate: string; createdAt: number; builtIn?: boolean; doc?: LetterDoc }
function itemsOf(letters: LetterDoc[], me: Who): Item[] {
  const built: Item = { id: LETTER.id, from: LETTER.from, openDate: LETTER.date, createdAt: Date.parse(LETTER.date), builtIn: true };
  return [built, ...letters.map(l => ({ id: l.id, from: l.from, openDate: l.openDate, createdAt: l.createdAt, doc: l }))]
    .filter(i => i.from !== me) // เห็นเฉพาะที่ส่งถึงเรา
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** เปิดอ่านแล้ว = จดหมายเก่า · จดหมายก่อนมีระบบล็อกอิน (ไม่มี openedAt) ที่อ่านได้แล้วก็นับเป็นเก่า */
function isOld(it: Item, today: string) {
  if (it.builtIn) return true;
  const o = it.doc!.openedAt;
  if (o) return true;
  return o === undefined && it.openDate <= today;
}

// ---------- ไอคอนตู้จดหมาย ----------
export function MailboxButton({ today, onOpenAnniv }: { today: string; onOpenAnniv: () => void }) {
  const me = useMeSure();
  const letters = useCollection('letters') || [];
  const unread = itemsOf(letters, me).some(i => i.openDate <= today && !isOld(i, today)); // มีฉบับที่เปิดได้แล้วแต่ยังไม่ได้อ่าน
  const open = () => openSheet({ title: 'ตู้จดหมาย', render: close => <MailboxSheet today={today} close={close} onOpenAnniv={onOpenAnniv} /> });
  return (
    <button className={`mailbox-btn ${unread ? 'fresh' : ''}`} onClick={open} aria-label="ตู้จดหมาย">
      <svg viewBox="0 0 48 48" className="mailbox-ico" aria-hidden="true">
        <rect x="19.5" y="32" width="5" height="14" rx="1.5" fill="#B9835A" />
        <path d="M5 22a10 10 0 0 1 10-10h14a10 10 0 0 1 10 10v12H5z" fill="#FF9EBB" stroke="#F2548A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M15 12a10 10 0 0 1 10 10v12" fill="none" stroke="#F2548A" strokeWidth="2" />
        <rect x="8" y="21" width="12" height="3.2" rx="1.6" fill="#fff" opacity=".9" />
        <path d="M32 30.5l-3-2.8a1.8 1.8 0 0 1 3-2 1.8 1.8 0 0 1 3 2z" fill="#fff" />
        {unread /* ธงยกขึ้น = มีจดหมายใหม่ */
          ? <><rect x="39.6" y="8" width="2.4" height="20" rx="1.2" fill="#B9835A" /><path d="M42 8h5.5v6.5H42z" fill="#F23F5E" /></>
          : <><rect x="39.6" y="20" width="2.4" height="10" rx="1.2" fill="#B9835A" /><path d="M42 25.5h5v4.5h-5z" fill="#F7A3B5" /></>}
      </svg>
      {unread && <span className="dot">!</span>}
    </button>
  );
}

// ---------- ในตู้ ----------
type Box = 'new' | 'old';
function MailboxSheet({ today, close, onOpenAnniv }: { today: string; close: () => void; onOpenAnniv: () => void }) {
  const me = useMeSure();
  const letters = useCollection('letters');
  const [shake, setShake] = useState<string | null>(null);
  const items = itemsOf(letters || [], me);
  const fresh = items.filter(i => !isOld(i, today));
  const old = items.filter(i => isOld(i, today));
  const [box, setBox] = useState<Box>('new');
  const list = box === 'new' ? fresh : old;

  const tap = async (it: Item) => {
    if (it.openDate > today) {
      setShake(it.id); setTimeout(() => setShake(null), 500);
      toast(`🔒 เปิดได้ ${fmtDate(it.openDate, { year: false })} · ${countdown(diffDays(today, it.openDate))}`);
      return;
    }
    if (it.builtIn) { close(); onOpenAnniv(); return; }
    openLetter(it.doc!);
    // เปิดครั้งแรก → ย้ายไปจดหมายเก่าทันที (ซิงก์ไปอีกเครื่องด้วย)
    if (!it.doc!.openedAt) {
      const cur = await coll.get('letters', it.id);
      if (cur && !cur.openedAt) await coll.save('letters', { ...cur, openedAt: Date.now() });
    }
  };
  const remove = async (l: LetterDoc) => {
    if (!(await confirmSheet({ title: 'ลบจดหมายฉบับนี้?', message: 'ลบแล้วเอากลับมาไม่ได้นะ', emoji: '🗑️', ok: 'ลบทิ้ง' }))) return;
    await deletePhotos(l.photos);
    await coll.remove('letters', l.id);
    toast('ลบจดหมายแล้ว');
  };

  return (
    <div className="mailbox">
      <button className="btn btn-primary btn-block" onClick={() => openCompose(today)}>✉️ เขียนจดหมายถึง {nameOf(otherOf(me))}</button>
      <Seg<Box> value={box} onChange={setBox} options={[['new', `💌 จดหมายใหม่${fresh.length ? ` (${fresh.length})` : ''}`], ['old', `📂 จดหมายเก่า${old.length ? ` (${old.length})` : ''}`]]} />
      {letters && (list.length ? (
        <div className="mail-list">
          {list.map(it => {
            const locked = it.openDate > today;
            const unread = !locked && box === 'new';
            return (
              <div key={it.id} className={`mail-item ${locked ? 'locked' : ''} ${unread ? 'fresh' : ''} ${shake === it.id ? 'shake' : ''}`}>
                <button className="mail-open" onClick={() => tap(it)}>
                  <span className={`env ${it.from}`}>{locked ? '🔒' : unread ? '💌' : '✉️'}</span>
                  <span className="t">
                    <b>จาก {nameOf(it.from)}</b>
                    <small>{locked ? `เปิดได้ ${fmtDate(it.openDate, { year: false })} · ${countdown(diffDays(today, it.openDate))}` : it.builtIn ? 'จดหมายครบรอบ 2 เดือน 💕' : `เปิดอ่านได้ตั้งแต่ ${fmtDate(it.openDate, { year: false })}`}</small>
                  </span>
                  {!!it.doc?.photos.length && <span className="ph">📷 {it.doc.photos.length}</span>}
                  {unread && <span className="new">ใหม่</span>}
                </button>
                {it.doc && <button className="x" onClick={() => remove(it.doc!)} aria-label="ลบจดหมาย">✕</button>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mail-empty small muted">{box === 'new' ? `ยังไม่มีจดหมายใหม่จาก ${nameOf(otherOf(me))} 💭` : 'ยังไม่มีจดหมายเก่า'}</p>
      ))}
    </div>
  );
}

// ---------- อ่านจดหมาย ----------
function openLetter(l: LetterDoc) {
  openSheet({ title: `จดหมายจาก ${nameOf(l.from)}`, render: () => <LetterView l={l} /> });
}
function LetterView({ l }: { l: LetterDoc }) {
  useEffect(() => { burstCenter(10, ['💌', '💕', '💗', '✨']); }, []);
  return (
    <div className="mail-paper">
      <div className="to">ถึง {nameOf(otherOf(l.from))} 💕</div>
      <p className="msg">{l.message}</p>
      {l.photos.length > 0 && (
        <div className="mail-photos">
          {l.photos.map((id, i) => <button key={id} onClick={() => openLightbox(l.photos, i)}><Photo id={id} /></button>)}
        </div>
      )}
      <div className="sign">— {nameOf(l.from)} · {fmtDate(l.openDate, { year: false })}</div>
    </div>
  );
}

// ---------- เขียนจดหมาย (ผู้ส่ง = คนที่เข้าสู่ระบบอยู่) ----------
function openCompose(today: string) {
  openSheet({ title: 'เขียนจดหมาย ✉️', render: close => <Compose today={today} close={close} /> });
}
function Compose({ today, close }: { today: string; close: () => void }) {
  const from = useMeSure();
  const to = otherOf(from);
  const [openDate, setOpenDate] = useState(today);
  const [message, setMessage] = useState('');
  const draft = usePhotoDraft();
  const sent = useRef(false);
  const rollback = useRef(draft.rollback);
  rollback.current = draft.rollback;
  useEffect(() => () => { if (!sent.current) rollback.current(); }, []); // ปิดโดยไม่ส่ง = ลบรูปที่เพิ่งใส่

  const send = async () => {
    if (draft.busy) return toast('รอรูปอัปโหลดแป๊บนึงน้า');
    if (!message.trim()) return toast('เขียนข้อความก่อนน้า');
    if (!(await confirmSheet({ title: 'ส่งจดหมายเลยไหม?', message: 'ส่งแล้วแก้ไขไม่ได้ แต่ลบทิ้งได้', emoji: '💌', ok: 'ส่งเลย', danger: false }))) return;
    await draft.commit();
    await coll.save('letters', { from, openDate: openDate < today ? today : openDate, message: message.trim(), photos: draft.ids, openedAt: null });
    sent.current = true;
    close();
    toast(openDate > today ? `ส่งถึง ${nameOf(to)} แล้ว 💌 เปิดได้ ${fmtDate(openDate, { year: false })}` : `ส่งจดหมายถึง ${nameOf(to)} แล้ว 💌`);
    burstCenter(12, ['💌', '💕', '✨']);
  };

  return (
    <div className="compose">
      <div className="who-row">
        <span>จาก <b className={`me ${from}`}>{nameOf(from)}</b></span>
        <span className="to">ถึง {nameOf(to)}</span>
      </div>
      <label className="field"><span>เปิดอ่านได้วันที่</span>
        <input className="input" type="date" value={openDate} min={today} onChange={e => setOpenDate(e.target.value || today)} />
      </label>
      <textarea className="input letter-text" value={message} onChange={e => setMessage(e.target.value)} placeholder={`ถึง ${nameOf(to)}…`} rows={7} />
      <div className="field"><span>รูปภาพ</span><PhotoPicker draft={draft} max={6} /></div>
      <button className="btn btn-primary btn-block" onClick={send} disabled={draft.busy}>ส่งจดหมาย 💌</button>
    </div>
  );
}
