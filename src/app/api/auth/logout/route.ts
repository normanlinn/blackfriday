import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearSessionCookie,
  deleteSession,
  SESSION_COOKIE_NAME,
} from '@/server/auth';

export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    deleteSession(token);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
