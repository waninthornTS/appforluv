import { useMemo, useState } from 'react';
import { addDays, countdown, diffDays, fmtDate, nextYearly, todayStr, ymd } from '../../lib/date';
import { T } from '../../lib/i18n';
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
  list.push({ emo: '💯', t: T(`ครบ ${n100.toLocaleString()} วัน`, `${n100.toLocaleString()} days`), date: addDays(PROFILE.startDate, n100 - 1) });
  const ann = nextYearly(PROFILE.startDate, today);
  const years = +ann.slice(0, 4) - +PROFILE.startDate.slice(0, 4);
  if (years > 0) list.push({ emo: '💍', t: T(`ครบรอบ ${years} ปี`, `${years}-year anniversary`), date: ann });
  const n1000 = Math.ceil(days / 1000) * 1000;
  if (n1000 > n100) list.push({ emo: '🏆', t: T(`ครบ ${n1000.toLocaleString()} วัน`, `${n1000.toLocaleString()} days`), date: addDays(PROFILE.startDate, n1000 - 1) });
  list.push({ emo: '🎂', t: T(`วันเกิด ${PROFILE.nameA}`, `${PROFILE.nameA}'s birthday`), date: nextYearly(PROFILE.birthA, today) });
  list.push({ emo: '🎂', t: T(`วันเกิด ${PROFILE.nameB}`, `${PROFILE.nameB}'s birthday`), date: nextYearly(PROFILE.birthB, today) });
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
      key: t.id, date: t.startDate!, title: T(`ทริป ${t.place}`, `Trip: ${t.place}`), emo: '✈️', color: 'mint' as Color, sub: t.scope === 'international' ? T('ต่างประเทศ', 'Abroad') : T('ในประเทศ', 'Thailand'), href: '#travel',
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
          <div className="small">{T('ติดตั้งเป็นแอป: กดปุ่ม ', 'Install as an app: tap ')}<b>{T('แชร์', 'Share')}</b>{T(' ด้านล่าง แล้วเลือก ', ' below, then choose ')}<b>{T('“เพิ่มไปยังหน้าจอโฮม”', '“Add to Home Screen”')}</b></div>
          <button className="x" aria-label={T('ปิด', 'Close')} onClick={() => { try { localStorage.setItem('hideInstallHint', '1'); } catch { /* ignore */ } setHideHint(true); }}>✕</button>
        </div>
      )}

      <header className="page-head">
        <div className="grow">
          <h1 className="ellipsis">{PROFILE.nameA} <span className="amp">♥</span> {PROFILE.nameB}</h1>
        </div>
      </header>

      <Scene sky={sky} days={days} />

      <section className="card counter">
        <div className="label">{T('เรารักกันมาแล้ว', "We've been in love for")}</div>
        <div className="num">{days.toLocaleString()} <small>{T('วัน', 'days')}</small></div>
        <div className="ymd">
          <div><b>{span.y}</b><span>{T('ปี', 'yrs')}</span></div><div><b>{span.m}</b><span>{T('เดือน', 'mos')}</span></div><div><b>{span.d}</b><span>{T('วัน', 'days')}</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 10, position: 'relative' }}>{T('ตั้งแต่ ', 'Since ')}{fmtDate(PROFILE.startDate, { long: true, weekday: true })}</p>
      </section>

      <section className="section">
        <div className="section-title"><h2>{T('วันสำคัญที่กำลังมา', 'Coming up')}</h2></div>
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
        <div className="section-title"><h2>{T('นัดถัดไปของเรา', 'Our next plans')}</h2><a href="#calendar">{T('ดูปฏิทิน', 'Calendar')}</a></div>
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
        ) : events && <a className="card empty" href="#calendar" style={{ display: 'block' }}><div className="emo">🗓️</div><p>{T('ยังไม่มีนัดเลย ลองเพิ่มนัดเดทดูสิ', 'No plans yet — add a date!')}</p></a>}
      </section>

      <section className="section">
        <div className="section-title"><h2>{T('ความทรงจำล่าสุด', 'Latest memories')}</h2><a href="#diary">{T('ทั้งหมด', 'See all')}</a></div>
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
        ) : memories && <a className="card empty" href="#diary" style={{ display: 'block' }}><div className="emo">🎬</div><p>{T('วันนี้ไปดูหนังเรื่องอะไรมา? มาจดไว้กัน', 'What movie did we watch today? Write it down!')}</p></a>}
      </section>
    </>
  );
}
