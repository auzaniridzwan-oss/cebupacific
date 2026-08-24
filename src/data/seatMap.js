const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];
const TOTAL_ROWS = 30;
const LEGROOM_ROWS = new Set([1, 12, 13]);

/**
 * @param {number} seed
 * @returns {() => number}
 */
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {string} [seedKey]
 * @returns {{ rows: number, columns: string[], seats: Array<{ id: string, row: number, col: string, occupied: boolean, legroom: boolean, price: number }> }}
 */
export function generateSeatMap(seedKey = '') {
  let hash = 0;
  const key = seedKey || String(Date.now());
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const rand = mulberry32(hash || 1);

  /** @type {Array<{ id: string, row: number, col: string, occupied: boolean, legroom: boolean, price: number }>} */
  const seats = [];

  for (let row = 1; row <= TOTAL_ROWS; row++) {
    const legroom = LEGROOM_ROWS.has(row);
    for (const col of COLUMNS) {
      const occupied = rand() < 0.28;
      seats.push({
        id: `${row}${col}`,
        row,
        col,
        occupied,
        legroom,
        price: occupied ? 0 : legroom ? 450 : 199,
      });
    }
  }

  return { rows: TOTAL_ROWS, columns: COLUMNS, seats };
}

/**
 * @param {ReturnType<typeof generateSeatMap>} map
 * @param {string} seatId
 * @returns {{ id: string, row: number, col: string, occupied: boolean, legroom: boolean, price: number } | undefined}
 */
export function findSeat(map, seatId) {
  return map.seats.find((s) => s.id === seatId);
}
