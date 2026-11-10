import moober from '../assets/covers/moober-card.jpg';   // made by scripts/make-card-cover.mjs scripts/covers/moober.json
import buzzit from '../assets/covers/buzzit-card.jpg';   // made by scripts/make-card-cover.mjs scripts/covers/buzzit.json

export const projects = [
  {
    slug: 'moober',
    href: '/work/moober',
    title: 'Moober',
    year: '2026',
    meta: ['Product', 'Web and mobile'],
    summary: 'Search that finds the rides already passing through a rider’s town.',
    cover: moober,
    alt: 'Moober search results for Davis to Fresno on desktop, beside the same search on a phone.',
  },
  {
    slug: 'buzzit',
    href: '/work/buzzit',
    title: 'Buzzit',
    year: '2026',
    meta: ['Product', 'Mobile'],
    summary: 'A student marketplace where completed bookings went from 22% to 92%.',
    cover: buzzit,
    alt: 'Buzzit on two phones: Home with a featured maker and listings, and a gel manicure listing with Request to book.',
  },
];
