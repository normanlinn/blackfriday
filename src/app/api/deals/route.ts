import { NextRequest, NextResponse } from 'next/server';
import { CURATED_COLLECTIONS } from '@/data/collections';
import { PRODUCTS } from '@/data/products';
import { STORES } from '@/data/stores';
import { getSessionUser } from '@/server/auth';
import { getUserBundle } from '@/server/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const customItems = user ? getUserBundle(user.uid).customItems : [];
  const allProducts = [...customItems, ...PRODUCTS];

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const category = searchParams.get('category') ?? 'All';
  const gender = searchParams.get('gender') ?? 'all';
  const store = searchParams.get('store') ?? 'all';

  const filtered = allProducts.filter((item) => {
    if (category !== 'All' && item.category !== category) return false;
    if (gender !== 'all' && item.genderFocus !== gender && item.genderFocus !== 'unisex') {
      return false;
    }
    if (store !== 'all' && item.storeId !== store) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.storeName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.whyRecommended.toLowerCase().includes(q)
    );
  });

  return NextResponse.json({
    products: filtered,
    stores: STORES,
    collections: CURATED_COLLECTIONS,
    totalCatalog: allProducts.length,
    fetchedAt: new Date().toISOString(),
    source: 'nextjs-sqlite-backend',
  });
}
