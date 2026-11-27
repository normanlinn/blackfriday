'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { BrandMark } from '@/components/BrandMark';
import { Countdown } from '@/components/Countdown';
import { ScrollChrome } from '@/components/ScrollChrome';
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
import { BRAND } from '@/lib/brand';
import { useCountUp } from '@/lib/hooks';
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
  getProductImageSrc,
  getSavingsAmount,
} from '@/utils/deals';

// Storage keys keep their original names so existing saved lists carry over.
const GUEST_STORAGE_KEY = 'velvet-friday-guest-v2';
const THEME_STORAGE_KEY = 'noir-edit-theme';

const DEFAULT_PREFERENCES: UserPreferences = {
  genderFocus: 'all',
  favoriteCategories: ['Skincare & Beauty', 'Shoes & Sneakers', 'Cookware & Kitchen'],
  budgetTier: 'all',
};

const HERO_WORDS = ['Only', 'the', 'deals', 'worth', 'your', 'Friday.'];

const MARQUEE_ITEMS = [
  'Black Friday 2026',
  "Macy's",
  'Zara',
  'H&M',
  'Uniqlo',
  'Skechers',
  'Citadel Outlets',
  'Westfield OC',
  'Sephora',
  'Nordstrom',
  'Best Buy',
  '12-month price histories',
  'No fake markdowns',
];

function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  const n = useCountUp(value);
  return (
    <>
      {prefix}
      {Math.round(n).toLocaleString('en-US')}
    </>
  );
}

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
  const [splashVisible, setSplashVisible] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [backendSource, setBackendSource] = useState<
    'nextjs-sqlite-backend' | 'static-browser-cache'
  >('nextjs-sqlite-backend');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  // The boot script in layout.tsx has already applied the saved theme to <html>.
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark',
  );

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
  const [searchMode, setSearchMode] = useState<'all' | 'items' | 'categories'>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [genderFilter, setGenderFilter] = useState<'all' | GenderFocus>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<'all' | DealVerdict>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1800);
  const [sortBy, setSortBy] = useState<SortOption>('personalized');

  // Modals & UI feedback animations
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);
  const [bagBump, setBagBump] = useState(false);

  const hydratedRef = useRef(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string, durationMs = 2600) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setSyncNotice(message);
    noticeTimerRef.current = setTimeout(() => setSyncNotice(null), durationMs);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }
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
    // Play the full intro once per browser session; later reloads stay snappy.
    let introSeen = false;
    try {
      introSeen = sessionStorage.getItem('noir-edit-intro') === '1';
      sessionStorage.setItem('noir-edit-intro', '1');
    } catch {
      // sessionStorage unavailable: just play the intro
    }
    const minSplash = new Promise((resolve) => setTimeout(resolve, introSeen ? 450 : 1500));

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
    showNotice('Deals & price histories refreshed');
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
    showNotice(`Signed in as ${session.user?.displayName}`, 3000);
  };

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    applyGuestFallback();
    showNotice('Signed out');
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

  const bagSnapshotRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hydratedRef.current) return;
    const snapshot = `${bagTotals.count}:${bagTotals.totalCost}`;
    const previous = bagSnapshotRef.current;
    bagSnapshotRef.current = snapshot;
    if (previous === null || previous === snapshot) return;
    setBagBump(true);
    const t = setTimeout(() => setBagBump(false), 450);
    return () => clearTimeout(t);
  }, [bagTotals.count, bagTotals.totalCost]);

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
      const matchesCategoryText = item.category.toLowerCase().includes(q);
      const matchesItemText =
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q) ||
        item.whyRecommended.toLowerCase().includes(q) ||
        item.vibeTags.some((t) => t.toLowerCase().includes(q));

      if (searchMode === 'categories') return matchesCategoryText;
      if (searchMode === 'items') return matchesItemText;
      return matchesCategoryText || matchesItemText;
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
    searchMode,
    categoryFilter,
    genderFilter,
    storeFilter,
    verdictFilter,
    maxPriceFilter,
    sortBy,
    preferences,
  ]);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const realCategories = CATEGORIES.filter((c): c is Category => c !== 'All');
    const matchingCategories = realCategories
      .filter((c) => !q || c.toLowerCase().includes(q))
      .map((cat) => ({
        category: cat,
        count: allProducts.filter((p) => p.category === cat).length,
      }));

    const matchingItems = q
      ? allProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q) ||
              p.storeName.toLowerCase().includes(q),
          )
          .slice(0, 5)
      : [];

    return {
      categories: searchMode === 'items' ? [] : matchingCategories,
      items: searchMode === 'categories' ? [] : matchingItems,
    };
  }, [allProducts, searchQuery, searchMode]);

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
    const remaining = shoppers.filter((s) => s.id !== id);
    if (remaining.length === 0) return; // always keep at least one list
    const fallbackId = remaining[0].id;
    setShoppers(remaining);
    setSelections((sels) =>
      sels.map((sel) => (sel.shopperId === id ? { ...sel, shopperId: fallbackId } : sel)),
    );
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
    a.download = 'noir-edit-lists.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so the download has started in every browser.
    setTimeout(() => URL.revokeObjectURL(url), 0);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.scrollY > 200) window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const atlCount = allProducts.filter((p) => p.verdict === 'all-time-low').length;
  const catalogSavings = allProducts.reduce(
    (sum, p) => sum + getSavingsAmount(p.msrp, p.currentPrice),
    0,
  );

  const splash = splashVisible ? (
    <LoadingScreen done={!booting} onExited={() => setSplashVisible(false)} />
  ) : null;

  if (booting) {
    return splash;
  }

  return (
    <div className="app-shell">
      {splash}
      <ScrollChrome />
      {/* Top Header */}
      <header className="top-header">
        <div className="container header-inner">
          <button
            type="button"
            className="brand-lockup"
            onClick={() => goToTab('catalog')}
            aria-label={`${BRAND.name} home`}
          >
            <BrandMark size={40} />
            <span>
              <span className="brand-title">
                {BRAND.wordmark[0]}
                <em>{BRAND.wordmark[1]}</em>
              </span>
              <span className="brand-subtitle">{BRAND.subtitle}</span>
            </span>
          </button>

          <nav className="primary-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'catalog' ? 'active' : ''}`}
              aria-current={activeTab === 'catalog' ? 'page' : undefined}
              onClick={() => goToTab('catalog')}
            >
              <Tag size={15} /> All Deals ({allProducts.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'stores' ? 'active' : ''}`}
              aria-current={activeTab === 'stores' ? 'page' : undefined}
              onClick={() => goToTab('stores')}
            >
              <Store size={15} /> Where to Shop ({stores.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              aria-current={activeTab === 'recommendations' ? 'page' : undefined}
              onClick={() => goToTab('recommendations')}
            >
              <Sparkles size={15} /> For You
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
              aria-current={activeTab === 'watchlist' ? 'page' : undefined}
              onClick={() => goToTab('watchlist')}
            >
              <ShoppingBag size={15} /> My Lists ({bagTotals.count})
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className={`bag-summary-pill ${bagBump ? 'bag-bump' : ''}`}
              onClick={() => goToTab('watchlist')}
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

      {/* Luxury Kinetic Ticker */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="marquee-group">
              {MARQUEE_ITEMS.map((item) => (
                <span key={item} className="marquee-item">
                  <span className="marquee-diamond">◆</span>
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <main className="container main-content">
        {syncNotice && (
          <div className="toast-banner floating-toast" role="status" key={syncNotice}>
            <Sparkles size={15} />
            <span>{syncNotice}</span>
          </div>
        )}

        {activeTab === 'catalog' && (
          <section className="section-stack panel-reveal">
            {/* Editorial Hero Banner */}
            <div className="hero-banner">
              <div className="hero-aura" />
              <div className="hero-aura hero-aura-2" />
              <div className="hero-copy">
                <span className="eyebrow hero-rise" style={{ '--d': 0 } as React.CSSProperties}>
                  <Sparkles size={13} /> {BRAND.tagline}
                </span>
                <h1 className="hero-title">
                  {HERO_WORDS.map((w, i) => (
                    <Fragment key={w}>
                      <span className="hero-word" style={{ '--d': i + 1 } as React.CSSProperties}>
                        {w === 'worth' ? <em className="shimmer-text">{w}</em> : w}
                      </span>
                      {i < HERO_WORDS.length - 1 && ' '}
                    </Fragment>
                  ))}
                </h1>
                <p className="hero-rise" style={{ '--d': 7 } as React.CSSProperties}>
                  Every price checked against twelve months of history, so you see real
                  drops, not inflated &ldquo;was&rdquo; prices. Beauty, fashion, home and tech
                  from the stores you already shop, filtered your way and saved to lists you can
                  share.
                </p>
                <div className="hero-cta-row hero-rise" style={{ '--d': 8 } as React.CSSProperties}>
                  <button
                    type="button"
                    className="btn-primary-gold btn-lg"
                    onClick={() => {
                      setVerdictFilter('all-time-low');
                      document
                        .getElementById('catalog-controls')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <Flame size={16} /> Shop all-time lows
                  </button>
                  <button type="button" className="btn-outline-lg" onClick={() => goToTab('recommendations')}>
                    <Sparkles size={15} /> Picks for you
                  </button>
                </div>
              </div>

              <div className="hero-side">
                <div className="hero-rise" style={{ '--d': 3 } as React.CSSProperties}>
                  <Countdown />
                </div>
                <div className="hero-stats-grid">
                  <div className="hero-stat hero-rise" style={{ '--d': 5 } as React.CSSProperties}>
                    <strong>
                      <CountUp value={allProducts.length} />
                    </strong>
                    <span>curated deals</span>
                  </div>
                  <div className="hero-stat hero-rise" style={{ '--d': 6 } as React.CSSProperties}>
                    <strong className="text-emerald">
                      <CountUp value={atlCount} />
                    </strong>
                    <span>all-time lows</span>
                  </div>
                  <div className="hero-stat hero-rise" style={{ '--d': 7 } as React.CSSProperties}>
                    <strong className="text-gold">
                      <CountUp value={catalogSavings} prefix="$" />
                    </strong>
                    <span>total markdowns</span>
                  </div>
                </div>
                <div className="hero-sync-note hero-rise" style={{ '--d': 8 } as React.CSSProperties}>
                  <Database size={13} />
                  {backendSource === 'nextjs-sqlite-backend' ? 'Live server sync' : 'Saved in this browser'}
                  {' · '}
                  {user ? `Signed in as ${user.displayName}` : 'Sign in to sync across devices'}
                </div>
              </div>
            </div>

            {/* Search & Multi-Facet Filter Bar */}
            <div className="catalog-controls" id="catalog-controls">
              <div className="search-sort-row">
                <div className="search-box-outer">
                  <div className="search-input-wrap search-lg">
                    <Search size={17} />
                    <input
                      type="search"
                      placeholder={
                        searchMode === 'categories'
                          ? 'Search categories (Skincare, Shoes, Cookware, Accessories...)'
                          : searchMode === 'items'
                            ? 'Search items & brands (Zara, Uniqlo, H&M, Skechers, Citadel, Dyson...)'
                            : 'Search items or categories (e.g. Skincare, Shoes, Zara, Citadel, Cookware...)'
                      }
                      value={searchQuery}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="search-mode-switch" role="group" aria-label="Search scope">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'items', label: 'Items' },
                          { id: 'categories', label: 'Categories' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`mode-pill ${searchMode === m.id ? 'active' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setSearchMode(m.id)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {searchFocused &&
                    (searchSuggestions.categories.length > 0 ||
                      searchSuggestions.items.length > 0) && (
                      <div className="search-suggestions-dropdown">
                        {searchSuggestions.categories.length > 0 && (
                          <div className="sugg-section">
                            <span className="sugg-heading">Categories</span>
                            <div className="sugg-cat-list">
                              {searchSuggestions.categories.map(({ category, count }) => (
                                <button
                                  key={category}
                                  type="button"
                                  className="sugg-cat-pill"
                                  onMouseDown={() => {
                                    setCategoryFilter(category);
                                    setSearchQuery('');
                                    setSearchFocused(false);
                                  }}
                                >
                                  <span>{category}</span>
                                  <small>{count} deals</small>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchSuggestions.items.length > 0 && (
                          <div className="sugg-section">
                            <span className="sugg-heading">Matching Black Friday Items</span>
                            <div className="sugg-items-list">
                              {searchSuggestions.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  className="sugg-item-row"
                                  onMouseDown={() => {
                                    setDetailProduct(item);
                                    setSearchFocused(false);
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getProductImageSrc(item)}
                                    alt={item.name}
                                    className="sugg-item-thumb"
                                  />
                                  <div className="sugg-item-info">
                                    <strong>{item.name}</strong>
                                    <span>
                                      {item.storeName} · {item.category}
                                    </span>
                                  </div>
                                  <span className="sugg-item-price">
                                    {formatCurrency(item.currentPrice)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
            onGoToCatalog={() => goToTab('catalog')}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <BrandMark size={30} />
            <div>
              <strong>
                {BRAND.wordmark[0]} <em>{BRAND.wordmark[1]}</em>
              </strong>
              <span>
                Prices change fast on Black Friday. Always confirm the final price at checkout.
              </span>
            </div>
          </div>
          <span className="footer-meta">
            {backendSource === 'nextjs-sqlite-backend'
              ? 'Synced with the Noir Edit server'
              : 'Static edition · lists save in your browser and share by link'}
            {' · © 2026'}
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
