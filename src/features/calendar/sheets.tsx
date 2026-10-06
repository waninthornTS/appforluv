// นัดหมาย: ดูรายละเอียด / เพิ่ม / แก้ไข
import { useState, type FormEvent } from 'react';
import { countdown, diffDays, fmtDate, fmtRange, todayStr } from '../../lib/date';
import { T } from '../../lib/i18n';
import { entries, EVENT_TYPES } from '../../lib/meta';
import { coll, useItem } from '../../lib/store';
import type { CalEvent, EventType } from '../../lib/types';
import { Field, Seg } from '../../ui/controls';
import { confirmSheet, openSheet, toast } from '../../ui/overlays';

export function openEventDetail(id: string) {
  openSheet({ title: T('นัดหมาย', 'Plan'), render: close => <EventDetail id={id} close={close} /> });
}

function EventDetail({ id, close }: { id: string; close: () => void }) {
  const e = useItem('events', id);
  if (e === undefined) return null;
  if (e === null) return <p className="muted center">{T('ไม่พบนัดนี้แล้ว', 'This plan no longer exists')}</p>;
  const t = EVENT_TYPES[e.type] || EVENT_TYPES.other;
  const remove = async () => {
    if (!await confirmSheet({ message: T(`ลบนัด “${e.title}”?`, `Delete “${e.title}”?`), ok: T('ลบนัด', 'Delete') })) return;
    await coll.remove('events', e.id);
    close();
    toast(T('ลบนัดแล้ว', 'Deleted'));
  };
  return (
    <>
      <span className={`chip ${t.color}`}>{t.emoji} {t.label}</span>
      <h2 className="detail-title">{e.title}</h2>
      <dl className="kv">
        <dt>📅 {T('วันที่', 'Date')}</dt><dd>{e.endDate && e.endDate !== e.date ? fmtRange(e.date, e.endDate) : fmtDate(e.date, { long: true, weekday: true })}</dd>
        {e.time && <><dt>⏰ {T('เวลา', 'Time')}</dt><dd>{e.time}{T(' น.', '')}</dd></>}
        {e.place && <><dt>📍 {T('ที่ไหน', 'Where')}</dt><dd>{e.place}</dd></>}
        <dt>⏳ {T('นับถอยหลัง', 'Countdown')}</dt><dd>{countdown(diffDays(todayStr(), e.date))}</dd>
      </dl>
      {e.note && <div className="note">{e.note}</div>}
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ {T('ลบ', 'Delete')}</button>
        <button className="btn btn-primary" onClick={() => { close(); openEventForm(e); }}>✏️ {T('แก้ไข', 'Edit')}</button>
      </div>
    </>
  );
}

export function openEventForm(e?: CalEvent, preset: Partial<CalEvent> = {}, onSaved?: (e: CalEvent) => void) {
  openSheet({ title: e ? T('แก้ไขนัดหมาย', 'Edit plan') : T('เพิ่มนัดหมาย 💕', 'New plan 💕'), render: close => <EventForm initial={e} preset={preset} close={close} onSaved={onSaved} /> });
}

function EventForm({ initial, preset, close, onSaved }: { initial?: CalEvent; preset: Partial<CalEvent>; close: () => void; onSaved?: (e: CalEvent) => void }) {
  const [e, setE] = useState<Partial<CalEvent>>(() => initial ? { ...initial } : { type: 'date', date: todayStr(), ...preset });
  const set = <K extends keyof CalEvent>(k: K, v: CalEvent[K]) => setE(cur => ({ ...cur, [k]: v }));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!e.title?.trim() || !e.date) return toast(T('ใส่ชื่อนัดกับวันที่ก่อนน้า', 'Please add a title and date'));
    if (e.endDate && e.endDate < e.date) return toast(T('วันสิ้นสุดต้องไม่ก่อนวันเริ่มน้า', 'End date must be after the start'));
    const rec = await coll.save('events', { ...(e as CalEvent), title: e.title.trim() });
    close();
    toast(initial ? T('แก้ไขนัดแล้ว', 'Plan updated') : T('เพิ่มนัดแล้ว อย่าลืมน้า 💕', 'Plan added — see you there 💕'));
    onSaved?.(rec);
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<EventType> value={e.type!} onChange={v => set('type', v)} options={entries(EVENT_TYPES).map(([k, t]) => [k, `${t.emoji} ${t.label}`])} className="mb" />
      <Field label={T('นัดอะไรกัน', 'What are we doing?')}><input required maxLength={100} value={e.title || ''} onChange={ev => set('title', ev.target.value)} placeholder={T('เช่น ไปกินชาบู, ไปคาเฟ่แมว', 'e.g. shabu dinner, cat café')} /></Field>
      <div className="field-row">
        <Field label={T('วันที่', 'Date')}><input type="date" required value={e.date || ''} onChange={ev => set('date', ev.target.value)} /></Field>
        <Field label={T('เวลา', 'Time')}><input type="time" value={e.time || ''} onChange={ev => set('time', ev.target.value)} /></Field>
      </div>
      <Field label={T('ถึงวันที่ (ถ้าหลายวัน)', 'Until (if several days)')}><input type="date" value={e.endDate || ''} onChange={ev => set('endDate', ev.target.value)} /></Field>
      <Field label={T('สถานที่', 'Place')}><input maxLength={80} value={e.place || ''} onChange={ev => set('place', ev.target.value)} placeholder={T('เช่น สยามพารากอน', 'e.g. Siam Paragon')} /></Field>
      <Field label={T('โน้ต', 'Note')}><textarea maxLength={1000} value={e.note || ''} onChange={ev => set('note', ev.target.value)} placeholder={T('แต่งตัวธีมสีชมพู, จองโต๊ะไว้แล้ว...', 'Pink outfits, table booked…')} /></Field>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 {T('บันทึกนัด', 'Save plan')}</button></div>
    </form>
  );
}
