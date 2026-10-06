import { useMemo, useState } from 'react';
import { countdown, diffDays, fmtRange, todayStr } from '../../lib/date';
import { entries, TRIP_STATUS } from '../../lib/meta';
import { useCollection } from '../../lib/store';
import type { TripScope, TripStatus } from '../../lib/types';
import { Photo, Seg } from '../../ui/controls';
import { Fab } from '../../ui/TabBar';
import { openTripDetail, openTripForm, tripFlag, tripWhere } from './sheets';

const ORDER: Record<TripStatus, number> = { planned: 0, wish: 1, done: 2 };
let lastScope: TripScope | 'all' = 'all';
let lastStatus: TripStatus | 'all' = 'all';

export default function TravelPage() {
  const trips = useCollection('trips');
  const [scope, setScopeS] = useState(lastScope);
  const [status, setStatusS] = useState(lastStatus);
  const setScope = (v: typeof scope) => { lastScope = v; setScopeS(v); };
  const setStatus = (v: typeof status) => { lastStatus = v; setStatusS(v); };
  const today = todayStr();

  const all = useMemo(() => [...(trips || [])].sort((a, b) => ORDER[a.status] - ORDER[b.status]
    || (a.status === 'done' ? (b.startDate || '').localeCompare(a.startDate || '') : (a.startDate || '9').localeCompare(b.startDate || '9'))), [trips]);
  const done = all.filter(t => t.status === 'done');
  const countries = new Set(done.filter(t => t.scope === 'international').map(t => (t.country === 'ZZ' ? t.countryOther : t.country)).filter(Boolean));
  const provinces = new Set(done.filter(t => t.scope === 'domestic' && t.province).map(t => t.province));
  const list = all.filter(t => (scope === 'all' || t.scope === scope) && (status === 'all' || t.status === status));

  return (
    <>
      <header className="page-head"><div><h1>ทริปของเรา ✈️</h1></div></header>
      <section className="card passport">
        <div className="lbl">PLOY &amp; DREAM TRAVEL PASSPORT</div>
        <h2>ไปมาแล้วด้วยกัน</h2>
        <div className="pstats">
          <div><b>{countries.size}</b><span>🌏 ประเทศ</span></div>
          <div><b>{provinces.size}</b><span>🇹🇭 จังหวัด</span></div>
          <div><b>{all.length - done.length}</b><span>🧳 รอไป</span></div>
        </div>
      </section>

      {done.length > 0 && (
        <section className="section">
          <div className="section-title"><h2>แสตมป์ของเรา</h2><span className="small muted">{done.length} ทริป</span></div>
          <div className="hscroll" style={{ paddingTop: 8, paddingBottom: 14 }}>
            {done.map(t => (
              <button key={t.id} className="stamp" onClick={() => openTripDetail(t.id)}>
                <div className="f">{tripFlag(t)}</div><div className="n">{t.place}</div><div className="y">{t.startDate ? +t.startDate.slice(0, 4) + 543 : ''}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <Seg value={scope} onChange={setScope} options={[['all', 'ทั้งหมด'], ['domestic', '🇹🇭 ในประเทศ'], ['international', '🌏 ต่างประเทศ']]} className="mt" />
      <div className="chips" style={{ marginTop: 10 }}>
        <button className={`filter-chip ${status === 'all' ? 'active' : ''}`} onClick={() => setStatus('all')}>ทุกสถานะ</button>
        {entries(TRIP_STATUS).map(([k, s]) => (
          <button key={k} className={`filter-chip ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>{s.emoji} {s.label} ({all.filter(t => t.status === k).length})</button>
        ))}
      </div>

      {trips && (list.length ? (
        <div className="trips" style={{ marginTop: 8 }}>
          {list.map(t => {
            const st = TRIP_STATUS[t.status];
            const left = t.startDate && t.status !== 'done' ? diffDays(today, t.startDate) : -1;
            return (
              <button key={t.id} className={`card trip-card ${t.scope === 'international' ? 'intl' : ''}`} onClick={() => openTripDetail(t.id)}>
                <div className="cover">
                  {t.photos[0] ? <Photo id={t.photos[0]} /> : tripFlag(t)}
                  <span className={`chip ${st.color}`}>{st.emoji} {st.label}</span>
                  {left >= 0 && <span className="chip cd">{countdown(left)}</span>}
                </div>
                <div className="body">
                  <div className="t">{tripFlag(t)} {t.place}</div>
                  <div className="s">{tripWhere(t)}{t.startDate ? ` · ${fmtRange(t.startDate, t.endDate)}` : ' · ยังไม่กำหนดวัน'}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card empty" style={{ marginTop: 12 }}><div className="emo">🗺️</div><p>ยังไม่มีทริปในหมวดนี้<br />อยากไปไหนด้วยกัน กด ＋ จดไว้เลย!</p></div>
      ))}
      <Fab onClick={() => openTripForm(undefined, scope !== 'all' ? { scope } : {})} />
    </>
  );
}
