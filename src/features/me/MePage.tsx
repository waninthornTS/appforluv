// หน้า "เรา": Ploy & Dream — วันเกิด อายุ สิ่งที่ชอบ/ไม่ชอบ และเลือกภาษา
import { useState } from 'react';
import { Character } from '../../characters/Character';
import { diffDays, fmtDate, nextYearly, todayStr, ymd } from '../../lib/date';
import { setLang, T, useLang, type Lang } from '../../lib/i18n';
import { ABOUT_CATS, entries } from '../../lib/meta';
import { coll, PROFILE, useCollection } from '../../lib/store';
import type { AboutCat, AboutItem, Who } from '../../lib/types';
import { Seg } from '../../ui/controls';
import { confirmSheet, toast } from '../../ui/overlays';
import { openAboutSheet } from './AboutSheet';

let lastWho: Who = 'A';

function PrefCard({ who, cat, items }: { who: Who; cat: AboutCat; items: AboutItem[] }) {
  const c = ABOUT_CATS[cat];
  const remove = async (a: AboutItem) => {
    if (!await confirmSheet({ title: T('ลบรายการนี้?', 'Remove this?'), message: T(`ลบ “${a.text}” ออกจาก${c.label}`, `Remove “${a.text}” from ${c.label}`), emoji: c.emoji, ok: T('ลบ', 'Remove') })) return;
    await coll.remove('about', a.id);
    toast(T('ลบแล้ว', 'Removed'));
  };
  return (
    <section className={`card pref-card ${c.color}`}>
      <div className="pref-head">
        <span className="pref-ico">{c.emoji}</span>
        <h3>{c.label}</h3>
        {items.length > 0 && <span className="pref-count">{items.length}</span>}
        <button className="pref-add" onClick={() => openAboutSheet(who, cat)} aria-label={T(`เพิ่ม${c.label}`, `Add to ${c.label}`)}>＋</button>
      </div>
      {items.length ? (
        <div className="tags">
          {items.map(a => <button key={a.id} className={`tag ${c.color}`} onClick={() => remove(a)}>{a.text}</button>)}
        </div>
      ) : (
        <button className="pref-empty" onClick={() => openAboutSheet(who, cat)}>{T('ยังไม่มีรายการ · แตะเพื่อเพิ่ม', 'Nothing yet · tap to add')}</button>
      )}
    </section>
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
      <div className="pref-head"><span className="pref-ico">💞</span><h3>{T('ชอบเหมือนกัน', 'We both love')}</h3><span className="pref-count">{same.length}</span></div>
      <div className="tags">{same.map(x => <span key={x.cat + x.text} className="tag pink">{ABOUT_CATS[x.cat].emoji} {x.text}</span>)}</div>
    </section>
  );
}

function LanguageCard() {
  const lang = useLang();
  const opts: [Lang, string, string][] = [['th', '🇹🇭', 'ภาษาไทย'], ['en', '🇬🇧', 'English']];
  return (
    <section className="card lang-card">
      <div className="pref-head"><span className="pref-ico">🌐</span><h3>{T('ภาษา', 'Language')}</h3></div>
      <div className="lang-options">
        {opts.map(([code, fl, label]) => (
          <button key={code} className={`lang-opt ${lang === code ? 'on' : ''}`} onClick={() => setLang(code)} aria-pressed={lang === code}>
            <span className="fl">{fl}</span>{label}
          </button>
        ))}
      </div>
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
  const age = ymd(birth, today).y;
  const mine = (about || []).filter(a => a.who === who).sort((x, y) => x.createdAt - y.createdAt);

  return (
    <>
      <header className="page-head"><div><h1>{T('เราสองคน 💞', 'Us two 💞')}</h1></div></header>

      <Seg<Who> value={who} onChange={setWho} options={[['A', `👓 ${PROFILE.nameA}`], ['B', `🧸 ${PROFILE.nameB}`]]} />

      <section className="card profile-card">
        <div className="pc-char"><Character who={who === 'A' ? 'ploy' : 'dream'} /></div>
        <div className="grow">
          <h2>{name}</h2>
          <div className="small muted">🎂 {T('เกิด', 'Born')} {fmtDate(birth, { long: true })}</div>
          <div className="small muted">{T(`อายุ ${age} ปี`, `${age} years old`)}</div>
          <div className="small muted">💕 {T(`คบกันมาแล้ว ${days.toLocaleString()} วัน`, `Together ${days.toLocaleString()} days`)}</div>
          <span className={`chip ${bdLeft <= 30 ? 'pink' : 'lav'}`} style={{ marginTop: 8 }}>
            {bdLeft === 0 ? T('วันนี้วันเกิด! 🎉', 'Birthday today! 🎉') : T(`วันเกิดอีก ${bdLeft} วัน`, `Birthday in ${bdLeft} days`)}
          </span>
        </div>
      </section>

      <div className="section-title" style={{ marginTop: 22 }}><h2>{T('ชอบ · ไม่ชอบ', 'Likes · Dislikes')}</h2><span className="small muted">{T('แตะรายการเพื่อลบ', 'Tap an item to remove')}</span></div>
      {about && entries(ABOUT_CATS).map(([k]) => <PrefCard key={k} who={who} cat={k} items={mine.filter(a => a.cat === k)} />)}
      {about && <SameCard about={about} />}

      <LanguageCard />
    </>
  );
}
