'use client';

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
  GenderFocus,
  ProductItem,
  SelectionEntry,
  UserPreferences,
} from '@/types/shopping';
import {
  computePersonalizedScore,
  formatCurrency,
  getDiscountPercent,
  getProductImageSrc,
  getVerdictMeta,
} from '@/utils/deals';

interface RecommendationsViewProps {
  products: ProductItem[];
  collections: CuratedCollection[];
  preferences: UserPreferences;
  selectionsMap: Record<string, SelectionEntry>;
  onToggleSelect: (product: ProductItem) => void;
  onSelectMany: (products: ProductItem[], shopperId?: string) => void;
  onOpenDetail: (product: ProductItem) => void;
  onOpenPersonalize: () => void;
}

export function RecommendationsView({
  products,
  collections,
  preferences,
  selectionsMap,
  onToggleSelect,
  onSelectMany,
  onOpenDetail,
  onOpenPersonalize,
}: RecommendationsViewProps) {
  const [genderChoice, setGenderChoice] = useState<'all' | GenderFocus>(
    preferences.genderFocus,
  );
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [onlyAtl, setOnlyAtl] = useState<boolean>(true);

  const recommendedPicks = useMemo(() => {
    return products
      .filter((p) => {
        if (p.verdict === 'watch-out') return false;
        if (
          genderChoice !== 'all' &&
          p.genderFocus !== genderChoice &&
          p.genderFocus !== 'unisex'
        ) {
          return false;
        }
        if (maxBudget !== null && p.currentPrice > maxBudget) return false;
        if (onlyAtl && p.verdict !== 'all-time-low') return false;
        return true;
      })
      .sort((a, b) => {
        const scoreDiff =
          computePersonalizedScore(b, preferences) -
          computePersonalizedScore(a, preferences);
        if (scoreDiff !== 0) return scoreDiff;
        return (
          getDiscountPercent(b.msrp, b.currentPrice) -
          getDiscountPercent(a.msrp, a.currentPrice)
        );
      })
      .slice(0, 6);
  }, [products, genderChoice, maxBudget, onlyAtl, preferences]);

  return (
    <section className="section-stack panel-reveal">
      <div className="hero-strip">
        <div>
          <span className="eyebrow">Personalized Recommendations</span>
          <h2 className="section-heading">Smart Deal Matchmaker &amp; Curated Edits</h2>
          <p className="section-sub">
            Dial in style focus and budget — we skip fake markdowns and rank verified drops tailored to your category preferences.
          </p>
        </div>
        <button type="button" className="btn-primary-gold" onClick={onOpenPersonalize}>
          <Sparkles size={15} /> Customize My Preferences
        </button>
      </div>

      {/* Interactive Deal Finder */}
      <div className="matchmaker-panel">
        <div className="matchmaker-controls">
          <div className="matchmaker-title">
            <Wand2 size={18} className="text-gold" />
            <h3>Find Top Matches For Anyone</h3>
          </div>

          <div className="control-clusters">
            <div className="chip-group">
              {(
                [
                  { id: 'all', label: '🛍️ All Styles' },
                  { id: 'women', label: "✨ Women's" },
                  { id: 'men', label: "⚡ Men's" },
                  { id: 'unisex', label: '🏡 Unisex & Home' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-chip ${genderChoice === opt.id ? 'active' : ''}`}
                  onClick={() => setGenderChoice(opt.id)}
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
            recommendedPicks.map((item, idx) => {
              const disc = getDiscountPercent(item.msrp, item.currentPrice);
              const selected = Boolean(selectionsMap[item.id]);
              const verdict = getVerdictMeta(item.verdict);
              const match = computePersonalizedScore(item, preferences);
              return (
                <article
                  key={item.id}
                  className="rec-card card-stagger"
                  style={{ '--stagger': idx } as React.CSSProperties}
                >
                  <div className="rec-thumb-wrap" onClick={() => onOpenDetail(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail(item); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getProductImageSrc(item)} alt={item.name} className="rec-thumb-img" loading="lazy" />
                  </div>
                  <div className="rec-card-top">
                    <span className="store-pill">{item.storeName}</span>
                    <span className="match-pill">
                      <Sparkles size={10} /> {match}% Match
                    </span>
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
                        className="btn-ghost-icon btn-icon"
                        onClick={() => onOpenDetail(item)}
                        title="Price history"
                        aria-label={`Price history for ${item.name}`}
                      >
                        <LineChart size={14} />
                      </button>
                      <button
                        type="button"
                        className={`btn-select ${selected ? 'selected' : ''}`}
                        onClick={() => onToggleSelect(item)}
                      >
                        {selected ? <Check size={14} /> : <Plus size={14} />}
                        {selected ? 'Saved' : 'Save'}
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
        {collections.map((col, idx) => {
          const colProducts = col.productIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is ProductItem => Boolean(p));
          const allSelected =
            colProducts.length > 0 &&
            colProducts.every((p) => Boolean(selectionsMap[p.id]));

          return (
            <article
              key={col.id}
              className="collection-card card-stagger"
              style={{ '--stagger': idx } as React.CSSProperties}
            >
              <div className="collection-top">
                <div>
                  <span className="collection-for" style={{ color: col.accent }}>
                    {col.forWho}
                  </span>
                  <h3>{col.title}</h3>
                  <p>{col.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="btn-select"
                  disabled={allSelected}
                  onClick={() => onSelectMany(colProducts)}
                >
                  {allSelected ? (
                    <>
                      <Check size={14} /> All Saved
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Save All ({colProducts.length})
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
                        aria-label={selected ? `Remove ${item.name}` : `Save ${item.name}`}
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
