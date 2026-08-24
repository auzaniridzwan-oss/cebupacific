import { defineConfig, loadEnv } from 'vite';
import { fetch5jGoogleFlights } from './api/lib/serpapiGoogleFlights.js';
import { isValidBookingSearch } from './src/logic/bookingPayload.js';

/**
 * Serves POST /api/serpapi/flights during `vite dev` so SerpAPI works without `vercel dev`.
 * @param {string} apiKey
 */
function serpapiDevPlugin(apiKey) {
  return {
    name: 'serpapi-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/serpapi/flights', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        /** @type {Buffer[]} */
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          if (!apiKey) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: 'SerpAPI proxy not configured' }));
            return;
          }
          let body = {};
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }
          if (!isValidBookingSearch(body)) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: 'Invalid or out-of-scope search (demo: MNL to SIN, BKK, KUL, CGK, or SGN only)',
              }),
            );
            return;
          }
          const result = await fetch5jGoogleFlights(apiKey, {
            origin_code: body.origin_code,
            destination_code: body.destination_code,
            depart_date: body.depart_date,
            return_date: body.return_date,
          });
          if (!result.ok) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'SerpAPI request failed', detail: result.error }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, itineraries: result.itineraries }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serpKey = (env.SERPAPI_API_KEY || '').trim();

  return {
    optimizeDeps: {
      exclude: ['@braze/web-sdk'],
    },
    plugins: [serpapiDevPlugin(serpKey)],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
