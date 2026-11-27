'use client';

import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import { BrandMark } from './BrandMark';

interface LoadingScreenProps {
  /** When true the splash plays its exit animation, then calls onExited. */
  done?: boolean;
  onExited?: () => void;
}

const STEPS = ['Pulling live deals', 'Reading 12-month price histories', 'Restoring your lists'];

export function LoadingScreen({ done = false, onExited }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  // Ease towards 92% while loading, then snap to 100% once data has arrived.
  useEffect(() => {
    if (done) {
      setProgress(100);
      return;
    }
    const id = window.setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(1, (92 - p) * 0.09) : p));
    }, 40);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    setStepIdx(Math.min(STEPS.length - 1, Math.floor(progress / 34)));
  }, [progress]);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => onExited?.(), 900);
    return () => window.clearTimeout(t);
  }, [done, onExited]);

  const letters = BRAND.wordmark.join(' ').split('');

  return (
    <div
      className={`loading-splash ${done ? 'is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${BRAND.name}`}
    >
      <div className="splash-grain" />
      <div className="loading-orb loading-orb-1" />
      <div className="loading-orb loading-orb-2" />

      <div className="splash-center">
        <BrandMark size={72} animated />

        <h1 className="splash-wordmark" aria-label={BRAND.name}>
          {letters.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className="splash-letter"
              style={{ '--i': i } as React.CSSProperties}
              aria-hidden="true"
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </h1>
        <p className="splash-tagline">{BRAND.tagline}</p>

        <div className="splash-progress">
          <div className="splash-progress-track">
            <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-progress-meta">
            <span key={stepIdx} className="splash-step">
              {STEPS[stepIdx]}
            </span>
            <span className="splash-pct">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div className="splash-curtain" />
    </div>
  );
}

export function CatalogSkeletonGrid() {
  return (
    <div className="products-grid" aria-label="Loading deals">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-card"
          style={{ '--stagger': idx } as React.CSSProperties}
        >
          <div className="skeleton-box skeleton-media" />
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-85 h-lg" />
          <div className="skeleton-line w-70" />
          <div className="skeleton-box" />
          <div className="skeleton-line w-55" />
          <div className="skeleton-btn-row">
            <div className="skeleton-pill" />
            <div className="skeleton-pill sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
