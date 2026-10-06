// นัดหมาย: ดูรายละเอียด / เพิ่ม / แก้ไข
import { useState, type FormEvent } from 'react';
import { countdown, diffDays, fmtDate, fmtRange, todayStr } from '../../lib/date';
import { entries, EVENT_TYPES } from '../../lib/meta';
import { coll, useItem } from '../../lib/store';
import type { CalEvent, EventType } from '../../lib/types';
import { Field, Seg } from '../../ui/controls';
import { confirmSheet, openSheet, toast } from '../../ui/overlays';

export function openEventDetail(id: string) {
  openSheet({ title: 'นัดหมาย', render: close => <EventDetail id={id} close={close} /> });
}

function EventDetail({ id, close }: { id: string; close: () => void }) {
  const e = useItem('events', id);
  if (e === undefined) return null;
  if (e === null) return <p className="muted center">ไม่พบนัดนี้แล้ว</p>;
  const t = EVENT_TYPES[e.type] || EVENT_TYPES.other;
  const remove = async () => {
    if (!await confirmSheet({ message: `ลบนัด “${e.title}”?`, ok: 'ลบนัด' })) return;
    await coll.remove('events', e.id);
    close();
    toast('ลบนัดแล้ว');
  };
  return (
    <>
      <span className={`chip ${t.color}`}>{t.emoji} {t.label}</span>
      <h2 className="detail-title">{e.title}</h2>
      <dl className="kv">
        <dt>📅 วันที่</dt><dd>{e.endDate && e.endDate !== e.date ? fmtRange(e.date, e.endDate) : fmtDate(e.date, { long: true, weekday: true })}</dd>
        {e.time && <><dt>⏰ เวลา</dt><dd>{e.time} น.</dd></>}
        {e.place && <><dt>📍 ที่ไหน</dt><dd>{e.place}</dd></>}
        <dt>⏳ นับถอยหลัง</dt><dd>{countdown(diffDays(todayStr(), e.date))}</dd>
      </dl>
      {e.note && <div className="note">{e.note}</div>}
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ ลบ</button>
        <button className="btn btn-primary" onClick={() => { close(); openEventForm(e); }}>✏️ แก้ไข</button>
      </div>
    </>
  );
}

export function openEventForm(e?: CalEvent, preset: Partial<CalEvent> = {}, onSaved?: (e: CalEvent) => void) {
  openSheet({ title: e ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย 💕', render: close => <EventForm initial={e} preset={preset} close={close} onSaved={onSaved} /> });
}

function EventForm({ initial, preset, close, onSaved }: { initial?: CalEvent; preset: Partial<CalEvent>; close: () => void; onSaved?: (e: CalEvent) => void }) {
  const [e, setE] = useState<Partial<CalEvent>>(() => initial ? { ...initial } : { type: 'date', date: todayStr(), ...preset });
  const set = <K extends keyof CalEvent>(k: K, v: CalEvent[K]) => setE(cur => ({ ...cur, [k]: v }));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!e.title?.trim() || !e.date) return toast('ใส่ชื่อนัดกับวันที่ก่อนน้า');
    if (e.endDate && e.endDate < e.date) return toast('วันสิ้นสุดต้องไม่ก่อนวันเริ่มน้า');
    const rec = await coll.save('events', { ...(e as CalEvent), title: e.title.trim() });
    close();
    toast(initial ? 'แก้ไขนัดแล้ว' : 'เพิ่มนัดแล้ว อย่าลืมน้า 💕');
    onSaved?.(rec);
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<EventType> value={e.type!} onChange={v => set('type', v)} options={entries(EVENT_TYPES).map(([k, t]) => [k, `${t.emoji} ${t.label}`])} className="mb" />
      <Field label="นัดอะไรกัน"><input required maxLength={100} value={e.title || ''} onChange={ev => set('title', ev.target.value)} placeholder="เช่น ไปกินชาบู, ไปคาเฟ่แมว" /></Field>
      <div className="field-row">
        <Field label="วันที่"><input type="date" required value={e.date || ''} onChange={ev => set('date', ev.target.value)} /></Field>
        <Field label="เวลา"><input type="time" value={e.time || ''} onChange={ev => set('time', ev.target.value)} /></Field>
      </div>
      <Field label="ถึงวันที่ (ถ้าหลายวัน)"><input type="date" value={e.endDate || ''} onChange={ev => set('endDate', ev.target.value)} /></Field>
      <Field label="สถานที่"><input maxLength={80} value={e.place || ''} onChange={ev => set('place', ev.target.value)} placeholder="เช่น สยามพารากอน" /></Field>
      <Field label="โน้ต"><textarea maxLength={1000} value={e.note || ''} onChange={ev => set('note', ev.target.value)} placeholder="แต่งตัวธีมสีชมพู, จองโต๊ะไว้แล้ว..." /></Field>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 บันทึกนัด</button></div>
    </form>
  );
}
