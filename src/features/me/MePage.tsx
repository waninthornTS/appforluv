// หน้า "เรา": Ploy & Dream — วันเกิด อายุ และสิ่งที่ชอบ/ไม่ชอบ
import { useState } from 'react';
import { Character } from '../../characters/Character';
import { diffDays, fmtDate, nextYearly, todayStr, ymd } from '../../lib/date';
import { ABOUT_CATS, entries } from '../../lib/meta';
import { coll, PROFILE, useCollection } from '../../lib/store';
import type { AboutCat, AboutItem, Who } from '../../lib/types';
import { Seg } from '../../ui/controls';
import { confirmSheet, toast } from '../../ui/overlays';
import { openAboutSheet } from './AboutSheet';
import { useSync } from '../../lib/sync';

let lastWho: Who = 'A';

function PrefCard({ who, cat, items }: { who: Who; cat: AboutCat; items: AboutItem[] }) {
  const c = ABOUT_CATS[cat];
  const remove = async (a: AboutItem) => {
    if (!await confirmSheet({ title: 'ลบรายการนี้?', message: `ลบ “${a.text}” ออกจาก${c.label}`, emoji: c.emoji, ok: 'ลบ' })) return;
    await coll.remove('about', a.id);
    toast('ลบแล้ว');
  };
  return (
    <section className={`card pref-card ${c.color}`}>
      <div className="pref-head">
        <span className="pref-ico">{c.emoji}</span>
        <h3>{c.label}</h3>
        {items.length > 0 && <span className="pref-count">{items.length}</span>}
        <button className="pref-add" onClick={() => openAboutSheet(who, cat)} aria-label={`เพิ่ม${c.label}`}>＋</button>
      </div>
      {items.length ? (
        <div className="tags">
          {items.map(a => <button key={a.id} className={`tag ${c.color}`} onClick={() => remove(a)}>{a.text}</button>)}
        </div>
      ) : (
        <button className="pref-empty" onClick={() => openAboutSheet(who, cat)}>ยังไม่มีรายการ · แตะเพื่อเพิ่ม</button>
      )}
    </section>
  );
}

function SyncFooter() {
  const sync = useSync();
  if (sync.mode === 'local') return null;
  const label = sync.status === 'offline' ? '📴 ออฟไลน์อยู่ · จะซิงก์ให้เมื่อต่อเน็ต'
    : sync.status === 'error' ? '⚠️ ซิงก์ไม่สำเร็จ · กำลังลองใหม่'
    : sync.pending || sync.status === 'syncing' ? `🔄 กำลังซิงก์${sync.pending ? ` (${sync.pending})` : ''}...`
    : '☁️ ข้อมูลตรงกันทั้งสองเครื่องแล้ว';
  return (
    <div className="sync-footer">
      <span className={`sync-dot ${sync.status}`} />
      <span className="grow">{label}<span className="sub">บันทึกที่เครื่องไหน อีกเครื่องก็เห็นทันที</span></span>
    </div>
  );
}

function SameCard({ about }: { about: AboutItem[] }) {
  const same = (['likeDo', 'likeEat'] as AboutCat[]).flatMap(cat => {
    const a = new Set(about.filter(x => x.who === 'A' && x.cat === cat).map(x => x.text));
    return about.filter(x => x.who === 'B' && x.cat === cat && a.has(x.text)).map(x => ({ cat, text: x.text }));
  });
  if (!same.length) return null;
  return (
    <section className="card same-card">
      <div className="pref-head"><span className="pref-ico">💞</span><h3>ชอบเหมือนกัน</h3><span className="pref-count">{same.length}</span></div>
      <div className="tags">{same.map(x => <span key={x.cat + x.text} className="tag pink">{ABOUT_CATS[x.cat].emoji} {x.text}</span>)}</div>
    </section>
  );
}

export default function MePage() {
  const about = useCollection('about');
  const [who, setWhoS] = useState<Who>(lastWho);
  const setWho = (w: Who) => { lastWho = w; setWhoS(w); };

  const today = todayStr();
  const name = who === 'A' ? PROFILE.nameA : PROFILE.nameB;
  const birth = who === 'A' ? PROFILE.birthA : PROFILE.birthB;
  const bdLeft = diffDays(today, nextYearly(birth, today));
  const days = diffDays(PROFILE.startDate, today) + 1;
  const mine = (about || []).filter(a => a.who === who).sort((x, y) => x.createdAt - y.createdAt);


  return (
    <>
      <header className="page-head"><div><h1>เราสองคน 💞</h1></div></header>

      <Seg<Who> value={who} onChange={setWho} options={[['A', `👓 ${PROFILE.nameA}`], ['B', `🧸 ${PROFILE.nameB}`]]} />

      <section className="card profile-card">
        <div className="pc-char"><Character who={who === 'A' ? 'ploy' : 'dream'} /></div>
        <div className="grow">
          <h2>{name}</h2>
          <div className="small muted">🎂 เกิด {fmtDate(birth, { long: true })}</div>
          <div className="small muted">อายุ {ymd(birth, today).y} ปี</div>
          <div className="small muted">💕 คบกันมาแล้ว {days.toLocaleString()} วัน</div>
          <span className={`chip ${bdLeft <= 30 ? 'pink' : 'lav'}`} style={{ marginTop: 8 }}>{bdLeft === 0 ? 'วันนี้วันเกิด! 🎉' : `วันเกิดอีก ${bdLeft} วัน`}</span>
        </div>
      </section>

      <div className="section-title" style={{ marginTop: 22 }}><h2>ชอบ · ไม่ชอบ</h2><span className="small muted">แตะรายการเพื่อลบ</span></div>
      {about && entries(ABOUT_CATS).map(([k]) => <PrefCard key={k} who={who} cat={k} items={mine.filter(a => a.cat === k)} />)}
      {about && <SameCard about={about} />}

      <SyncFooter />
      <p className="center small muted" style={{ marginTop: 28 }}>Ploy 💗 Dream · Our Little World v2</p>
    </>
  );
}
