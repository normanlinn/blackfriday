/** Single source of truth for the product name, so it is never hardcoded twice. */
export const BRAND = {
  name: 'NOIR EDIT',
  wordmark: ['NOIR', 'EDIT'] as const,
  monogram: 'NE',
  tagline: 'The Black Friday 2026 Edit',
  subtitle: 'Verified deals · 12-month price history · Shared lists',
  description:
    'A curated Black Friday 2026 edit: verified deals across beauty, fashion, home and tech, 12-month price histories that expose fake markdowns, personalized picks and shareable shopping lists.',
} as const;

/** Black Friday 2026 is Friday 27 November; Cyber Monday is 30 November. */
export const BLACK_FRIDAY_START = new Date(2026, 10, 27, 0, 0, 0);
export const CYBER_MONDAY_END = new Date(2026, 11, 1, 0, 0, 0);
