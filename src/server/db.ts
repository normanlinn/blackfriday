import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_SHOPPERS } from '@/data/collections';
import type {
  ProductItem,
  SelectionEntry,
  ShopperProfile,
  UserPreferences,
} from '@/types/shopping';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'velvet-friday.db');

declare global {
  // eslint-disable-next-line no-var
  var __vfDb: DatabaseSync | undefined;
}

function initDatabase(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL,
      photo_url TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      gender_focus TEXT NOT NULL,
      favorite_categories TEXT NOT NULL,
      budget_tier TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shoppers (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      budget REAL NOT NULL,
      PRIMARY KEY (user_id, id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS list_items (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      shopper_id TEXT NOT NULL,
      priority TEXT NOT NULL,
      purchased INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      note TEXT NOT NULL DEFAULT '',
      added_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__vfDb) {
    globalThis.__vfDb = initDatabase();
  }
  return globalThis.__vfDb;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  genderFocus: 'all',
  favoriteCategories: ['Skincare & Beauty', 'Shoes & Sneakers', 'Cookware & Kitchen'],
  budgetTier: 'all',
};

export function seedUserDefaults(userId: string): void {
  const db = getDb();

  const existingPref = db
    .prepare('SELECT user_id FROM user_preferences WHERE user_id = ?')
    .get(userId);

  if (!existingPref) {
    db.prepare(
      'INSERT INTO user_preferences (user_id, gender_focus, favorite_categories, budget_tier) VALUES (?, ?, ?, ?)',
    ).run(
      userId,
      DEFAULT_PREFERENCES.genderFocus,
      JSON.stringify(DEFAULT_PREFERENCES.favoriteCategories),
      DEFAULT_PREFERENCES.budgetTier,
    );
  }

  const existingShopper = db
    .prepare('SELECT id FROM shoppers WHERE user_id = ? LIMIT 1')
    .get(userId);

  if (!existingShopper) {
    const insertShopper = db.prepare(
      'INSERT INTO shoppers (id, user_id, name, emoji, color, budget) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const s of DEFAULT_SHOPPERS) {
      insertShopper.run(s.id, userId, s.name, s.emoji, s.color, s.budget);
    }

    const insertItem = db.prepare(
      'INSERT INTO list_items (user_id, product_id, shopper_id, priority, purchased, quantity, note, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const now = Date.now();
    insertItem.run(
      userId,
      'sony-wh1000xm5',
      'personal',
      'must-have',
      0,
      1,
      'Midnight Blue',
      now - 5000,
    );
    insertItem.run(
      userId,
      'caraway-cookware-12pc',
      'home-shared',
      'nice-to-have',
      0,
      1,
      'Sage or Cream set',
      now - 2000,
    );
  }
}

export function getUserBundle(userId: string): {
  preferences: UserPreferences;
  shoppers: ShopperProfile[];
  selections: SelectionEntry[];
  customItems: ProductItem[];
} {
  const db = getDb();

  const prefRow = db
    .prepare(
      'SELECT gender_focus, favorite_categories, budget_tier FROM user_preferences WHERE user_id = ?',
    )
    .get(userId) as
    | { gender_focus: string; favorite_categories: string; budget_tier: string }
    | undefined;

  const preferences: UserPreferences = prefRow
    ? {
        genderFocus: prefRow.gender_focus as UserPreferences['genderFocus'],
        favoriteCategories: JSON.parse(prefRow.favorite_categories),
        budgetTier: prefRow.budget_tier as UserPreferences['budgetTier'],
      }
    : DEFAULT_PREFERENCES;

  const shopperRows = db
    .prepare('SELECT id, name, emoji, color, budget FROM shoppers WHERE user_id = ?')
    .all(userId) as Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    budget: number;
  }>;

  const shoppers: ShopperProfile[] =
    shopperRows.length > 0 ? shopperRows : DEFAULT_SHOPPERS;

  const itemRows = db
    .prepare(
      'SELECT product_id, shopper_id, priority, purchased, quantity, note, added_at FROM list_items WHERE user_id = ? ORDER BY added_at DESC',
    )
    .all(userId) as Array<{
    product_id: string;
    shopper_id: string;
    priority: string;
    purchased: number;
    quantity: number;
    note: string;
    added_at: number;
  }>;

  const selections: SelectionEntry[] = itemRows.map((row) => ({
    productId: row.product_id,
    shopperId: row.shopper_id,
    priority: row.priority as SelectionEntry['priority'],
    purchased: Boolean(row.purchased),
    quantity: row.quantity,
    note: row.note,
    addedAt: row.added_at,
  }));

  const customRows = db
    .prepare('SELECT payload FROM custom_products WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Array<{ payload: string }>;

  const customItems: ProductItem[] = customRows
    .map((r) => {
      try {
        return JSON.parse(r.payload) as ProductItem;
      } catch {
        return null;
      }
    })
    .filter((p): p is ProductItem => Boolean(p));

  return { preferences, shoppers, selections, customItems };
}

export function saveUserLists(
  userId: string,
  shoppers: ShopperProfile[],
  selections: SelectionEntry[],
  customItems: ProductItem[],
): void {
  const db = getDb();
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM shoppers WHERE user_id = ?').run(userId);
    const insShopper = db.prepare(
      'INSERT INTO shoppers (id, user_id, name, emoji, color, budget) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const s of shoppers) {
      insShopper.run(s.id, userId, s.name, s.emoji, s.color, s.budget);
    }

    db.prepare('DELETE FROM list_items WHERE user_id = ?').run(userId);
    const insItem = db.prepare(
      'INSERT INTO list_items (user_id, product_id, shopper_id, priority, purchased, quantity, note, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const item of selections) {
      insItem.run(
        userId,
        item.productId,
        item.shopperId,
        item.priority,
        item.purchased ? 1 : 0,
        item.quantity,
        item.note,
        item.addedAt,
      );
    }

    db.prepare('DELETE FROM custom_products WHERE user_id = ?').run(userId);
    const insCustom = db.prepare(
      'INSERT INTO custom_products (id, user_id, payload, created_at) VALUES (?, ?, ?, ?)',
    );
    for (const custom of customItems) {
      insCustom.run(custom.id, userId, JSON.stringify(custom), Date.now());
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function saveUserPreferences(userId: string, prefs: UserPreferences): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO user_preferences (user_id, gender_focus, favorite_categories, budget_tier)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       gender_focus = excluded.gender_focus,
       favorite_categories = excluded.favorite_categories,
       budget_tier = excluded.budget_tier`,
  ).run(
    userId,
    prefs.genderFocus,
    JSON.stringify(prefs.favoriteCategories),
    prefs.budgetTier,
  );
}
