import { useMemo, useState } from 'react';
import {
  BadgePercent,
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { Category, ProductItem, StoreInfo } from '../types/shopping';

interface StoresDirectoryProps {
  stores: StoreInfo[];
  products: ProductItem[];
  onBrowseStoreDeals: (storeId: string) => void;
}

export function StoresDirectory({
  stores,
  products,
  onBrowseStoreDeals,
}: StoresDirectoryProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');

  const allCategories: Category[] = [
    'Tech & Audio',
    'Beauty & Skincare',
    'Fashion & Bags',
    'Home & Kitchen',
    'Fitness & Wellness',
    'Travel & Luggage',
    'Gaming & Entertainment',
  ];

  const dealCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.storeId] = (counts[p.storeId] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((store) => {
      const matchesCat =
        selectedCategory === 'All' || store.categories.includes(selectedCategory);
      const matchesQuery =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.tagline.toLowerCase().includes(q) ||
        store.promoHint.toLowerCase().includes(q) ||
        store.stackingTip.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [stores, query, selectedCategory]);

  return (
    <section className="section-stack">
      <div className="hero-strip">
        <div>
          <span className="eyebrow">Where To Shop Online</span>
          <h2 className="section-heading">Verified Black Friday Retailers & Stacking Playbook</h2>
          <p className="section-sub">
            Compare storewide discount tiers, promo stacking tricks, free-shipping minimums, and holiday price-match policies before checking out.
          </p>
        </div>
        <div className="playbook-pill-group">
          <div className="playbook-pill">
            <BadgePercent size={16} />
            <span>Stack Cashback Portals + Store Cards</span>
          </div>
          <div className="playbook-pill">
            <ShieldCheck size={16} />
            <span>Use Best Buy / Target Price Match</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search stores, promos, or perks (e.g. Sephora, Rakuten, price match)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="chip-scroll">
          <button
            type="button"
            className={`filter-chip ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Categories
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="stores-grid">
        {filteredStores.map((store) => {
          const count = dealCounts[store.id] ?? 0;
          return (
            <article key={store.id} className="store-card">
              <div className="store-card-top">
                <div className="store-identity">
                  <span
                    className="store-dot"
                    style={{ backgroundColor: store.accentColor }}
                  />
                  <div>
                    <h3>{store.name}</h3>
                    <span className="store-rating">★ {store.rating.toFixed(1)} Shopper Score</span>
                  </div>
                </div>
                <span className="store-discount-badge">{store.discountRange}</span>
              </div>

              <p className="store-tagline">{store.tagline}</p>

              <div className="store-details-list">
                <div className="store-detail-row">
                  <Sparkles size={14} className="text-gold" />
                  <div>
                    <strong>Promo Intel:</strong> {store.promoHint}
                  </div>
                </div>
                <div className="store-detail-row">
                  <BadgePercent size={14} className="text-emerald" />
                  <div>
                    <strong>Stacking Tip:</strong> {store.stackingTip}
                  </div>
                </div>
                <div className="store-detail-row">
                  <Truck size={14} className="text-sky" />
                  <div>
                    <strong>Shipping & Match:</strong> {store.freeShipping} · {store.priceMatch}
                  </div>
                </div>
              </div>

              <div className="store-card-cats">
                {store.categories.map((cat) => (
                  <span key={cat} className="vibe-tag">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="store-card-actions">
                <button
                  type="button"
                  className="btn-select"
                  onClick={() => onBrowseStoreDeals(store.id)}
                >
                  Browse {count} Tracked {count === 1 ? 'Deal' : 'Deals'}
                </button>
                <a
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-gold"
                >
                  Shop Site <ExternalLink size={14} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
