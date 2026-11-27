/**
 * 2026 expansion: five new categories, six new stores and more variety in the
 * existing aisles. Prices are estimates for Black Friday 2026 — always check
 * the retailer before buying.
 */
import type {
  Category,
  GenderFocus,
  ProductItem,
  StoreInfo,
} from '../types/shopping';
import { computeVerdict } from '../utils/deals';

interface DealSpec {
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

function deal(d: DealSpec): ProductItem {
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

const q = (base: string, term: string) => `${base}${encodeURIComponent(term)}`;
const WALMART = (t: string) => q('https://www.walmart.com/search?q=', t);
const WAYFAIR = (t: string) => q('https://www.wayfair.com/keyword.php?keyword=', t);
const HOMEDEPOT = (t: string) => q('https://www.homedepot.com/s/', t);
const REI = (t: string) => q('https://www.rei.com/search?q=', t);
const CHEWY = (t: string) => q('https://www.chewy.com/s?query=', t);
const LEGO = (t: string) => q('https://www.lego.com/en-us/search?q=', t);
const TARGET = (t: string) => q('https://www.target.com/s?searchTerm=', t);
const AMAZON = (t: string) => q('https://www.amazon.com/s?k=', t);
const BESTBUY = (t: string) => q('https://www.bestbuy.com/site/searchpage.jsp?st=', t);
const MACYS = (t: string) => q('https://www.macys.com/shop/search?keyword=', t);
const NORDSTROM = (t: string) => q('https://www.nordstrom.com/sr?keyword=', t);
const ULTA = (t: string) => q('https://www.ulta.com/search?search=', t);

export const EXPANSION_STORES: StoreInfo[] = [
  {
    id: 'walmart',
    name: 'Walmart',
    url: 'https://www.walmart.com',
    tagline: 'Rolling Black Friday events across TVs, toys, home & kitchen',
    discountRange: 'Up to 60% Off',
    promoHint: 'Walmart+ members get early access to each deal drop',
    stackingTip: 'Join Walmart+ for early access, then use Capital One Walmart card for 5% back online.',
    categories: ['Toys & Kids', 'Home & Furniture', 'Gaming & Home Theater', 'Smart Home', 'Cookware & Kitchen'],
    freeShipping: 'Free shipping on $35+ or with Walmart+',
    priceMatch: 'No online price match; 90-day returns on most items',
    accentColor: '#0071dc',
    rating: 4.4,
  },
  {
    id: 'wayfair',
    name: 'Wayfair',
    url: 'https://www.wayfair.com',
    tagline: 'Furniture, rugs, lighting and bedding at Black Friday lows',
    discountRange: 'Up to 70% Off',
    promoHint: 'Daily Doorbusters + free shipping on almost everything',
    stackingTip: 'Sign up for emails for an extra 10% off your first order, then layer card rewards.',
    categories: ['Home & Furniture'],
    freeShipping: 'Free shipping on orders $35+',
    priceMatch: 'No price match; 30-day returns',
    accentColor: '#7f187f',
    rating: 4.3,
  },
  {
    id: 'homedepot',
    name: 'The Home Depot',
    url: 'https://www.homedepot.com',
    tagline: 'Smart-home, tools, outdoor and holiday décor savings',
    discountRange: 'Up to 50% Off',
    promoHint: 'Special Buy of the Day + tool battery bundles',
    stackingTip: 'Look for "free tool with battery kit" bundles — the best value of the season.',
    categories: ['Smart Home', 'Outdoor & Camping', 'Home & Furniture'],
    freeShipping: 'Free delivery on $45+ or free pickup in store',
    priceMatch: 'Matches qualified competitor prices on identical items',
    accentColor: '#f96302',
    rating: 4.5,
  },
  {
    id: 'rei',
    name: 'REI Co-op',
    url: 'https://www.rei.com',
    tagline: 'Camping, hiking and outerwear from the outdoor co-op',
    discountRange: '20–40% Off',
    promoHint: 'Members get an extra coupon and annual dividend',
    stackingTip: 'Co-op members earn 10% back as a yearly dividend on full-price purchases.',
    categories: ['Outdoor & Camping', 'Fitness & Travel', 'Apparel & Loungewear'],
    freeShipping: 'Free shipping on $50+',
    priceMatch: 'Price-matches rei.com within 14 days',
    accentColor: '#3f6b35',
    rating: 4.7,
  },
  {
    id: 'chewy',
    name: 'Chewy',
    url: 'https://www.chewy.com',
    tagline: 'Pet beds, toys, food and smart pet gear',
    discountRange: 'Up to 50% Off',
    promoHint: 'Buy-2-get-1 on toys + extra 35% off first Autoship',
    stackingTip: 'Set up Autoship for 35% off the first order, then cancel or adjust anytime.',
    categories: ['Pet Supplies'],
    freeShipping: 'Free shipping on $49+',
    priceMatch: 'No price match; 365-day returns',
    accentColor: '#1c49c2',
    rating: 4.8,
  },
  {
    id: 'lego',
    name: 'LEGO',
    url: 'https://www.lego.com',
    tagline: 'Sets, gift-with-purchase and double Insiders points',
    discountRange: '20–40% Off select sets',
    promoHint: 'Gift-with-purchase + double LEGO Insiders points',
    stackingTip: 'Check Target and Walmart too — they often beat LEGO.com on the same sets.',
    categories: ['Toys & Kids'],
    freeShipping: 'Free shipping on $35+',
    priceMatch: 'No price match; 60-day returns',
    accentColor: '#e3000b',
    rating: 4.8,
  },
];

/** Extra categories existing stores now carry thanks to the new deals. */
export const STORE_CATEGORY_ADDITIONS: Record<string, Category[]> = {
  target: ['Toys & Kids', 'Home & Furniture'],
  amazon: ['Smart Home', 'Pet Supplies', 'Toys & Kids'],
  bestbuy: ['Smart Home'],
  macys: ['Home & Furniture'],
  nordstrom: ['Home & Furniture'],
  ulta: ['Skincare & Beauty'],
};

export const EXPANSION_PRODUCTS: ProductItem[] = [
  // === HOME & FURNITURE ===
  deal({
    id: 'wayfair-boucle-accent-chair',
    name: 'Bouclé Barrel Accent Chair',
    brand: 'Wade Logan',
    category: 'Home & Furniture',
    store: ['wayfair', 'Wayfair', WAYFAIR('boucle barrel chair')],
    msrp: 449, price: 219, low: 249, avg90: 329,
    tags: ['Cozy', 'Trending'],
    why: 'The curvy bouclé chair everyone pins, at half its usual price.',
    advice: 'Check the seat height in the specs; Wayfair returns on furniture can carry a fee.',
    rating: 4.6, reviews: '3.1k', for: ['me', 'shared'],
  }),
  deal({
    id: 'wayfair-washable-area-rug',
    name: 'Ruggable-Style Washable Area Rug (8×10)',
    brand: 'Well Woven',
    category: 'Home & Furniture',
    store: ['wayfair', 'Wayfair', WAYFAIR('washable area rug 8x10')],
    msrp: 389, price: 159, low: 179, avg90: 239,
    tags: ['Pet-Friendly', 'Washable'],
    why: 'Machine-washable 8×10 rug for under $160 — great with kids or pets.',
    advice: 'Add a rug pad; it keeps thin washable rugs from sliding.',
    rating: 4.5, reviews: '6.8k',
  }),
  deal({
    id: 'target-threshold-linen-bedding',
    name: 'Threshold x Studio McGee Washed Linen Duvet Set',
    brand: 'Threshold',
    category: 'Home & Furniture',
    store: ['target', 'Target', TARGET('studio mcgee linen duvet')],
    msrp: 120, price: 72, low: 84, avg90: 110,
    tags: ['Gift-Ready', 'Neutral'],
    why: 'Soft washed-linen look for a fraction of designer bedding prices.',
    advice: 'Stack Target Circle Card 5% off; full/queen and king are the same sale price.',
    rating: 4.7, reviews: '2.2k', gender: 'unisex', for: ['me', 'girlfriends'],
  }),
  deal({
    id: 'macys-hotel-collection-towels',
    name: 'Hotel Collection Turkish Cotton Bath Towel Set',
    brand: 'Hotel Collection',
    category: 'Home & Furniture',
    store: ['macys', "Macy's", MACYS('hotel collection towels')],
    msrp: 180, price: 72, low: 72, avg90: 108,
    tags: ['Spa at Home'],
    why: "Macy's in-house luxe towels hit 60% off only twice a year.",
    advice: "Use the Macy's Black Friday code for an extra 10–15% on top.",
    rating: 4.7, reviews: '5.4k',
  }),
  deal({
    id: 'nordstrom-diptyque-candle',
    name: 'Diptyque Baies Scented Candle (190g)',
    brand: 'Diptyque',
    category: 'Home & Furniture',
    gender: 'women',
    store: ['nordstrom', 'Nordstrom', NORDSTROM('diptyque baies candle')],
    msrp: 78, price: 74, low: 62, avg90: 74,
    tags: ['Luxury Favorite', 'Gift-Ready'],
    why: 'A gifting icon — but this "deal" is barely off; it was cheaper in spring.',
    advice: 'Skip unless you need it now; Nordstrom gift-with-purchase sets are better value.',
    rating: 4.8, reviews: '1.9k', for: ['girlfriends'],
  }),

  // === SMART HOME ===
  deal({
    id: 'amazon-echo-show-8',
    name: 'Amazon Echo Show 8 (3rd Gen) Smart Display',
    brand: 'Amazon',
    category: 'Smart Home',
    store: ['amazon', 'Amazon', AMAZON('echo show 8 3rd gen')],
    msrp: 150, price: 79, low: 89, avg90: 129,
    tags: ['Kitchen Helper', 'Video Calls'],
    why: 'Best-in-class small smart display, nearly half off.',
    advice: 'Bundles with a smart bulb are often the same price — pick the bundle.',
    rating: 4.6, reviews: '41k',
  }),
  deal({
    id: 'google-nest-thermostat',
    name: 'Google Nest Learning Thermostat (4th Gen)',
    brand: 'Google',
    category: 'Smart Home',
    store: ['bestbuy', 'Best Buy', BESTBUY('nest learning thermostat 4th gen')],
    msrp: 279, price: 229, low: 229, avg90: 279,
    tags: ['Energy Saver'],
    why: 'First real discount on the new Nest; many utilities add a rebate on top.',
    advice: 'Check your power company for a $50–$100 smart thermostat rebate.',
    rating: 4.5, reviews: '3.6k',
  }),
  deal({
    id: 'ring-battery-doorbell-pro',
    name: 'Ring Battery Doorbell Pro',
    brand: 'Ring',
    category: 'Smart Home',
    store: ['homedepot', 'The Home Depot', HOMEDEPOT('ring battery doorbell pro')],
    msrp: 229, price: 149, low: 149, avg90: 209,
    tags: ['Security', 'Easy Install'],
    why: 'Head-to-toe video with no wiring needed, at its lowest price.',
    advice: 'You will want a Ring Protect plan for saved video — factor in about $5/month.',
    rating: 4.4, reviews: '8.2k',
  }),
  deal({
    id: 'philips-hue-starter-kit',
    name: 'Philips Hue White & Color Starter Kit (4 bulbs + Bridge)',
    brand: 'Philips Hue',
    category: 'Smart Home',
    store: ['amazon', 'Amazon', AMAZON('philips hue starter kit 4 bulbs')],
    msrp: 200, price: 129, low: 139, avg90: 179,
    tags: ['Mood Lighting', 'Gift-Ready'],
    why: 'The easiest way into smart lighting, with the Bridge included.',
    advice: 'Bulbs-only packs drop too; buy the kit once, then add bulbs on sale.',
    rating: 4.7, reviews: '19k',
  }),
  deal({
    id: 'roborock-q7-max',
    name: 'Roborock Q7 Max+ Robot Vacuum & Mop',
    brand: 'Roborock',
    category: 'Smart Home',
    store: ['walmart', 'Walmart', WALMART('roborock q7 max+')],
    msrp: 869, price: 299, low: 349, avg90: 459,
    tags: ['Self-Emptying', 'Pet Hair'],
    why: 'Self-emptying robot vac and mop for about a third of list price.',
    advice: 'Compare Amazon too; Walmart+ members usually get this one first.',
    rating: 4.5, reviews: '6.1k',
  }),

  // === TOYS & KIDS ===
  deal({
    id: 'lego-botanical-orchid',
    name: 'LEGO Icons Orchid Botanical Collection',
    brand: 'LEGO',
    category: 'Toys & Kids',
    store: ['lego', 'LEGO', LEGO('orchid 10311')],
    msrp: 49.99, price: 39.99, low: 39.99, avg90: 49.99,
    tags: ['Adult Builders', 'Gift-Ready'],
    why: 'The flower set adults love; rarely discounted on LEGO.com.',
    advice: 'Target sometimes has it at $34.99 — check before checkout.',
    rating: 4.9, reviews: '12k', for: ['girlfriends', 'me'],
  }),
  deal({
    id: 'lego-technic-mclaren',
    name: 'LEGO Technic McLaren P1 Hypercar',
    brand: 'LEGO',
    category: 'Toys & Kids',
    gender: 'men',
    store: ['walmart', 'Walmart', WALMART('lego technic mclaren p1')],
    msrp: 449.99, price: 359.99, low: 379.99, avg90: 429.99,
    tags: ['Collector', 'Display Piece'],
    why: 'A 3,800-piece display build, with a rare $90 drop.',
    advice: 'LEGO.com adds Insiders points; Walmart has the lower cash price.',
    rating: 4.8, reviews: '1.4k', for: ['me'],
  }),
  deal({
    id: 'nintendo-switch-2-bundle',
    name: 'Nintendo Switch 2 + Mario Kart World Bundle',
    brand: 'Nintendo',
    category: 'Toys & Kids',
    store: ['target', 'Target', TARGET('nintendo switch 2 mario kart world bundle')],
    msrp: 499.99, price: 449.99, low: 449.99, avg90: 499.99,
    tags: ['Hot Gift', 'Family Night'],
    why: 'First Black Friday for Switch 2 — the bundle includes a free $50 gift card.',
    advice: 'Stock goes fast; set a store alert and use Drive Up pickup.',
    rating: 4.9, reviews: '9.7k',
  }),
  deal({
    id: 'barbie-dreamhouse-2026',
    name: 'Barbie Dreamhouse with Pool & Slide',
    brand: 'Mattel',
    category: 'Toys & Kids',
    store: ['amazon', 'Amazon', AMAZON('barbie dreamhouse')],
    msrp: 199.99, price: 119.99, low: 129.99, avg90: 169.99,
    tags: ['Kids Favorite'],
    why: 'The holiday-morning showstopper at its lowest price of the year.',
    advice: 'Big box — ship to home early or pick up in store to hide it.',
    rating: 4.7, reviews: '18k',
  }),
  deal({
    id: 'yoto-player-3rd-gen',
    name: 'Yoto Player (3rd Gen) Kids Audio Player',
    brand: 'Yoto',
    category: 'Toys & Kids',
    store: ['target', 'Target', TARGET('yoto player')],
    msrp: 119.99, price: 89.99, low: 95.99, avg90: 109.99,
    tags: ['Screen-Free', 'Bedtime'],
    why: 'Screen-free audiobooks and music kids control themselves.',
    advice: 'Card bundles drop too; pick a starter pack of 5 for the best value.',
    rating: 4.8, reviews: '7.5k',
  }),

  // === OUTDOOR & CAMPING ===
  deal({
    id: 'yeti-tundra-45',
    name: 'YETI Tundra 45 Hard Cooler',
    brand: 'YETI',
    category: 'Outdoor & Camping',
    store: ['rei', 'REI Co-op', REI('yeti tundra 45')],
    msrp: 325, price: 260, low: 260, avg90: 325,
    tags: ['Built to Last', 'Tailgate'],
    why: 'YETI rarely discounts; 20% off is the best you will see.',
    advice: 'Co-op members get the dividend on top — buy here, not Amazon.',
    rating: 4.8, reviews: '6.3k',
  }),
  deal({
    id: 'solo-stove-bonfire-2',
    name: 'Solo Stove Bonfire 2.0 Smokeless Fire Pit',
    brand: 'Solo Stove',
    category: 'Outdoor & Camping',
    store: ['homedepot', 'The Home Depot', HOMEDEPOT('solo stove bonfire 2.0')],
    msrp: 349.99, price: 199.99, low: 219.99, avg90: 279.99,
    tags: ['Backyard', 'Gift-Ready'],
    why: 'Smokeless backyard fire for under $200 — lower than summer.',
    advice: 'The stand and lid bundle is often only $40 more; worth it.',
    rating: 4.7, reviews: '11k',
  }),
  deal({
    id: 'rei-half-dome-sl-tent',
    name: 'REI Co-op Half Dome SL 2+ Tent',
    brand: 'REI Co-op',
    category: 'Outdoor & Camping',
    store: ['rei', 'REI Co-op', REI('half dome sl 2+ tent')],
    msrp: 349, price: 244, low: 244, avg90: 349,
    tags: ['Backpacking', 'Two-Person'],
    why: 'A roomy two-person tent with a lifetime of REI support, 30% off.',
    advice: 'Members can return gear within a year — low-risk buy.',
    rating: 4.6, reviews: '2.4k', for: ['me', 'shared'],
  }),
  deal({
    id: 'patagonia-nano-puff',
    name: 'Patagonia Nano Puff Jacket',
    brand: 'Patagonia',
    category: 'Outdoor & Camping',
    store: ['rei', 'REI Co-op', REI('patagonia nano puff')],
    msrp: 239, price: 179, low: 167, avg90: 199,
    tags: ['Packable', 'Recycled'],
    why: 'The do-everything puffer. Good price, though older colors dipped lower in spring.',
    advice: 'Older colorways go lower — sort by price and pick last season.',
    rating: 4.7, reviews: '4.9k',
  }),
  deal({
    id: 'hydroflask-trail-32',
    name: 'Hydro Flask 32 oz Trail Series Bottle',
    brand: 'Hydro Flask',
    category: 'Outdoor & Camping',
    store: ['amazon', 'Amazon', AMAZON('hydro flask 32 oz trail series')],
    msrp: 54.95, price: 35.71, low: 38.47, avg90: 49.95,
    tags: ['Lightweight', 'Stocking Stuffer'],
    why: '25% lighter than the classic, and a third off.',
    advice: 'Pick a color under the coupon — prices vary by finish.',
    rating: 4.8, reviews: '15k',
  }),

  // === PET SUPPLIES ===
  deal({
    id: 'furhaven-orthopedic-bed',
    name: 'Furhaven Orthopedic Sofa-Style Dog Bed (L)',
    brand: 'Furhaven',
    category: 'Pet Supplies',
    store: ['chewy', 'Chewy', CHEWY('furhaven orthopedic sofa dog bed')],
    msrp: 89.99, price: 39.99, low: 44.99, avg90: 64.99,
    tags: ['Senior Dogs', 'Washable Cover'],
    why: 'Memory-foam support for older dogs at its lowest price.',
    advice: 'Measure your dog nose-to-tail and add 6 inches to pick the size.',
    rating: 4.6, reviews: '22k',
  }),
  deal({
    id: 'furbo-360-dog-camera',
    name: 'Furbo 360° Dog Camera with Treat Toss',
    brand: 'Furbo',
    category: 'Pet Supplies',
    store: ['amazon', 'Amazon', AMAZON('furbo 360 dog camera')],
    msrp: 210, price: 99, low: 109, avg90: 159,
    tags: ['Smart Pet', 'Gift-Ready'],
    why: 'Check in and toss treats from your phone — under $100.',
    advice: 'The alerts need a subscription; the camera and treat toss work without it.',
    rating: 4.4, reviews: '31k',
  }),
  deal({
    id: 'litter-robot-4',
    name: 'Litter-Robot 4 Self-Cleaning Litter Box',
    brand: 'Whisker',
    category: 'Pet Supplies',
    store: ['chewy', 'Chewy', CHEWY('litter robot 4')],
    msrp: 699, price: 649, low: 599, avg90: 649,
    tags: ['Smart Pet'],
    why: 'Popular, but this is no deal — it was $599 during spring sales.',
    advice: 'Wait for a bundle with free accessories, or buy direct from Whisker.',
    rating: 4.6, reviews: '9.8k',
  }),
  deal({
    id: 'kong-holiday-toy-bundle',
    name: 'KONG Holiday Toy Bundle (5-Pack)',
    brand: 'KONG',
    category: 'Pet Supplies',
    store: ['chewy', 'Chewy', CHEWY('kong holiday toy bundle')],
    msrp: 49.99, price: 24.99, low: 29.99, avg90: 39.99,
    tags: ['Stocking Stuffer'],
    why: 'Five durable toys for the price of two.',
    advice: 'Counts toward Chewy buy-2-get-1 — add a second bundle for gifts.',
    rating: 4.7, reviews: '4.4k',
  }),

  // === MORE VARIETY IN EXISTING AISLES ===
  deal({
    id: 'ulta-olaplex-hair-kit',
    name: 'Olaplex Strong Days Ahead Hair Kit',
    brand: 'Olaplex',
    category: 'Skincare & Beauty',
    gender: 'women',
    store: ['ulta', 'Ulta Beauty', ULTA('olaplex kit')],
    msrp: 90, price: 54, low: 60, avg90: 84,
    tags: ['Value Set', 'Gift-Ready'],
    why: 'Three full-size Olaplex bestsellers for less than two would cost.',
    advice: 'Ultamate members earn 2× points on this one during the sale.',
    rating: 4.7, reviews: '2.7k', for: ['girlfriends'],
  }),
  deal({
    id: 'walmart-ninja-air-fryer',
    name: 'Ninja Foodi 6-in-1 Dual-Zone Air Fryer (8 qt)',
    brand: 'Ninja',
    category: 'Cookware & Kitchen',
    store: ['walmart', 'Walmart', WALMART('ninja dual zone air fryer 8 qt')],
    msrp: 199.99, price: 99, low: 119, avg90: 159,
    tags: ['Weeknight Hero'],
    why: 'Two baskets, two foods, one finish time — half price.',
    advice: 'The 10-qt model is often only $20 more; worth it for 4+ people.',
    rating: 4.8, reviews: '38k',
  }),
  deal({
    id: 'walmart-tcl-qm7-65',
    name: 'TCL 65" QM7 QLED 4K Mini-LED TV',
    brand: 'TCL',
    category: 'Gaming & Home Theater',
    store: ['walmart', 'Walmart', WALMART('tcl 65 qm7')],
    msrp: 1299.99, price: 598, low: 698, avg90: 899,
    tags: ['Big Screen', 'Best Value'],
    why: 'Mini-LED brightness for well under $600 — the value TV of the year.',
    advice: 'Check Best Buy price-match; both chains usually land on the same number.',
    rating: 4.6, reviews: '5.2k',
  }),
  deal({
    id: 'samsung-galaxy-tab-s10',
    name: 'Samsung Galaxy Tab S10 FE (128GB)',
    brand: 'Samsung',
    category: 'Tech & Audio',
    store: ['bestbuy', 'Best Buy', BESTBUY('galaxy tab s10 fe')],
    msrp: 499.99, price: 349.99, low: 379.99, avg90: 449.99,
    tags: ['S Pen Included', 'Students'],
    why: 'Big screen, S Pen in the box, $150 off.',
    advice: 'Trade in an old tablet at Best Buy for an extra $50–$100.',
    rating: 4.6, reviews: '2.1k',
  }),
  deal({
    id: 'nike-tech-fleece-hoodie',
    name: 'Nike Sportswear Tech Fleece Full-Zip Hoodie',
    brand: 'Nike',
    category: 'Apparel & Loungewear',
    gender: 'men',
    store: ['macys', "Macy's", MACYS('nike tech fleece hoodie')],
    msrp: 135, price: 94.5, low: 99, avg90: 125,
    tags: ['Streetwear', 'Gift-Ready'],
    why: 'The Tech Fleece everyone asks for — rarely below $100.',
    advice: "Size up for a relaxed fit; Macy's extra code may apply.",
    rating: 4.7, reviews: '6.6k', for: ['me'],
  }),
  deal({
    id: 'target-stanley-iceflow',
    name: 'Stanley IceFlow Flip Straw Tumbler (30 oz)',
    brand: 'Stanley',
    category: 'Fitness & Travel',
    store: ['target', 'Target', TARGET('stanley iceflow 30 oz')],
    msrp: 35, price: 24.5, low: 26.25, avg90: 35,
    tags: ['Stocking Stuffer', 'Leak-Proof'],
    why: 'Leak-proof, bag-friendly cousin of the Quencher, 30% off.',
    advice: 'Holiday colors sell out first — buy early.',
    rating: 4.8, reviews: '9.3k',
  }),
];
