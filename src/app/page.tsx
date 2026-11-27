'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  Flame,
  LogIn,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Store,
  Sun,
  Tag,
} from 'lucide-react';
import { AddCustomItemModal } from '@/components/AddCustomItemModal';
import { AuthModal } from '@/components/AuthModal';
import { CatalogSkeletonGrid, LoadingScreen } from '@/components/LoadingScreen';
import { PersonalizeModal } from '@/components/PersonalizeModal';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { RecommendationsView } from '@/components/RecommendationsView';
import { StoresDirectory } from '@/components/StoresDirectory';
import { WatchlistView } from '@/components/WatchlistView';
import { CURATED_COLLECTIONS, DEFAULT_SHOPPERS } from '@/data/collections';
import { PRODUCTS } from '@/data/products';
import { STORES } from '@/data/stores';
import {
  fetchDealsFromBackend,
  fetchSessionFromBackend,
  logoutSession,
  syncListsToBackend,
  syncPreferencesToBackend,
  type AuthSessionResponse,
} from '@/lib/apiClient';
import type {
  ActiveTab,
  AuthUser,
  Category,
  CuratedCollection,
  DealVerdict,
  GenderFocus,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
  SortOption,
  StoreInfo,
  UserPreferences,
} from '@/types/shopping';
import {
  computePersonalizedScore,
  decodeSharePayload,
  encodeSharePayload,
  formatCurrency,
  getDiscountPercent,
  getSavingsAmount,
} from '@/utils/deals';

const GUEST_STORAGE_KEY = 'velvet-friday-guest-v2';

const DEFAULT_PREFERENCES: UserPreferences = {
  genderFocus: 'all',
  favoriteCategories: ['Skincare & Beauty', 'Shoes & Sneakers', 'Cookware & Kitchen'],
  budgetTier: 'all',
};

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Skincare & Beauty',
  'Shoes & Sneakers',
  'Accessories & Jewelry',
  'Apparel & Loungewear',
  'Cookware & Kitchen',
  'Tech & Audio',
  'Fitness & Travel',
  'Gaming & Home Theater',
];

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [backendSource, setBackendSource] = useState<
    'nextjs-sqlite-backend' | 'static-browser-cache'
  >('nextjs-sqlite-backend');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Data from backend
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(PRODUCTS);
  const [stores, setStores] = useState<StoreInfo[]>(STORES);
  const [collections, setCollections] = useState<CuratedCollection[]>(CURATED_COLLECTIONS);

  // User & saved state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [shoppers, setShoppers] = useState<ShopperProfile[]>(DEFAULT_SHOPPERS);
  const [selections, setSelections] = useState<SelectionEntry[]>([]);
  const [customItems, setCustomItems] = useState<ProductItem[]>([]);

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [genderFilter, setGenderFilter] = useState<'all' | GenderFocus>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<'all' | DealVerdict>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1800);
  const [sortBy, setSortBy] = useState<SortOption>('personalized');

  // Modals
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);

  const hydratedRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const applyGuestFallback = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#list=')) {
      const decoded = decodeSharePayload(window.location.hash.slice('#list='.length));
      if (decoded) {
        setShoppers(decoded.shoppers.length ? decoded.shoppers : DEFAULT_SHOPPERS);
        setSelections(decoded.selections);
        setCustomItems(decoded.customItems);
        return;
      }
    }

    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          shoppers?: ShopperProfile[];
          selections?: SelectionEntry[];
          customItems?: ProductItem[];
          preferences?: UserPreferences;
          theme?: 'dark' | 'light';
        };
        if (parsed.shoppers?.length) setShoppers(parsed.shoppers);
        if (Array.isArray(parsed.selections)) setSelections(parsed.selections);
        if (Array.isArray(parsed.customItems)) setCustomItems(parsed.customItems);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.theme === 'light' || parsed.theme === 'dark') setTheme(parsed.theme);
        return;
      }
    } catch {
      // Ignore invalid localStorage
    }

    setSelections([
      {
        productId: 'sony-wh1000xm5',
        shopperId: 'personal',
        priority: 'must-have',
        purchased: false,
        quantity: 1,
        note: 'Midnight Blue',
        addedAt: Date.now() - 5000,
      },
      {
        productId: 'caraway-cookware-12pc',
        shopperId: 'home-shared',
        priority: 'nice-to-have',
        purchased: false,
        quantity: 1,
        note: 'Sage or Cream set',
        addedAt: Date.now() - 2000,
      },
    ]);
  }, []);

  // Initial backend boot with smooth splash screen
  useEffect(() => {
    let active = true;
    const minSplash = new Promise((resolve) => setTimeout(resolve, 720));

    async function bootstrap() {
      const [dealsRes, sessionRes] = await Promise.all([
        fetchDealsFromBackend(),
        fetchSessionFromBackend(),
        minSplash,
      ]);
      if (!active) return;

      setCatalogProducts(dealsRes.products);
      setStores(dealsRes.stores);
      setCollections(dealsRes.collections);
      setBackendSource(dealsRes.source);

      if (sessionRes.user) {
        setUser(sessionRes.user);
        if (sessionRes.preferences) {
          setPreferences(sessionRes.preferences);
          setGenderFilter(sessionRes.preferences.genderFocus);
        }
        if (sessionRes.shoppers?.length) setShoppers(sessionRes.shoppers);
        if (sessionRes.selections) setSelections(sessionRes.selections);
        if (sessionRes.customItems) setCustomItems(sessionRes.customItems);
      } else {
        applyGuestFallback();
      }

      hydratedRef.current = true;
      setBooting(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [applyGuestFallback]);

  // Persist changes to backend (if logged in) or localStorage (guest)
  useEffect(() => {
    if (!hydratedRef.current) return;

    if (user) {
      const timer = setTimeout(() => {
        void syncListsToBackend(user, shoppers, selections, customItems);
      }, 250);
      return () => clearTimeout(timer);
    }

    try {
      localStorage.setItem(
        GUEST_STORAGE_KEY,
        JSON.stringify({ shoppers, selections, customItems, preferences, theme }),
      );
    } catch {
      // Ignore storage errors
    }
  }, [user, shoppers, selections, customItems, preferences, theme]);

  const handleRefreshFromBackend = async () => {
    setLoadingDeals(true);
    const [res] = await Promise.all([
      fetchDealsFromBackend(),
      new Promise((r) => setTimeout(r, 380)),
    ]);
    setCatalogProducts(res.products);
    setStores(res.stores);
    setCollections(res.collections);
    setBackendSource(res.source);
    setLoadingDeals(false);
    setSyncNotice('Deals & price histories refreshed');
    setTimeout(() => setSyncNotice(null), 2600);
  };

  const handleAuthenticated = (session: AuthSessionResponse) => {
    setUser(session.user);
    if (session.preferences) {
      setPreferences(session.preferences);
      setGenderFilter(session.preferences.genderFocus);
    }
    if (session.shoppers?.length) setShoppers(session.shoppers);
    if (session.selections) setSelections(session.selections);
    if (session.customItems) setCustomItems(session.customItems);
    setSyncNotice(`Signed in as ${session.user?.displayName}`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    applyGuestFallback();
    setSyncNotice('Signed out');
    setTimeout(() => setSyncNotice(null), 2600);
  };

  const handleSavePreferences = (next: UserPreferences) => {
    setPreferences(next);
    setGenderFilter(next.genderFocus);
    if (user) {
      void syncPreferencesToBackend(user, next);
    }
  };

  const allProducts = useMemo(() => {
    const map = new Map<string, ProductItem>();
    for (const p of customItems) map.set(p.id, p);
    for (const p of catalogProducts) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [customItems, catalogProducts]);

  const selectionsMap = useMemo(() => {
    const map: Record<string, SelectionEntry> = {};
    for (const s of selections) map[s.productId] = s;
    return map;
  }, [selections]);

  const storesMap = useMemo(() => {
    const map: Record<string, StoreInfo> = {};
    for (const st of stores) map[st.id] = st;
    return map;
  }, [stores]);

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
      if (
        genderFilter !== 'all' &&
        item.genderFocus !== genderFilter &&
        item.genderFocus !== 'unisex'
      ) {
        return false;
      }
      if (storeFilter !== 'all' && item.storeId !== storeFilter) return false;
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
        case 'personalized':
          return (
            computePersonalizedScore(b, preferences) -
            computePersonalizedScore(a, preferences)
          );
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
            (p.verdict === 'all-time-low'
              ? 30
              : p.verdict === 'great-deal'
                ? 15
                : p.verdict === 'watch-out'
                  ? -20
                  : 0) + getDiscountPercent(p.msrp, p.currentPrice);
          return score(b) - score(a);
        }
      }
    });
  }, [
    allProducts,
    searchQuery,
    categoryFilter,
    genderFilter,
    storeFilter,
    verdictFilter,
    maxPriceFilter,
    sortBy,
    preferences,
  ]);

  const inferDefaultShopperId = (product: ProductItem): string => {
    if (product.genderFocus === 'women' && shoppers.some((s) => s.id === 'gifts-her')) {
      return 'gifts-her';
    }
    if (product.genderFocus === 'men' && shoppers.some((s) => s.id === 'gifts-him')) {
      return 'gifts-him';
    }
    if (
      (product.category === 'Cookware & Kitchen' || product.recommendedFor.includes('shared')) &&
      shoppers.some((s) => s.id === 'home-shared')
    ) {
      return 'home-shared';
    }
    return shoppers[0]?.id ?? 'personal';
  };

  const handleToggleSelect = (product: ProductItem) => {
    setSelections((prev) => {
      const exists = prev.some((s) => s.productId === product.id);
      if (exists) return prev.filter((s) => s.productId !== product.id);
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
    const palette = ['#ff6b8b', '#38bdf8', '#a78bfa', '#2ee59d', '#f2c96d'];
    const id = `list-${Date.now()}`;
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
      const fallbackId = next[0]?.id ?? 'personal';
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
    a.download = 'velvet-friday-lists.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as {
        shoppers?: ShopperProfile[];
        selections?: SelectionEntry[];
        customItems?: ProductItem[];
      };
      if (!Array.isArray(parsed.shoppers) || !Array.isArray(parsed.selections)) {
        return false;
      }
      setShoppers(parsed.shoppers);
      setSelections(parsed.selections);
      if (Array.isArray(parsed.customItems)) setCustomItems(parsed.customItems);
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
    setGenderFilter('all');
    setStoreFilter('all');
    setVerdictFilter('all');
    setMaxPriceFilter(1800);
    setSortBy('personalized');
  };

  if (booting) {
    return <LoadingScreen />;
  }

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
                Curated Deals, Price History &amp; Personal Lists for All
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
              <Store size={15} /> Where to Shop ({stores.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <Sparkles size={15} /> For You
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              <ShoppingBag size={15} /> My Lists ({bagTotals.count})
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="bag-summary-pill"
              onClick={() => setActiveTab('watchlist')}
              title="Open saved shopping lists"
            >
              <ShoppingBag size={14} />
              <span>{formatCurrency(bagTotals.totalCost)}</span>
              <span className="bag-saved-tag">-{formatCurrency(bagTotals.totalSaved)}</span>
            </button>

            <button
              type="button"
              className="btn-ghost-icon"
              onClick={() => setPersonalizeModalOpen(true)}
              title="Personalize gender & category feed"
            >
              <Sliders size={15} />
              <span className="hide-mobile">Personalize</span>
            </button>

            <button
              type="button"
              className="btn-ghost-icon"
              onClick={() => setCustomModalOpen(true)}
              title="Add custom deal or fetch URL"
            >
              <Plus size={16} />
              <span className="hide-mobile">Add</span>
            </button>

            {user ? (
              <div className="user-pill">
                <span className="user-avatar">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hide-mobile user-name">{user.displayName}</span>
                <button
                  type="button"
                  className="icon-trash-btn"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary-gold"
                onClick={() => setAuthModalOpen(true)}
              >
                <LogIn size={14} /> Sign In
              </button>
            )}

            <button
              type="button"
              className="btn-ghost-icon"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle color theme"
              title="Toggle Obsidian / Silk theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        {syncNotice && (
          <div className="toast-banner floating-toast">
            <Sparkles size={15} />
            <span>{syncNotice}</span>
          </div>
        )}

        {activeTab === 'catalog' && (
          <section className="section-stack panel-reveal">
            {/* Editorial Hero Banner */}
            <div className="hero-banner">
              <div className="hero-aura" />
              <div className="hero-copy">
                <span className="eyebrow">
                  <Sparkles size={13} /> Black Friday 2026 · Personalized For Everyone
                </span>
                <h1>
                  Real discounts, 12-month price histories &amp; curated lists for all styles.
                </h1>
                <p>
                  Explore verified drops across Skincare, Shoes, Accessories, Apparel, Cookware, Tech &amp; Travel. Filter by Women&apos;s, Men&apos;s, or Unisex, sign in to save your lists, and skip fake markups.
                </p>
              </div>

              <div className="hero-quick-stats">
                <div className="hero-stat-pill">
                  <Flame size={16} className="text-emerald" />
                  <div>
                    <strong>
                      {allProducts.filter((p) => p.verdict === 'all-time-low').length} All-Time Lows
                    </strong>
                    <span>Verified 12-month price drops</span>
                  </div>
                </div>
                <div className="hero-stat-pill">
                  <Database size={16} className="text-gold" />
                  <div>
                    <strong>
                      {backendSource === 'nextjs-sqlite-backend'
                        ? 'Next.js + SQLite Live'
                        : 'Static Mirror Mode'}
                    </strong>
                    <span>
                      {user
                        ? `Synced for ${user.displayName}`
                        : 'Sign in with Google or Email to sync'}
                    </span>
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
                    placeholder="Search skincare, Nike sneakers, Mejuri hoops, Caraway cookware, Dyson..."
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
                      <option value="all">All Stores ({stores.length})</option>
                      {stores.map((s) => (
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
                      <option value="personalized">Sort: Personalized Match</option>
                      <option value="recommended">Sort: Top Deals</option>
                      <option value="discount-desc">Sort: Biggest % Off</option>
                      <option value="savings-desc">Sort: Most $ Saved</option>
                      <option value="price-asc">Sort: Price Low → High</option>
                      <option value="price-desc">Sort: Price High → Low</option>
                      <option value="rating-desc">Sort: Highest Rated</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="btn-ghost-icon"
                    onClick={handleRefreshFromBackend}
                    title="Refresh deals from backend"
                  >
                    <RefreshCw size={15} className={loadingDeals ? 'spin' : ''} />
                  </button>
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
                      { id: 'all', label: 'All Styles' },
                      { id: 'women', label: "✨ Women's" },
                      { id: 'men', label: "⚡ Men's" },
                      { id: 'unisex', label: '🏡 Unisex & Home' },
                    ] as const
                  ).map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      className={`filter-chip ${genderFilter === aud.id ? 'active' : ''}`}
                      onClick={() => setGenderFilter(aud.id)}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                <div className="price-cap-slider">
                  <span>
                    Max Price:{' '}
                    {maxPriceFilter >= 1800 ? 'Any' : formatCurrency(maxPriceFilter)}
                  </span>
                  <input
                    type="range"
                    min={50}
                    max={1800}
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
                    <Plus size={13} /> Save All Visible ({filteredProducts.length})
                  </button>
                )}
                {(searchQuery ||
                  categoryFilter !== 'All' ||
                  genderFilter !== 'all' ||
                  storeFilter !== 'all' ||
                  verdictFilter !== 'all' ||
                  maxPriceFilter < 1800) && (
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

            {/* Product Grid or Skeletons */}
            {loadingDeals ? (
              <CatalogSkeletonGrid />
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state-box">
                <h3>No matching Black Friday deals found</h3>
                <p>
                  Try widening your price cap, switching style filters, or adding a custom URL.
                </p>
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
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                    matchScore={computePersonalizedScore(product, preferences)}
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
            stores={stores}
            products={allProducts}
            onBrowseStoreDeals={handleBrowseStoreDeals}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsView
            products={allProducts}
            collections={collections}
            preferences={preferences}
            selectionsMap={selectionsMap}
            onToggleSelect={handleToggleSelect}
            onSelectMany={handleSelectMany}
            onOpenDetail={setDetailProduct}
            onOpenPersonalize={() => setPersonalizeModalOpen(true)}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistView
            user={user}
            products={allProducts}
            selections={selections}
            shoppers={shoppers}
            onOpenAuth={() => setAuthModalOpen(true)}
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
            VELVET // FRIDAY — Next.js TypeScript Full-Stack Shopping Hub. Verify final checkout pricing on retailer sites.
          </span>
          <span>
            {backendSource === 'nextjs-sqlite-backend'
              ? 'Backend: Next.js API + SQLite'
              : 'Static Web Mode · Shareable via URL'}
          </span>
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

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <PersonalizeModal
        open={personalizeModalOpen}
        preferences={preferences}
        onClose={() => setPersonalizeModalOpen(false)}
        onSavePreferences={handleSavePreferences}
      />
    </div>
  );
}
