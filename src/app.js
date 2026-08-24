import { renderShellHeader, renderShellFooter } from './components/shell.js';
import { renderHomeBooking } from './components/homeBooking.js';
import { renderHighlightsSection } from './components/highlightsSection.js';
import { initHeroCarousel, stopHeroCarousel } from './components/heroCarousel.js';
import { renderSearchResults } from './components/searchResults.js';
import { renderAncillariesStep } from './components/ancillariesStep.js';
import { renderSeatMapStep } from './components/seatMapStep.js';
import { renderPassengerStep, normalizePassenger } from './components/passengerStep.js';
import { renderPaymentStep } from './components/paymentStep.js';
import { renderCompleteStep } from './components/completeStep.js';
import { renderLoginModal } from './components/loginModal.js';
import { renderDebugOverlay } from './components/debugOverlay.js';
import { StorageManager } from './managers/StorageManager.js';
import { AppLogger } from './managers/AppLogger.js';
import { BrazeManager, EVENT_LOGGED } from './managers/BrazeManager.js';
import { getUserSession, persistAuthSession } from './logic/userSession.js';
import { buildBookingPayload, generateBookingCode, isValidBookingSearch } from './logic/bookingPayload.js';
import { fetchDemoFlights } from './services/serpapiFlightsClient.js';
import { getAncillaryByCode } from './data/ancillaries.js';
import { generateSeatMap, findSeat } from './data/seatMap.js';

const ROUTES = {
  HOME: 'HOME',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
  ANCILLARIES: 'ANCILLARIES',
  SEATS: 'SEATS',
  PASSENGER: 'PASSENGER',
  PAYMENT: 'PAYMENT',
  COMPLETE: 'COMPLETE',
};

const HASH_TO_ROUTE = {
  '#/home': ROUTES.HOME,
  '#/search-results': ROUTES.SEARCH_RESULTS,
  '#/ancillaries': ROUTES.ANCILLARIES,
  '#/seats': ROUTES.SEATS,
  '#/passenger': ROUTES.PASSENGER,
  '#/payment': ROUTES.PAYMENT,
  '#/complete': ROUTES.COMPLETE,
};

/** @type {string} */
let currentRoute = ROUTES.HOME;
let isDebugOpen = false;
let isSearching = false;
/** @type {Array<{ name: string, props?: Record<string, unknown>, at: number }>} */
let eventLog = [];
/** @type {ReturnType<typeof generateSeatMap> | null} */
let currentSeatMap = null;
/** @type {string | null} */
let selectedSeatId = null;

const BOOKING_ABANDON_MS = 3 * 60 * 1000;
const DEMO_IAM_REDIRECT_MS = 10 * 1000;
const DEMO_IAM_EVENT_DELAY_MS = 3 * 1000;
/** @type {ReturnType<typeof setTimeout> | null} */
let bookingAbandonTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let demoIamRedirectTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let demoIamEventTimer = null;
/** @type {{ origin: string, destination: string, depart: string, return: string } | null} */
let pendingAbandonProps = null;
/** Whether an in-progress booking can still emit `ceb_booking_abandoned`. */
let bookingAbandonArmed = false;

/**
 * Cancel a pending booking-abandonment timer (e.g. after payment completes).
 * @returns {void}
 */
function clearBookingAbandonTimer() {
  if (bookingAbandonTimer != null) {
    clearTimeout(bookingAbandonTimer);
    bookingAbandonTimer = null;
  }
  pendingAbandonProps = null;
  bookingAbandonArmed = false;
}

/**
 * Start/restart the 3-minute abandonment window from flight search start.
 * @param {{ origin_code: string, destination_code: string, depart_date: string, return_date: string }} search
 * @returns {void}
 */
function scheduleBookingAbandonTimer(search) {
  clearBookingAbandonTimer();
  pendingAbandonProps = {
    origin: search.origin_code,
    destination: search.destination_code,
    depart: search.depart_date,
    return: search.return_date,
  };
  bookingAbandonArmed = true;
  bookingAbandonTimer = setTimeout(() => {
    bookingAbandonTimer = null;
    if (!bookingAbandonArmed || !pendingAbandonProps) return;
    const props = pendingAbandonProps;
    bookingAbandonArmed = false;
    pendingAbandonProps = null;
    BrazeManager.logCustomEvent('ceb_booking_abandoned', {
      origin: props.origin,
      destination: props.destination,
      depart: props.depart,
      return: props.return,
    });
    BrazeManager.requestImmediateDataFlush();
    AppLogger.info('[SDK]', 'ceb_booking_abandoned fired after inactivity', props);
  }, BOOKING_ABANDON_MS);
}

/**
 * Cancel pending post-booking demo IAM redirect / event timers.
 * @returns {void}
 */
function clearDemoIamTimer() {
  if (demoIamRedirectTimer != null) {
    clearTimeout(demoIamRedirectTimer);
    demoIamRedirectTimer = null;
  }
  if (demoIamEventTimer != null) {
    clearTimeout(demoIamEventTimer);
    demoIamEventTimer = null;
  }
}

/**
 * After booking completes, wait 10s, go home, then wait 3s and fire `ceb_demo_iam`.
 * @returns {void}
 */
function scheduleDemoIamRedirect() {
  clearDemoIamTimer();
  demoIamRedirectTimer = setTimeout(() => {
    demoIamRedirectTimer = null;
    navigate(ROUTES.HOME);
    demoIamEventTimer = setTimeout(() => {
      demoIamEventTimer = null;
      BrazeManager.logCustomEvent('ceb_demo_iam', {});
      BrazeManager.requestImmediateDataFlush();
      AppLogger.info('[SDK]', 'ceb_demo_iam fired after homepage redirect');
    }, DEMO_IAM_EVENT_DELAY_MS);
  }, DEMO_IAM_REDIRECT_MS);
}

/**
 * @returns {string}
 */
function parseRouteFromHash() {
  const hash = location.hash || '#/home';
  const base = hash.split('?')[0];
  return HASH_TO_ROUTE[base] || ROUTES.HOME;
}

/**
 * @param {string} route
 * @param {{ replaceHash?: boolean }} [opts]
 */
function navigate(route, opts = {}) {
  const { replaceHash = true } = opts;
  const hash =
    Object.entries(HASH_TO_ROUTE).find(([, r]) => r === route)?.[0] || '#/home';
  currentRoute = route;
  if (replaceHash && location.hash !== hash) {
    if (opts.replaceHash === false) {
      /* keep */
    } else {
      location.hash = hash;
    }
  }
  renderApp();
}

/**
 * @returns {string}
 */
function userLabel() {
  const s = getUserSession();
  if (!s) return '';
  if (s.firstName) return s.firstName;
  return s.email || s.external_id || '';
}

/**
 * @returns {{ lines: string[], total: number }}
 */
function buildPriceSummary() {
  const flight = /** @type {Record<string, unknown> | null} */ (StorageManager.get('booking_flight', null));
  const ancillaries = /** @type {string[]} */ (StorageManager.get('booking_ancillaries', []) || []);
  const seat = /** @type {{ seat_number?: string, price?: number } | null} */ (
    StorageManager.get('booking_seat', null)
  );
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));

  /** @type {string[]} */
  const lines = [];
  let total = 0;

  if (search) {
    lines.push(`Route: ${search.origin_code} → ${search.destination_code}`);
    lines.push(`Dates: ${search.depart_date} – ${search.return_date}`);
  }
  if (flight) {
    const price = Number(flight.price) || 0;
    total += price;
    lines.push(`Flight ${flight.flight_code || flight.flightNumber}: ₱${price.toLocaleString()}`);
  }
  for (const code of ancillaries) {
    const p = getAncillaryByCode(code);
    if (p) {
      total += p.price;
      lines.push(`${p.product_name}: ₱${p.price.toLocaleString()}`);
    }
  }
  if (seat?.seat_number) {
    const price = Number(seat.price) || 0;
    total += price;
    lines.push(`Seat ${seat.seat_number}: ₱${price.toLocaleString()}`);
  }

  return { lines, total };
}

function renderApp() {
  const root = document.getElementById('app');
  if (!root) return;

  const session = getUserSession();
  const header = renderShellHeader({
    activeView:
      currentRoute === ROUTES.HOME
        ? 'HOME'
        : currentRoute === ROUTES.SEARCH_RESULTS
          ? 'SEARCH_RESULTS'
          : 'HOME',
    loggedIn: !!session,
    userLabel: userLabel(),
  });

  let main = '';
  switch (currentRoute) {
    case ROUTES.HOME: {
      const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
      main = `${renderHomeBooking({
        defaultDestination: search?.destination_code,
        defaultDepart: search?.depart_date,
        defaultReturn: search?.return_date,
      })}${renderHighlightsSection()}`;
      break;
    }
    case ROUTES.SEARCH_RESULTS: {
      const search = StorageManager.get('booking_search', null);
      if (!isValidBookingSearch(search)) {
        main = renderSearchResults({
          flights: [],
          searchSummary: 'No active search',
          loading: false,
        });
        break;
      }
      const results = /** @type {Array<Record<string, unknown>>} */ (
        StorageManager.get('booking_last_results', []) || []
      );
      const usedMock = !!StorageManager.get('booking_used_mock', false);
      const mockReason = String(StorageManager.get('booking_mock_reason', '') || '');
      const s = /** @type {{ origin_code: string, destination_code: string, depart_date: string, return_date: string }} */ (
        search
      );
      main = renderSearchResults({
        flights: results,
        searchSummary: `${s.origin_code} → ${s.destination_code} · ${s.depart_date} – ${s.return_date}`,
        usedMock,
        mockReason,
        loading: isSearching,
      });
      break;
    }
    case ROUTES.ANCILLARIES: {
      const selected = /** @type {string[]} */ (StorageManager.get('booking_ancillaries', []) || []);
      main = renderAncillariesStep({ selectedCodes: selected });
      break;
    }
    case ROUTES.SEATS: {
      ensureSeatMap();
      main = renderSeatMapStep({
        seatMap: /** @type {NonNullable<typeof currentSeatMap>} */ (currentSeatMap),
        selectedSeatId,
      });
      break;
    }
    case ROUTES.PASSENGER: {
      const passenger = /** @type {Record<string, string> | null} */ (
        StorageManager.get('booking_passenger', null)
      );
      const sess = getUserSession();
      const defaults = normalizePassenger(
        passenger || {
          firstName: sess?.firstName || '',
          lastName: sess?.lastName || '',
          email: sess?.email || '',
          phone: sess?.phone || '',
          nationality: sess?.nationality || 'PH',
        },
      );
      main = renderPassengerStep({ passenger: defaults });
      break;
    }
    case ROUTES.PAYMENT: {
      const { lines, total } = buildPriceSummary();
      main = renderPaymentStep({ totalPhp: total, summaryLines: lines });
      break;
    }
    case ROUTES.COMPLETE: {
      const code = String(StorageManager.get('booking_code', '—'));
      const { lines } = buildPriceSummary();
      main = renderCompleteStep({ bookingCode: code, summaryLines: lines });
      break;
    }
    default:
      main = renderHomeBooking({});
  }

  root.innerHTML = `
    <div class="min-h-screen flex flex-col">
      ${header}
      <main id="main-view" class="flex-1">${main}</main>
      ${renderShellFooter()}
    </div>
    ${renderLoginModal()}
    ${renderDebugOverlay({ events: eventLog, open: isDebugOpen })}
  `;

  bindGlobalHandlers();
  bindRouteHandlers();
}

function ensureSeatMap() {
  const flight = /** @type {Record<string, unknown> | null} */ (StorageManager.get('booking_flight', null));
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
  const seed = `${flight?.id || ''}-${search?.depart_date || ''}`;
  if (!currentSeatMap || currentSeatMap._seed !== seed) {
    currentSeatMap = generateSeatMap(seed);
    /** @type {any} */ (currentSeatMap)._seed = seed;
    const saved = /** @type {{ seat_number?: string } | null} */ (StorageManager.get('booking_seat', null));
    selectedSeatId = saved?.seat_number || null;
  }
}

function bindGlobalHandlers() {
  document.getElementById('ceb-logo-btn')?.addEventListener('click', () => {
    navigate(ROUTES.HOME);
  });

  document.getElementById('header-login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal();
  });
  document.getElementById('header-signup-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal();
  });
  document.getElementById('header-logout-link')?.addEventListener('click', () => {
    StorageManager.remove('user_id');
    StorageManager.remove('user_session');
    AppLogger.info('[AUTH]', 'Logged out locally');
    renderApp();
  });

  document.getElementById('debug-launcher')?.addEventListener('click', () => {
    isDebugOpen = !isDebugOpen;
    StorageManager.set('debug_mode', true);
    renderApp();
  });
  document.getElementById('debug-drawer-close')?.addEventListener('click', () => {
    isDebugOpen = false;
    renderApp();
  });

  document.querySelectorAll('[data-login-dismiss]').forEach((el) => {
    el.addEventListener('click', () => closeLoginModal());
  });

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = /** @type {HTMLFormElement} */ (e.target);
    const fd = new FormData(form);
    const email = String(fd.get('email') || '')
      .trim()
      .toLowerCase();
    const firstName = String(fd.get('firstName') || '').trim();
    const lastName = String(fd.get('lastName') || '').trim();
    const err = document.getElementById('login-form-error');
    if (!email || !email.includes('@')) {
      if (err) {
        err.textContent = 'Enter a valid email.';
        err.classList.remove('hidden');
      }
      return;
    }
    persistAuthSession(email, 'login', { firstName, lastName, email });
    BrazeManager.login(email, { firstName, lastName, email });
    BrazeManager.requestImmediateDataFlush();
    closeLoginModal();
    renderApp();
  });
}

function openLoginModal() {
  document.getElementById('login-modal')?.classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('login-modal')?.classList.add('hidden');
}

function bindRouteHandlers() {
  if (currentRoute === ROUTES.HOME) {
    initHeroCarousel(document);
    document.getElementById('flight-search-form')?.addEventListener('submit', onSearchSubmit);
  } else {
    stopHeroCarousel();
  }
  if (currentRoute === ROUTES.SEARCH_RESULTS) {
    document.querySelectorAll('[data-select-flight]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-select-flight');
        onSelectFlight(id);
      });
    });
  }
  if (currentRoute === ROUTES.ANCILLARIES) {
    document.querySelectorAll('[data-ancillary-code]').forEach((input) => {
      input.addEventListener('change', onAncillaryToggle);
    });
    document.getElementById('ancillaries-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      navigate(ROUTES.SEATS);
    });
  }
  if (currentRoute === ROUTES.SEATS) {
    document.querySelectorAll('[data-seat-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-seat-id');
        onSelectSeat(id);
      });
    });
    document.getElementById('seat-skip-btn')?.addEventListener('click', () => {
      StorageManager.remove('booking_seat');
      selectedSeatId = null;
      navigate(ROUTES.PASSENGER);
    });
    document.getElementById('seat-continue-btn')?.addEventListener('click', () => {
      if (!selectedSeatId) return;
      navigate(ROUTES.PASSENGER);
    });
  }
  if (currentRoute === ROUTES.PASSENGER) {
    document.getElementById('passenger-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = /** @type {HTMLFormElement} */ (e.target);
      const fd = new FormData(form);
      const errEl = document.getElementById('passenger-form-error');
      const firstName = String(fd.get('firstName') || '').trim();
      const lastName = String(fd.get('lastName') || '').trim();
      const email = String(fd.get('email') || '')
        .trim()
        .toLowerCase();
      const phone = String(fd.get('phone') || '').trim();
      const nationality = String(fd.get('nationality') || 'PH').trim() || 'PH';

      if (!email || !email.includes('@')) {
        if (errEl) {
          errEl.textContent = 'Enter a valid email to continue.';
          errEl.classList.remove('hidden');
        }
        return;
      }
      if (!firstName || !lastName) {
        if (errEl) {
          errEl.textContent = 'Enter first and last name.';
          errEl.classList.remove('hidden');
        }
        return;
      }

      const passenger = { firstName, lastName, email, phone, nationality };
      StorageManager.set('booking_passenger', passenger);

      persistAuthSession(email, 'passenger', passenger);
      BrazeManager.login(email, passenger);
      BrazeManager.requestImmediateDataFlush();
      AppLogger.info('[AUTH]', 'Passenger identified in Braze', {
        emailPreview: BrazeManager.maskExternalId(email),
      });

      navigate(ROUTES.PAYMENT);
    });
  }
  if (currentRoute === ROUTES.PAYMENT) {
    const cardFields = document.getElementById('card-fields');
    const ewalletHint = document.getElementById('ewallet-hint');
    document.querySelectorAll('input[name="pay_method"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const val = /** @type {HTMLInputElement} */ (radio).value;
        const isCard = val === 'card';
        cardFields?.classList.toggle('hidden', !isCard);
        ewalletHint?.classList.toggle('hidden', isCard);
      });
    });
    document.getElementById('payment-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = generateBookingCode();
      StorageManager.set('booking_code', code);
      clearBookingAbandonTimer();
      logBookingCompletedEvent(code);
      syncBookingCustomAttributes();
      scheduleDemoIamRedirect();
      AppLogger.info('[UI]', 'Mock payment completed', { code });
      navigate(ROUTES.COMPLETE);
    });
  }
}

/**
 * @param {string} bookingCode
 * @returns {void}
 */
function logBookingCompletedEvent(bookingCode) {
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
  const flight = /** @type {Record<string, unknown> | null} */ (StorageManager.get('booking_flight', null));
  const { total } = buildPriceSummary();

  BrazeManager.logCustomEvent('ceb_booking_completed', {
    booking_code: bookingCode,
    origin: String(flight?.origin || search?.origin_code || 'MNL'),
    destination: String(flight?.destination || search?.destination_code || ''),
    depart_date: String(flight?.depart_date || search?.depart_date || ''),
    return_date: String(flight?.return_date || search?.return_date || ''),
    flight_code: String(flight?.flight_code || flight?.flightNumber || ''),
    price: total,
  });
  BrazeManager.requestImmediateDataFlush();
}

/**
 * Push booking summary onto the Braze user profile after payment.
 * @returns {void}
 */
function syncBookingCustomAttributes() {
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
  const flight = /** @type {Record<string, unknown> | null} */ (StorageManager.get('booking_flight', null));
  const ancillaries = /** @type {string[]} */ (StorageManager.get('booking_ancillaries', []) || []);

  const origin = String(flight?.origin || search?.origin_code || 'MNL')
    .trim()
    .toUpperCase();
  const destination = String(flight?.destination || search?.destination_code || '')
    .trim()
    .toUpperCase();

  BrazeManager.setCustomAttributes({
    ceb_last_booked_origin: origin,
    ceb_last_booked_destination: destination,
    ceb_last_searched_destination: destination,
    ceb_selected_ancillaries: ancillaries.slice(),
  });
  BrazeManager.requestImmediateDataFlush();
}

/**
 * @param {Event} e
 */
async function onSearchSubmit(e) {
  e.preventDefault();
  const form = /** @type {HTMLFormElement} */ (e.target);
  const fd = new FormData(form);
  const dest = String(fd.get('destination') || '');
  const depart = String(fd.get('depart') || '');
  const ret = String(fd.get('return') || '');
  const errEl = document.getElementById('search-form-error');

  const payload = buildBookingPayload({
    destination_code: dest,
    depart_date: depart,
    return_date: ret,
  });

  if (!isValidBookingSearch(payload)) {
    if (errEl) {
      errEl.textContent = 'Choose a valid destination and dates (return on or after depart).';
      errEl.classList.remove('hidden');
    }
    return;
  }
  if (ret < depart) {
    if (errEl) {
      errEl.textContent = 'Return date must be on or after depart date.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  StorageManager.set('booking_search', payload);
  StorageManager.remove('booking_flight');
  StorageManager.remove('booking_ancillaries');
  StorageManager.remove('booking_seat');
  currentSeatMap = null;
  selectedSeatId = null;

  const bookingStartedAt = new Date();
  BrazeManager.setCustomAttributes({
    ceb_last_booking_started_at: bookingStartedAt,
  });
  BrazeManager.logCustomEvent('ceb_booking_started', {
    origin: payload.origin_code,
    destination: payload.destination_code,
    depart: payload.depart_date,
    return: payload.return_date,
    started_at: bookingStartedAt.toISOString(),
  });
  BrazeManager.logCustomEvent('ceb_searched_flight', {
    origin: payload.origin_code,
    destination: payload.destination_code,
    depart: payload.depart_date,
    return: payload.return_date,
  });
  BrazeManager.requestImmediateDataFlush();
  scheduleBookingAbandonTimer(payload);

  isSearching = true;
  navigate(ROUTES.SEARCH_RESULTS);
  const result = await fetchDemoFlights(payload);
  StorageManager.set('booking_last_results', result.rows);
  StorageManager.set('booking_used_mock', !!result.usedMock);
  if (result.usedMock) {
    StorageManager.set(
      'booking_mock_reason',
      result.error || 'Live SerpAPI unavailable or returned no 5J results.',
    );
  } else {
    StorageManager.remove('booking_mock_reason');
  }
  isSearching = false;
  renderApp();
}

/**
 * @param {string | null} flightId
 */
function onSelectFlight(flightId) {
  if (!flightId) return;
  const results = /** @type {Array<Record<string, unknown>>} */ (
    StorageManager.get('booking_last_results', []) || []
  );
  const flight = results.find((f) => f.id === flightId);
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
  if (!flight || !search) return;

  const selected = {
    id: flight.id,
    flight_code: String(flight.flightNumber || ''),
    flightNumber: String(flight.flightNumber || ''),
    origin: search.origin_code,
    destination: search.destination_code,
    depart_date: search.depart_date,
    depart_time: String(flight.departureTime || ''),
    return_date: search.return_date,
    return_time: String(flight.returnTime || ''),
    price: Number(flight.price) || 0,
    duration: flight.duration,
  };
  StorageManager.set('booking_flight', selected);
  StorageManager.set('booking_ancillaries', []);
  StorageManager.remove('booking_seat');
  currentSeatMap = null;

  BrazeManager.logCustomEvent('ceb_selected_flight', {
    flight_code: selected.flight_code,
    origin: selected.origin,
    destination: selected.destination,
    depart_date: selected.depart_date,
    depart_time: selected.depart_time,
    return_date: selected.return_date,
    return_time: selected.return_time,
    price: selected.price,
  });

  navigate(ROUTES.ANCILLARIES);
}

/**
 * @param {Event} e
 */
function onAncillaryToggle(e) {
  const input = /** @type {HTMLInputElement} */ (e.target);
  const code = input.value;
  const product = getAncillaryByCode(code);
  if (!product) return;

  /** @type {string[]} */
  let selected = /** @type {string[]} */ (StorageManager.get('booking_ancillaries', []) || []).slice();
  if (input.checked) {
    if (!selected.includes(code)) selected.push(code);
  } else {
    selected = selected.filter((c) => c !== code);
  }
  BrazeManager.logCustomEvent('ceb_selected_ancillary', {
    product_code: product.product_code,
    product_name: product.product_name,
    price: product.price,
  });
  StorageManager.set('booking_ancillaries', selected);
}

/**
 * @param {string | null} seatId
 */
function onSelectSeat(seatId) {
  if (!seatId || !currentSeatMap) return;
  const seat = findSeat(currentSeatMap, seatId);
  if (!seat || seat.occupied) return;

  selectedSeatId = seatId;
  const search = /** @type {Record<string, string> | null} */ (StorageManager.get('booking_search', null));
  StorageManager.set('booking_seat', {
    seat_number: seat.id,
    price: seat.price,
    origin: search?.origin_code || 'MNL',
    destination: search?.destination_code || '',
  });

  BrazeManager.logCustomEvent('ceb_selected_seat', {
    seat_number: seat.id,
    origin: search?.origin_code || 'MNL',
    destination: search?.destination_code || '',
  });

  // Re-render seat map selection state without full navigation flicker
  renderApp();
}

/**
 * Bootstrap entry.
 */
export function bootstrapApp() {
  AppLogger.info('[SYSTEM]', 'Cebu Pacific demo start', { version: '1.0.0' });
  StorageManager.set('debug_mode', true);

  const apiKey = import.meta.env.VITE_BRAZE_API_KEY || '';
  const endpoint = import.meta.env.VITE_BRAZE_SDK_ENDPOINT || '';
  BrazeManager.initialize(apiKey, endpoint);
  BrazeManager.syncUserFromStorage();

  BrazeManager.subscribe(EVENT_LOGGED, (payload) => {
    const p = /** @type {{ name: string, props?: Record<string, unknown>, at?: number }} */ (payload);
    eventLog.push({ name: p.name, props: p.props, at: p.at || Date.now() });
    if (eventLog.length > 80) eventLog.shift();
    if (isDebugOpen) renderApp();
  });

  window.addEventListener('hashchange', () => {
    const route = parseRouteFromHash();
    if (route === ROUTES.SEARCH_RESULTS) {
      const search = StorageManager.get('booking_search', null);
      if (!isValidBookingSearch(search) && !isSearching) {
        location.hash = '#/home';
        return;
      }
    }
    if (
      [ROUTES.ANCILLARIES, ROUTES.SEATS, ROUTES.PASSENGER, ROUTES.PAYMENT].includes(route) &&
      !StorageManager.get('booking_flight', null)
    ) {
      location.hash = '#/home';
      return;
    }
    currentRoute = route;
    renderApp();
  });

  if (!location.hash || location.hash === '#') {
    history.replaceState(null, '', `${location.pathname}${location.search}#/home`);
  }
  currentRoute = parseRouteFromHash();
  renderApp();
}
