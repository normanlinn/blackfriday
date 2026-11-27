# VELVET // FRIDAY — Full-Stack Next.js Black Friday Hub

A **Next.js App Router + TypeScript + SQLite** Black Friday deal tracker, price-history analyzer, retailer directory, and personalized shopping list app for everyone.

## Features
- **Full-Stack Backend (`src/app/api/*` + `node:sqlite`)**:
  - `GET /api/deals` — Serves deals, stores, collections, and user custom items.
  - `POST /api/fetch-deal` — Server-side URL metadata fetcher (extracts product title, store, and price when you paste a product link).
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/logout` — Email + password authentication (`scrypt` salted hashes + `HttpOnly` session cookies) and Google Sign-In (`GOOGLE_CLIENT_ID` ID-token verification or quick Google email profile).
  - `GET/PUT /api/lists` & `PUT /api/preferences` — Persists saved lists, budgets, and style preferences in SQLite (`data/velvet-friday.db`).
- **Categories & Gender Personalization**:
  - Categories: *Skincare & Beauty*, *Shoes & Sneakers*, *Accessories & Jewelry*, *Apparel & Loungewear*, *Cookware & Kitchen*, *Tech & Audio*, *Fitness & Travel*, *Gaming & Home Theater*.
  - Style/Gender Filters: *All Styles*, *Women's*, *Men's*, *Unisex & Home* + live match percentage badges.
- **Animations, Loading Splash & Dual Color Themes**:
  - Animated boot splash screen, shimmer skeletons, staggered card entrances, specular card hover sweeps, and Obsidian Velvet / Silk & Rose themes.

## Run Full-Stack Server (Next.js + SQLite Backend)
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### Optional: Live Google OAuth Setup
Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` from Google Cloud Console (adding `localhost` to Authorized JavaScript origins).

## GitHub Pages Static Mirror
GitHub Pages hosts static files only (no Node.js runtime). When deployed via `npm run build:static` to `gh-pages`, the app seamlessly uses its built-in browser persistence fallback while keeping all animations, categories, and personalization features active.
