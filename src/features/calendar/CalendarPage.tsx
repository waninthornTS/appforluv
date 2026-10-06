import { useMemo, useState } from 'react';
import { addDays, countdown, diffDays, fmtDate, parse, TH_DAYS_S, TH_MONTHS, toStr, todayStr } from '../../lib/date';
import { useCollection } from '../../lib/store';
import { Fab } from '../../ui/TabBar';
import { openMemoryDetail } from '../diary/sheets';
import { openTripDetail, openTripForm } from '../travel/sheets';
import { collect, type CalItem } from './collect';
import { openEventDetail, openEventForm } from './sheets';

// จำเดือน/วันที่เลือกไว้ เวลาสลับแท็บไปมา
const now = new Date();
let lastCur = { y: now.getFullYear(), m: now.getMonth() };
let lastSel = todayStr();

const openItem = (i: CalItem) => {
  if (!i.id) return;
  if (i.kind === 'event') openEventDetail(i.id);
  else if (i.kind === 'trip') openTripDetail(i.id);
  else if (i.kind === 'memory') openMemoryDetail(i.id);
};

function Item({ i, date }: { i: CalItem; date?: string }) {
  const clickable = !!i.id;
  const body = (
    <>
      {date
        ? <div className="datebox"><b>{+date.slice(8)}</b><span>{fmtDate(date, { year: false }).split(' ')[1]}</span></div>
        : <div className={`ico ${i.color === 'red' ? 'pink' : i.color}`}>{i.emo}</div>}
      <div className="grow">
        <div className="t ellipsis">{date ? `${i.emo} ` : ''}{i.title}</div>
        {i.sub && <div className="s ellipsis">{i.sub}</div>}
      </div>
      {date && <span className="chip">{countdown(diffDays(todayStr(), date))}</span>}
    </>
  );
  return clickable
    ? <button className="card item" onClick={() => openItem(i)}>{body}</button>
    : <div className="card item">{body}</div>;
}

export default function CalendarPage() {
  const events = useCollection('events');
  const trips = useCollection('trips');
  const memories = useCollection('memories');
  const [cur, setCurS] = useState(lastCur);
  const [sel, setSelS] = useState(lastSel);
  const setCur = (c: typeof cur) => { lastCur = c; setCurS(c); };
  const setSel = (d: string) => { lastSel = d; setSelS(d); };
  const today = todayStr();

  const data = useMemo(() => ({ events: events || [], trips: trips || [], memories: memories || [] }), [events, trips, memories]);
  const first = new Date(cur.y, cur.m, 1);
  const gridStart = addDays(toStr(first), -first.getDay());
  const cellCount = new Date(cur.y, cur.m + 1, 0).getDate() + first.getDay() > 35 ? 42 : 35;
  const cells = Array.from({ length: cellCount }, (_, i) => addDays(gridStart, i));
  const map = useMemo(() => collect(data, gridStart, addDays(gridStart, 41)), [data, gridStart]);
  const selItems = useMemo(() => collect(data, sel, sel).get(sel) || [], [data, sel]);
  const upcoming = useMemo(() => [...collect(data, today, addDays(today, 60))]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([d, items]) => items.filter(i => i.kind !== 'memory' && !(i.kind === 'trip' && !i.tripStart)).map(i => ({ i, d })))
    .slice(0, 6), [data, today]);

  const nav = (delta: number) => {
    const d = new Date(cur.y, cur.m + delta, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  };
  const pick = (d: string) => {
    setSel(d);
    const dt = parse(d);
    if (dt.getMonth() !== cur.m) setCur({ y: dt.getFullYear(), m: dt.getMonth() });
  };
  const addEvent = () => openEventForm(undefined, { date: sel }, e => pick(e.date));

  return (
    <>
      <header className="page-head"><div><h1>ปฏิทินของเรา 🗓️</h1></div></header>
      <section className="card">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => nav(-1)} aria-label="เดือนก่อน">‹</button>
          <div className="center">
            <h2>{TH_MONTHS[cur.m]} {cur.y + 543}</h2>
            <button className="link today-btn" onClick={() => { const n = new Date(); setCur({ y: n.getFullYear(), m: n.getMonth() }); setSel(todayStr()); }}>กลับไปวันนี้</button>
          </div>
          <button className="icon-btn" onClick={() => nav(1)} aria-label="เดือนถัดไป">›</button>
        </div>
        <div className="cal-grid">
          {TH_DAYS_S.map(d => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map(d => {
            const items = map.get(d) || [];
            const dt = parse(d);
            const trip = items.find(i => i.kind === 'trip');
            const spec = items.find(i => i.special);
            const dots = [...new Set(items.filter(i => i.kind !== 'trip').map(i => i.color))].slice(0, 3);
            const cls = ['cal-day', dt.getMonth() !== cur.m && 'out', dt.getDay() === 0 && 'sun', d === today && 'today', d === sel && 'sel',
              trip && 'trip', trip?.tripStart && 'trip-s', trip?.tripEnd && 'trip-e'].filter(Boolean).join(' ');
            return (
              <button key={d} className={cls} onClick={() => pick(d)}>
                {dt.getDate()}
                {spec && <span className="spec">{spec.emo}</span>}
                <span className="dots">{dots.map(c => <i key={c} className={`dot-${c}`} />)}</span>
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="dot-pink" />นัดเดท</span><span><i className="dot-mint" />ทริป</span><span><i className="dot-red" />ครบรอบ</span>
          <span><i className="dot-yellow" />วันสำคัญ/วันเกิด</span><span><i className="dot-lav" />ไดอารี่</span>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>{fmtDate(sel, { weekday: true })}</h2><span className="chip">{countdown(diffDays(today, sel))}</span></div>
        {selItems.length
          ? <div className="list">{selItems.map((i, n) => <Item key={n} i={i} />)}</div>
          : <div className="card empty" style={{ padding: 18 }}><p>ยังไม่มีอะไรในวันนี้</p></div>}
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={addEvent}>💕 เพิ่มนัด</button>
          <button className="btn btn-mint" onClick={() => openTripForm(undefined, { startDate: sel })}>✈️ เพิ่มทริป</button>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>60 วันข้างหน้า</h2></div>
        {upcoming.length
          ? <div className="list">{upcoming.map(({ i, d }, n) => <Item key={n} i={i} date={d} />)}</div>
          : <div className="card empty" style={{ padding: 18 }}><p>ว่างเลย ชวนกันไปเดทหน่อยมั้ย 👀</p></div>}
      </section>
      <Fab onClick={addEvent} />
    </>
  );
}
