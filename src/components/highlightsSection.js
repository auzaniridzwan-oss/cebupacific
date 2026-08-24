/**
 * @returns {string}
 */
export function renderHighlightsSection() {
  const cards = [
    {
      title: 'Seat Sale from Manila',
      desc: 'Score low fares to Singapore, Bangkok, and more. Limited seats — book early!',
      icon: 'fa-solid fa-tags',
      tint: 'bg-ceb-sky/10',
    },
    {
      title: 'GetMoreFun Rewards',
      desc: 'Earn points when you fly and redeem for flights, add-ons, and partner deals.',
      icon: 'fa-solid fa-gift',
      tint: 'bg-ceb-yellow/30',
    },
    {
      title: 'Ceb Mobile App',
      desc: 'Manage bookings, add baggage, and check in on the go with the official app.',
      icon: 'fa-solid fa-mobile-screen',
      tint: 'bg-ceb-green/10',
    },
  ];

  return `
  <section class="max-w-7xl mx-auto px-4 py-12" aria-label="Highlights">
    <h2 class="text-2xl font-extrabold text-ceb-blue mb-6 flex items-center gap-3">
      <span class="w-1.5 h-7 bg-ceb-yellow rounded-full inline-block" aria-hidden="true"></span>
      Highlights
    </h2>
    <div class="grid md:grid-cols-3 gap-5">
      ${cards
        .map(
          (c) => `
        <article class="bg-white rounded-xl border border-ceb-border shadow-sm overflow-hidden hover:shadow-md transition">
          <div class="${c.tint} h-36 flex items-center justify-center text-ceb-blue text-4xl">
            <i class="${c.icon}" aria-hidden="true"></i>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-ceb-navy mb-1">${c.title}</h3>
            <p class="text-sm text-ceb-text-muted">${c.desc}</p>
          </div>
        </article>`,
        )
        .join('')}
    </div>
  </section>`;
}
