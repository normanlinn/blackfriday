import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { getUserBundle, saveUserLists } from '@/server/db';
import type { ProductItem, SelectionEntry, ShopperProfile } from '@/types/shopping';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const bundle = getUserBundle(user.uid);
  return NextResponse.json({
    shoppers: bundle.shoppers,
    selections: bundle.selections,
    customItems: bundle.customItems,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      shoppers?: ShopperProfile[];
      selections?: SelectionEntry[];
      customItems?: ProductItem[];
    };
    if (!Array.isArray(body.shoppers) || !Array.isArray(body.selections)) {
      return NextResponse.json({ error: 'Invalid list payload.' }, { status: 400 });
    }
    saveUserLists(
      user.uid,
      body.shoppers,
      body.selections,
      Array.isArray(body.customItems) ? body.customItems : [],
    );
    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Failed to save list.' }, { status: 500 });
  }
}
