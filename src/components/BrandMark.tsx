import { useId } from 'react';

interface BrandMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

/** Diamond monogram: a faceted gem outline with the letters N·E. */
export function BrandMark({ size = 40, animated = false, className = '' }: BrandMarkProps) {
  const gradientId = `gem-${useId().replace(/:/g, '')}`;
  return (
    <span
      className={`brand-gem ${animated ? 'brand-gem-animated' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-gold-strong)" />
            <stop offset="55%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="var(--accent-rose)" />
          </linearGradient>
        </defs>
        <path
          className="gem-outline"
          pathLength={100}
          d="M24 3 L44 24 L24 45 L4 24 Z"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          className="gem-facet"
          pathLength={100}
          d="M14 13 H34 M14 13 L24 3 L34 13 M14 13 L20 24 M34 13 L28 24"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="0.7"
          opacity="0.45"
        />
        <text
          x="24"
          y="33"
          textAnchor="middle"
          className="gem-letters"
          fill="var(--text-primary)"
        >
          NE
        </text>
      </svg>
    </span>
  );
}
