// ทริป: ดูรายละเอียด / เพิ่ม / แก้ไข
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { countdown, diffDays, fmtRange, todayStr } from '../../lib/date';
import { T } from '../../lib/i18n';
import { entries, TRIP_STATUS } from '../../lib/meta';
import { deletePhotos } from '../../lib/photos';
import { countries, countryName, flag, provinces } from '../../lib/places';
import { coll, useItem } from '../../lib/store';
import type { Trip, TripScope, TripStatus } from '../../lib/types';
import { Field, Gallery, PhotoPicker, Seg, usePhotoDraft } from '../../ui/controls';
import { burstCenter, confirmSheet, openSheet, toast } from '../../ui/overlays';

export const tripFlag = (t: Pick<Trip, 'scope' | 'country'>) => (t.scope === 'international' ? flag(t.country) : '🇹🇭');
export const tripWhere = (t: Trip) => t.scope === 'international'
  ? (t.country === 'ZZ' ? t.countryOther || T('ต่างประเทศ', 'Abroad') : countryName(t.country))
  : t.province || T('ประเทศไทย', 'Thailand');

export function openTripDetail(id: string) {
  openSheet({ title: T('ทริปของเรา', 'Our trip'), render: close => <TripDetail id={id} close={close} /> });
}

function TripDetail({ id, close }: { id: string; close: () => void }) {
  const t = useItem('trips', id);
  if (t === undefined) return null;
  if (t === null) return <p className="muted center">{T('ไม่พบทริปนี้แล้ว', 'This trip no longer exists')}</p>;
  const today = todayStr();
  const st = TRIP_STATUS[t.status];
  const left = t.startDate && t.status !== 'done' ? diffDays(today, t.startDate) : -1;
  const nights = t.startDate && t.endDate && t.endDate !== t.startDate ? diffDays(t.startDate, t.endDate) + 1 : 0;

  const markDone = async () => {
    await coll.save('trips', { ...t, status: 'done', startDate: t.startDate || today });
    close();
    burstCenter(14, ['🎉', '✈️', '💖', '📸', tripFlag(t)]);
    toast(T(`ปั๊มแสตมป์ ${t.place} แล้ว! 🎉`, `Stamped ${t.place}! 🎉`));
  };
  const remove = async () => {
    if (!await confirmSheet({ message: T(`ลบทริป “${t.place}”?`, `Delete the trip “${t.place}”?`), ok: T('ลบทริป', 'Delete') })) return;
    await deletePhotos(t.photos);
    await coll.remove('trips', t.id);
    close();
    toast(T('ลบทริปแล้ว', 'Trip deleted'));
  };

  return (
    <>
      <Gallery ids={t.photos} />
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        <span className={`chip ${st.color}`}>{st.emoji} {st.label}</span>
        <span className={`chip ${t.scope === 'international' ? 'pink' : 'mint'}`}>{t.scope === 'international' ? T('🌏 ต่างประเทศ', '🌏 Abroad') : T('🇹🇭 ในประเทศ', '🇹🇭 Thailand')}</span>
        {left >= 0 && <span className="chip yellow">⏳ {countdown(left)}</span>}
      </div>
      <h2 className="detail-title">{tripFlag(t)} {t.place}</h2>
      <dl className="kv">
        <dt>📍 {T('ที่ไหน', 'Where')}</dt><dd>{tripFlag(t)} {tripWhere(t)}</dd>
        <dt>📅 {T('วันที่', 'When')}</dt><dd>{t.startDate ? fmtRange(t.startDate, t.endDate) + (nights ? T(` (${nights} วัน)`, ` (${nights} days)`) : '') : T('ยังไม่กำหนด', 'Not set yet')}</dd>
        {!!t.budget && <><dt>💰 {T('งบ', 'Budget')}</dt><dd>฿{Number(t.budget).toLocaleString()}</dd></>}
      </dl>
      {t.note && <div className="note">{t.note}</div>}

      {t.status !== 'done' && <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={markDone}>{T('✅ ไปมาแล้ว! ปั๊มแสตมป์', '✅ We went! Stamp it')}</button>}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn btn-danger" onClick={remove}>🗑️ {T('ลบ', 'Delete')}</button>
        <button className="btn btn-ghost" onClick={() => { close(); openTripForm(t); }}>✏️ {T('แก้ไข', 'Edit')}</button>
      </div>
    </>
  );
}

export function openTripForm(t?: Trip, preset: Partial<Trip> = {}) {
  openSheet({ title: t ? T('แก้ไขทริป', 'Edit trip') : T('เพิ่มทริปใหม่ 🧳', 'New trip 🧳'), render: close => <TripForm initial={t} preset={preset} close={close} /> });
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
    if (draft.busy) return toast(T('รอรูปอัปโหลดแป๊บนึงน้า', 'Photos are still uploading…'));
    if (!t.place?.trim()) return toast(T('ใส่ชื่อสถานที่ก่อนน้า', 'Please enter a place'));
    if (t.endDate && t.startDate && t.endDate < t.startDate) return toast(T('วันกลับต้องไม่ก่อนวันไปน้า', 'Return date must be after departure'));
    const rec = { ...t, place: t.place.trim(), startDate: t.startDate || t.endDate || '', photos: draft.ids } as Trip;
    delete rec.checklist;
    if (rec.scope === 'domestic') { delete rec.country; delete rec.countryOther; } else delete rec.province;
    await draft.commit();
    await coll.save('trips', rec);
    saved.current = true;
    close();
    toast(initial ? T('แก้ไขทริปแล้ว', 'Trip updated') : T('เพิ่มทริปแล้ว ไปเที่ยวกัน! ✈️', "Trip added — let's go! ✈️"));
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <Seg<TripScope> value={t.scope!} onChange={v => set('scope', v)} options={[['domestic', T('🇹🇭 ในประเทศ', '🇹🇭 Thailand')], ['international', T('🌏 ต่างประเทศ', '🌏 Abroad')]]} className="mb" />
      <Field label={T('จะไปที่ไหน', 'Where to?')}>
        <input required maxLength={80} value={t.place || ''} onChange={e => set('place', e.target.value)} placeholder={T('เช่น ดอยอินทนนท์, โตเกียว', 'e.g. Doi Inthanon, Tokyo')} />
      </Field>
      {!intl && (
        <Field label={T('จังหวัด', 'Province')}>
          <input list="provinces" value={t.province || ''} onChange={e => set('province', e.target.value)} placeholder={T('พิมพ์ชื่อจังหวัด', 'Type a province')} />
          <datalist id="provinces">{provinces().map(p => <option key={p} value={p} />)}</datalist>
        </Field>
      )}
      {intl && (
        <Field label={T('ประเทศ', 'Country')}>
          <select value={t.country} onChange={e => set('country', e.target.value)}>
            {countries().map(c => <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>)}
          </select>
        </Field>
      )}
      {intl && t.country === 'ZZ' && <Field label={T('ชื่อประเทศ', 'Country name')}><input maxLength={60} value={t.countryOther || ''} onChange={e => set('countryOther', e.target.value)} /></Field>}
      <div className="field"><span>{T('สถานะ', 'Status')}</span>
        <Seg<TripStatus> value={t.status!} onChange={v => set('status', v)} options={entries(TRIP_STATUS).map(([k, s]) => [k, `${s.emoji} ${s.label}`])} />
      </div>
      <div className="field-row">
        <Field label={T('วันไป', 'Departure')}><input type="date" value={t.startDate || ''} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label={T('วันกลับ', 'Return')}><input type="date" value={t.endDate || ''} onChange={e => set('endDate', e.target.value)} /></Field>
      </div>
      <Field label={T('งบประมาณ (บาท)', 'Budget (THB)')}>
        <input type="number" inputMode="numeric" min={0} value={t.budget ?? ''} onChange={e => set('budget', e.target.value ? Number(e.target.value) : '')} placeholder={T('เช่น 20000', 'e.g. 20000')} />
      </Field>
      <Field label={T('โน้ต / ที่อยากไป / ของที่อยากกิน', 'Notes / places / food to try')}>
        <textarea maxLength={2000} value={t.note || ''} onChange={e => set('note', e.target.value)} placeholder={T('คาเฟ่ริมทะเล, ทะเลหมอก, ร้านราเมงเจ้าดัง...', 'Seaside café, sea of mist, famous ramen…')} />
      </Field>
      <div className="field"><span>{T('รูปทริป (รูปแรกเป็นปก)', 'Trip photos (first one is the cover)')}</span><PhotoPicker draft={draft} max={9} coverHint /></div>
      <div className="sheet-actions"><button className="btn btn-primary btn-block" type="submit">💾 {T('บันทึกทริป', 'Save trip')}</button></div>
    </form>
  );
}
