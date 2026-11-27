export type Category =
  | 'Tech & Audio'
  | 'Beauty & Skincare'
  | 'Fashion & Bags'
  | 'Home & Kitchen'
  | 'Fitness & Wellness'
  | 'Travel & Luggage'
  | 'Gaming & Entertainment';

export type DealVerdict = 'all-time-low' | 'great-deal' | 'fair-deal' | 'watch-out';

export type PriorityLevel = 'must-have' | 'nice-to-have' | 'watching';

export interface ShopperProfile {
  id: string;
  name: string;
  emoji: string;
  color: string;
  budget: number;
}

export interface PricePoint {
  month: string;
  price: number;
  note?: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  url: string;
  tagline: string;
  discountRange: string;
  promoHint: string;
  stackingTip: string;
  categories: Category[];
  freeShipping: string;
  priceMatch: string;
  accentColor: string;
  rating: number;
}

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: Category;
  storeId: string;
  storeName: string;
  url: string;
  msrp: number;
  currentPrice: number;
  allTimeLow: number;
  avg90Day: number;
  verdict: DealVerdict;
  priceHistory: PricePoint[];
  recommendedFor: ('me' | 'girlfriends' | 'shared')[];
  vibeTags: string[];
  whyRecommended: string;
  buyAdvice: string;
  rating: number;
  reviewCount: string;
  isCustom?: boolean;
}

export interface SelectionEntry {
  productId: string;
  shopperId: string;
  priority: PriorityLevel;
  purchased: boolean;
  quantity: number;
  note: string;
  addedAt: number;
}

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle: string;
  forWho: string;
  productIds: string[];
  accent: string;
}

export type ActiveTab = 'catalog' | 'stores' | 'recommendations' | 'watchlist';

export type SortOption =
  | 'recommended'
  | 'discount-desc'
  | 'savings-desc'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc';
