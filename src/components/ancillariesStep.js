import { ANCILLARY_PRODUCTS } from '../data/ancillaries.js';
import { renderBookingStepper } from './shell.js';

/**
 * @param {{ selectedCodes: string[] }} opts
 * @returns {string}
 */
export function renderAncillariesStep(opts) {
  const selected = new Set(opts.selectedCodes || []);

  const cards = ANCILLARY_PRODUCTS.map((p) => {
    const on = selected.has(p.product_code);
    return `
    <label class="flex gap-3 p-4 rounded-xl border ${
      on ? 'border-ceb-green bg-ceb-green/5' : 'border-ceb-border bg-white'
    } cursor-pointer hover:border-ceb-sky">
      <input type="checkbox" name="ancillary" value="${p.product_code}" ${on ? 'checked' : ''}
        class="mt-1 rounded text-ceb-green focus:ring-ceb-sky" data-ancillary-code="${p.product_code}" />
      <span class="flex-1">
        <span class="flex items-start justify-between gap-2">
          <span class="font-bold text-ceb-navy"><i class="${p.icon} text-ceb-sky mr-2" aria-hidden="true"></i>${p.product_name}</span>
          <span class="font-extrabold text-ceb-blue shrink-0">₱${p.price.toLocaleString()}</span>
        </span>
        <span class="block text-sm text-ceb-text-muted mt-1">${p.description}</span>
      </span>
    </label>`;
  }).join('');

  return `
  <div class="max-w-3xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('ancillaries')}
    <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Add-ons &amp; ancillaries</h1>
    <p class="text-sm text-ceb-text-muted mb-6">Select optional products for your trip. You can deselect anytime.</p>
    <form id="ancillaries-form" class="space-y-3">
      ${cards}
      <div class="flex flex-wrap gap-3 pt-4 justify-between">
        <a href="#/search-results" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-navy hover:bg-ceb-muted">Back</a>
        <button type="submit" class="px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
          Continue to seats
        </button>
      </div>
    </form>
  </div>`;
}
