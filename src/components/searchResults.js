import { renderBookingStepper } from './shell.js';

/**
 * @param {Record<string, unknown>} f
 * @returns {string}
 */
function aircraftLine(f) {
  const type = String(f.aircraftType || '').trim();
  const model = String(f.aircraftModel || '').trim();
  const fallback = String(f.aircraft || '').trim();
  if (type && model) {
    return `<span>Type <span class="font-semibold text-ceb-navy">${type}</span></span>
      <span class="text-ceb-border">|</span>
      <span>Model <span class="font-semibold text-ceb-navy">${model}</span></span>`;
  }
  if (fallback) {
    return `<span class="font-semibold text-ceb-navy">${fallback}</span>`;
  }
  return `<span class="text-ceb-text-muted">Not listed</span>`;
}

/**
 * @param {{ flights: Array<Record<string, unknown>>, searchSummary: string, usedMock?: boolean, mockReason?: string, loading?: boolean }} opts
 * @returns {string}
 */
export function renderSearchResults(opts) {
  const { flights, searchSummary, usedMock = false, mockReason = '', loading = false } = opts;

  if (loading) {
    return `
    <div class="max-w-7xl mx-auto px-4 py-8">
      ${renderBookingStepper('results')}
      <div class="bg-white rounded-xl border border-ceb-border p-10 text-center">
        <i class="fa-solid fa-plane fa-bounce text-ceb-sky text-3xl mb-3" aria-hidden="true"></i>
        <p class="font-semibold text-ceb-navy">Searching Cebu Pacific flights…</p>
      </div>
    </div>`;
  }

  const rows =
    flights.length === 0
      ? `<p class="text-ceb-text-muted p-6">No flights found for this search. Try different dates.</p>`
      : flights
          .map(
            (f) => `
        <article class="border border-ceb-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-ceb-sky bg-white">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ceb-blue text-white text-xs font-bold">5J</span>
              <span class="font-bold text-ceb-navy">${f.flightNumber}</span>
              ${f.source === 'mock' ? '<span class="text-[10px] uppercase bg-ceb-muted px-2 py-0.5 rounded text-ceb-text-muted">Demo data</span>' : ''}
            </div>
            <p class="text-xs text-ceb-text-muted mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <i class="fa-solid fa-plane text-ceb-sky" aria-hidden="true"></i>
              ${aircraftLine(f)}
            </p>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p class="text-ceb-text-muted text-xs">Depart</p>
                <p class="font-bold text-lg">${f.departureTime}</p>
                <p class="text-xs text-ceb-text-muted">${f.originAirportCode || 'MNL'}</p>
              </div>
              <div class="text-center self-center">
                <p class="text-xs text-ceb-text-muted">${f.duration}</p>
                <div class="h-px bg-ceb-border my-1 relative">
                  <i class="fa-solid fa-plane absolute -top-2 left-1/2 -translate-x-1/2 text-ceb-sky text-xs" aria-hidden="true"></i>
                </div>
                <p class="text-xs text-ceb-text-muted">Return ${f.returnTime || '—'}</p>
              </div>
              <div class="text-right">
                <p class="text-ceb-text-muted text-xs">Arrive</p>
                <p class="font-bold text-lg">${f.arrivalTime}${f.arrivalDayOffset ? `<sup class="text-xs">+${f.arrivalDayOffset}</sup>` : ''}</p>
                <p class="text-xs text-ceb-text-muted">${f.destinationAirportCode || ''}</p>
              </div>
            </div>
          </div>
          <div class="sm:text-right shrink-0">
            <p class="text-xs text-ceb-text-muted">from</p>
            <p class="text-xl font-extrabold text-ceb-blue">₱${Number(f.price).toLocaleString()}</p>
            <button type="button" data-select-flight="${f.id}"
              class="mt-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-bold">
              Select
            </button>
          </div>
        </article>`,
          )
          .join('');

  return `
  <div class="max-w-7xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('results')}
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-ceb-blue">Flight results</h1>
        <p class="text-sm text-ceb-text-muted">${searchSummary}</p>
      </div>
      <a href="#/home" class="text-sm font-semibold text-ceb-sky hover:underline">Edit search</a>
    </div>
    ${
      usedMock
        ? `<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
            <p class="font-semibold">Showing demo flight data</p>
            <p class="mt-1">${
              mockReason
                ? String(mockReason)
                : 'Live SerpAPI unavailable or returned no 5J results.'
            }</p>
          </div>`
        : ''
    }
    <div class="space-y-3" id="flight-results-list">${rows}</div>
  </div>`;
}
