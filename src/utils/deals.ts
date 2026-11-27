import type {
  DealVerdict,
  PricePoint,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
} from '../types/shopping';

export function getDiscountPercent(msrp: number, currentPrice: number): number {
  if (msrp <= 0) return 0;
  return Math.max(0, Math.round(((msrp - currentPrice) / msrp) * 100));
}

export function getSavingsAmount(msrp: number, currentPrice: number): number {
  return Math.max(0, Number((msrp - currentPrice).toFixed(2)));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function computeVerdict(
  msrp: number,
  currentPrice: number,
  allTimeLow: number,
  avg90Day: number,
): DealVerdict {
  if (currentPrice <= allTimeLow * 1.02) {
    return 'all-time-low';
  }
  if (currentPrice > avg90Day * 1.02 || currentPrice >= msrp * 0.94) {
    return 'watch-out';
  }
  if (currentPrice <= avg90Day * 0.85 || currentPrice <= msrp * 0.72) {
    return 'great-deal';
  }
  return 'fair-deal';
}

export function getVerdictMeta(verdict: DealVerdict): {
  label: string;
  shortLabel: string;
  description: string;
  toneClass: string;
} {
  switch (verdict) {
    case 'all-time-low':
      return {
        label: 'All-Time Low',
        shortLabel: 'ATL',
        description: 'Matches or beats the lowest tracked 12-month price.',
        toneClass: 'verdict-atl',
      };
    case 'great-deal':
      return {
        label: 'Verified Drop',
        shortLabel: 'GREAT',
        description: 'Significantly below the 90-day average selling price.',
        toneClass: 'verdict-great',
      };
    case 'fair-deal':
      return {
        label: 'Solid Sale',
        shortLabel: 'GOOD',
        description: 'Respectable Black Friday markdown, though similar promos occur.',
        toneClass: 'verdict-fair',
      };
    case 'watch-out':
      return {
        label: 'Fake Markdown Alert',
        shortLabel: 'WAIT',
        description: 'Price was lower earlier this year or discount is minimal vs. 90-day average.',
        toneClass: 'verdict-warn',
      };
  }
}

export function generateDefaultHistory(msrp: number, currentPrice: number): PricePoint[] {
  const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Oct', 'BF 26'];
  const mid = Number(((msrp + currentPrice) / 2).toFixed(0));
  return months.map((month, idx) => {
    if (idx === months.length - 1) {
      return { month, price: currentPrice, note: 'Black Friday' };
    }
    if (idx === 3) {
      return { month, price: Math.round(msrp * 0.82), note: 'Summer Promo' };
    }
    if (idx === 5) {
      return { month, price: msrp, note: 'Pre-BF MSRP' };
    }
    return { month, price: idx % 2 === 0 ? msrp : mid };
  });
}

export interface SharePayload {
  shoppers: ShopperProfile[];
  selections: SelectionEntry[];
  customItems: ProductItem[];
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (!Array.isArray(parsed.shoppers) || !Array.isArray(parsed.selections)) {
      return null;
    }
    return {
      shoppers: parsed.shoppers,
      selections: parsed.selections,
      customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
    };
  } catch {
    return null;
  }
}
