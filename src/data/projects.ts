import moober from '../assets/covers/moober-cover.jpg';
import buzzit from '../assets/covers/buzzit-cover.jpg';
// import crate from '../assets/covers/crate-cover.jpg';   // made by scripts/make-crate-cover.mjs

export const projects = [
  {
    slug: 'moober',
    href: '/work/moober',
    title: 'Moober',
    year: '2026',
    meta: ['Product', 'Web and mobile'],
    summary: 'Search that finds the rides already passing through a rider’s town.',
    blurb: 'Moober is UC Davis’s student rideshare, used by more than 2,000 students. Its search only matched a driver’s final city, so riders saw nothing while rides passed straight through their town. I redesigned it to follow each driver’s whole route.',
    cover: moober,
    alt: 'Moober screens: carpool search, detour setting, mobile search and trip details.',
  },
  {
    slug: 'buzzit',
    href: '/work/buzzit',
    title: 'Buzzit',
    year: '2026',
    meta: ['Product', 'Mobile'],
    summary: 'A student marketplace where completed bookings went from 22% to 92%.',
    blurb: 'Buzzit is a marketplace where UC Davis students sell services and things to each other. In spring, about 22% of bookings were completed. I redesigned the app over the summer as its only designer, and since the relaunch about 92% are.',
    cover: buzzit,
    alt: 'Buzzit screens: the home feed with a featured maker and listings, a gel manicure listing with Message and Request to book, an ask for a desk lamp, and a reserved order.',
  },
  // Crate is off the homepage for now (Ian, 2026-11-12). To bring it back, restore this entry:
  //   {
  //     slug: 'crate',
  //     href: 'https://kkim248.github.io/Crate/',
  //     external: true, // a short side project: the card opens the live app instead of a case study
  //     title: 'Crate',
  //     year: '2026',
  //     meta: ['Side project', 'Web'],
  //     summary: 'A home for my unfinished beats, each one sorted by how far along it is.',
  //     blurb: 'A library for my unfinished FL Studio projects. It reads the files without changing them, lets me browse and listen, and sorts every beat by how far along it is, so I can decide what to finish.',
  //     cover: crate,
  //     alt: 'Crate on its soft sage and lavender: the library of beats with their stages, Post Monterey Trip open with its sessions and active time, and a recap tile reading 4 hours never heard.',
  //   },
];
