'use client';

import { useState } from 'react';
import type { PricePoint } from '@/types/shopping';
import { formatCurrency } from '@/utils/deals';

interface PriceHistoryChartProps {
  points: PricePoint[];
  msrp: number;
  allTimeLow: number;
  avg90Day: number;
  currentPrice: number;
  compact?: boolean;
}

export function PriceHistoryChart({
  points,
  msrp,
  allTimeLow,
  avg90Day,
  currentPrice,
  compact = false,
}: PriceHistoryChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length === 0) return null;

  const prices = points.map((p) => p.price);
  const minVal = Math.min(...prices, allTimeLow) * 0.92;
  const maxVal = Math.max(...prices, msrp) * 1.04;
  const range = Math.max(1, maxVal - minVal);

  const width = compact ? 240 : 560;
  const height = compact ? 52 : 210;
  const padX = compact ? 6 : 44;
  const padY = compact ? 6 : 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((p, index) => {
    const x =
      points.length === 1
        ? padX + innerW / 2
        : padX + (index / (points.length - 1)) * innerW;
    const y = padY + ((maxVal - p.price) / range) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
    height - padY
  ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`;

  const atlY = padY + ((maxVal - allTimeLow) / range) * innerH;
  const avgY = padY + ((maxVal - avg90Day) / range) * innerH;

  if (compact) {
    const last = coords[coords.length - 1];
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="sparkline-svg"
        aria-label="12-month price trend"
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="3.5"
          fill="var(--accent-emerald)"
          stroke="var(--surface-card)"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : coords[coords.length - 1];

  return (
    <div className="price-history-panel">
      <div className="price-history-stats">
        <div className="ph-stat">
          <span>List MSRP</span>
          <strong>{formatCurrency(msrp)}</strong>
        </div>
        <div className="ph-stat">
          <span>90-Day Avg</span>
          <strong>{formatCurrency(avg90Day)}</strong>
        </div>
        <div className="ph-stat">
          <span>All-Time Low</span>
          <strong className="text-emerald">{formatCurrency(allTimeLow)}</strong>
        </div>
        <div className="ph-stat">
          <span>Current BF</span>
          <strong className="text-gold">{formatCurrency(currentPrice)}</strong>
        </div>
      </div>

      <div className="ph-chart-wrap">
        <div className="ph-hover-banner">
          <span>
            <strong>{activePoint.month}</strong>
            {activePoint.note ? ` · ${activePoint.note}` : ''}
          </span>
          <span className="mono">{formatCurrency(activePoint.price)}</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="ph-svg"
          role="img"
          aria-label="12-month price history chart"
        >
          <defs>
            <linearGradient id="phAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.38" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={padX}
            y1={avgY}
            x2={width - padX}
            y2={avgY}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />
          <text x={padX} y={avgY - 5} className="ph-ref-label">
            90d avg {formatCurrency(avg90Day)}
          </text>

          <line
            x1={padX}
            y1={atlY}
            x2={width - padX}
            y2={atlY}
            stroke="var(--accent-emerald)"
            strokeDasharray="3 3"
            strokeOpacity="0.65"
          />

          <path d={areaPath} fill="url(#phAreaGrad)" className="ph-area-fade" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="ph-line-draw"
          />

          {coords.map((pt, idx) => {
            const isActive =
              hoveredIdx === idx || (hoveredIdx === null && idx === coords.length - 1);
            return (
              <g
                key={pt.month}
                className="ph-point-group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                tabIndex={0}
                role="button"
                aria-label={`${pt.month}: ${formatCurrency(pt.price)}${pt.note ? `, ${pt.note}` : ''}`}
              >
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 5.5 : 3.5}
                  fill={
                    idx === coords.length - 1
                      ? 'var(--accent-emerald)'
                      : 'var(--accent-gold)'
                  }
                  stroke="var(--surface-elevated)"
                  strokeWidth="2"
                />
                <text x={pt.x} y={height - 4} textAnchor="middle" className="ph-axis-label">
                  {pt.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <details className="ph-table-wrap">
        <summary>See every tracked price</summary>
        <table className="ph-table">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Price</th>
              <th scope="col">vs. today</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, idx) => {
              const diff = p.price - currentPrice;
              const isNow = idx === points.length - 1;
              return (
                <tr key={`${p.month}-${idx}`} className={isNow ? 'is-now' : undefined}>
                  <th scope="row">
                    {p.month}
                    {p.note && <span className="ph-table-note">{p.note}</span>}
                  </th>
                  <td>{formatCurrency(p.price)}</td>
                  <td className={diff > 0 ? 'text-emerald' : diff < 0 ? 'text-rose' : undefined}>
                    {isNow ? 'Now' : diff === 0 ? 'Same' : `${diff > 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
