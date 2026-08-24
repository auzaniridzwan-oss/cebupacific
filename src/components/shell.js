/**
 * Cebu Pacific eagle + wordmark (inline SVG).
 * @returns {string}
 */
export function cebLogoSvg() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48" width="180" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="cebEagle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#06A7E0"/>
        <stop offset="50%" stop-color="#039482"/>
        <stop offset="100%" stop-color="#2574BB"/>
      </linearGradient>
    </defs>
    <path fill="url(#cebEagle)" d="M8 28c6-14 18-22 32-22 4 0 8 1 11 3-8 2-14 7-18 14 6-2 12-2 18 0-10 8-22 12-34 11l-9-6z"/>
    <path fill="#06A7E0" d="M36 12c4-3 9-5 15-5 2 2 3 5 3 8-5-1-10 0-15 2l-3-5z"/>
    <text x="58" y="32" font-family="Nunito, system-ui, sans-serif" font-size="22" font-weight="800" fill="#2574BB">cebu pacific</text>
  </svg>`;
}

/**
 * @param {{ activeView: string, loggedIn?: boolean, userLabel?: string }} opts
 * @returns {string}
 */
export function renderShellHeader(opts) {
  const { activeView, loggedIn = false, userLabel = '' } = opts;
  const authLinks = loggedIn
    ? `<span class="text-white/90">${userLabel || 'Guest'}</span>
       <button type="button" id="header-logout-link" class="hover:underline">Log out</button>`
    : `<a href="#" id="header-login-link" data-nav="utility" class="hover:underline">Login</a>
       <a href="#" id="header-signup-link" data-nav="utility" class="hover:underline">Sign up</a>`;

  const navCls = (v) =>
    v === activeView
      ? 'text-ceb-blue font-bold border-b-2 border-ceb-yellow pb-0.5'
      : 'text-ceb-text hover:text-ceb-blue';

  return `
  <header class="sticky top-0 z-40 shadow-sm">
    <div class="bg-ceb-blue text-white text-xs">
      <div class="max-w-7xl mx-auto px-4 flex justify-between gap-4 py-2 items-center">
        <a href="#" class="font-semibold tracking-wide hover:underline" data-nav="decor">GetMoreFun</a>
        <div class="flex items-center gap-4">
          <button type="button" id="debug-launcher" class="hover:underline text-white/80" aria-label="Show debug panel">Braze</button>
          ${authLinks}
          <button type="button" class="inline-flex items-center gap-1 hover:underline" aria-label="Language">
            <span>EN</span>
            <i class="fa-solid fa-chevron-down text-[0.65rem]" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="bg-white border-b border-ceb-border">
      <div class="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 py-3">
        <button type="button" id="ceb-logo-btn" class="flex items-center text-left" aria-label="Home">
          ${cebLogoSvg()}
        </button>
        <nav class="flex flex-wrap items-center gap-4 md:gap-8 text-sm" aria-label="Primary">
          <a href="#/home" data-route="HOME" class="${navCls('HOME')}">Book</a>
          <a href="#/search-results" data-route="SEARCH_RESULTS" class="${navCls('SEARCH_RESULTS')}">Flight results</a>
          <a href="#" data-nav="decor" class="hidden sm:inline text-ceb-text-muted hover:text-ceb-blue">Experience</a>
          <a href="#" data-nav="decor" class="hidden sm:inline text-ceb-text-muted hover:text-ceb-blue">Discover</a>
        </nav>
      </div>
    </div>
  </header>`;
}

/** @returns {string} */
export function renderShellFooter() {
  const col = (title, links) => `
    <div>
      <h3 class="text-white text-sm font-bold mb-4">${title}</h3>
      <ul class="space-y-2 text-sm text-white/70">
        ${links.map((l) => `<li><a href="#" class="hover:text-white">${l}</a></li>`).join('')}
      </ul>
    </div>`;
  return `
  <footer class="bg-ceb-navy text-white/70 mt-auto">
    <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      ${col('Company', ['About us', 'Careers', 'Press', 'Sustainability'])}
      ${col('GetMoreFun', ['Rewards', 'Partner offers', 'How it works', 'Redeem'])}
      ${col('Where We Fly', ['Route map', 'Flight schedules', 'Timetables', 'Travel guides'])}
      ${col('Support', ['Help centre', 'Contact us', 'FAQs', 'Baggage'])}
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex flex-wrap gap-4">
          <a href="#" class="hover:text-white">Privacy</a>
          <a href="#" class="hover:text-white">Terms</a>
          <a href="#" class="hover:text-white">Cookies</a>
        </div>
        <div class="flex gap-4 text-white">
          <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></a>
          <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram" aria-hidden="true"></i></a>
          <a href="#" aria-label="TikTok"><i class="fa-brands fa-tiktok" aria-hidden="true"></i></a>
        </div>
        <p class="w-full md:w-auto text-center md:text-right">© Cebu Pacific Demo — Braze SDK workshop. Not an official site.</p>
      </div>
    </div>
  </footer>`;
}

/**
 * @param {string} current
 * @returns {string}
 */
export function renderBookingStepper(current) {
  const steps = [
    { id: 'results', label: 'Flights', hash: '#/search-results' },
    { id: 'ancillaries', label: 'Add-ons', hash: '#/ancillaries' },
    { id: 'seats', label: 'Seats', hash: '#/seats' },
    { id: 'passenger', label: 'Passenger', hash: '#/passenger' },
    { id: 'payment', label: 'Payment', hash: '#/payment' },
  ];
  return `
  <nav class="flex flex-wrap gap-2 mb-6 text-xs sm:text-sm" aria-label="Booking steps">
    ${steps
      .map((s) => {
        const active = s.id === current;
        return `<a href="${s.hash}" class="px-3 py-1.5 rounded-full border ${
          active
            ? 'bg-ceb-yellow border-ceb-navy text-ceb-navy font-bold'
            : 'bg-white border-ceb-border text-ceb-text-muted hover:border-ceb-sky'
        }">${s.label}</a>`;
      })
      .join('')}
  </nav>`;
}
