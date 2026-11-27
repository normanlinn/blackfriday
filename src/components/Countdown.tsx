'use client';

import { useEffect, useState } from 'react';
import { BLACK_FRIDAY_START, CYBER_MONDAY_END } from '@/lib/brand';

type Phase = 'before' | 'live' | 'after';

function getState(now: number): { phase: Phase; remaining: number } {
  if (now < BLACK_FRIDAY_START.getTime()) {
    return { phase: 'before', remaining: BLACK_FRIDAY_START.getTime() - now };
  }
  if (now < CYBER_MONDAY_END.getTime()) {
    return { phase: 'live', remaining: CYBER_MONDAY_END.getTime() - now };
  }
  return { phase: 'after', remaining: 0 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Live countdown to Black Friday, then to the end of Cyber Monday. */
export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Render a stable placeholder until mounted to avoid hydration mismatch.
  if (now === null) return <div className="countdown countdown-placeholder" aria-hidden="true" />;

  const { phase, remaining } = getState(now);
  if (phase === 'after') {
    return (
      <div className="countdown">
        <span className="countdown-label">Black Friday 2026 has wrapped</span>
        <span className="countdown-note">Price histories stay live for holiday shopping</span>
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const units = [
    { label: 'Days', value: Math.floor(totalSeconds / 86400) },
    { label: 'Hrs', value: Math.floor((totalSeconds % 86400) / 3600) },
    { label: 'Min', value: Math.floor((totalSeconds % 3600) / 60) },
    { label: 'Sec', value: totalSeconds % 60 },
  ];

  return (
    <div className={`countdown ${phase === 'live' ? 'is-live' : ''}`}>
      <span className="countdown-label">
        {phase === 'live' ? (
          <>
            <span className="live-dot" /> Live now · ends after Cyber Monday
          </>
        ) : (
          'Black Friday doors open in'
        )}
      </span>
      <div className="countdown-units" role="timer" aria-live="off">
        {units.map((u) => (
          <div key={u.label} className="countdown-unit">
            <span key={u.value} className="countdown-value">
              {pad(u.value)}
            </span>
            <span className="countdown-unit-label">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
