// แผงเพิ่ม "ชอบ / ไม่ชอบ" — เลือกคน เลือกหมวด พิมพ์เอง หรือแตะคำแนะนำ เพิ่มได้หลายรายการต่อเนื่อง
import { useRef, useState, type FormEvent } from 'react';
import { ABOUT_CATS, ABOUT_SUGGEST, entries } from '../../lib/meta';
import { coll, PROFILE, useCollection } from '../../lib/store';
import type { AboutCat, Who } from '../../lib/types';
import { Seg } from '../../ui/controls';
import { openSheet, toast } from '../../ui/overlays';

export function openAboutSheet(who: Who, cat: AboutCat) {
  openSheet({ title: 'เพิ่มสิ่งที่ชอบ / ไม่ชอบ', render: close => <AboutSheet initialWho={who} initialCat={cat} close={close} /> });
}

function AboutSheet({ initialWho, initialCat, close }: { initialWho: Who; initialCat: AboutCat; close: () => void }) {
  const about = useCollection('about');
  const [who, setWho] = useState(initialWho);
  const [cat, setCat] = useState(initialCat);
  const [text, setText] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const existing = new Set((about || []).filter(a => a.who === who && a.cat === cat).map(a => a.text));
  const suggestions = ABOUT_SUGGEST[cat].filter(s => !existing.has(s));
  const c = ABOUT_CATS[cat];

  const add = async (value: string) => {
    const t = value.trim();
    if (!t) return;
    if (existing.has(t)) return toast('มีอยู่แล้วน้า');
    await coll.save('about', { who, cat, text: t });
    setAdded(cur => [t, ...cur].slice(0, 6));
    setText('');
  };
  const submit = (e: FormEvent) => { e.preventDefault(); add(text); input.current?.focus(); };

  return (
    <div className="about-sheet">
      <Seg<Who> value={who} onChange={setWho} options={[['A', `👓 ${PROFILE.nameA}`], ['B', `🧸 ${PROFILE.nameB}`]]} />

      <div className="cat-tiles">
        {entries(ABOUT_CATS).map(([k, m]) => (
          <button key={k} type="button" className={`cat-tile ${m.color} ${k === cat ? 'on' : ''}`} onClick={() => setCat(k)}>
            <span className="emo">{m.emoji}</span>{m.label}
          </button>
        ))}
      </div>

      <form className="composer" onSubmit={submit}>
        <span className={`composer-ico ${c.color}`}>{c.emoji}</span>
        <input ref={input} value={text} onChange={e => setText(e.target.value)} maxLength={40}
          placeholder={`พิมพ์เอง ${c.ph}`} autoComplete="off" enterKeyHint="done" />
        <button className="btn btn-primary btn-sm" disabled={!text.trim()}>เพิ่ม</button>
      </form>

      {suggestions.length > 0 && (
        <>
          <div className="hint-label">แตะเพื่อเพิ่มเร็วๆ</div>
          <div className="suggest">
            {suggestions.map(s => <button key={s} type="button" className={`sug ${c.color}`} onClick={() => add(s)}>＋ {s}</button>)}
          </div>
        </>
      )}

      {added.length > 0 && (
        <div className="added-note">✅ เพิ่มแล้ว: {added.join(', ')}</div>
      )}

      <div className="sheet-actions"><button className="btn btn-ghost btn-block" type="button" onClick={close}>เสร็จแล้ว</button></div>
    </div>
  );
}
