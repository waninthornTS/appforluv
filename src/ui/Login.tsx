// หน้าเข้าสู่ระบบ: แตะเลือกว่าเป็นใคร แล้วกดเข้าแอป — เครื่องนี้จะจำไว้จนกว่าจะกดออกจากระบบ (เมนู ☰)
import { useState } from 'react';
import { Character } from '../characters/Character';
import { login } from '../lib/auth';
import { nameOf } from '../lib/store';
import type { Who } from '../lib/types';

export function LoginPage() {
  const [pick, setPick] = useState<Who | null>(null);
  return (
    <main className="login">
      <div className="login-card">
        <h1>Login</h1>
        <div className="login-who" role="radiogroup" aria-label="เลือกว่าเป็นใคร">
          {(['A', 'B'] as const).map(w => (
            <button key={w} type="button" role="radio" aria-checked={pick === w}
              className={`login-who-btn ${w} ${pick === w ? 'on' : ''}`} onClick={() => setPick(w)}>
              <span className="pic"><Character who={w === 'A' ? 'ploy' : 'dream'} /></span>
              <span className="nm">{nameOf(w)}</span>
              {pick === w && <span className="tick" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" disabled={!pick} onClick={() => pick && login(pick)}>
          เลือก
        </button>
      </div>
    </main>
  );
}
