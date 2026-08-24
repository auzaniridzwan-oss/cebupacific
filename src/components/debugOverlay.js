/**
 * @param {{ events: Array<{ name: string, props?: Record<string, unknown>, at: number }>, open: boolean }} opts
 * @returns {string}
 */
export function renderDebugOverlay(opts) {
  const { events, open } = opts;
  const list =
    events.length === 0
      ? `<p class="text-xs text-white/60 p-3">No custom events yet.</p>`
      : events
          .slice()
          .reverse()
          .map(
            (e) => `
        <li class="border-b border-white/10 px-3 py-2 event-log-flash">
          <p class="font-bold text-ceb-yellow text-xs">${e.name}</p>
          <pre class="text-[10px] text-white/80 whitespace-pre-wrap break-all mt-1">${JSON.stringify(e.props || {}, null, 0)}</pre>
          <p class="text-[10px] text-white/40 mt-1">${new Date(e.at).toLocaleTimeString()}</p>
        </li>`,
          )
          .join('');

  return `
  <aside id="debug-drawer" class="${open ? '' : 'hidden'} fixed bottom-0 right-0 z-[90] w-full sm:w-96 max-h-[50vh] bg-ceb-navy text-white shadow-2xl rounded-tl-xl overflow-hidden flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-ceb-blue">
      <h2 class="text-sm font-bold">Braze custom events</h2>
      <button type="button" id="debug-drawer-close" class="text-white/80 hover:text-white" aria-label="Close">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
    <ul class="overflow-y-auto flex-1">${list}</ul>
  </aside>`;
}
