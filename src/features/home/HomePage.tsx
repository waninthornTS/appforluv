import { useMemo, useState } from 'react';
import { addDays, countdown, diffDays, fmtDate, nextYearly, todayStr, ymd } from '../../lib/date';
import { EVENT_TYPES, MEM_CATS } from '../../lib/meta';
import { usePeriod } from '../../lib/sky';
import { PROFILE, useCollection } from '../../lib/store';
import type { Color } from '../../lib/types';
import { Photo } from '../../ui/controls';
import { openMemoryDetail } from '../diary/sheets';
import { Scene } from './Scene';

function milestones(today: string) {
  const days = diffDays(PROFILE.startDate, today) + 1; // วันแรกที่คบ = วันที่ 1
  const list: { emo: string; t: string; date: string }[] = [];
  const n100 = Math.max(100, Math.ceil(days / 100) * 100);
  list.push({ emo: '💯', t: `ครบ ${n100.toLocaleString()} วัน`, date: addDays(PROFILE.startDate, n100 - 1) });
  const ann = nextYearly(PROFILE.startDate, today);
  const years = +ann.slice(0, 4) - +PROFILE.startDate.slice(0, 4);
  if (years > 0) list.push({ emo: '💍', t: `ครบรอบ ${years} ปี`, date: ann });
  const n1000 = Math.ceil(days / 1000) * 1000;
  if (n1000 > n100) list.push({ emo: '🏆', t: `ครบ ${n1000.toLocaleString()} วัน`, date: addDays(PROFILE.startDate, n1000 - 1) });
  list.push({ emo: '🎂', t: `วันเกิด ${PROFILE.nameA}`, date: nextYearly(PROFILE.birthA, today) });
  list.push({ emo: '🎂', t: `วันเกิด ${PROFILE.nameB}`, date: nextYearly(PROFILE.birthB, today) });
  return list.map(m => ({ ...m, left: diffDays(today, m.date) })).sort((a, b) => a.left - b.left);
}

export default function HomePage() {
  const sky = usePeriod();
  const today = todayStr();
  const events = useCollection('events');
  const trips = useCollection('trips');
  const memories = useCollection('memories');
  const days = diffDays(PROFILE.startDate, today) + 1;
  const span = ymd(PROFILE.startDate, today);

  const upcoming = useMemo(() => [
    ...(events || []).filter(e => (e.endDate || e.date) >= today).map(e => ({
      key: e.id, date: e.date, title: e.title, emo: EVENT_TYPES[e.type]?.emoji || '📌', color: (EVENT_TYPES[e.type]?.color || 'pink') as Color,
      sub: [e.time, e.place].filter(Boolean).join(' · '), href: '#calendar',
    })),
    ...(trips || []).filter(t => t.startDate && (t.endDate || t.startDate) >= today && t.status !== 'done').map(t => ({
      key: t.id, date: t.startDate!, title: `ทริป ${t.place}`, emo: '✈️', color: 'mint' as Color, sub: t.scope === 'international' ? 'ต่างประเทศ' : 'ในประเทศ', href: '#travel',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3), [events, trips, today]);

  const recent = useMemo(() => [...(memories || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6), [memories]);

  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone || matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [hideHint, setHideHint] = useState(() => { try { return localStorage.getItem('hideInstallHint') === '1'; } catch { return false; } });

  return (
    <>
      {isIOS && !standalone && !hideHint && (
        <div className="card install-hint">
          <div style={{ fontSize: 30 }}>📲</div>
          <div className="small">ติดตั้งเป็นแอป: กดปุ่ม <b>แชร์</b> ด้านล่าง แล้วเลือก <b>“เพิ่มไปยังหน้าจอโฮม”</b></div>
          <button className="x" aria-label="ปิด" onClick={() => { try { localStorage.setItem('hideInstallHint', '1'); } catch { /* ignore */ } setHideHint(true); }}>✕</button>
        </div>
      )}

      <header className="page-head">
        <div className="grow">
          <h1 className="ellipsis">{PROFILE.nameA} <span className="amp">♥</span> {PROFILE.nameB}</h1>
        </div>
      </header>

      <Scene sky={sky} days={days} />

      <section className="card counter">
        <div className="label">เรารักกันมาแล้ว</div>
        <div className="num">{days.toLocaleString()} <small>วัน</small></div>
        <div className="ymd">
          <div><b>{span.y}</b><span>ปี</span></div><div><b>{span.m}</b><span>เดือน</span></div><div><b>{span.d}</b><span>วัน</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 10, position: 'relative' }}>ตั้งแต่ {fmtDate(PROFILE.startDate, { long: true, weekday: true })}</p>
      </section>

      <section className="section">
        <div className="section-title"><h2>วันสำคัญที่กำลังมา</h2></div>
        <div className="hscroll">
          {milestones(today).map(m => (
            <div key={m.t} className="card milestone">
              <div className="emo">{m.emo}</div><div className="t">{m.t}</div><div className="d">{fmtDate(m.date)}</div>
              <div className="cd"><span className={`chip ${m.left <= 7 ? 'pink' : 'lav'}`}>{countdown(m.left)}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>นัดถัดไปของเรา</h2><a href="#calendar">ดูปฏิทิน</a></div>
        {upcoming.length ? (
          <div className="list">
            {upcoming.map(u => (
              <a key={u.key} className="card item" href={u.href}>
                <div className={`ico ${u.color}`}>{u.emo}</div>
                <div className="grow"><div className="t ellipsis">{u.title}</div><div className="s">{fmtDate(u.date, { weekday: true })}{u.sub ? ` · ${u.sub}` : ''}</div></div>
                <span className="chip">{countdown(diffDays(today, u.date))}</span>
              </a>
            ))}
          </div>
        ) : events && <a className="card empty" href="#calendar" style={{ display: 'block' }}><div className="emo">🗓️</div><p>ยังไม่มีนัดเลย ลองเพิ่มนัดเดทดูสิ</p></a>}
      </section>

      <section className="section">
        <div className="section-title"><h2>ความทรงจำล่าสุด</h2><a href="#diary">ทั้งหมด</a></div>
        {recent.length ? (
          <div className="hscroll" style={{ paddingTop: 14 }}>
            {recent.map(m => (
              <button key={m.id} className="polaroid mini" onClick={() => openMemoryDetail(m.id)}>
                <div className="tape" />
                <div className="ph">{m.photos[0] ? <Photo id={m.photos[0]} /> : MEM_CATS[m.cat]?.emoji || '💌'}</div>
                <div className="cap"><div className="t">{m.title}</div><div className="d">{fmtDate(m.date)}</div></div>
              </button>
            ))}
          </div>
        ) : memories && <a className="card empty" href="#diary" style={{ display: 'block' }}><div className="emo">🎬</div><p>วันนี้ไปดูหนังเรื่องอะไรมา? มาจดไว้กัน</p></a>}
      </section>
    </>
  );
}
