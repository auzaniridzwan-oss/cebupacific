import { renderBookingStepper } from './shell.js';

/**
 * @param {{ totalPhp: number, summaryLines: string[] }} opts
 * @returns {string}
 */
export function renderPaymentStep(opts) {
  return `
  <div class="max-w-xl mx-auto px-4 py-8 fade-view">
    ${renderBookingStepper('payment')}
    <h1 class="text-2xl font-extrabold text-ceb-blue mb-2">Payment</h1>
    <p class="text-sm text-ceb-text-muted mb-4">Mock checkout — no real charge will be made.</p>
    <div class="bg-ceb-muted rounded-xl border border-ceb-border p-4 mb-4 text-sm space-y-1">
      ${opts.summaryLines.map((l) => `<p>${l}</p>`).join('')}
      <p class="pt-2 text-lg font-extrabold text-ceb-blue">Total: ₱${opts.totalPhp.toLocaleString()}</p>
    </div>
    <form id="payment-form" class="bg-white rounded-xl border border-ceb-border p-5 space-y-4">
      <fieldset>
        <legend class="text-sm font-bold mb-2">Payment method</legend>
        <div class="flex flex-wrap gap-3 text-sm">
          <label class="inline-flex items-center gap-2 font-semibold">
            <input type="radio" name="pay_method" value="card" checked class="text-ceb-blue" /> Card
          </label>
          <label class="inline-flex items-center gap-2 font-semibold">
            <input type="radio" name="pay_method" value="gcash" class="text-ceb-blue" /> GCash
          </label>
          <label class="inline-flex items-center gap-2 font-semibold">
            <input type="radio" name="pay_method" value="maya" class="text-ceb-blue" /> Maya
          </label>
        </div>
      </fieldset>
      <div id="card-fields" class="space-y-3">
        <label class="block text-sm font-semibold">
          Card number
          <input type="text" name="cardNumber" placeholder="4111 1111 1111 1111" maxlength="19"
            class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block text-sm font-semibold">
            Expiry
            <input type="text" name="expiry" placeholder="MM/YY" maxlength="5"
              class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal" />
          </label>
          <label class="block text-sm font-semibold">
            CCV
            <input type="text" name="ccv" placeholder="123" maxlength="4"
              class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal" />
          </label>
        </div>
        <label class="block text-sm font-semibold">
          Name on card
          <input type="text" name="cardName"
            class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2.5 font-normal" />
        </label>
      </div>
      <p id="ewallet-hint" class="text-sm text-ceb-text-muted hidden">
        Demo mode: e-wallet payment is simulated instantly.
      </p>
      <div class="flex flex-wrap gap-3 pt-2 justify-between">
        <a href="#/passenger" class="px-4 py-2.5 rounded-lg border border-ceb-border font-semibold text-ceb-navy hover:bg-ceb-muted">Back</a>
        <button type="submit" id="pay-submit-btn"
          class="px-6 py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
          Pay now
        </button>
      </div>
    </form>
  </div>`;
}
