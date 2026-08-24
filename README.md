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

Deploy to Vercel and set environment variables:

- `VITE_BRAZE_API_KEY`
- `VITE_BRAZE_SDK_ENDPOINT` (e.g. `sdk.iad-03.braze.com`)
- `SERPAPI_API_KEY` (server-only)

## Demo routes

| Origin | Destinations |
|--------|----------------|
| Manila (MNL) | SIN, BKK, KUL, CGK, SGN |

## Disclaimer

Unofficial demo for Braze workshops. Not affiliated with Cebu Pacific Air.
