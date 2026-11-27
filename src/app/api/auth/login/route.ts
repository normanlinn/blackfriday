import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from '@/server/auth';
import { getDb, getUserBundle, seedUserDefaults } from '@/server/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const db = getDb();
    const row = db
      .prepare(
        'SELECT id, email, display_name, password_hash, provider, photo_url FROM users WHERE email = ?',
      )
      .get(email) as
      | {
          id: string;
          email: string;
          display_name: string;
          password_hash: string | null;
          provider: string;
          photo_url: string | null;
        }
      | undefined;

    if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    seedUserDefaults(row.id);
    const { token, expiresAt } = createSession(row.id);
    await setSessionCookie(token, expiresAt);

    const bundle = getUserBundle(row.id);
    return NextResponse.json({
      user: {
        uid: row.id,
        email: row.email,
        displayName: row.display_name,
        photoURL: row.photo_url ?? undefined,
        provider: row.provider,
      },
      ...bundle,
    });
  } catch {
    return NextResponse.json({ error: 'Sign in failed.' }, { status: 500 });
  }
}
