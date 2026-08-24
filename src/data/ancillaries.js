/**
 * @typedef {Object} AncillaryProduct
 * @property {string} product_code
 * @property {string} product_name
 * @property {string} description
 * @property {number} price
 * @property {string} icon
 */

/** @type {AncillaryProduct[]} */
export const ANCILLARY_PRODUCTS = [
  {
    product_code: 'BAG_20KG',
    product_name: 'Extra Baggage 20kg',
    description: 'Add 20kg checked baggage allowance for your trip.',
    price: 899,
    icon: 'fa-solid fa-suitcase',
  },
  {
    product_code: 'BAG_32KG',
    product_name: 'Extra Baggage 32kg',
    description: 'Add 32kg checked baggage allowance for your trip.',
    price: 1299,
    icon: 'fa-solid fa-suitcase-rolling',
  },
  {
    product_code: 'CEB_FLEXI',
    product_name: 'CEB Flexi',
    description: 'Change your flight once for free (fare difference may apply).',
    price: 599,
    icon: 'fa-solid fa-calendar-check',
  },
  {
    product_code: 'MEAL_PREORDER',
    product_name: 'Pre-order Meal',
    description: 'Reserve a hot meal for your flight.',
    price: 350,
    icon: 'fa-solid fa-utensils',
  },
  {
    product_code: 'TRAVELSURE',
    product_name: 'TravelSure',
    description: 'Travel insurance covering cancellation and medical emergencies.',
    price: 450,
    icon: 'fa-solid fa-shield-heart',
  },
  {
    product_code: 'CEB_WIFI',
    product_name: 'Ceb Wifi',
    description: 'Stay connected with onboard Wi-Fi for your flight.',
    price: 299,
    icon: 'fa-solid fa-wifi',
  },
  {
    product_code: 'PRIORITY_BOARD',
    product_name: 'Priority Boarding',
    description: 'Board early and settle in before general boarding.',
    price: 199,
    icon: 'fa-solid fa-person-walking-luggage',
  },
];

/**
 * @param {string} code
 * @returns {AncillaryProduct | undefined}
 */
export function getAncillaryByCode(code) {
  return ANCILLARY_PRODUCTS.find((p) => p.product_code === code);
}
