/** @typedef {{ code: string, name: string, country: string, airport: string }} Destination */

/** @type {Destination[]} */
export const DESTINATIONS = [
  { code: 'SIN', name: 'Singapore', country: 'Singapore', airport: 'Changi' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand', airport: 'Suvarnabhumi' },
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', airport: 'KLIA' },
  { code: 'CGK', name: 'Jakarta', country: 'Indonesia', airport: 'Soekarno-Hatta' },
  { code: 'SGN', name: 'Ho Chi Minh City', country: 'Vietnam', airport: 'Tan Son Nhat' },
];

export const ORIGIN = {
  code: 'MNL',
  name: 'Manila',
  country: 'Philippines',
  airport: 'Ninoy Aquino',
};

/**
 * @param {string} code
 * @returns {Destination | undefined}
 */
export function getDestinationByCode(code) {
  return DESTINATIONS.find((d) => d.code === code);
}
