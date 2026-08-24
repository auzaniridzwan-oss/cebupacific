import { DEMO_DESTINATION_CODES, DEMO_ORIGIN_CODE } from '../config/flightSearchScope.js';

/**
 * @param {unknown} search
 * @returns {search is { origin_code: string, destination_code: string, depart_date: string, return_date: string }}
 */
export function isValidBookingSearch(search) {
  if (!search || typeof search !== 'object') return false;
  const s = /** @type {Record<string, unknown>} */ (search);
  const origin = String(s.origin_code || '')
    .trim()
    .toUpperCase();
  const dest = String(s.destination_code || '')
    .trim()
    .toUpperCase();
  const depart = String(s.depart_date || '').trim();
  const ret = String(s.return_date || '').trim();
  if (origin !== DEMO_ORIGIN_CODE) return false;
  if (!DEMO_DESTINATION_CODES.includes(dest)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(depart)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ret)) return false;
  if (ret < depart) return false;
  return true;
}

/**
 * @param {{ destination_code: string, depart_date: string, return_date: string }} fields
 * @returns {{ origin_code: string, destination_code: string, depart_date: string, return_date: string }}
 */
export function buildBookingPayload(fields) {
  return {
    origin_code: DEMO_ORIGIN_CODE,
    destination_code: String(fields.destination_code || '')
      .trim()
      .toUpperCase(),
    depart_date: String(fields.depart_date || '').trim(),
    return_date: String(fields.return_date || '').trim(),
  };
}

/**
 * @returns {string}
 */
export function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '5J';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
