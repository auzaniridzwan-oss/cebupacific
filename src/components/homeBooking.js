import dayjs from 'dayjs';
import { DESTINATIONS, ORIGIN } from '../data/destinations.js';
import { getBannerCopy, renderHeroCarouselSlides } from './heroCarousel.js';

/**
 * @param {{ defaultDestination?: string, defaultDepart?: string, defaultReturn?: string }} [opts]
 * @returns {string}
 */
export function renderHomeBooking(opts = {}) {
  const tomorrow = dayjs().add(7, 'day').format('YYYY-MM-DD');
  const weekLater = dayjs().add(14, 'day').format('YYYY-MM-DD');
  const dest = opts.defaultDestination || 'SIN';
  const depart = opts.defaultDepart || tomorrow;
  const ret = opts.defaultReturn || weekLater;
  const copy = getBannerCopy(0);

  const destOptions = DESTINATIONS.map(
    (d) =>
      `<option value="${d.code}" ${d.code === dest ? 'selected' : ''}>${d.name} (${d.code})</option>`,
  ).join('');

  return `
  <section id="hero-banner" class="hero-banner text-white relative overflow-hidden">
    ${renderHeroCarouselSlides()}
    <div class="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <p class="uppercase tracking-widest text-ceb-yellow text-xs font-bold mb-2">Fly with us</p>
        <h1 id="hero-title" class="text-3xl md:text-5xl font-extrabold leading-tight mb-3 drop-shadow">${copy.title}</h1>
        <p id="hero-subtitle" class="text-white/95 mb-4 max-w-md drop-shadow">${copy.subtitle}</p>
        <p class="text-white/80 text-sm mb-4 max-w-md">Search Cebu Pacific flights from Manila to top Southeast Asian cities. Demo site for Braze SDK integration.</p>
        <button type="button" class="text-sm font-semibold underline underline-offset-4" data-nav="decor">Discover more →</button>
      </div>
      <div class="bg-white text-ceb-text rounded-xl shadow-xl overflow-hidden">
        <div class="flex text-xs sm:text-sm font-semibold border-b border-ceb-border overflow-x-auto">
          <button type="button" class="flex-1 px-3 py-3 bg-ceb-blue text-white" data-book-tab="book">Book Trip</button>
          <button type="button" class="flex-1 px-3 py-3 text-ceb-text-muted hover:bg-ceb-muted" data-book-tab="manage">Manage Booking</button>
          <button type="button" class="flex-1 px-3 py-3 text-ceb-text-muted hover:bg-ceb-muted" data-book-tab="checkin">Check In</button>
          <button type="button" class="flex-1 px-3 py-3 text-ceb-text-muted hover:bg-ceb-muted" data-book-tab="status">Flight Status</button>
        </div>
        <form id="flight-search-form" class="p-4 sm:p-6 space-y-4">
          <div class="flex gap-4 text-sm">
            <label class="inline-flex items-center gap-2 font-semibold">
              <input type="radio" name="trip_mode" value="book" checked class="text-ceb-blue" /> Book flights
            </label>
            <label class="inline-flex items-center gap-2 text-ceb-text-muted">
              <input type="radio" name="trip_mode" value="redeem" class="text-ceb-blue" /> Redeem flights
            </label>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <label class="block text-sm font-semibold">
              From
              <input type="text" value="${ORIGIN.name} (${ORIGIN.code})" readonly
                class="mt-1 w-full rounded-lg border border-ceb-border bg-ceb-muted px-3 py-2.5 text-ceb-text font-normal" />
              <input type="hidden" name="origin" value="${ORIGIN.code}" />
            </label>
            <label class="block text-sm font-semibold">
              To
              <select name="destination" required
                class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky">
                ${destOptions}
              </select>
            </label>
            <label class="block text-sm font-semibold">
              Depart
              <input type="date" name="depart" required value="${depart}" min="${dayjs().format('YYYY-MM-DD')}"
                class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
            </label>
            <label class="block text-sm font-semibold">
              Return
              <input type="date" name="return" required value="${ret}" min="${dayjs().format('YYYY-MM-DD')}"
                class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
            </label>
            <label class="block text-sm font-semibold">
              Class
              <select name="class" class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal">
                <option value="economy" selected>Economy</option>
              </select>
            </label>
            <label class="block text-sm font-semibold">
              Passengers
              <input type="number" name="passengers" value="1" min="1" max="1" readonly
                class="mt-1 w-full rounded-lg border border-ceb-border bg-ceb-muted px-3 py-2.5 font-normal" />
            </label>
          </div>
          <p id="search-form-error" class="text-red-600 text-sm hidden"></p>
          <button type="submit"
            class="w-full sm:w-auto px-8 py-3 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold tracking-wide shadow">
            SEARCH
          </button>
        </form>
      </div>
    </div>
  </section>`;
}
