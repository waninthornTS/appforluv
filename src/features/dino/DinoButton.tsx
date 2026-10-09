// ไอคอนไดโนมุมขวาบนของหน้าแรก → เข้าเกมเลี้ยงไดโน (มีจุด ! เมื่อไดโนต้องการการดูแล)
import { useNow } from '../../lib/sky';
import { useCollection } from '../../lib/store';
import { activeDino, anyNeed, view } from './logic';
import { DinoSprite } from './Sprite';

export function DinoButton() {
  const all = useCollection('dino');
  const now = +useNow(60_000);
  const d = all && activeDino(all);
  const v = d && view(d, now);
  const alert = !all ? false : !d || (v ? anyNeed(v, now) : false);
  return (
    <a className="dino-btn" href="#dino" aria-label="เลี้ยงไดโน">
      <span className="disc">
        {d && v ? <DinoSprite species={d.species} stage={v.stage} size={v.stage === 'egg' ? 70 : 66} /> : <span className="emo">🥚</span>}
      </span>
      {alert && <span className="dot">!</span>}
    </a>
  );
}
