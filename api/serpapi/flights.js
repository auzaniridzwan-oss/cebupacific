import { isValidBookingSearch } from '../../src/logic/bookingPayload.js';
import { fetch5jGoogleFlights } from '../lib/serpapiGoogleFlights.js';

/**
 * Vercel serverless: proxy SerpAPI Google Flights (5J, demo routes MNL ↔ SEA).
 * Env: `SERPAPI_API_KEY` — never exposed to the client.
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse & { status: (n: number) => any, json: (b: unknown) => void }} res
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = (process.env.SERPAPI_API_KEY || '').trim();
  if (!key) {
    console.error(
      '[SerpAPI] SERPAPI_API_KEY is missing. Set it in Vercel → Project Settings → Environment Variables (Production + Preview), then redeploy.',
    );
    res.status(503).json({
      error: 'SerpAPI proxy not configured',
      hint: 'Set SERPAPI_API_KEY in Vercel Environment Variables for this deployment environment, then redeploy. Do not use a VITE_ prefix.',
      configured: false,
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Expected JSON body with booking_search fields' });
    return;
  }

  if (!isValidBookingSearch(body)) {
    res.status(400).json({
      error: 'Invalid or out-of-scope search (demo: MNL to SIN, BKK, KUL, CGK, or SGN only)',
    });
    return;
  }

  const search = {
    origin_code: body.origin_code,
    destination_code: body.destination_code,
    depart_date: body.depart_date,
    return_date: body.return_date,
  };

  const result = await fetch5jGoogleFlights(key, search);

  if (!result.ok) {
    const detail = result.error ? String(result.error).slice(0, 500) : 'unknown';
    console.error('[SerpAPI] flights error:', detail);
    res.status(502).json({ error: 'SerpAPI request failed', detail });
    return;
  }

  res.status(200).json({ ok: true, itineraries: result.itineraries });
}
