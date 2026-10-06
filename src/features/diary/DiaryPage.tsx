import { useMemo, useState } from 'react';
import { fmtDate, monthLabel } from '../../lib/date';
import { entries, MEM_CATS } from '../../lib/meta';
import { useCollection } from '../../lib/store';
import type { MemoryCat } from '../../lib/types';
import { Hearts, Photo } from '../../ui/controls';
import { Fab } from '../../ui/TabBar';
import { openMemoryDetail, openMemoryForm } from './sheets';

let lastFilter: MemoryCat | 'all' = 'all';

export default function DiaryPage() {
  const all = useCollection('memories');
  const [filter, setFilterState] = useState(lastFilter);
  const setFilter = (f: typeof filter) => { lastFilter = f; setFilterState(f); };

  const sorted = useMemo(() => [...(all || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt), [all]);
  const list = filter === 'all' ? sorted : sorted.filter(m => m.cat === filter);
  const groups = useMemo(() => {
    const g = new Map<string, typeof list>();
    for (const m of list) {
      const key = (m.date || '').slice(0, 7);
      g.set(key, [...(g.get(key) || []), m]);
    }
    return [...g];
  }, [list]);

  return (
    <>
      <header className="page-head"><div><h1>ไดอารี่ของเรา 📔</h1></div></header>
      <div className="stats">
        <div className="card stat"><b>{sorted.filter(m => m.cat === 'movie').length}</b><span>🎬 หนังที่ดูด้วยกัน</span></div>
        <div className="card stat"><b>{sorted.length}</b><span>💌 ความทรงจำ</span></div>
        <div className="card stat"><b>{sorted.reduce((n, m) => n + m.photos.length, 0)}</b><span>📸 รูปภาพ</span></div>
      </div>
      <div className="chips" style={{ marginTop: 16 }}>
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
        {entries(MEM_CATS).map(([k, c]) => (
          <button key={k} className={`filter-chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{c.emoji} {c.label}</button>
        ))}
      </div>

      {all && (list.length ? groups.map(([key, items]) => (
        <div key={key}>
          <div className="month-label">{key ? monthLabel(key) : 'ไม่ระบุวันที่'}</div>
          <div className="polaroids">
            {items.map(m => (
              <button key={m.id} className="polaroid" onClick={() => openMemoryDetail(m.id)}>
                <div className="ph">
                  {m.photos[0] ? <><Photo id={m.photos[0]} />{m.photos.length > 1 && <span className="count">📷 {m.photos.length}</span>}</> : MEM_CATS[m.cat]?.emoji}
                </div>
                <div className="cap">
                  <div className="t">{MEM_CATS[m.cat]?.emoji} {m.title}</div>
                  <div className="d">{fmtDate(m.date)}</div>
                  <Hearts n={m.rating} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )) : (
        <div className="card empty" style={{ marginTop: 14 }}>
          <div className="emo">{filter === 'all' || filter === 'movie' ? '🍿' : MEM_CATS[filter].emoji}</div>
          <p>ยังไม่มีบันทึก{filter === 'all' ? '' : 'หมวดนี้'}<br />กดปุ่ม ＋ ด้านล่างเพื่อเพิ่มความทรงจำแรกกัน</p>
        </div>
      ))}
      <Fab onClick={() => openMemoryForm(undefined, filter !== 'all' ? { cat: filter } : {})} />
    </>
  );
}
