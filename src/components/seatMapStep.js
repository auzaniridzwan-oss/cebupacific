import { renderBookingStepper } from './shell.js';

/**
 * @param {{ seatMap: ReturnType<import('../data/seatMap.js').generateSeatMap>, selectedSeatId?: string | null }} opts
 * @returns {string}
 */
export function renderSeatMapStep(opts) {
  const { seatMap, selectedSeatId = null } = opts;
  const leftCols = ['A', 'B', 'C'];
  const rightCols = ['D', 'E', 'F'];

  let grid = '';
  for (let row = 1; row <= seatMap.rows; row++) {
    grid += `<span class="seat-row-label">${row}</span>`;
    for (const col of leftCols) {
      const seat = seatMap.seats.find((s) => s.id === `${row}${col}`);
      grid += seatBtn(seat, selectedSeatId);
    }
    grid += `<span class="seat-aisle" aria-hidden="true"></span>`;
    for (const col of rightCols) {
      const seat = seatMap.seats.find((s) => s.id === `${row}${col}`);
      grid += seatBtn(seat, selectedSeatId);
    }
  }

  const selected = seatMap.seats.find((s) => s.id === selectedSeatId);

  return `
  <div class="max-w-3xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('seats')}
    <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Select your seat</h1>
    <p class="text-sm text-ceb-text-muted mb-4">A320 layout · occupied seats are randomized per booking. Extra-legroom rows cost more.</p>
    <div class="flex flex-wrap gap-4 text-xs mb-4">
      <span class="inline-flex items-center gap-1"><span class="w-4 h-4 rounded border bg-white"></span> Available</span>
      <span class="inline-flex items-center gap-1"><span class="w-4 h-4 rounded bg-gray-300"></span> Occupied</span>
      <span class="inline-flex items-center gap-1"><span class="w-4 h-4 rounded bg-ceb-yellow border border-ceb-navy"></span> Selected</span>
      <span class="inline-flex items-center gap-1"><span class="w-4 h-4 rounded border border-ceb-green"></span> Extra legroom</span>
    </div>
    <div class="bg-white rounded-xl border border-ceb-border p-4 overflow-x-auto">
      <div class="text-center text-xs text-ceb-text-muted mb-3 font-semibold tracking-widest">FRONT</div>
      <div class="seat-map-grid mx-auto" id="seat-map">${grid}</div>
    </div>
    <p id="seat-selection-label" class="mt-4 text-sm font-semibold text-ceb-navy">
      ${selected ? `Selected: ${selected.id} · ₱${selected.price}` : 'No seat selected'}
    </p>
    <div class="flex flex-wrap gap-3 pt-4 justify-between">
      <a href="#/ancillaries" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-navy hover:bg-ceb-muted">Back</a>
      <div class="flex gap-2">
        <button type="button" id="seat-skip-btn" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-text-muted hover:bg-ceb-muted">
          Skip
        </button>
        <button type="button" id="seat-continue-btn"
          class="px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold"
          ${selected ? '' : 'disabled'}>
          Continue
        </button>
      </div>
    </div>
  </div>`;
}

/**
 * @param {{ id: string, occupied: boolean, legroom: boolean, price: number } | undefined} seat
 * @param {string | null} selectedSeatId
 */
function seatBtn(seat, selectedSeatId) {
  if (!seat) return '<span></span>';
  const classes = [
    'seat-btn',
    seat.occupied ? 'occupied' : '',
    seat.legroom && !seat.occupied ? 'legroom' : '',
    seat.id === selectedSeatId ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<button type="button" class="${classes}" data-seat-id="${seat.id}" data-seat-price="${seat.price}"
    ${seat.occupied ? 'disabled' : ''} title="${seat.id}${seat.legroom ? ' · Extra legroom' : ''} · ₱${seat.price}"
    aria-label="Seat ${seat.id}">${seat.col}</button>`;
}
