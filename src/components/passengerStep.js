import { renderBookingStepper } from './shell.js';

/**
 * @param {{ passenger?: { fullName?: string, email?: string, phone?: string, nationality?: string } }} opts
 * @returns {string}
 */
export function renderPassengerStep(opts = {}) {
  const p = opts.passenger || {};
  return `
  <div class="max-w-xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('passenger')}
    <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Passenger details</h1>
    <p class="text-sm text-ceb-text-muted mb-6">Enter contact details for the lead passenger.</p>
    <form id="passenger-form" class="bg-white rounded-xl border border-ceb-border p-5 space-y-4">
      <label class="block text-sm font-semibold">
        Full name *
        <input type="text" name="fullName" required value="${p.fullName || ''}"
          class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
      </label>
      <label class="block text-sm font-semibold">
        Email *
        <input type="email" name="email" required value="${p.email || ''}"
          class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
      </label>
      <label class="block text-sm font-semibold">
        Phone
        <input type="tel" name="phone" value="${p.phone || ''}" placeholder="+63…"
          class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
      </label>
      <label class="block text-sm font-semibold">
        Nationality
        <select name="nationality" class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal">
          <option value="PH" ${(p.nationality || 'PH') === 'PH' ? 'selected' : ''}>Philippines</option>
          <option value="SG" ${p.nationality === 'SG' ? 'selected' : ''}>Singapore</option>
          <option value="TH" ${p.nationality === 'TH' ? 'selected' : ''}>Thailand</option>
          <option value="MY" ${p.nationality === 'MY' ? 'selected' : ''}>Malaysia</option>
          <option value="ID" ${p.nationality === 'ID' ? 'selected' : ''}>Indonesia</option>
          <option value="VN" ${p.nationality === 'VN' ? 'selected' : ''}>Vietnam</option>
          <option value="OTHER" ${p.nationality === 'OTHER' ? 'selected' : ''}>Other</option>
        </select>
      </label>
      <div class="flex flex-wrap gap-3 pt-2 justify-between">
        <a href="#/seats" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-navy hover:bg-ceb-muted">Back</a>
        <button type="submit" class="px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
          Continue to payment
        </button>
      </div>
    </form>
  </div>`;
}
