'use client';

import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = 'Fetching live deals, 12-month price histories & your lists...',
}: LoadingScreenProps) {
  return (
    <div className="loading-splash" role="status" aria-live="polite">
      <div className="loading-orb loading-orb-1" />
      <div className="loading-orb loading-orb-2" />

      <div className="loading-card">
        <div className="loading-crest-wrap">
          <div className="loading-ring" />
          <div className="brand-mark brand-mark-lg">VF</div>
        </div>
        <h2 className="loading-title">VELVET // FRIDAY</h2>
        <p className="loading-subtitle">
          <Sparkles size={14} className="text-gold" /> {message}
        </p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
      </div>
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
