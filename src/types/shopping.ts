/** Single source of truth for categories, in display order. */
export const CATEGORIES = [
  'Skincare & Beauty',
  'Shoes & Sneakers',
  'Accessories & Jewelry',
  'Apparel & Loungewear',
  'Cookware & Kitchen',
  'Tech & Audio',
  'Fitness & Travel',
  'Gaming & Home Theater',
  'Home & Furniture',
  'Smart Home',
  'Toys & Kids',
  'Outdoor & Camping',
  'Pet Supplies',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type GenderFocus = 'women' | 'men' | 'unisex';

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
  genderFocus: GenderFocus;
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
  imageUrl?: string;
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

export interface UserPreferences {
  genderFocus: 'all' | GenderFocus;
  favoriteCategories: Category[];
  budgetTier: 'all' | 'under-75' | 'mid' | 'luxury';
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'password' | 'google-local' | 'firebase-google' | 'firebase-password';
}

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId?: string;
}

export type ActiveTab = 'catalog' | 'stores' | 'recommendations' | 'watchlist';

export type SortOption =
  | 'personalized'
  | 'recommended'
  | 'discount-desc'
  | 'savings-desc'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc';
