import type { Category, GenderFocus, ProductItem } from '../types/shopping';
import { computeVerdict } from '../utils/deals';

/** Compact deal description; `deal()` expands it into a full ProductItem. */
export interface DealSpec {
  id: string;
  name: string;
  brand: string;
  category: Category;
  gender?: GenderFocus;
  store: [id: string, name: string, searchUrl: string];
  msrp: number;
  price: number;
  /** Lowest price seen in the last 12 months before Black Friday. */
  low: number;
  /** Typical selling price over the last 90 days. */
  avg90: number;
  /** Month of an earlier promo, shown on the chart (optional). */
  promo?: [month: string, price: number, note: string];
  tags: string[];
  why: string;
  advice: string;
  rating: number;
  reviews: string;
  for?: ProductItem['recommendedFor'];
}

export function deal(d: DealSpec): ProductItem {
  const [storeId, storeName, url] = d.store;
  const promo = d.promo ?? ['Jul', Math.round((d.avg90 + d.low) / 2), 'Summer Sale'];
  const priceHistory = [
    { month: 'Jan', price: d.msrp },
    { month: 'Mar', price: Math.round(d.avg90 * 1.02) },
    { month: 'May', price: d.msrp },
    { month: promo[0], price: promo[1], note: promo[2] },
    { month: 'Sep', price: d.avg90 },
    { month: 'Oct', price: d.msrp, note: 'Pre-BF MSRP' },
    { month: 'BF 26', price: d.price, note: 'Black Friday' },
  ];
  const allTimeLow = Math.min(d.low, d.price);
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    category: d.category,
    genderFocus: d.gender ?? 'unisex',
    storeId,
    storeName,
    url,
    msrp: d.msrp,
    currentPrice: d.price,
    allTimeLow,
    avg90Day: d.avg90,
    verdict: computeVerdict(d.msrp, d.price, allTimeLow, d.avg90),
    priceHistory,
    recommendedFor: d.for ?? ['shared'],
    vibeTags: d.tags,
    whyRecommended: d.why,
    buyAdvice: d.advice,
    rating: d.rating,
    reviewCount: d.reviews,
  };
}

