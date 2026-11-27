import { useMemo, useState } from 'react';
import {
  Check,
  Flame,
  LineChart,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type {
  CuratedCollection,
  ProductItem,
  SelectionEntry,
} from '../types/shopping';
import { formatCurrency, getDiscountPercent, getVerdictMeta } from '../utils/deals';

interface RecommendationsViewProps {
  products: ProductItem[];
  collections: CuratedCollection[];
  selectionsMap: Record<string, SelectionEntry>;
  onToggleSelect: (product: ProductItem) => void;
  onSelectMany: (products: ProductItem[], shopperId?: string) => void;
  onOpenDetail: (product: ProductItem) => void;
}

type AudienceChoice = 'all' | 'girlfriends' | 'me' | 'shared';

export function RecommendationsView({
  products,
  collections,
  selectionsMap,
  onToggleSelect,
  onSelectMany,
  onOpenDetail,
}: RecommendationsViewProps) {
  const [audience, setAudience] = useState<AudienceChoice>('girlfriends');
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [onlyAtl, setOnlyAtl] = useState<boolean>(true);

  const recommendedPicks = useMemo(() => {
    return products
      .filter((p) => {
        if (p.verdict === 'watch-out') return false;
        if (audience !== 'all' && !p.recommendedFor.includes(audience)) return false;
        if (maxBudget !== null && p.currentPrice > maxBudget) return false;
        if (onlyAtl && p.verdict !== 'all-time-low') return false;
        return true;
      })
      .sort((a, b) => {
        const discA = getDiscountPercent(a.msrp, a.currentPrice);
        const discB = getDiscountPercent(b.msrp, b.currentPrice);
        return discB - discA;
      })
      .slice(0, 6);
  }, [products, audience, maxBudget, onlyAtl]);

  return (
    <section className="section-stack">
      <div className="hero-strip">
        <div>
          <span className="eyebrow">Curated Recommendations</span>
          <h2 className="section-heading">Smart Deal Matchmaker & Gift Guides</h2>
          <p className="section-sub">
            Dial in who you’re shopping for and your budget — we filter out fake markdowns and surface the strongest value drops.
          </p>
        </div>
      </div>

      {/* Interactive Deal Finder */}
      <div className="matchmaker-panel">
        <div className="matchmaker-controls">
          <div className="matchmaker-title">
            <Wand2 size={18} className="text-gold" />
            <h3>Who are we finding deals for?</h3>
          </div>

          <div className="control-clusters">
            <div className="chip-group">
              {(
                [
                  { id: 'girlfriends', label: '✨ For Girlfriend / Girlfriends' },
                  { id: 'me', label: '🖤 For Me' },
                  { id: 'shared', label: '🏡 Shared / Couple' },
                  { id: 'all', label: '🛍️ Everyone' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-chip ${audience === opt.id ? 'active' : ''}`}
                  onClick={() => setAudience(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="chip-group">
              {[
                { label: 'Any Price', value: null },
                { label: 'Under $75', value: 75 },
                { label: 'Under $200', value: 200 },
                { label: 'Under $500', value: 500 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className={`filter-chip ${maxBudget === b.value ? 'active' : ''}`}
                  onClick={() => setMaxBudget(b.value)}
                >
                  {b.label}
                </button>
              ))}

              <button
                type="button"
                className={`filter-chip ${onlyAtl ? 'active' : ''}`}
                onClick={() => setOnlyAtl((prev) => !prev)}
              >
                <Flame size={13} /> All-Time Lows Only
              </button>
            </div>
          </div>
        </div>

        <div className="rec-grid">
          {recommendedPicks.length === 0 ? (
            <div className="empty-inline">
              No exact match under those constraints — try turning off &ldquo;All-Time Lows Only&rdquo; or raising the budget cap.
            </div>
          ) : (
            recommendedPicks.map((item) => {
              const disc = getDiscountPercent(item.msrp, item.currentPrice);
              const selected = Boolean(selectionsMap[item.id]);
              const verdict = getVerdictMeta(item.verdict);
              return (
                <article key={item.id} className="rec-card">
                  <div className="rec-card-top">
                    <span className="store-pill">{item.storeName}</span>
                    <span className={`verdict-badge ${verdict.toneClass}`}>
                      {verdict.label}
                    </span>
                  </div>
                  <h4>
                    <button
                      type="button"
                      className="pc-title-btn"
                      onClick={() => onOpenDetail(item)}
                    >
                      {item.name}
                    </button>
                  </h4>
                  <p className="rec-reason">{item.whyRecommended}</p>
                  <div className="rec-card-footer">
                    <div>
                      <strong className="pc-current-price">
                        {formatCurrency(item.currentPrice)}
                      </strong>{' '}
                      <span className="pc-msrp">{formatCurrency(item.msrp)}</span>
                      <span className="discount-inline">-{disc}%</span>
                    </div>
                    <div className="rec-btn-pair">
                      <button
                        type="button"
                        className="btn-ghost-icon"
                        onClick={() => onOpenDetail(item)}
                        title="Price History"
                      >
                        <LineChart size={14} />
                      </button>
                      <button
                        type="button"
                        className={`btn-select ${selected ? 'selected' : ''}`}
                        onClick={() => onToggleSelect(item)}
                      >
                        {selected ? <Check size={14} /> : <Plus size={14} />}
                        {selected ? 'Added' : 'Select'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Curated Collections */}
      <div className="collections-header">
        <Sparkles size={18} className="text-gold" />
        <h3>Curated Shopping Edits</h3>
      </div>

      <div className="collections-grid">
        {collections.map((col) => {
          const colProducts = col.productIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is ProductItem => Boolean(p));
          const allSelected =
            colProducts.length > 0 &&
            colProducts.every((p) => Boolean(selectionsMap[p.id]));

          return (
            <article key={col.id} className="collection-card">
              <div className="collection-top">
                <div>
                  <span
                    className="collection-for"
                    style={{ color: col.accent }}
                  >
                    {col.forWho}
                  </span>
                  <h3>{col.title}</h3>
                  <p>{col.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="btn-select"
                  disabled={allSelected}
                  onClick={() =>
                    onSelectMany(
                      colProducts,
                      col.id === 'cozy-night-in' ? 'shared' : 'girlfriend',
                    )
                  }
                >
                  {allSelected ? (
                    <>
                      <Check size={14} /> All Selected
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add All ({colProducts.length})
                    </>
                  )}
                </button>
              </div>

              <div className="collection-items">
                {colProducts.map((item) => {
                  const selected = Boolean(selectionsMap[item.id]);
                  const disc = getDiscountPercent(item.msrp, item.currentPrice);
                  return (
                    <div key={item.id} className="collection-row">
                      <button
                        type="button"
                        className="collection-item-link"
                        onClick={() => onOpenDetail(item)}
                      >
                        <span className="col-item-name">{item.name}</span>
                        <span className="col-item-meta">
                          {item.storeName} · {formatCurrency(item.currentPrice)} (-{disc}%)
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`mini-toggle-btn ${selected ? 'selected' : ''}`}
                        onClick={() => onToggleSelect(item)}
                        aria-label={selected ? `Remove ${item.name}` : `Select ${item.name}`}
                      >
                        {selected ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
