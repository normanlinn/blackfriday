import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  // Block private IPv4 ranges and loopback/link-local
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true;
    }
  }
  if (lower.startsWith('[') || lower.includes(':')) {
    return true;
  }
  return false;
}

function extractMeta(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m?.[1]?.trim() ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const rawUrl = body.url?.trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Please provide a product URL.' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are allowed.' }, { status: 400 });
    }

    if (isBlockedHostname(parsed.hostname)) {
      return NextResponse.json({ error: 'Private or local addresses cannot be fetched.' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    try {
      const response = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; VelvetFridayBot/1.0; +https://github.com/normanlinn/black-friday-collective)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeout);

      const html = (await response.text()).slice(0, 180_000);
      const ogTitle =
        extractMeta(
          html,
          /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        ) ??
        extractMeta(
          html,
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        ) ??
        extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i);

      const ogSite =
        extractMeta(
          html,
          /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
        ) ?? parsed.hostname.replace(/^www\./, '').split('.')[0];

      const ogImage =
        extractMeta(
          html,
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        ) ??
        extractMeta(
          html,
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        );

      const priceRaw =
        extractMeta(
          html,
          /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
        ) ??
        extractMeta(html, /"\s*price\s*"\s*:\s*"?(\d+(?:\.\d{1,2})?)"?/i) ??
        extractMeta(html, /\$\s?(\d{2,4}(?:\.\d{2})?)/);

      const detectedPrice = priceRaw ? Number.parseFloat(priceRaw) : null;

      return NextResponse.json({
        ok: true,
        title: ogTitle ? ogTitle.replace(/\s+/g, ' ').slice(0, 120) : parsed.hostname,
        storeName: ogSite ? ogSite.charAt(0).toUpperCase() + ogSite.slice(1) : 'Online Store',
        imageUrl: ogImage && ogImage.startsWith('http') ? ogImage : null,
        detectedPrice:
          detectedPrice && Number.isFinite(detectedPrice) && detectedPrice > 0
            ? detectedPrice
            : null,
        fetchedFromBackend: true,
      });
    } catch {
      clearTimeout(timeout);
      const fallbackStore = parsed.hostname.replace(/^www\./, '').split('.')[0];
      return NextResponse.json({
        ok: true,
        title: '',
        storeName: fallbackStore.charAt(0).toUpperCase() + fallbackStore.slice(1),
        detectedPrice: null,
        note: 'Store blocked automated scraping; store name parsed from URL.',
        fetchedFromBackend: true,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Unable to parse request.' }, { status: 400 });
  }
}
