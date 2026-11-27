'use client';

import { CURATED_COLLECTIONS, DEFAULT_SHOPPERS } from '@/data/collections';
import { PRODUCTS } from '@/data/products';
import { STORES } from '@/data/stores';
import type {
  AuthUser,
  CuratedCollection,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
  StoreInfo,
  UserPreferences,
} from '@/types/shopping';

export interface BackendDealsResponse {
  products: ProductItem[];
  stores: StoreInfo[];
  collections: CuratedCollection[];
  source: 'nextjs-sqlite-backend' | 'static-browser-cache';
  fetchedAt: string;
}

export interface AuthSessionResponse {
  user: AuthUser | null;
  preferences?: UserPreferences;
  shoppers?: ShopperProfile[];
  selections?: SelectionEntry[];
  customItems?: ProductItem[];
  mode: 'backend' | 'local';
}

interface LocalAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash?: string;
  provider: AuthUser['provider'];
  preferences: UserPreferences;
  shoppers: ShopperProfile[];
  selections: SelectionEntry[];
  customItems: ProductItem[];
}

const LOCAL_ACCOUNTS_KEY = 'vf-local-accounts-v2';
const LOCAL_CURRENT_UID_KEY = 'vf-local-current-uid-v2';

const DEFAULT_PREFS: UserPreferences = {
  genderFocus: 'all',
  favoriteCategories: ['Skincare & Beauty', 'Shoes & Sneakers', 'Cookware & Kitchen'],
  budgetTier: 'all',
};

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return text;
}

function readLocalAccounts(): Record<string, LocalAccountRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalAccountRecord>) : {};
  } catch {
    return {};
  }
}

function writeLocalAccounts(accounts: Record<string, LocalAccountRecord>): void {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore quota issues
  }
}

function createDefaultRecord(
  email: string,
  displayName: string,
  provider: AuthUser['provider'],
  passwordHash?: string,
): LocalAccountRecord {
  return {
    uid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    displayName,
    passwordHash,
    provider,
    preferences: DEFAULT_PREFS,
    shoppers: DEFAULT_SHOPPERS,
    selections: [
      {
        productId: 'sony-wh1000xm5',
        shopperId: 'personal',
        priority: 'must-have',
        purchased: false,
        quantity: 1,
        note: 'Midnight Blue',
        addedAt: Date.now(),
      },
    ],
    customItems: [],
  };
}

export async function fetchDealsFromBackend(): Promise<BackendDealsResponse> {
  try {
    const res = await fetch('/api/deals', { cache: 'no-store' });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = (await res.json()) as {
        products: ProductItem[];
        stores: StoreInfo[];
        collections: CuratedCollection[];
        fetchedAt: string;
      };
      return {
        products: data.products,
        stores: data.stores,
        collections: data.collections,
        fetchedAt: data.fetchedAt,
        source: 'nextjs-sqlite-backend',
      };
    }
  } catch {
    // Static fallback below
  }

  return {
    products: PRODUCTS,
    stores: STORES,
    collections: CURATED_COLLECTIONS,
    fetchedAt: new Date().toISOString(),
    source: 'static-browser-cache',
  };
}

export async function fetchSessionFromBackend(): Promise<AuthSessionResponse> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = (await res.json()) as Omit<AuthSessionResponse, 'mode'>;
      return { ...data, mode: 'backend' };
    }
  } catch {
    // Static fallback
  }

  const currentUid = localStorage.getItem(LOCAL_CURRENT_UID_KEY);
  if (currentUid) {
    const accounts = readLocalAccounts();
    const acct = Object.values(accounts).find((a) => a.uid === currentUid);
    if (acct) {
      return {
        user: {
          uid: acct.uid,
          email: acct.email,
          displayName: acct.displayName,
          provider: acct.provider,
        },
        preferences: acct.preferences,
        shoppers: acct.shoppers,
        selections: acct.selections,
        customItems: acct.customItems,
        mode: 'local',
      };
    }
  }

  return { user: null, mode: 'local' };
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
): Promise<{ ok: boolean; error?: string; session?: AuthSessionResponse }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.status !== 404 && res.headers.get('content-type')?.includes('application/json')) {
      const data = (await res.json()) as AuthSessionResponse & { error?: string };
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed.' };
      return { ok: true, session: { ...data, mode: 'backend' } };
    }
  } catch {
    // Static fallback
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || password.length < 6) {
    return {
      ok: false,
      error: 'Enter a valid email and password (min 6 characters).',
    };
  }
  const accounts = readLocalAccounts();
  if (accounts[cleanEmail]) {
    return { ok: false, error: 'Account already exists. Please sign in.' };
  }
  const passwordHash = await sha256Hex(`${cleanEmail}:${password}`);
  const record = createDefaultRecord(
    cleanEmail,
    displayName.trim() || cleanEmail.split('@')[0],
    'password',
    passwordHash,
  );
  accounts[cleanEmail] = record;
  writeLocalAccounts(accounts);
  localStorage.setItem(LOCAL_CURRENT_UID_KEY, record.uid);

  return {
    ok: true,
    session: {
      user: {
        uid: record.uid,
        email: record.email,
        displayName: record.displayName,
        provider: record.provider,
      },
      preferences: record.preferences,
      shoppers: record.shoppers,
      selections: record.selections,
      customItems: record.customItems,
      mode: 'local',
    },
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; session?: AuthSessionResponse }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status !== 404 && res.headers.get('content-type')?.includes('application/json')) {
      const data = (await res.json()) as AuthSessionResponse & { error?: string };
      if (!res.ok) return { ok: false, error: data.error || 'Invalid credentials.' };
      return { ok: true, session: { ...data, mode: 'backend' } };
    }
  } catch {
    // Static fallback
  }

  const cleanEmail = email.trim().toLowerCase();
  const accounts = readLocalAccounts();
  const acct = accounts[cleanEmail];
  const hash = await sha256Hex(`${cleanEmail}:${password}`);
  if (!acct || acct.passwordHash !== hash) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  localStorage.setItem(LOCAL_CURRENT_UID_KEY, acct.uid);

  return {
    ok: true,
    session: {
      user: {
        uid: acct.uid,
        email: acct.email,
        displayName: acct.displayName,
        provider: acct.provider,
      },
      preferences: acct.preferences,
      shoppers: acct.shoppers,
      selections: acct.selections,
      customItems: acct.customItems,
      mode: 'local',
    },
  };
}

export async function loginWithGoogleProfile(payload: {
  idToken?: string;
  email?: string;
  displayName?: string;
}): Promise<{ ok: boolean; error?: string; session?: AuthSessionResponse }> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status !== 404 && res.headers.get('content-type')?.includes('application/json')) {
      const data = (await res.json()) as AuthSessionResponse & { error?: string };
      if (!res.ok) return { ok: false, error: data.error || 'Google sign-in failed.' };
      return { ok: true, session: { ...data, mode: 'backend' } };
    }
  } catch {
    // Static fallback
  }

  const cleanEmail = payload.email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Please provide a valid Google email.' };
  }
  const accounts = readLocalAccounts();
  let acct = accounts[cleanEmail];
  if (!acct) {
    acct = createDefaultRecord(
      cleanEmail,
      payload.displayName?.trim() || cleanEmail.split('@')[0],
      'google-local',
    );
    accounts[cleanEmail] = acct;
    writeLocalAccounts(accounts);
  }
  localStorage.setItem(LOCAL_CURRENT_UID_KEY, acct.uid);

  return {
    ok: true,
    session: {
      user: {
        uid: acct.uid,
        email: acct.email,
        displayName: acct.displayName,
        provider: acct.provider,
      },
      preferences: acct.preferences,
      shoppers: acct.shoppers,
      selections: acct.selections,
      customItems: acct.customItems,
      mode: 'local',
    },
  };
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore
  }
  localStorage.removeItem(LOCAL_CURRENT_UID_KEY);
}

export async function syncListsToBackend(
  user: AuthUser | null,
  shoppers: ShopperProfile[],
  selections: SelectionEntry[],
  customItems: ProductItem[],
): Promise<boolean> {
  if (!user) return false;
  try {
    const res = await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shoppers, selections, customItems }),
    });
    if (res.ok) return true;
  } catch {
    // Static fallback
  }

  const accounts = readLocalAccounts();
  const acct = accounts[user.email.toLowerCase()];
  if (acct) {
    acct.shoppers = shoppers;
    acct.selections = selections;
    acct.customItems = customItems;
    writeLocalAccounts(accounts);
    return true;
  }
  return false;
}

export async function syncPreferencesToBackend(
  user: AuthUser | null,
  preferences: UserPreferences,
): Promise<void> {
  if (!user) return;
  try {
    const res = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (res.ok) return;
  } catch {
    // Static fallback
  }

  const accounts = readLocalAccounts();
  const acct = accounts[user.email.toLowerCase()];
  if (acct) {
    acct.preferences = preferences;
    writeLocalAccounts(accounts);
  }
}

export async function fetchDealInfoFromUrl(url: string): Promise<{
  ok: boolean;
  title?: string;
  storeName?: string;
  imageUrl?: string | null;
  detectedPrice?: number | null;
  note?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/fetch-deal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (res.status !== 404 && res.headers.get('content-type')?.includes('application/json')) {
      return (await res.json()) as {
        ok: boolean;
        title?: string;
        storeName?: string;
        imageUrl?: string | null;
        detectedPrice?: number | null;
        note?: string;
        error?: string;
      };
    }
  } catch {
    // Fallback
  }

  try {
    const parsed = new URL(url);
    const store = parsed.hostname.replace(/^www\./, '').split('.')[0];
    return {
      ok: true,
      title: '',
      storeName: store.charAt(0).toUpperCase() + store.slice(1),
      detectedPrice: null,
      note: 'URL store name parsed locally (run Next.js backend server to fetch live HTML title/price).',
    };
  } catch {
    return { ok: false, error: 'Enter a valid https:// product URL.' };
  }
}
