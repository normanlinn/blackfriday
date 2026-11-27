import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  hashPassword,
  setSessionCookie,
} from '@/server/auth';
import { getDb, getUserBundle, seedUserDefaults } from '@/server/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';
    const displayName = body.displayName?.trim() || email.split('@')[0] || 'Shopper';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 },
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    db.prepare(
      'INSERT INTO users (id, email, display_name, password_hash, provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(userId, email, displayName, passwordHash, 'password', Date.now());

    seedUserDefaults(userId);
    const { token, expiresAt } = createSession(userId);
    await setSessionCookie(token, expiresAt);

    const bundle = getUserBundle(userId);
    return NextResponse.json({
      user: {
        uid: userId,
        email,
        displayName,
        provider: 'password',
      },
      ...bundle,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
  }
}
