/**
 * Hero background banners (files in /public/images).
 * @typedef {{ id: string, src: string, alt: string, title: string, subtitle: string }} HeroBanner
 */

/** @type {HeroBanner[]} */
export const HERO_BANNERS = [
  {
    id: 'davao',
    src: '/images/banner_davaoi.webp',
    alt: 'Davao destination banner',
    title: 'Discover Davao',
    subtitle: 'Adventure, fruit markets, and Samal Island getaways.',
  },
  {
    id: 'iloilo',
    src: '/images/banner_iloiilio.webp',
    alt: 'Iloilo destination banner',
    title: 'Explore Iloilo',
    subtitle: 'Heritage streets, seafood, and warm Visayan hospitality.',
  },
  {
    id: 'kaohsiung',
    src: '/images/banner_kaoshing.webp',
    alt: 'Kaohsiung destination banner',
    title: 'Fly to Kaohsiung',
    subtitle: 'Harbour nights, night markets, and easy Taiwan connections.',
  },
];
