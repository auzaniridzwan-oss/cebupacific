# Cebu Pacific Braze Booking Demo

Sample airline booking website for **Cebu Pacific Air**, used to demonstrate the Braze Web SDK.

## Features

- SIA-style site shell with Cebu Pacific branding
- Booking flow: search → flights → ancillaries → seats → passenger → mock payment
- Live flight listings via [SerpAPI Google Flights](https://serpapi.com/google-flights-api) (MNL → 5 SEA cities, prefer `5J`)
- Mock fallback when SerpAPI is unavailable
- Braze custom events:
  - `ceb_searched_flight`
  - `ceb_selected_flight`
  - `ceb_selected_seat`
  - `ceb_selected_ancillary`
- Optional login (`changeUser` by email)
- Debug drawer (header **Braze**) to inspect events

## Setup

```bash
npm install
cp .env.example .env.local
# Fill VITE_BRAZE_API_KEY, VITE_BRAZE_SDK_ENDPOINT, SERPAPI_API_KEY
```

### Local UI only (mock flights)

```bash
npm run dev
```

SerpAPI calls go to `/api/serpapi/flights`. Without `vercel dev`, the client falls back to mock 5J flights.

### Local with live SerpAPI

```bash
npx vercel dev
# In another terminal, or use vercel's Vite integration on port 3000
```

Or run Vite (`npm run dev` on 5173) with `vercel dev` on 3000 — Vite proxies `/api` to 3000.

## Deploy

Deploy to Vercel and set environment variables under **Project → Settings → Environment Variables**:

| Variable | Environments | Notes |
|----------|--------------|--------|
| `VITE_BRAZE_API_KEY` | Production, Preview | Client build — redeploy after changing |
| `VITE_BRAZE_SDK_ENDPOINT` | Production, Preview | e.g. `sdk.iad-03.braze.com` |
| `SERPAPI_API_KEY` | Production, Preview | **Server-only** for `/api/serpapi/flights` — do **not** prefix with `VITE_` |

Localhost works because Vite reads `SERPAPI_API_KEY` from `.env.local`. On Vercel that file is not deployed; if the var is missing, `POST /api/serpapi/flights` returns **503** (`SerpAPI proxy not configured`) and the UI falls back to demo flights.

After adding or changing `SERPAPI_API_KEY`, trigger a **Redeploy**. Confirm the Network tab response body includes `"ok": true` (not `configured: false`).

## Demo routes

| Origin | Destinations |
|--------|----------------|
| Manila (MNL) | SIN, BKK, KUL, CGK, SGN |

## Disclaimer

Unofficial demo for Braze workshops. Not affiliated with Cebu Pacific Air.
