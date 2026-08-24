import { AppLogger } from '../managers/AppLogger.js';
import { SERPAPI_CURRENCY } from '../config/flightSearchScope.js';
import { parseAirplane } from '../../api/lib/serpapiGoogleFlights.js';

/**
 * @param {number} totalMinutes
 * @returns {string}
 */
function formatDurationLabel(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

/**
 * @param {Array<{ id: string, price: number, currency?: string, durationLabel?: string, totalDurationMinutes?: number, departureTime: string, arrivalTime: string, flightNumbers: string[], returnTime?: string, returnFlightNumbers?: string[], originAirportName?: string, destinationAirportName?: string, originAirportCode?: string, destinationAirportCode?: string, aircraft?: string, aircraftType?: string, aircraftModel?: string, returnAircraft?: string, returnAircraftType?: string, returnAircraftModel?: string, arrivalDayOffset?: number }>} itineraries
 */
export function mapItinerariesToResultRows(itineraries) {
  return itineraries.map((it) => {
    const duration =
      it.durationLabel && String(it.durationLabel).trim()
        ? it.durationLabel
        : it.totalDurationMinutes != null
          ? formatDurationLabel(it.totalDurationMinutes)
          : '—';
    const outboundPlane = parseAirplane(String(it.aircraft || '').trim());
    const returnPlane = parseAirplane(String(it.returnAircraft || '').trim());
    return {
      id: it.id,
      flightNumber: it.flightNumbers?.length ? it.flightNumbers.join(' / ') : '5J',
      departureTime: it.departureTime,
      arrivalTime: it.arrivalTime,
      returnTime: it.returnTime || '',
      returnFlightNumber: it.returnFlightNumbers?.length ? it.returnFlightNumbers.join(' / ') : '',
      duration,
      price: it.price,
      currency: it.currency || SERPAPI_CURRENCY,
      originAirportName: String(it.originAirportName || '').trim(),
      destinationAirportName: String(it.destinationAirportName || '').trim(),
      originAirportCode: String(it.originAirportCode || '').trim().toUpperCase(),
      destinationAirportCode: String(it.destinationAirportCode || '').trim().toUpperCase(),
      aircraft: String(it.aircraft || outboundPlane.aircraft || '').trim(),
      aircraftType: String(it.aircraftType || outboundPlane.aircraftType || '').trim(),
      aircraftModel: String(it.aircraftModel || outboundPlane.aircraftModel || '').trim(),
      returnAircraft: String(it.returnAircraft || returnPlane.aircraft || '').trim(),
      returnAircraftType: String(it.returnAircraftType || returnPlane.aircraftType || '').trim(),
      returnAircraftModel: String(it.returnAircraftModel || returnPlane.aircraftModel || '').trim(),
      arrivalDayOffset:
        typeof it.arrivalDayOffset === 'number' && Number.isFinite(it.arrivalDayOffset)
          ? Math.max(0, Math.floor(it.arrivalDayOffset))
          : 0,
      source: 'serpapi',
    };
  });
}

/**
 * Mock Cebu Pacific flights when SerpAPI is unavailable.
 * @param {{ origin_code: string, destination_code: string, depart_date: string, return_date: string }} search
 */
export function generateMockFlights(search) {
  const bases = [
    { dep: '06:15', arr: '09:45', ret: '11:20', dur: '3h 30m', price: 4299, fn: '5J 801' },
    { dep: '09:40', arr: '13:10', ret: '14:55', dur: '3h 30m', price: 3899, fn: '5J 803' },
    { dep: '13:05', arr: '16:40', ret: '18:10', dur: '3h 35m', price: 4599, fn: '5J 805' },
    { dep: '18:30', arr: '22:05', ret: '07:15', dur: '3h 35m', price: 3499, fn: '5J 807' },
    { dep: '22:10', arr: '01:45', ret: '08:40', dur: '3h 35m', price: 3199, fn: '5J 809' },
  ];
  return bases.map((b, i) => ({
    id: `mock-${search.origin_code}-${search.destination_code}-${i}`,
    flightNumber: b.fn,
    departureTime: b.dep,
    arrivalTime: b.arr,
    returnTime: b.ret,
    returnFlightNumber: b.fn.replace(/(\d+)$/, (_, n) => String(Number(n) + 1)),
    duration: b.dur,
    price: b.price + (search.destination_code.charCodeAt(0) % 5) * 100,
    currency: SERPAPI_CURRENCY,
    originAirportName: 'Ninoy Aquino International Airport',
    destinationAirportName: search.destination_code,
    originAirportCode: search.origin_code,
    destinationAirportCode: search.destination_code,
    aircraft: 'Airbus A320',
    aircraftType: 'Airbus',
    aircraftModel: 'A320',
    returnAircraft: 'Airbus A320',
    returnAircraftType: 'Airbus',
    returnAircraftModel: 'A320',
    arrivalDayOffset: b.arr < b.dep ? 1 : 0,
    source: 'mock',
  }));
}

/**
 * @param {object} bookingPayload
 * @returns {Promise<{ ok: boolean, rows: ReturnType<typeof mapItinerariesToResultRows>, error?: string, usedMock?: boolean }>}
 */
export async function fetchDemoFlights(bookingPayload) {
  try {
    const res = await fetch('/api/serpapi/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    });

    /** @type {{ ok?: boolean, itineraries?: unknown, error?: string, detail?: string, hint?: string }} */
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.status === 503 || !res.ok) {
      const parts = [
        typeof data.error === 'string' ? data.error : `HTTP ${res.status}`,
        typeof data.hint === 'string' ? data.hint : '',
        typeof data.detail === 'string' ? data.detail : '',
      ].filter(Boolean);
      const reason = parts.join(' — ');
      AppLogger.warn('[SDK]', 'SerpAPI unavailable — using mock flights', {
        status: res.status,
        data,
      });
      return {
        ok: true,
        rows: generateMockFlights(bookingPayload),
        usedMock: true,
        error: reason || `http_${res.status}`,
      };
    }

    const itineraries = Array.isArray(data.itineraries) ? data.itineraries : [];
    if (!itineraries.length) {
      AppLogger.warn('[SDK]', 'SerpAPI returned no itineraries — using mock');
      return {
        ok: true,
        rows: generateMockFlights(bookingPayload),
        usedMock: true,
        error: 'SerpAPI returned no Cebu Pacific (5J) itineraries for this search.',
      };
    }

    const rows = mapItinerariesToResultRows(
      /** @type {Parameters<typeof mapItinerariesToResultRows>[0]} */ (itineraries),
    );
    AppLogger.info('[SDK]', 'SerpAPI flights loaded', { count: rows.length });
    return { ok: true, rows, usedMock: false };
  } catch (e) {
    AppLogger.error('[SDK]', 'SerpAPI flights fetch failed — using mock', { detail: String(e) });
    return {
      ok: true,
      rows: generateMockFlights(bookingPayload),
      usedMock: true,
      error: String(e),
    };
  }
}
