// คอมโพเนนต์เล็กๆ ที่ใช้ซ้ำ: ปุ่มแบ่งส่วน, ให้หัวใจ, รูปจาก IndexedDB, ตัวเลือกรูป
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { T } from '../lib/i18n';
import { deletePhotos, savePhoto, usePhotoURL } from '../lib/photos';
import { openLightbox, toast } from './overlays';

export function Seg<T extends string>({ value, options, onChange, className = '' }: {
  value: T; options: [T, string][]; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={`seg ${className}`}>
      {options.map(([v, label]) => (
        <button key={v} type="button" className={v === value ? 'active' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

export function HeartsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="hearts-input">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" className={i <= value ? 'on' : ''} aria-label={T(`${i} หัวใจ`, `${i} hearts`)} onClick={() => onChange(i === value ? 0 : i)}>💗</button>
      ))}
    </div>
  );
}

export const Hearts = ({ n }: { n?: number }) => (n ? <span className="hearts">{'♥'.repeat(n)}<span style={{ opacity: 0.25 }}>{'♥'.repeat(5 - n)}</span></span> : null);

export function Photo({ id, className, onClick }: { id: string; className?: string; onClick?: () => void }) {
  const url = usePhotoURL(id);
  return url ? <img src={url} alt="" className={className} onClick={onClick} loading="lazy" decoding="async" /> : null;
}

/**
 * จัดการรูปในฟอร์ม
 * - รูปที่เพิ่มใหม่จะถูกบันทึกทันที ถ้ายกเลิกฟอร์มจะลบทิ้ง (rollback)
 * - รูปเดิมที่กดลบ จะลบจริงตอนกดบันทึก (commit)
 */
export function usePhotoDraft(initial: string[] = []) {
  const [ids, setIds] = useState(initial);
  const [loading, setLoading] = useState(0);
  const added = useRef(new Set<string>());
  const removed = useRef(new Set<string>());

  const add = useCallback(async (files: File[]) => {
    setLoading(n => n + files.length);
    for (const f of files) {
      try {
        const id = await savePhoto(f);
        added.current.add(id);
        setIds(cur => [...cur, id]);
      } catch {
        toast(T('อัปโหลดรูปไม่สำเร็จ 😢', 'Photo upload failed 😢'));
      }
      setLoading(n => n - 1);
    }
  }, []);
  const remove = useCallback((id: string) => {
    setIds(cur => cur.filter(x => x !== id));
    if (added.current.has(id)) { added.current.delete(id); deletePhotos([id]); } else removed.current.add(id);
  }, []);
  const commit = useCallback(async () => { await deletePhotos([...removed.current]); added.current.clear(); removed.current.clear(); }, []);
  const rollback = useCallback(async () => { await deletePhotos([...added.current]); added.current.clear(); }, []);
  return { ids, loading, busy: loading > 0, add, remove, commit, rollback };
}
export type PhotoDraft = ReturnType<typeof usePhotoDraft>;

export function PhotoPicker({ draft, max = 6, label = T('เพิ่มรูป', 'Add photo'), coverHint = false }: { draft: PhotoDraft; max?: number; label?: string; coverHint?: boolean }) {
  const left = max - draft.ids.length - draft.loading;
  return (
    <div className="photo-grid">
      {draft.ids.map((id, i) => (
        <div key={id} className={`photo-tile ${coverHint && i === 0 ? 'cover' : ''}`}>
          <Photo id={id} />
          <button type="button" className="rm" onClick={() => draft.remove(id)} aria-label={T('ลบรูป', 'Remove photo')}>✕</button>
        </div>
      ))}
      {Array.from({ length: draft.loading }, (_, i) => <div key={`l${i}`} className="photo-tile loading"><div className="spinner" /></div>)}
      {left > 0 && (
        <label className="photo-add"><b>＋</b>{label}
          <input type="file" accept="image/*" multiple={left > 1}
            onChange={e => { const files = [...(e.target.files || [])].slice(0, left); e.target.value = ''; draft.add(files); }} />
        </label>
      )}
    </div>
  );
}

/** แกลเลอรีรูป: เลื่อนซ้าย-ขวาทีละรูป รูปเต็มกว้างและอยู่กึ่งกลาง มีจุดบอกลำดับ แตะเพื่อดูเต็มจอ */
export function Gallery({ ids }: { ids: string[] }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (!ids.length) return null;
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div className="gallery-wrap">
      <div className="gallery" ref={track} onScroll={onScroll}>
        {ids.map((id, i) => <div key={id} className="gallery-slide"><Photo id={id} onClick={() => openLightbox(ids, i)} /></div>)}
      </div>
      {ids.length > 1 && (
        <div className="gallery-dots">{ids.map((id, i) => <i key={id} className={i === index ? 'on' : ''} />)}</div>
      )}
    </div>
  );
}

/** ช่องกรอกข้อมูลพร้อมป้ายชื่อ */
export const Field = ({ label, children, id }: { label: string; children: ReactNode; id?: string }) => (
  <label className="field" id={id}><span>{label}</span>{children}</label>
);
