/**
 * Optional login / sign-up modal markup.
 * @returns {string}
 */
export function renderLoginModal() {
  return `
  <div id="login-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
    <div class="absolute inset-0 bg-black/50" data-login-dismiss></div>
    <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
      <button type="button" class="absolute top-3 right-3 text-ceb-text-muted hover:text-ceb-navy" data-login-dismiss aria-label="Close">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
      <h2 id="login-modal-title" class="text-xl font-extrabold text-ceb-blue mb-1">Sign in (optional)</h2>
      <p class="text-sm text-ceb-text-muted mb-4">Identify yourself in Braze with your email. You can search anonymously without signing in.</p>
      <form id="login-form" class="space-y-3">
        <label class="block text-sm font-semibold">
          First name
          <input type="text" name="firstName" class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2 font-normal" />
        </label>
        <label class="block text-sm font-semibold">
          Last name
          <input type="text" name="lastName" class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2 font-normal" />
        </label>
        <label class="block text-sm font-semibold">
          Email *
          <input type="email" name="email" required class="mt-1 w-full rounded-lg border border-ceb-border px-3 py-2 font-normal" />
        </label>
        <p id="login-form-error" class="text-red-600 text-sm hidden"></p>
        <button type="submit" class="w-full py-2.5 rounded-lg bg-ceb-yellow hover:bg-ceb-yellow-hover text-ceb-navy font-extrabold">
          Continue
        </button>
      </form>
    </div>
  </div>`;
}
