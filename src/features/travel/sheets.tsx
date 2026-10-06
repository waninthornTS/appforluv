// ทริป: ดูรายละเอียด / เพิ่ม / แก้ไข
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { countdown, diffDays, fmtRange, todayStr } from '../../lib/date';
import { entries, TRIP_STATUS } from '../../lib/meta';
import { deletePhotos } from '../../lib/photos';
import { COUNTRIES, countryName, flag, PROVINCES } from '../../lib/places';
import { coll, useItem } from '../../lib/store';
import type { Trip, TripScope, TripStatus } from '../../lib/types';
import { Field, Photo, PhotoPicker, Seg, usePhotoDraft } from '../../ui/controls';
import { burstCenter, confirmSheet, openLightbox, openSheet, toast } from '../../ui/overlays';

export const tripFlag = (t: Pick<Trip, 'scope' | 'country'>) => (t.scope === 'international' ? flag(t.country) : '🇹🇭');
export const tripWhere = (t: Trip) => t.scope === 'international'
  ? (t.country === 'ZZ' ? t.countryOther || 'ต่างประเทศ' : countryName(t.country))
  : t.province || 'ประเทศไทย';

export function openTripDetail(id: string) {
  openSheet({ title: 'ทริปของเรา', render: close => <TripDetail id={id} close={close} /> });
}

function TripDetail({ id, close }: { id: string; close: () => void }) {
  const t = useItem('trips', id);
  if (t === undefined) return null;
  if (t === null) return <p className="muted center">ไม่พบทริปนี้แล้ว</p>;
  const today = todayStr();
  const st = TRIP_STATUS[t.status];
  const left = t.startDate && t.status !== 'done' ? diffDays(today, t.startDate) : -1;
  const save = (patch: Partial<Trip>) => coll.save('trips', { ...t, ...patch });

  const markDone = async () => {
    await save({ status: 'done', startDate: t.startDate || today });
    close();
    burstCenter(14, ['🎉', '✈️', '💖', '📸', tripFlag(t)]);
    toast(`ปั๊มแสตมป์ ${t.place} แล้ว! 🎉`);
  };
  const remove = async () => {
    if (!await confirmSheet({ message: `ลบทริป “${t.place}”?`, ok: 'ลบทริป' })) return;
    await deletePhotos(t.photos);
    await coll.remove('trips', t.id);
    close();
    toast('ลบทริปแล้ว');
  };

  return (
    <>
      {t.photos.length > 0 && (
        <div className={`gallery ${t.photos.length > 1 ? 'multi' : ''}`}>
          {t.photos.map((ph, i) => <Photo key={ph} id={ph} onClick={() => openLightbox(t.photos, i)} />)}
        </div>
      )}
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        <span className={`chip ${st.color}`}>{st.emoji} {st.label}</span>
        <span className={`chip ${t.scope === 'international' ? 'pink' : 'mint'}`}>{t.scope === 'international' ? '🌏 ต่างประเทศ' : '🇹🇭 ในประเทศ'}</span>
        {left >= 0 && <span className="chip yellow">⏳ {countdown(left)}</span>}
      </div>
      <h2 className="detail-title">{tripFlag(t)} {t.place}</h2>
      <dl className="kv">
        <dt>📍 ที่ไหน</dt><dd>{tripFlag(t)} {tripWhere(t)}</dd>
        <dt>📅 วันที่</dt><dd>{t.startDate ? fmtRange(t.startDate, t.endDate) + (t.endDate && t.endDate !== t.startDate ? ` (${diffDays(t.startDate, t.endDate) + 1} วัน)` : '') : 'ยังไม่กำหนด'}</dd>
        {!!t.budget && <><dt>💰 งบ</dt><dd>฿{Number(t.budget).toLocaleString()}</dd></>}
      </dl>
      {t.note && <div className="note">{t.note}</div>}

      {t.status !== 'done' && <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={markDone}>✅ ไปมาแล้ว! ปั๊มแสตมป์</button>}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ ลบ</button>
        <button className="btn btn-ghost" onClick={() => { close(); openTripForm(t); }}>✏️ แก้ไข</button>
      </div>
    </>
  );
}

export function openTripForm(t?: Trip, preset: Partial<Trip> = {}) {
  openSheet({ title: t ? 'แก้ไขทริป' : 'เพิ่มทริปใหม่ 🧳', render: close => <TripForm initial={t} preset={preset} close={close} /> });
}

function TripForm({ initial, preset, close }: { initial?: Trip; preset: Partial<Trip>; close: () => void }) {
  const [t, setT] = useState<Partial<Trip>>(() => initial ? { ...initial } : {
    scope: 'domestic', status: preset.startDate ? 'planned' : 'wish', country: 'JP', ...preset,
  });
  const draft = usePhotoDraft(initial?.photos);
  const saved = useRef(false);
  const rollback = useRef(draft.rollback);
  rollback.current = draft.rollback;
  useEffect(() => () => { if (!saved.current) rollback.current(); }, []);
  const set = <K extends keyof Trip>(k: K, v: Trip[K]) => setT(cur => ({ ...cur, [k]: v }));
  const intl = t.scope === 'international';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (draft.busy) return toast('รอรูปอัปโหลดแป๊บนึงน้า');
    if (!t.place?.trim()) return toast('ใส่ชื่อสถานที่ก่อนน้า');
    if (t.endDate && t.startDate && t.endDate < t.startDate) return toast('วันกลับต้องไม่ก่อนวันไปน้า');
    const rec = { ...t, place: t.place.trim(), startDate: t.startDate || t.endDate || '', photos: draft.ids } as Trip;
    if (rec.scope === 'domestic') { delete rec.country; delete rec.countryOther; } else delete rec.province;
    delete rec.checklist;
    await draft.commit();
    await coll.save('trips', rec);
    saved.current = true;
    close();
    toast(initial ? 'แก้ไขทริปแล้ว' : 'เพิ่มทริปแล้ว ไปเที่ยวกัน! ✈️');
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<TripScope> value={t.scope!} onChange={v => set('scope', v)} options={[['domestic', '🇹🇭 ในประเทศ'], ['international', '🌏 ต่างประเทศ']]} className="mb" />
      <Field label="จะไปที่ไหน"><input required maxLength={80} value={t.place || ''} onChange={e => set('place', e.target.value)} placeholder="เช่น ดอยอินทนนท์, โตเกียว" /></Field>
      {!intl && (
        <Field label="จังหวัด">
          <input list="provinces" value={t.province || ''} onChange={e => set('province', e.target.value)} placeholder="พิมพ์ชื่อจังหวัด" />
          <datalist id="provinces">{PROVINCES.map(p => <option key={p} value={p} />)}</datalist>
        </Field>
      )}
      {intl && (
        <Field label="ประเทศ">
          <select value={t.country} onChange={e => set('country', e.target.value)}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>)}
          </select>
        </Field>
      )}
      {intl && t.country === 'ZZ' && <Field label="ชื่อประเทศ"><input maxLength={60} value={t.countryOther || ''} onChange={e => set('countryOther', e.target.value)} /></Field>}
      <div className="field"><span>สถานะ</span>
        <Seg<TripStatus> value={t.status!} onChange={v => set('status', v)} options={entries(TRIP_STATUS).map(([k, s]) => [k, `${s.emoji} ${s.label}`])} />
      </div>
      <div className="field-row">
        <Field label="วันไป"><input type="date" value={t.startDate || ''} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label="วันกลับ"><input type="date" value={t.endDate || ''} onChange={e => set('endDate', e.target.value)} /></Field>
      </div>
      <Field label="งบประมาณ (บาท)">
        <input type="number" inputMode="numeric" min={0} value={t.budget ?? ''} onChange={e => set('budget', e.target.value ? Number(e.target.value) : '')} placeholder="เช่น 20000" />
      </Field>
      <Field label="โน้ต / ที่อยากไป / ของที่อยากกิน">
        <textarea maxLength={2000} value={t.note || ''} onChange={e => set('note', e.target.value)} placeholder="คาเฟ่ริมทะเล, ทะเลหมอก, ร้านราเมงเจ้าดัง..." />
      </Field>
      <div className="field"><span>รูปทริป (รูปแรกเป็นปก)</span><PhotoPicker draft={draft} max={9} coverHint /></div>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 บันทึกทริป</button></div>
    </form>
  );
}
