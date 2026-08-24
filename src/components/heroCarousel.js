import { HERO_BANNERS } from '../data/banners.js';

const AUTOPLAY_MS = 5500;

/** @type {ReturnType<typeof setInterval> | null} */
let autoplayTimer = null;

/**
 * Background image slides + controls markup (place inside the hero shell).
 * @returns {string}
 */
export function renderHeroCarouselSlides() {
  const slides = HERO_BANNERS.map(
    (b, i) => `
    <div class="hero-carousel-slide${i === 0 ? ' is-active' : ''}" data-hero-slide="${i}"
      style="background-image: url('${b.src}')" role="img" aria-label="${b.alt}"></div>`,
  ).join('');

  const dots = HERO_BANNERS.map(
    (b, i) => `
    <button type="button" class="hero-carousel-dot${i === 0 ? ' is-active' : ''}"
      data-hero-dot="${i}" aria-label="Show ${b.title}"${i === 0 ? ' aria-current="true"' : ''}></button>`,
  ).join('');

  return `
  <div class="hero-carousel-track" aria-hidden="true">${slides}</div>
  <div class="hero-carousel-overlay" aria-hidden="true"></div>
  <div class="hero-carousel-controls">
    <button type="button" class="hero-carousel-nav" data-hero-prev aria-label="Previous banner">
      <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
    </button>
    <div class="hero-carousel-dots" role="tablist" aria-label="Banner slides">${dots}</div>
    <button type="button" class="hero-carousel-nav" data-hero-next aria-label="Next banner">
      <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    </button>
  </div>`;
}

/**
 * Caption text for the active banner (synced by init).
 * @param {number} [index]
 * @returns {{ title: string, subtitle: string }}
 */
export function getBannerCopy(index = 0) {
  const b = HERO_BANNERS[index] || HERO_BANNERS[0];
  return {
    title: b?.title || 'Get more fun on every trip',
    subtitle: b?.subtitle || '',
  };
}

/**
 * Wire autoplay, dots, and prev/next on the home hero. Safe to call after every re-render.
 * @param {ParentNode | null} [root]
 */
export function initHeroCarousel(root = document) {
  stopHeroCarousel();
  const section = root?.querySelector?.('#hero-banner') || document.getElementById('hero-banner');
  if (!section || !HERO_BANNERS.length) return;

  const slides = /** @type {NodeListOf<HTMLElement>} */ (section.querySelectorAll('[data-hero-slide]'));
  const dots = /** @type {NodeListOf<HTMLButtonElement>} */ (section.querySelectorAll('[data-hero-dot]'));
  const titleEl = section.querySelector('#hero-title');
  const subtitleEl = section.querySelector('#hero-subtitle');
  let index = 0;

  /**
   * @param {number} next
   */
  function goTo(next) {
    if (!slides.length) return;
    index = ((next % slides.length) + slides.length) % slides.length;
    slides.forEach((el, i) => {
      el.classList.toggle('is-active', i === index);
    });
    dots.forEach((el, i) => {
      const on = i === index;
      el.classList.toggle('is-active', on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    const copy = getBannerCopy(index);
    if (titleEl) titleEl.textContent = copy.title;
    if (subtitleEl) subtitleEl.textContent = copy.subtitle;
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function restartAutoplay() {
    stopHeroCarousel();
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const i = Number(dot.getAttribute('data-hero-dot'));
      if (!Number.isFinite(i)) return;
      goTo(i);
      restartAutoplay();
    });
  });

  section.querySelector('[data-hero-prev]')?.addEventListener('click', () => {
    prev();
    restartAutoplay();
  });
  section.querySelector('[data-hero-next]')?.addEventListener('click', () => {
    next();
    restartAutoplay();
  });

  section.addEventListener('mouseenter', () => stopHeroCarousel());
  section.addEventListener('mouseleave', () => restartAutoplay());

  goTo(0);
  restartAutoplay();
}

export function stopHeroCarousel() {
  if (autoplayTimer != null) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}
