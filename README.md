# NOIR EDIT — The Black Friday 2026 Edit

A curated Black Friday deal tracker built with **Next.js (App Router) + TypeScript + SQLite**.
Every deal is checked against twelve months of price history, so real drops stand out and
inflated "was" prices get flagged.

**Live:** https://normanlinn.github.io/blackfriday/

## Highlights

- **Cinematic intro** – gem monogram that draws itself, letter-by-letter wordmark and a live
  progress readout. It plays in full once per session; reloads stay fast.
- **Editorial hero** – blur-in headline, live countdown to Black Friday (switches to a
  "Live now" timer through Cyber Monday) and count-up stats.
- **Motion that stays out of the way** – cards reveal on scroll, a cursor spotlight on hover,
  images that sharpen in as they load, a reading-progress bar, a condensing header and
  back-to-top. All of it respects `prefers-reduced-motion`.
- **Deal intelligence** – all-time-low, verified-drop and fake-markdown verdicts with
  12-month charts.
- **Search & filters** – items or categories, store, verdict, style, max price and seven sorts.
- **Lists** – save deals to multiple lists with budgets, priorities and notes. Share by link,
  export or import JSON.
- **Accounts** – email + password (`scrypt` hashes, `HttpOnly` cookies) or Google sign-in.
- **Two themes** – Noir (dark) and Alabaster (light), remembered with no flash on load.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with the API and SQLite (`data/velvet-friday.db`) |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run build:static` | Static export to `out/` for GitHub Pages |

### Optional: Google sign-in

Copy `.env.example` to `.env.local`, then set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_ID` from Google Cloud Console. Add `localhost` to the authorized JavaScript
origins.

## API

| Route | Purpose |
| --- | --- |
| `GET /api/deals` | Deals, stores and curated collections |
| `POST /api/fetch-deal` | Reads the title, store and price from a pasted product URL |
| `POST /api/auth/register` · `login` · `google` · `logout`, `GET /api/auth/me` | Sessions |
| `GET/PUT /api/lists`, `PUT /api/preferences` | Saved lists, budgets and style preferences |

## GitHub Pages

Pages serves static files only. `npm run build:static` sets the API routes aside and exports
the site to `out/`. Without a server, the app keeps lists and accounts in the browser and
shares lists by link.

> Prices move fast on Black Friday. Always confirm the final price at checkout.
