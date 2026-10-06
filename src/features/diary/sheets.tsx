// ไดอารี่: ดูรายละเอียด / เพิ่ม / แก้ไขความทรงจำ
import { useEffect, useRef, useState } from 'react';
import { fmtDate, todayStr } from '../../lib/date';
import { entries, MEM_CATS } from '../../lib/meta';
import { deletePhotos } from '../../lib/photos';
import { coll, PROFILE, useItem } from '../../lib/store';
import type { Memory, MemoryCat } from '../../lib/types';
import { Field, Hearts, HeartsInput, Photo, PhotoPicker, Seg, usePhotoDraft } from '../../ui/controls';
import { burstCenter, confirmSheet, openLightbox, openSheet, toast } from '../../ui/overlays';

export function openMemoryDetail(id: string) {
  openSheet({ title: 'ความทรงจำ', render: close => <MemoryDetail id={id} close={close} /> });
}

function MemoryDetail({ id, close }: { id: string; close: () => void }) {
  const m = useItem('memories', id);
  if (m === undefined) return null;
  if (m === null) return <p className="muted center">ไม่พบรายการนี้แล้ว</p>;
  const cat = MEM_CATS[m.cat] || MEM_CATS.other;
  const picker = m.picker === 'A' ? PROFILE.nameA : m.picker === 'B' ? PROFILE.nameB : m.picker === 'both' ? 'เลือกด้วยกัน' : '';
  const remove = async () => {
    if (!await confirmSheet({ message: `ลบ “${m.title}” ออกจากไดอารี่?`, ok: 'ลบเลย' })) return;
    await deletePhotos(m.photos);
    await coll.remove('memories', m.id);
    close();
    toast('ลบแล้ว');
  };
  return (
    <>
      {m.photos.length > 0 && (
        <div className={`gallery ${m.photos.length > 1 ? 'multi' : ''}`}>
          {m.photos.map((ph, i) => <Photo key={ph} id={ph} onClick={() => openLightbox(m.photos, i)} />)}
        </div>
      )}
      <span className={`chip ${cat.color}`}>{cat.emoji} {cat.label}</span>
      <h2 className="detail-title">{m.title}</h2>
      {!!m.rating && <div style={{ fontSize: 20 }}><Hearts n={m.rating} /></div>}
      <dl className="kv">
        <dt>📅 วันที่</dt><dd>{fmtDate(m.date, { long: true, weekday: true })}</dd>
        {m.place && <><dt>📍 ที่ไหน</dt><dd>{m.place}</dd></>}
        {picker && <><dt>🙋 ใครเลือก</dt><dd>{picker}</dd></>}
      </dl>
      {m.note && <div className="note">{m.note}</div>}
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ ลบ</button>
        <button className="btn btn-primary" onClick={() => { close(); openMemoryForm(m); }}>✏️ แก้ไข</button>
      </div>
    </>
  );
}

export function openMemoryForm(m?: Memory, preset: Partial<Memory> = {}) {
  openSheet({ title: m ? 'แก้ไขความทรงจำ' : 'เพิ่มความทรงจำ ✨', render: close => <MemoryForm initial={m} preset={preset} close={close} /> });
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.busy) return toast('รอรูปอัปโหลดแป๊บนึงน้า');
    if (!m.title?.trim()) return toast('ใส่ชื่อก่อนน้า');
    await draft.commit();
    await coll.save('memories', {
      ...(m as Memory), title: m.title.trim(), place: m.place?.trim(), note: m.note?.trim(),
      picker: movie ? m.picker : '', photos: draft.ids,
    });
    saved.current = true;
    close();
    toast(initial ? 'แก้ไขแล้ว' : 'บันทึกความทรงจำแล้ว 💕');
    if (!initial) burstCenter(12);
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<MemoryCat> value={m.cat!} onChange={v => set('cat', v)} options={entries(MEM_CATS).map(([k, c]) => [k, `${c.emoji} ${c.label}`])} className="mb" />
      <Field label={movie ? 'ชื่อหนัง' : 'หัวข้อ'}>
        <input required maxLength={120} value={m.title || ''} onChange={e => set('title', e.target.value)}
          placeholder={movie ? 'เช่น Your Name' : m.cat === 'food' ? 'เช่น ชาบูร้านโปรด' : 'วันนี้ทำอะไรกัน'} />
      </Field>
      <div className="field-row">
        <Field label="วันที่"><input type="date" required value={m.date || ''} onChange={e => set('date', e.target.value)} /></Field>
        <Field label={movie ? 'โรงหนัง' : 'สถานที่'}><input maxLength={80} value={m.place || ''} onChange={e => set('place', e.target.value)} placeholder={movie ? 'เช่น Paragon' : ''} /></Field>
      </div>
      {movie && (
        <div className="field"><span>ใครเป็นคนเลือกเรื่องนี้</span>
          <Seg value={m.picker || ''} onChange={v => set('picker', v)} options={[['A', PROFILE.nameA], ['B', PROFILE.nameB], ['both', 'ด้วยกัน']]} />
        </div>
      )}
      <div className="field"><span>ให้กี่หัวใจ</span><HeartsInput value={m.rating || 0} onChange={v => set('rating', v)} /></div>
      <Field label="บันทึกเล็กๆ">
        <textarea maxLength={2000} value={m.note || ''} onChange={e => set('note', e.target.value)} placeholder="ฉากที่ชอบ, ร้องไห้ตรงไหน, กินป๊อปคอร์นรสอะไร..." />
      </Field>
      <div className="field"><span>รูปภาพ (สูงสุด 6 รูป)</span><PhotoPicker draft={draft} max={6} /></div>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 บันทึก</button></div>
    </form>
  );
}
