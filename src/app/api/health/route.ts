import { NextResponse } from 'next/server';
import { PRODUCTS } from '@/data/products';
import { STORES } from '@/data/stores';
import { getDb } from '@/server/db';

export const runtime = 'nodejs';

export async function GET() {
  getDb();
  return NextResponse.json({
    ok: true,
    backend: 'nextjs-sqlite',
    productCount: PRODUCTS.length,
    storeCount: STORES.length,
    googleClientConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
}
