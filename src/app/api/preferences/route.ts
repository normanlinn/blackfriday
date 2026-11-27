import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { saveUserPreferences } from '@/server/db';
import type { UserPreferences } from '@/types/shopping';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as UserPreferences;
    saveUserPreferences(user.uid, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save preferences.' }, { status: 500 });
  }
}
