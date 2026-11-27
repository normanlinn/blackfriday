import type { CuratedCollection, ShopperProfile } from '../types/shopping';

export const DEFAULT_SHOPPERS: ShopperProfile[] = [
  {
    id: 'me',
    name: 'Me',
    emoji: '🖤',
    color: '#d4af37',
    budget: 900,
  },
  {
    id: 'girlfriend',
    name: 'Girlfriend',
    emoji: '✨',
    color: '#f472b6',
    budget: 900,
  },
  {
    id: 'squad',
    name: 'Girlfriends / Crew',
    emoji: '🥂',
    color: '#a78bfa',
    budget: 400,
  },
  {
    id: 'shared',
    name: 'Shared / Home',
    emoji: '🏡',
    color: '#34d399',
    budget: 1200,
  },
];

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'glow-vault',
    title: 'The Glow & Hair Vault',
    subtitle: 'Most-wished beauty & styling drops hitting all-time lows this week',
    forWho: 'Girlfriend & Besties',
    productIds: [
      'dyson-airwrap-id',
      'shark-flexstyle-gold',
      'sol-de-janeiro-jet-set',
      'laneige-lip-sleep-trio',
      'glossier-you-duo',
      't3-airebrush-duo',
    ],
    accent: '#f43f5e',
  },
  {
    id: 'cozy-night-in',
    title: 'Cozy Date Night In',
    subtitle: 'Espresso mornings, gelato nights, plush throws & big-screen movies',
    forWho: 'Shared Couple Upgrades',
    productIds: [
      'breville-barista-express',
      'ninjacreami-deluxe',
      'barefoot-dreams-throw',
      'nebula-capsule-3-laser',
      'lg-c4-oled-55',
      'dualsense-rose-cobalt',
    ],
    accent: '#d4af37',
  },
  {
    id: 'jetset-duo',
    title: 'Weekend Getaway Edit',
    subtitle: 'Rare luggage discounts, noise-canceling travel audio & MagSafe gear',
    forWho: 'Travel Together',
    productIds: [
      'away-carry-on-set',
      'beis-weekender-bag',
      'sony-wh1000xm5',
      'anker-maggo-qi2',
      'apple-airtag-4pack',
      'fujifilm-instax-mini-evo',
    ],
    accent: '#14b8a6',
  },
  {
    id: 'under-75-hits',
    title: 'Stocking Stuffers & Under $75 Hits',
    subtitle: 'High-impact gifts for girlfriends, friends, or effortless add-ons',
    forWho: 'Everyone on the List',
    productIds: [
      'laneige-lip-sleep-trio',
      'lululemon-belt-bag',
      'stanley-quencher-pro',
      'bala-bangles-set',
      'dualsense-rose-cobalt',
      'sol-de-janeiro-jet-set',
    ],
    accent: '#a78bfa',
  },
];
