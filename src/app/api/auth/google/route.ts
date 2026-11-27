import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, setSessionCookie } from '@/server/auth';
import { getDb, getUserBundle, seedUserDefaults } from '@/server/db';

export const runtime = 'nodejs';

interface GoogleTokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      idToken?: string;
      email?: string;
      displayName?: string;
    };

    let email = '';
    let displayName = '';
    let photoUrl: string | null = null;
    let provider: 'firebase-google' | 'google-local' = 'google-local';

    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    if (body.idToken) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.idToken)}`,
      );
      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: 'Google token verification failed.' },
          { status: 401 },
        );
      }
      const info = (await verifyRes.json()) as GoogleTokenInfo;
      if (configuredClientId && info.aud !== configuredClientId) {
        return NextResponse.json(
          { error: 'Google token audience mismatch.' },
          { status: 401 },
        );
      }
      if (!info.email || info.email_verified !== 'true') {
        return NextResponse.json(
          { error: 'Google account email is not verified.' },
          { status: 401 },
        );
      }
      email = info.email.toLowerCase();
      displayName = info.name || email.split('@')[0];
      photoUrl = info.picture ?? null;
      provider = 'firebase-google';
    } else if (!configuredClientId && body.email) {
      // Quick Google-style local profile login when OAuth Client ID is not configured
      email = body.email.trim().toLowerCase();
      if (!email.includes('@')) {
        return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
      }
      displayName = body.displayName?.trim() || email.split('@')[0];
      provider = 'google-local';
    } else {
      return NextResponse.json(
        { error: 'Google ID token is required.' },
        { status: 400 },
      );
    }

    const db = getDb();
    let row = db
      .prepare('SELECT id, email, display_name, provider, photo_url FROM users WHERE email = ?')
      .get(email) as
      | {
          id: string;
          email: string;
          display_name: string;
          provider: string;
          photo_url: string | null;
        }
      | undefined;

    if (!row) {
      const userId = crypto.randomUUID();
      db.prepare(
        'INSERT INTO users (id, email, display_name, password_hash, provider, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(userId, email, displayName, null, provider, photoUrl, Date.now());
      seedUserDefaults(userId);
      row = {
        id: userId,
        email,
        display_name: displayName,
        provider,
        photo_url: photoUrl,
      };
    } else {
      seedUserDefaults(row.id);
    }

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
    return NextResponse.json({ error: 'Google sign-in failed.' }, { status: 500 });
  }
}
