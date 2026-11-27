'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { ProductItem, StoreInfo } from '@/types/shopping';

interface BrandRailProps {
  stores: StoreInfo[];
  products: ProductItem[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
}

const COLLAPSED_COUNT = 12;

/** Two-letter monogram for a store name ("H&M" → "H&M", "Old Navy" → "ON"). */
function monogram(name: string): string {
  if (name.length <= 3) return name;
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** True when white text would be hard to read on this hex color. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** "Shop by brand": every store as a tappable tile with its live deal count. */
export function BrandRail({ stores, products, activeStoreId, onSelectStore }: BrandRailProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  const tiles = useMemo(() => {
    const counts = new Map<string, { deals: number; bestOff: number }>();
    for (const p of products) {
      const off = p.msrp > 0 ? Math.round(((p.msrp - p.currentPrice) / p.msrp) * 100) : 0;
      const entry = counts.get(p.storeId) ?? { deals: 0, bestOff: 0 };
      entry.deals += 1;
      entry.bestOff = Math.max(entry.bestOff, off);
      counts.set(p.storeId, entry);
    }
    return stores
      .map((s) => ({ store: s, ...(counts.get(s.id) ?? { deals: 0, bestOff: 0 }) }))
      .filter((t) => t.deals > 0)
      .sort((a, b) => b.deals - a.deals || a.store.name.localeCompare(b.store.name));
  }, [stores, products]);

  const q = filter.trim().toLowerCase();
  const matching = q ? tiles.filter((t) => t.store.name.toLowerCase().includes(q)) : tiles;
  // Keep the active store visible even when the rail is collapsed.
  let visible = expanded || q ? matching : matching.slice(0, COLLAPSED_COUNT);
  if (!expanded && !q && activeStoreId !== 'all' && !visible.some((t) => t.store.id === activeStoreId)) {
    const active = matching.find((t) => t.store.id === activeStoreId);
    if (active) visible = [...visible.slice(0, COLLAPSED_COUNT - 1), active];
  }

  return (
    <section className="brand-rail" aria-labelledby="brand-rail-title">
      <div className="brand-rail-head">
        <div>
          <h2 id="brand-rail-title" className="brand-rail-title">
            Shop by brand
          </h2>
          <p className="brand-rail-sub">
            {tiles.length} stores with live Black Friday deals
          </p>
        </div>
        <label className="brand-rail-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            placeholder="Find a store…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Find a store"
          />
        </label>
      </div>

      <div className="brand-grid" role="list">
        {visible.map(({ store, deals, bestOff }, i) => {
          const active = activeStoreId === store.id;
          return (
            <button
              key={store.id}
              type="button"
              role="listitem"
              className={`brand-tile ${active ? 'active' : ''}`}
              style={
                { '--brand': store.accentColor, '--i': i } as React.CSSProperties
              }
              aria-pressed={active}
              onClick={() => onSelectStore(active ? 'all' : store.id)}
            >
              <span
                className={`brand-tile-mark ${isLight(store.accentColor) ? 'on-light' : ''}`}
                aria-hidden="true"
              >
                {monogram(store.name)}
              </span>
              <span className="brand-tile-text">
                <span className="brand-tile-name">{store.name}</span>
                <span className="brand-tile-meta">
                  {deals} {deals === 1 ? 'deal' : 'deals'}
                  {bestOff > 0 && <> · up to {bestOff}% off</>}
                </span>
              </span>
              {active && <X size={14} className="brand-tile-clear" aria-hidden="true" />}
            </button>
          );
        })}
        {q && matching.length === 0 && (
          <p className="brand-rail-empty">No store matches “{filter}”.</p>
        )}
      </div>

      {!q && tiles.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="btn btn-ghost brand-rail-toggle"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show fewer stores' : `Show all ${tiles.length} stores`}
          <ChevronDown size={15} className={expanded ? 'rotate-180' : ''} />
        </button>
      )}
    </section>
  );
}
