// ไดอารี่: ดูรายละเอียด / เพิ่ม / แก้ไขความทรงจำ
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fmtDate, todayStr } from '../../lib/date';
import { T } from '../../lib/i18n';
import { entries, MEM_CATS } from '../../lib/meta';
import { deletePhotos } from '../../lib/photos';
import { coll, PROFILE, useItem } from '../../lib/store';
import type { Memory, MemoryCat } from '../../lib/types';
import { Field, Gallery, Hearts, HeartsInput, PhotoPicker, Seg, usePhotoDraft } from '../../ui/controls';
import { burstCenter, confirmSheet, openSheet, toast } from '../../ui/overlays';

export function openMemoryDetail(id: string) {
  openSheet({ title: T('ความทรงจำ', 'Memory'), render: close => <MemoryDetail id={id} close={close} /> });
}

function MemoryDetail({ id, close }: { id: string; close: () => void }) {
  const m = useItem('memories', id);
  if (m === undefined) return null;
  if (m === null) return <p className="muted center">{T('ไม่พบรายการนี้แล้ว', 'This memory no longer exists')}</p>;
  const cat = MEM_CATS[m.cat] || MEM_CATS.other;
  const picker = m.picker === 'A' ? PROFILE.nameA : m.picker === 'B' ? PROFILE.nameB : m.picker === 'both' ? T('เลือกด้วยกัน', 'Both of us') : '';
  const remove = async () => {
    if (!await confirmSheet({ message: T(`ลบ “${m.title}” ออกจากไดอารี่?`, `Delete “${m.title}” from the diary?`), ok: T('ลบเลย', 'Delete') })) return;
    await deletePhotos(m.photos);
    await coll.remove('memories', m.id);
    close();
    toast(T('ลบแล้ว', 'Deleted'));
  };
  return (
    <>
      <Gallery ids={m.photos} />
      <span className={`chip ${cat.color}`}>{cat.emoji} {cat.label}</span>
      <h2 className="detail-title">{m.title}</h2>
      {!!m.rating && <div style={{ fontSize: 20 }}><Hearts n={m.rating} /></div>}
      <dl className="kv">
        <dt>📅 {T('วันที่', 'Date')}</dt><dd>{fmtDate(m.date, { long: true, weekday: true })}</dd>
        {m.place && <><dt>📍 {T('ที่ไหน', 'Where')}</dt><dd>{m.place}</dd></>}
        {picker && <><dt>🙋 {T('ใครเลือก', 'Picked by')}</dt><dd>{picker}</dd></>}
      </dl>
      {m.note && <div className="note">{m.note}</div>}
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ {T('ลบ', 'Delete')}</button>
        <button className="btn btn-primary" onClick={() => { close(); openMemoryForm(m); }}>✏️ {T('แก้ไข', 'Edit')}</button>
      </div>
    </>
  );
}

export function openMemoryForm(m?: Memory, preset: Partial<Memory> = {}) {
  openSheet({ title: m ? T('แก้ไขความทรงจำ', 'Edit memory') : T('เพิ่มความทรงจำ ✨', 'New memory ✨'), render: close => <MemoryForm initial={m} preset={preset} close={close} /> });
}

function MemoryForm({ initial, preset, close }: { initial?: Memory; preset: Partial<Memory>; close: () => void }) {
  const [m, setM] = useState<Partial<Memory>>(() => initial ? { ...initial } : { cat: 'movie', date: todayStr(), rating: 0, picker: '', ...preset });
  const draft = usePhotoDraft(initial?.photos);
  const saved = useRef(false);
  const rollback = useRef(draft.rollback);
  rollback.current = draft.rollback;
  useEffect(() => () => { if (!saved.current) rollback.current(); }, []);

  const set = <K extends keyof Memory>(k: K, v: Memory[K]) => setM(cur => ({ ...cur, [k]: v }));
  const movie = m.cat === 'movie';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (draft.busy) return toast(T('รอรูปอัปโหลดแป๊บนึงน้า', 'Photos are still uploading…'));
    if (!m.title?.trim()) return toast(T('ใส่ชื่อก่อนน้า', 'Please add a title'));
    await draft.commit();
    await coll.save('memories', {
      ...(m as Memory), title: m.title.trim(), place: m.place?.trim(), note: m.note?.trim(),
      picker: movie ? m.picker : '', photos: draft.ids,
    });
    saved.current = true;
    close();
    toast(initial ? T('แก้ไขแล้ว', 'Updated') : T('บันทึกความทรงจำแล้ว 💕', 'Memory saved 💕'));
    if (!initial) burstCenter(12);
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<MemoryCat> value={m.cat!} onChange={v => set('cat', v)} options={entries(MEM_CATS).map(([k, c]) => [k, `${c.emoji} ${c.label}`])} className="mb" />
      <Field label={movie ? T('ชื่อหนัง', 'Movie title') : T('หัวข้อ', 'Title')}>
        <input required maxLength={120} value={m.title || ''} onChange={e => set('title', e.target.value)}
          placeholder={movie ? T('เช่น Your Name', 'e.g. Your Name') : m.cat === 'food' ? T('เช่น ชาบูร้านโปรด', 'e.g. our favourite shabu') : T('วันนี้ทำอะไรกัน', 'What did we do today?')} />
      </Field>
      <div className="field-row">
        <Field label={T('วันที่', 'Date')}><input type="date" required value={m.date || ''} onChange={e => set('date', e.target.value)} /></Field>
        <Field label={movie ? T('โรงหนัง', 'Cinema') : T('สถานที่', 'Place')}><input maxLength={80} value={m.place || ''} onChange={e => set('place', e.target.value)} placeholder={movie ? T('เช่น Paragon', 'e.g. Paragon') : ''} /></Field>
      </div>
      {movie && (
        <div className="field"><span>{T('ใครเป็นคนเลือกเรื่องนี้', 'Who picked this movie?')}</span>
          <Seg value={m.picker || ''} onChange={v => set('picker', v)} options={[['A', PROFILE.nameA], ['B', PROFILE.nameB], ['both', T('ด้วยกัน', 'Both')]]} />
        </div>
      )}
      <div className="field"><span>{T('ให้กี่หัวใจ', 'Rating')}</span><HeartsInput value={m.rating || 0} onChange={v => set('rating', v)} /></div>
      <Field label={T('บันทึกเล็กๆ', 'Little note')}>
        <textarea maxLength={2000} value={m.note || ''} onChange={e => set('note', e.target.value)}
          placeholder={T('ฉากที่ชอบ, ร้องไห้ตรงไหน, กินป๊อปคอร์นรสอะไร...', 'Favourite scene, where we cried, popcorn flavour…')} />
      </Field>
      <div className="field"><span>{T('รูปภาพ (สูงสุด 6 รูป)', 'Photos (up to 6)')}</span><PhotoPicker draft={draft} max={6} /></div>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 {T('บันทึก', 'Save')}</button></div>
    </form>
  );
}
