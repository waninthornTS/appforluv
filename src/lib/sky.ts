// ช่วงเวลาของวัน (ใช้กับพื้นหลังท้องฟ้า นาฬิกา และฉากหน้าแรก)
import { useEffect, useState } from 'react';

export type Period = 'morning' | 'day' | 'evening' | 'night';
export const SKY: Record<Period, { icon: string; theme: string }> = {
  morning: { icon: '🌅', theme: '#FFD9C7' },
  day: { icon: '☀️', theme: '#CFEAFF' },
  evening: { icon: '🌇', theme: '#FFB199' },
  night: { icon: '🌙', theme: '#24224F' },
};

export function periodOf(h: number): Period {
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'evening';
  return 'night';
}

/** เวลาปัจจุบัน อัปเดตทุก 10 วินาที และทันทีที่กลับมาเปิดแอป */
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t = setInterval(tick, intervalMs);
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [intervalMs]);
  return now;
}

export const usePeriod = () => periodOf(useNow().getHours());
