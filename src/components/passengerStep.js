import { renderBookingStepper } from './shell.js';

/**
 * @param {{ passenger?: { firstName?: string, lastName?: string, fullName?: string, email?: string, phone?: string, nationality?: string } }} opts
 * @returns {string}
 */
export function renderPassengerStep(opts = {}) {
  const p = normalizePassenger(opts.passenger || {});
  return `
  <div class="max-w-xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('passenger')}
    <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Passenger details</h1>
    <p class="text-sm text-ceb-text-muted mb-6">Enter contact details for the lead passenger. Submitting with an email identifies you in Braze.</p>
    <form id="passenger-form" class="bg-white rounded-xl border border-ceb-border p-5 space-y-4">
      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block text-sm font-semibold">
          First name *
          <input type="text" name="firstName" required autocomplete="given-name" value="${escapeAttr(p.firstName)}"
            class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
        </label>
        <label class="block text-sm font-semibold">
          Last name *
          <input type="text" name="lastName" required autocomplete="family-name" value="${escapeAttr(p.lastName)}"
            class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
        </label>
      </div>
      <label class="block text-sm font-semibold">
        Email *
        <input type="email" name="email" required autocomplete="email" value="${escapeAttr(p.email)}"
          class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
      </label>
      <label class="block text-sm font-semibold">
        Phone
        <input type="tel" name="phone" autocomplete="tel" value="${escapeAttr(p.phone)}" placeholder="+63…"
          class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal focus:ring-2 focus:ring-ceb-sky" />
      </label>
      <label class="block text-sm font-semibold">
        Nationality
        <select name="nationality" class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal">
          <option value="PH" ${p.nationality === 'PH' ? 'selected' : ''}>Philippines</option>
          <option value="SG" ${p.nationality === 'SG' ? 'selected' : ''}>Singapore</option>
          <option value="TH" ${p.nationality === 'TH' ? 'selected' : ''}>Thailand</option>
          <option value="MY" ${p.nationality === 'MY' ? 'selected' : ''}>Malaysia</option>
          <option value="ID" ${p.nationality === 'ID' ? 'selected' : ''}>Indonesia</option>
          <option value="VN" ${p.nationality === 'VN' ? 'selected' : ''}>Vietnam</option>
          <option value="OTHER" ${p.nationality === 'OTHER' ? 'selected' : ''}>Other</option>
        </select>
      </label>
      <p id="passenger-form-error" class="text-red-600 text-sm hidden"></p>
      <div class="flex flex-wrap gap-3 pt-2 justify-between">
        <a href="#/seats" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-navy hover:bg-ceb-muted">Back</a>
        <button type="submit" class="px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
          Continue to payment
        </button>
      </div>
    </form>
  </div>`;
}

/**
 * @param {{ firstName?: string, lastName?: string, fullName?: string, email?: string, phone?: string, nationality?: string }} raw
 * @returns {{ firstName: string, lastName: string, email: string, phone: string, nationality: string }}
 */
export function normalizePassenger(raw) {
  let firstName = String(raw.firstName || '').trim();
  let lastName = String(raw.lastName || '').trim();
  if ((!firstName || !lastName) && raw.fullName) {
    const parts = String(raw.fullName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!firstName && parts.length) firstName = parts[0];
    if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
  }
  return {
    firstName,
    lastName,
    email: String(raw.email || '').trim(),
    phone: String(raw.phone || '').trim(),
    nationality: String(raw.nationality || 'PH').trim() || 'PH',
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
