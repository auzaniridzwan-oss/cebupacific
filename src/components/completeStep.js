/**
 * @param {{ bookingCode: string, summaryLines: string[] }} opts
 * @returns {string}
 */
export function renderCompleteStep(opts) {
  return `
  <div class="max-w-xl mx-auto px-4 py-12 fade-view text-center">
    <div class="bg-white rounded-2xl border border-ceb-border shadow-sm p-8">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-ceb-green/15 text-ceb-green flex items-center justify-center text-3xl">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      </div>
      <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Booking complete!</h1>
      <p class="text-ceb-text-muted mb-4">Thank you for flying with Cebu Pacific (demo).</p>
      <p class="text-lg font-extrabold text-ceb-navy mb-6">Booking code: <span class="text-ceb-sky">${opts.bookingCode}</span></p>
      <div class="text-left text-sm bg-ceb-muted rounded-lg p-4 space-y-1 mb-6">
        ${opts.summaryLines.map((l) => `<p>${l}</p>`).join('')}
      </div>
      <a href="#/home"
        class="inline-block px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
        Book another flight
      </a>
    </div>
  </div>`;
}
