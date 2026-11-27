import { NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { getUserBundle } from '@/server/db';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const bundle = getUserBundle(user.uid);
  return NextResponse.json({
    user,
    ...bundle,
  });
}
