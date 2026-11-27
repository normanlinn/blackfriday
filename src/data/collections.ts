import type { CuratedCollection, ShopperProfile } from '../types/shopping';

export const DEFAULT_SHOPPERS: ShopperProfile[] = [
  {
    id: 'personal',
    name: 'Personal Wishlist',
    emoji: '🖤',
    color: '#f2c96d',
    budget: 900,
  },
  {
    id: 'gifts-her',
    name: 'Gifts — Her',
    emoji: '✨',
    color: '#ff6b8b',
    budget: 800,
  },
  {
    id: 'gifts-him',
    name: 'Gifts — Him',
    emoji: '⚡',
    color: '#38bdf8',
    budget: 700,
  },
  {
    id: 'home-shared',
    name: 'Home & Family',
    emoji: '🏡',
    color: '#2ee59d',
    budget: 1200,
  },
];

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'glow-vault',
    title: 'Skincare, Hair & Beauty Vault',
    subtitle: 'Top-rated serums, tools & fragrance sets hitting all-time lows this week',
    forWho: 'Skincare & Beauty',
    productIds: [
      'dyson-airwrap-id',
      'shark-flexstyle-gold',
      'sol-de-janeiro-jet-set',
      'laneige-lip-sleep-trio',
      'cosrx-glass-skin-kit',
      'kiehls-mens-fuel-set',
    ],
    accent: '#ff6b8b',
  },
  {
    id: 'sneaker-style',
    title: 'Sneakers, Bags & Everyday Luxury',
    subtitle: 'Verified drops on Nike, New Balance, HOKA, Coach, Mejuri & cashmere',
    forWho: 'Shoes & Accessories',
    productIds: [
      'nike-v2k-run',
      'new-balance-9060',
      'hoka-clifton-9',
      'coach-tabby-26',
      'mejuri-gold-bold-hoops',
      'nordstrom-cashmere-crew',
    ],
    accent: '#f2c96d',
  },
  {
    id: 'chef-kitchen',
    title: 'Cookware & Home Espresso Edit',
    subtitle: 'Non-toxic ceramic cookware, heirloom Dutch ovens & barista machines',
    forWho: 'Cookware & Kitchen',
    productIds: [
      'caraway-cookware-12pc',
      'breville-barista-express',
      'le-creuset-dutch-oven',
      'kitchenaid-artisan-mixer',
      'ninjacreami-deluxe',
      'barefoot-dreams-throw',
    ],
    accent: '#2ee59d',
  },
  {
    id: 'under-75-hits',
    title: 'Under $75 & All-Around Crowd Pleasers',
    subtitle: 'High-impact gifts for friends, family, coworkers & stocking stuffers',
    forWho: 'Everyone on Your List',
    productIds: [
      'laneige-lip-sleep-trio',
      'cosrx-glass-skin-kit',
      'kiehls-mens-fuel-set',
      'lululemon-belt-bag',
      'stanley-quencher-pro',
      'dualsense-rose-cobalt',
    ],
    accent: '#a78bfa',
  },
];
