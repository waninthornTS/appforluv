// ค้นหาเพลงจาก Spotify (Web API แบบ PKCE — ไม่มีรหัสลับในแอป)
// เชื่อมต่อครั้งเดียวจากเครื่องไหนก็ได้ → เก็บไว้ในรายการ 'spotify' ที่ซิงก์ แล้วทั้งสองเครื่องค้นหาได้เลย
// ไม่ขอสิทธิ์ (scope) ใดๆ ในบัญชี: ทำได้แค่ค้นคลังเพลงสาธารณะ ไม่เห็นเพลย์ลิสต์/ไม่สั่งเล่นในบัญชี
import { SPOTIFY } from '../cloud.config';
import { coll, useItem } from './store';

const AUTH_ID = 'spotify';
const PKCE_KEY = 'spotify-pkce';
export const spotifyReady = !!SPOTIFY.clientId;
const redirectUri = () => location.origin + location.pathname;
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const useSpotifyAuth = () => useItem('spotify', AUTH_ID);

/** ไปหน้าล็อกอิน Spotify (กลับมาที่แอปเองหลังกดยอมรับ) */
export async function connectSpotify() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)).buffer);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(12)).buffer);
  try { localStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state })); } catch { /* ไม่เป็นไร */ }
  const q = new URLSearchParams({
    client_id: SPOTIFY.clientId, response_type: 'code', redirect_uri: redirectUri(),
    code_challenge_method: 'S256', code_challenge: challenge, state,
  });
  location.href = `https://accounts.spotify.com/authorize?${q}`;
}

export const disconnectSpotify = () => coll.remove('spotify', AUTH_ID);

interface TokenRes { access_token: string; expires_in: number; refresh_token?: string }
async function tokenRequest(params: Record<string, string>): Promise<TokenRes | null> {
  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: SPOTIFY.clientId, ...params }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
const saveAuth = (t: TokenRes, prevRefresh = '') =>
  coll.save('spotify', { id: AUTH_ID, access: t.access_token, expiresAt: Date.now() + (t.expires_in - 60) * 1000, refresh: t.refresh_token || prevRefresh });

/** กลับมาจากหน้าล็อกอิน Spotify (?code=...) → แลกเป็น token แล้วเก็บ — คืน 'ok' / 'fail' / null (ไม่ใช่การกลับมาจาก Spotify) */
export async function handleSpotifyCallback(): Promise<'ok' | 'fail' | null> {
  const p = new URLSearchParams(location.search);
  const code = p.get('code'), state = p.get('state');
  if (!code && !p.get('error')) return null;
  history.replaceState(null, '', `${redirectUri()}#home`); // เอา ?code ออกจากที่อยู่
  let saved: { verifier: string; state: string } | null = null;
  try { saved = JSON.parse(localStorage.getItem(PKCE_KEY) || 'null'); localStorage.removeItem(PKCE_KEY); } catch { /* ไม่เป็นไร */ }
  if (!code || !saved || saved.state !== state) return 'fail';
  const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: saved.verifier });
  if (!t?.refresh_token) return 'fail';
  await saveAuth(t);
  return 'ok';
}

/** token ที่ใช้ได้ตอนนี้ (หมดอายุก็ขอใหม่ แล้วแชร์ให้อีกเครื่องใช้ต่อ) */
async function accessToken(force = false): Promise<string | null> {
  const a = await coll.get('spotify', AUTH_ID);
  if (!a?.refresh) return null;
  if (!force && a.access && a.expiresAt > Date.now()) return a.access;
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: a.refresh });
  if (!t) return null;
  await saveAuth(t, a.refresh);
  return t.access_token;
}

export interface FoundTrack { sid: string; title: string; artist: string; cover?: string; thumb?: string }
interface SpImage { url: string; width: number }
interface SpTrack { id: string; name: string; artists: { name: string }[]; album: { images: SpImage[] } }

/** ค้นหาเพลง — 'not-connected' = ยังไม่ได้เชื่อม Spotify */
export async function searchTracks(q: string): Promise<FoundTrack[] | 'not-connected'> {
  if (!spotifyReady) return import.meta.env.DEV ? mockSearch(q) : 'not-connected';
  let tok = await accessToken();
  if (!tok) return 'not-connected';
  const url = `https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: 'track', limit: '10', market: 'TH' })}`; // Spotify ให้สูงสุด 10 เพลงต่อครั้ง
  let r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  if (r.status === 401) {
    tok = await accessToken(true);
    if (!tok) return 'not-connected';
    r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  }
  if (!r.ok) throw new Error(`spotify search ${r.status}`);
  const j: { tracks: { items: SpTrack[] } } = await r.json();
  return j.tracks.items.map(t => {
    const imgs = [...t.album.images].sort((a, b) => b.width - a.width);
    return { sid: t.id, title: t.name, artist: t.artists.map(a => a.name).join(', '), cover: (imgs[1] || imgs[0])?.url, thumb: imgs[imgs.length - 1]?.url };
  });
}

// ---------- ตัวทดสอบในเครื่อง (ยังไม่ได้ใส่ Client ID): ผลค้นหาจำลองจากเพลงจริงไม่กี่เพลง ----------
const MOCK: [string, string, string][] = [
  ['0T5iIrXA4p5GsubkhuBIKV', 'Until I Found You', 'Stephen Sanchez'],
  ['0tgVpDi06FyKpA1z0VMD4v', 'Perfect', 'Ed Sheeran'],
  ['2plbrEY59IikOBgBGLjaoe', 'Die With A Smile', 'Lady Gaga, Bruno Mars'],
  ['5vNRhkKd0yEAg8suGBpjeY', 'APT.', 'ROSÉ, Bruno Mars'],
  ['0VjIjW4GlUZAMYd2vXMi3b', 'Blinding Lights', 'The Weeknd'],
];
async function mockSearch(q: string): Promise<FoundTrack[]> {
  const s = q.trim().toLowerCase();
  const hits = MOCK.filter(([, t, a]) => !s || `${t} ${a}`.toLowerCase().includes(s));
  return Promise.all((hits.length ? hits : MOCK).map(async ([sid, title, artist]) => {
    try {
      const j = await (await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${sid}`)}`)).json();
      return { sid, title, artist, cover: j.thumbnail_url, thumb: j.thumbnail_url };
    } catch { return { sid, title, artist }; }
  }));
}
