import {
  CEBU_PACIFIC_IATA,
  DEMO_ORIGIN_CODE,
  SERPAPI_CURRENCY,
  SERPAPI_GL,
  SERPAPI_HL,
} from '../../src/config/flightSearchScope.js';

const SERPAPI_SEARCH_URL = 'https://serpapi.com/search';

/**
 * @param {unknown} leg
 * @returns {leg is { flight_number?: string, airline?: string }}
 */
function isLegShape(leg) {
  return leg != null && typeof leg === 'object';
}

/**
 * @param {unknown} leg
 * @returns {boolean}
 */
export function isCebuPacificLeg(leg) {
  if (!isLegShape(leg)) return false;
  const fn = String(leg.flight_number || '').trim();
  if (/^5J\d/i.test(fn) || /^5J\s/i.test(fn)) return true;
  const name = String(leg.airline || '').toLowerCase();
  return name.includes('cebu');
}

/**
 * @param {unknown} itinerary
 * @returns {itinerary is { flights?: unknown[], price?: number, departure_token?: string }}
 */
function hasFlightsArray(itinerary) {
  return (
    itinerary != null &&
    typeof itinerary === 'object' &&
    Array.isArray(/** @type {{ flights?: unknown[] }} */ (itinerary).flights)
  );
}

/**
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatDurationLabel(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

/**
 * @param {string} serpTime
 * @returns {string}
 */
export function extractClock(serpTime) {
  const s = String(serpTime || '').trim();
  const parts = s.split(/\s+/);
  return parts.length >= 2 ? parts[parts.length - 1].slice(0, 5) : s.slice(0, 5);
}

/**
 * @param {string} serpTime
 * @returns {string|null}
 */
export function extractDateKey(serpTime) {
  const s = String(serpTime || '').trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * @param {string|null} depDateKey
 * @param {string|null} arrDateKey
 * @returns {number}
 */
function calendarDayOffset(depDateKey, arrDateKey) {
  if (!depDateKey || !arrDateKey) return 0;
  const t0 = Date.parse(`${depDateKey}T00:00:00Z`);
  const t1 = Date.parse(`${arrDateKey}T00:00:00Z`);
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return 0;
  return Math.max(0, Math.round((t1 - t0) / 86400000));
}

/**
 * Split SerpAPI `airplane` (e.g. "Airbus A320neo") into manufacturer type + model.
 * @param {string} airplane
 * @returns {{ aircraftType: string, aircraftModel: string, aircraft: string }}
 */
export function parseAirplane(airplane) {
  const raw = String(airplane || '')
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!raw.length) {
    return { aircraftType: '', aircraftModel: '', aircraft: '' };
  }

  const makers =
    /^(Airbus|Boeing|Embraer|ATR|Bombardier|Comac|McDonnell Douglas|Douglas|Cessna|Fokker)\s+(.+)$/i;

  /** @type {string[]} */
  const types = [];
  /** @type {string[]} */
  const models = [];
  const seenType = new Set();
  const seenModel = new Set();

  for (const label of raw) {
    const m = label.match(makers);
    if (m) {
      const type = m[1].replace(/\b\w/g, (c) => c.toUpperCase());
      const model = m[2].trim();
      if (!seenType.has(type.toLowerCase())) {
        seenType.add(type.toLowerCase());
        types.push(type);
      }
      if (!seenModel.has(model.toLowerCase())) {
        seenModel.add(model.toLowerCase());
        models.push(model);
      }
    } else if (!seenModel.has(label.toLowerCase())) {
      seenModel.add(label.toLowerCase());
      models.push(label);
    }
  }

  return {
    aircraftType: types.join(' · '),
    aircraftModel: models.join(' · '),
    aircraft: raw.join(' · '),
  };
}

/**
 * Unique `airplane` labels from itinerary legs (SerpAPI Google Flights).
 * @param {Array<{ airplane?: string }>} legs
 * @returns {string}
 */
export function collectAirplaneLabels(legs) {
  /** @type {string[]} */
  const ordered = [];
  const seen = new Set();
  for (const leg of legs) {
    const a = String(leg?.airplane || '').trim();
    if (a && !seen.has(a)) {
      seen.add(a);
      ordered.push(a);
    }
  }
  return ordered.join(' · ');
}

/**
 * @param {{ flights: Array<{ departure_airport?: { time?: string, name?: string, id?: string }, arrival_airport?: { time?: string, name?: string, id?: string }, flight_number?: string, airplane?: string }>, price?: number, total_duration?: number, departure_token?: string }} itinerary
 * @returns {{ price: number, currency: string, totalDurationMinutes: number, durationLabel: string, departureTime: string, arrivalTime: string, flightNumbers: string[], id: string, originAirportName: string, destinationAirportName: string, originAirportCode: string, destinationAirportCode: string, aircraft: string, aircraftType: string, aircraftModel: string, arrivalDayOffset: number, departureToken: string | null } | null}
 */
export function normalizeItinerary(itinerary) {
  const legs = itinerary.flights;
  if (!legs.length) return null;
  const first = legs[0];
  const last = legs[legs.length - 1];
  const dep = first?.departure_airport?.time;
  const arr = last?.arrival_airport?.time;
  if (dep == null || arr == null) return null;
  const price = itinerary.price;
  if (typeof price !== 'number' || !Number.isFinite(price)) return null;

  const flightNumbers = legs.map((l) => String(l.flight_number || '').trim()).filter(Boolean);
  const id = flightNumbers.join('-') || `5j-${price}-${dep}`;

  const totalMin =
    typeof itinerary.total_duration === 'number' && Number.isFinite(itinerary.total_duration)
      ? itinerary.total_duration
      : 0;

  const originAirportName = String(first?.departure_airport?.name || '').trim();
  const destinationAirportName = String(last?.arrival_airport?.name || '').trim();
  const originAirportCode = String(first?.departure_airport?.id || '')
    .trim()
    .toUpperCase();
  const destinationAirportCode = String(last?.arrival_airport?.id || '')
    .trim()
    .toUpperCase();

  const parsedAircraft = parseAirplane(collectAirplaneLabels(legs));

  const depKey = extractDateKey(String(dep));
  const arrKey = extractDateKey(String(arr));
  const arrivalDayOffset = calendarDayOffset(depKey, arrKey);
  const departureToken =
    typeof itinerary.departure_token === 'string' && itinerary.departure_token.trim()
      ? itinerary.departure_token.trim()
      : null;

  return {
    price,
    currency: SERPAPI_CURRENCY,
    totalDurationMinutes: totalMin,
    durationLabel: totalMin > 0 ? formatDurationLabel(totalMin) : '',
    departureTime: extractClock(String(dep)),
    arrivalTime: extractClock(String(arr)),
    flightNumbers,
    id,
    originAirportName,
    destinationAirportName,
    originAirportCode,
    destinationAirportCode,
    aircraft: parsedAircraft.aircraft,
    aircraftType: parsedAircraft.aircraftType,
    aircraftModel: parsedAircraft.aircraftModel,
    arrivalDayOffset,
    departureToken,
  };
}

/**
 * @param {unknown[]} list
 * @returns {unknown[]}
 */
export function filterAll5jItineraries(list) {
  return list.filter((item) => {
    if (!hasFlightsArray(item)) return false;
    const legs = /** @type {{ flights: unknown[] }} */ (item).flights;
    return legs.length > 0 && legs.every((leg) => isCebuPacificLeg(leg));
  });
}

/**
 * @param {unknown} data
 * @returns {unknown[]}
 */
function mergeFlightLists(data) {
  if (!data || typeof data !== 'object') return [];
  const d = /** @type {Record<string, unknown>} */ (data);
  const best = Array.isArray(d.best_flights) ? d.best_flights : [];
  const other = Array.isArray(d.other_flights) ? d.other_flights : [];
  return [...best, ...other];
}

/**
 * @param {string} apiKey
 * @param {Record<string, string>} params
 * @returns {Promise<{ ok: boolean, error?: string, data?: unknown }>}
 */
async function serpFetch(apiKey, params) {
  const qs = new URLSearchParams({ ...params, api_key: apiKey, engine: 'google_flights' });
  const url = `${SERPAPI_SEARCH_URL}?${qs.toString()}`;
  let res;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e) {
    return { ok: false, error: `network: ${String(e)}` };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'invalid_json_from_serpapi' };
  }
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `http_${res.status}`;
    return { ok: false, error: msg };
  }
  if (data && typeof data === 'object' && typeof /** @type {{ error?: string }} */ (data).error === 'string') {
    return { ok: false, error: /** @type {{ error: string }} */ (data).error };
  }
  return { ok: true, data };
}

/**
 * @param {unknown} data
 * @returns {ReturnType<typeof normalizeItinerary>[]}
 */
function normalizeList(data) {
  const preferred = filterAll5jItineraries(mergeFlightLists(data));
  const source = preferred.length ? preferred : mergeFlightLists(data);
  /** @type {ReturnType<typeof normalizeItinerary>[]} */
  const itineraries = [];
  for (const raw of source) {
    if (!hasFlightsArray(raw)) continue;
    const n = normalizeItinerary(/** @type {Parameters<typeof normalizeItinerary>[0]} */ (raw));
    if (n) itineraries.push(n);
  }
  return itineraries;
}

/**
 * Round-trip Google Flights: outbound list, then return via departure_token when available.
 * @param {string} apiKey
 * @param {{ origin_code: string, destination_code: string, depart_date: string, return_date: string }} search
 * @returns {Promise<{ ok: boolean, error?: string, itineraries: Array<ReturnType<typeof normalizeItinerary> & { returnTime?: string, returnFlightNumbers?: string[], returnAircraft?: string, returnAircraftType?: string, returnAircraftModel?: string }> }>}
 */
export async function fetch5jGoogleFlights(apiKey, search) {
  const departureId = String(search.origin_code || DEMO_ORIGIN_CODE)
    .trim()
    .toUpperCase();

  const baseParams = {
    departure_id: departureId,
    arrival_id: search.destination_code,
    outbound_date: search.depart_date,
    return_date: search.return_date,
    type: '1',
    travel_class: '1',
    adults: '1',
    include_airlines: CEBU_PACIFIC_IATA,
    hl: SERPAPI_HL,
    gl: SERPAPI_GL,
    currency: SERPAPI_CURRENCY,
  };

  const outbound = await serpFetch(apiKey, baseParams);
  if (!outbound.ok) {
    return { ok: false, error: outbound.error, itineraries: [] };
  }

  const outboundList = normalizeList(outbound.data);
  if (!outboundList.length) {
    return { ok: true, itineraries: [] };
  }

  /** Attach return times from the first departure_token (one extra SerpAPI call). */
  const withToken = outboundList.find((o) => o.departureToken);
  let returnTime = '';
  /** @type {string[]} */
  let returnFlightNumbers = [];
  let returnAircraft = '';
  let returnAircraftType = '';
  let returnAircraftModel = '';
  let roundTripPrice = null;

  if (withToken?.departureToken) {
    const ret = await serpFetch(apiKey, {
      ...baseParams,
      departure_token: withToken.departureToken,
    });
    if (ret.ok) {
      const returnList = normalizeList(ret.data);
      const bestReturn = returnList[0];
      if (bestReturn) {
        returnTime = bestReturn.departureTime;
        returnFlightNumbers = bestReturn.flightNumbers;
        returnAircraft = bestReturn.aircraft;
        returnAircraftType = bestReturn.aircraftType;
        returnAircraftModel = bestReturn.aircraftModel;
        if (typeof bestReturn.price === 'number') roundTripPrice = bestReturn.price;
      }
    }
  }

  return {
    ok: true,
    itineraries: outboundList.slice(0, 8).map((out) => ({
      ...out,
      price: roundTripPrice != null ? roundTripPrice : out.price,
      returnTime,
      returnFlightNumbers,
      returnAircraft,
      returnAircraftType,
      returnAircraftModel,
    })),
  };
}
