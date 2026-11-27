import { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  HeartHandshake,
  Moon,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Sun,
  Tag,
} from 'lucide-react';
import { AddCustomItemModal } from './components/AddCustomItemModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { RecommendationsView } from './components/RecommendationsView';
import { StoresDirectory } from './components/StoresDirectory';
import { WatchlistView } from './components/WatchlistView';
import { CURATED_COLLECTIONS, DEFAULT_SHOPPERS } from './data/collections';
import { PRODUCTS } from './data/products';
import { STORES } from './data/stores';
import type {
  ActiveTab,
  Category,
  DealVerdict,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
  SortOption,
} from './types/shopping';
import {
  decodeSharePayload,
  encodeSharePayload,
  formatCurrency,
  getDiscountPercent,
  getSavingsAmount,
} from './utils/deals';

const STORAGE_KEY = 'velvet-friday-state-v1';

interface StoredState {
  shoppers: ShopperProfile[];
  selections: SelectionEntry[];
  customItems: ProductItem[];
  theme: 'dark' | 'light';
}

function loadInitialState(): StoredState {
  // Check URL hash share payload first (#list=...)
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#list=')) {
    const encoded = window.location.hash.slice('#list='.length);
    const decoded = decodeSharePayload(encoded);
    if (decoded) {
      return {
        shoppers: decoded.shoppers.length > 0 ? decoded.shoppers : DEFAULT_SHOPPERS,
        selections: decoded.selections,
        customItems: decoded.customItems,
        theme: 'dark',
      };
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return {
        shoppers:
          Array.isArray(parsed.shoppers) && parsed.shoppers.length > 0
            ? parsed.shoppers
            : DEFAULT_SHOPPERS,
        selections: Array.isArray(parsed.selections) ? parsed.selections : [],
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
        theme: parsed.theme === 'light' ? 'light' : 'dark',
      };
    }
  } catch {
    // Ignore malformed localStorage
  }

  // Starter sample selection so first visit immediately shows how the shared list works
  return {
    shoppers: DEFAULT_SHOPPERS,
    selections: [
      {
        productId: 'dyson-airwrap-id',
        shopperId: 'girlfriend',
        priority: 'must-have',
        purchased: false,
        quantity: 1,
        note: 'Strawberry Bronze or Ceramic Pink',
        addedAt: Date.now() - 10000,
      },
      {
        productId: 'sony-wh1000xm5',
        shopperId: 'me',
        priority: 'must-have',
        purchased: false,
        quantity: 1,
        note: 'Midnight Blue for travel',
        addedAt: Date.now() - 5000,
      },
    ],
    customItems: [],
    theme: 'dark',
  };
}

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Beauty & Skincare',
  'Fashion & Bags',
  'Tech & Audio',
  'Home & Kitchen',
  'Fitness & Wellness',
  'Travel & Luggage',
  'Gaming & Entertainment',
];

export function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [theme, setTheme] = useState<'dark' | 'light'>(initial.theme);
  const [shoppers, setShoppers] = useState<ShopperProfile[]>(initial.shoppers);
  const [selections, setSelections] = useState<SelectionEntry[]>(initial.selections);
  const [customItems, setCustomItems] = useState<ProductItem[]>(initial.customItems);

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'me' | 'girlfriends' | 'shared'>('all');
  const [verdictFilter, setVerdictFilter] = useState<'all' | DealVerdict>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1500);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Modals
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      const payload: StoredState = { shoppers, selections, customItems, theme };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [shoppers, selections, customItems, theme]);

  const allProducts = useMemo(() => [...customItems, ...PRODUCTS], [customItems]);

  const selectionsMap = useMemo(() => {
    const map: Record<string, SelectionEntry> = {};
    for (const s of selections) {
      map[s.productId] = s;
    }
    return map;
  }, [selections]);

  const storesMap = useMemo(() => {
    const map: Record<string, (typeof STORES)[number]> = {};
    for (const st of STORES) {
      map[st.id] = st;
    }
    return map;
  }, []);

  const bagTotals = useMemo(() => {
    const prodMap = new Map(allProducts.map((p) => [p.id, p]));
    let totalCost = 0;
    let totalSaved = 0;
    for (const sel of selections) {
      const p = prodMap.get(sel.productId);
      if (!p) continue;
      totalCost += p.currentPrice * sel.quantity;
      totalSaved += getSavingsAmount(p.msrp, p.currentPrice) * sel.quantity;
    }
    return { count: selections.length, totalCost, totalSaved };
  }, [allProducts, selections]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allProducts.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (storeFilter !== 'all' && item.storeId !== storeFilter) return false;
      if (audienceFilter !== 'all' && !item.recommendedFor.includes(audienceFilter)) {
        return false;
      }
      if (verdictFilter !== 'all' && item.verdict !== verdictFilter) return false;
      if (item.currentPrice > maxPriceFilter) return false;

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.whyRecommended.toLowerCase().includes(q) ||
        item.vibeTags.some((t) => t.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'discount-desc':
          return (
            getDiscountPercent(b.msrp, b.currentPrice) -
            getDiscountPercent(a.msrp, a.currentPrice)
          );
        case 'savings-desc':
          return (
            getSavingsAmount(b.msrp, b.currentPrice) -
            getSavingsAmount(a.msrp, a.currentPrice)
          );
        case 'price-asc':
          return a.currentPrice - b.currentPrice;
        case 'price-desc':
          return b.currentPrice - a.currentPrice;
        case 'rating-desc':
          return b.rating - a.rating;
        case 'recommended':
        default: {
          const score = (p: ProductItem) =>
            (p.verdict === 'all-time-low' ? 30 : p.verdict === 'great-deal' ? 15 : p.verdict === 'watch-out' ? -20 : 0) +
            getDiscountPercent(p.msrp, p.currentPrice);
          return score(b) - score(a);
        }
      }
    });
  }, [
    allProducts,
    searchQuery,
    categoryFilter,
    storeFilter,
    audienceFilter,
    verdictFilter,
    maxPriceFilter,
    sortBy,
  ]);

  const inferDefaultShopperId = (product: ProductItem): string => {
    if (product.recommendedFor.includes('girlfriends') && shoppers.some((s) => s.id === 'girlfriend')) {
      return 'girlfriend';
    }
    if (product.recommendedFor.includes('shared') && shoppers.some((s) => s.id === 'shared')) {
      return 'shared';
    }
    return shoppers[0]?.id ?? 'me';
  };

  const handleToggleSelect = (product: ProductItem) => {
    setSelections((prev) => {
      const exists = prev.some((s) => s.productId === product.id);
      if (exists) {
        return prev.filter((s) => s.productId !== product.id);
      }
      return [
        {
          productId: product.id,
          shopperId: inferDefaultShopperId(product),
          priority: product.verdict === 'all-time-low' ? 'must-have' : 'nice-to-have',
          purchased: false,
          quantity: 1,
          note: '',
          addedAt: Date.now(),
        },
        ...prev,
      ];
    });
  };

  const handleSelectMany = (items: ProductItem[], forcedShopperId?: string) => {
    setSelections((prev) => {
      const existingIds = new Set(prev.map((s) => s.productId));
      const additions: SelectionEntry[] = [];
      for (const item of items) {
        if (!existingIds.has(item.id)) {
          additions.push({
            productId: item.id,
            shopperId: forcedShopperId ?? inferDefaultShopperId(item),
            priority: 'nice-to-have',
            purchased: false,
            quantity: 1,
            note: '',
            addedAt: Date.now(),
          });
        }
      }
      return [...additions, ...prev];
    });
  };

  const handleUpdateSelection = (
    productId: string,
    patch: Partial<
      Pick<SelectionEntry, 'shopperId' | 'priority' | 'purchased' | 'quantity' | 'note'>
    >,
  ) => {
    setSelections((prev) =>
      prev.map((s) => (s.productId === productId ? { ...s, ...patch } : s)),
    );
  };

  const handleRemoveSelection = (productId: string) => {
    setSelections((prev) => prev.filter((s) => s.productId !== productId));
  };

  const handleClearPurchased = () => {
    setSelections((prev) => prev.filter((s) => !s.purchased));
  };

  const handleAddShopper = (name: string, emoji: string, budget: number) => {
    const palette = ['#f472b6', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24'];
    const id = `shopper-${Date.now()}`;
    setShoppers((prev) => [
      ...prev,
      {
        id,
        name,
        emoji,
        color: palette[prev.length % palette.length],
        budget,
      },
    ]);
  };

  const handleUpdateShopper = (id: string, patch: Partial<ShopperProfile>) => {
    setShoppers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleDeleteShopper = (id: string) => {
    setShoppers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const fallbackId = next[0]?.id ?? 'me';
      setSelections((sels) =>
        sels.map((sel) => (sel.shopperId === id ? { ...sel, shopperId: fallbackId } : sel)),
      );
      return next;
    });
  };

  const handleAddCustomItem = (
    product: ProductItem,
    shopperId: string,
    note: string,
  ) => {
    setCustomItems((prev) => [product, ...prev]);
    setSelections((prev) => [
      {
        productId: product.id,
        shopperId,
        priority: 'must-have',
        purchased: false,
        quantity: 1,
        note,
        addedAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleCopyShareLink = async (): Promise<boolean> => {
    const encoded = encodeSharePayload({ shoppers, selections, customItems });
    const url = `${window.location.origin}${window.location.pathname}#list=${encoded}`;
    window.history.replaceState(null, '', `#list=${encoded}`);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleExportJson = () => {
    const data = JSON.stringify({ shoppers, selections, customItems }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'black-friday-collective-list.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (!Array.isArray(parsed.shoppers) || !Array.isArray(parsed.selections)) {
        return false;
      }
      setShoppers(parsed.shoppers);
      setSelections(parsed.selections);
      if (Array.isArray(parsed.customItems)) {
        setCustomItems(parsed.customItems);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleBrowseStoreDeals = (storeId: string) => {
    setStoreFilter(storeId);
    setCategoryFilter('All');
    setActiveTab('catalog');
  };

  const resetCatalogFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStoreFilter('all');
    setAudienceFilter('all');
    setVerdictFilter('all');
    setMaxPriceFilter(1500);
    setSortBy('recommended');
  };

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="top-header">
        <div className="container header-inner">
          <div className="brand-lockup">
            <div className="brand-mark">VF</div>
            <div>
              <span className="brand-title">VELVET // FRIDAY</span>
              <span className="brand-subtitle">
                Shared Black Friday Intel for You &amp; Your Girlfriends
              </span>
            </div>
          </div>

          <nav className="primary-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <Tag size={15} /> All Deals ({allProducts.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'stores' ? 'active' : ''}`}
              onClick={() => setActiveTab('stores')}
            >
              <Store size={15} /> Where to Shop ({STORES.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <Sparkles size={15} /> Recommendations
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              <ShoppingBag size={15} /> Our List ({bagTotals.count})
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="bag-summary-pill"
              onClick={() => setActiveTab('watchlist')}
              title="Open shared shopping list"
            >
              <ShoppingBag size={14} />
              <span>{formatCurrency(bagTotals.totalCost)}</span>
              <span className="bag-saved-tag">
                -{formatCurrency(bagTotals.totalSaved)}
              </span>
            </button>

            <button
              type="button"
              className="btn-ghost-icon"
              onClick={() => setCustomModalOpen(true)}
              title="Add any custom product"
            >
              <Plus size={16} />
              <span className="hide-mobile">Add Item</span>
            </button>

            <button
              type="button"
              className="btn-ghost-icon"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle color theme"
              title="Toggle light/dark mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        {activeTab === 'catalog' && (
          <section className="section-stack">
            {/* Editorial Hero Banner */}
            <div className="hero-banner">
              <div className="hero-copy">
                <span className="eyebrow">
                  <HeartHandshake size={13} /> Black Friday 2026 Collective
                </span>
                <h1>
                  Shop smarter together. Track real price drops, skip fake markdowns.
                </h1>
                <p>
                  Search curated discounts across top online stores, inspect 12-month price histories, build a shared wishlist for you and your girlfriends, and send one link to sync picks.
                </p>
              </div>
              <div className="hero-quick-stats">
                <div className="hero-stat-pill">
                  <Flame size={16} className="text-emerald" />
                  <div>
                    <strong>
                      {allProducts.filter((p) => p.verdict === 'all-time-low').length} All-Time Lows
                    </strong>
                    <span>Verified 12-month drops</span>
                  </div>
                </div>
                <div className="hero-stat-pill">
                  <Store size={16} className="text-gold" />
                  <div>
                    <strong>{STORES.length} Verified Retailers</strong>
                    <span>Promo codes &amp; stacking tips</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Multi-Facet Filter Bar */}
            <div className="catalog-controls">
              <div className="search-sort-row">
                <div className="search-input-wrap search-lg">
                  <Search size={17} />
                  <input
                    type="search"
                    placeholder="Search Dyson, Sony, Sephora, cashmere, luggage, under $75..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="select-inline-group">
                  <label className="compact-select">
                    <SlidersHorizontal size={14} />
                    <select
                      aria-label="Filter by store"
                      value={storeFilter}
                      onChange={(e) => setStoreFilter(e.target.value)}
                    >
                      <option value="all">All Stores ({STORES.length})</option>
                      {STORES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="compact-select">
                    <select
                      aria-label="Filter by price verdict"
                      value={verdictFilter}
                      onChange={(e) =>
                        setVerdictFilter(e.target.value as 'all' | DealVerdict)
                      }
                    >
                      <option value="all">All Deal Ratings</option>
                      <option value="all-time-low">All-Time Low Only</option>
                      <option value="great-deal">Verified Drop</option>
                      <option value="watch-out">Fake Markdown Alerts</option>
                    </select>
                  </label>

                  <label className="compact-select">
                    <select
                      aria-label="Sort deals"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                    >
                      <option value="recommended">Sort: Top Recommended</option>
                      <option value="discount-desc">Sort: Biggest % Off</option>
                      <option value="savings-desc">Sort: Most $ Saved</option>
                      <option value="price-asc">Sort: Price Low → High</option>
                      <option value="price-desc">Sort: Price High → Low</option>
                      <option value="rating-desc">Sort: Highest Rated</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="chip-scroll">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="subfilter-bar">
                <div className="chip-group">
                  {(
                    [
                      { id: 'all', label: 'Everyone' },
                      { id: 'girlfriends', label: '✨ For Girlfriends' },
                      { id: 'me', label: '🖤 For Me' },
                      { id: 'shared', label: '🏡 Shared / Couple' },
                    ] as const
                  ).map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      className={`filter-chip ${audienceFilter === aud.id ? 'active' : ''}`}
                      onClick={() => setAudienceFilter(aud.id)}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                <div className="price-cap-slider">
                  <span>Max Price: {maxPriceFilter >= 1500 ? 'Any' : formatCurrency(maxPriceFilter)}</span>
                  <input
                    type="range"
                    min={50}
                    max={1500}
                    step={25}
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Results Bar */}
            <div className="results-bar">
              <span>
                Showing <strong>{filteredProducts.length}</strong> of {allProducts.length} curated items
              </span>
              <div className="results-bar-actions">
                {filteredProducts.length > 0 && (
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => handleSelectMany(filteredProducts)}
                  >
                    <Plus size={13} /> Select All Visible ({filteredProducts.length})
                  </button>
                )}
                {(searchQuery ||
                  categoryFilter !== 'All' ||
                  storeFilter !== 'all' ||
                  audienceFilter !== 'all' ||
                  verdictFilter !== 'all' ||
                  maxPriceFilter < 1500) && (
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={resetCatalogFilters}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="empty-state-box">
                <h3>No matching Black Friday deals found</h3>
                <p>Try widening your price cap, clearing a store filter, or adding a custom item.</p>
                <div className="empty-actions">
                  <button type="button" className="btn-select" onClick={resetCatalogFilters}>
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    className="btn-primary-gold"
                    onClick={() => setCustomModalOpen(true)}
                  >
                    <Plus size={15} /> Add Custom Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selection={selectionsMap[product.id]}
                    shoppers={shoppers}
                    onToggleSelect={handleToggleSelect}
                    onAssignShopper={(productId, shopperId) =>
                      handleUpdateSelection(productId, { shopperId })
                    }
                    onOpenDetail={setDetailProduct}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'stores' && (
          <StoresDirectory
            stores={STORES}
            products={allProducts}
            onBrowseStoreDeals={handleBrowseStoreDeals}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsView
            products={allProducts}
            collections={CURATED_COLLECTIONS}
            selectionsMap={selectionsMap}
            onToggleSelect={handleToggleSelect}
            onSelectMany={handleSelectMany}
            onOpenDetail={setDetailProduct}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistView
            products={allProducts}
            selections={selections}
            shoppers={shoppers}
            onUpdateSelection={handleUpdateSelection}
            onRemoveSelection={handleRemoveSelection}
            onClearPurchased={handleClearPurchased}
            onOpenDetail={setDetailProduct}
            onAddShopper={handleAddShopper}
            onUpdateShopper={handleUpdateShopper}
            onDeleteShopper={handleDeleteShopper}
            onCopyShareLink={handleCopyShareLink}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onGoToCatalog={() => setActiveTab('catalog')}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <span>
            VELVET // FRIDAY — Built with TypeScript &amp; React. Prices &amp; 12-month histories are curated Black Friday reference data; verify final checkout price on the retailer site.
          </span>
          <span>Saved locally in your browser · Shareable via URL link</span>
        </div>
      </footer>

      <ProductDetailModal
        product={detailProduct}
        store={detailProduct ? storesMap[detailProduct.storeId] : undefined}
        selection={detailProduct ? selectionsMap[detailProduct.id] : undefined}
        shoppers={shoppers}
        onClose={() => setDetailProduct(null)}
        onToggleSelect={handleToggleSelect}
        onUpdateSelection={handleUpdateSelection}
      />

      <AddCustomItemModal
        open={customModalOpen}
        shoppers={shoppers}
        onClose={() => setCustomModalOpen(false)}
        onAddCustomItem={handleAddCustomItem}
      />
    </div>
  );
}

export default App;
