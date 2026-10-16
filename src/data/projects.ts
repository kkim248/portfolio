import moober from '../assets/covers/moober-cover.jpg';
import buzzit from '../assets/covers/buzzit-cover.jpg';

export const projects = [
  {
    slug: 'moober',
    href: '/work/moober',
    title: 'Moober',
    year: '2026',
    meta: ['Product', 'Web and mobile', '2026'],
    summary: 'A carpool board that matches riders with drivers already heading their way.',
    cover: moober,
    alt: 'Moober screens: carpool search, detour setting, mobile search and trip details.',
  },
  {
    slug: 'buzzit',
    href: undefined, // no case study yet: the cover and links show "coming soon" instead
    soon: true,
    title: 'Buzzit',
    year: '2026',
    meta: ['Product', 'Mobile', '2026'],
    summary: 'A local marketplace where UC Davis students buy, sell, book and ask each other.',
    cover: buzzit,
    alt: 'Buzzit screens: the home feed with a featured maker and listings, a gel manicure listing with Message and Request to book, an ask for a desk lamp, and a reserved order.',
  },
];
