// Sunlight on paper. What lives for the whole visit starts once: the paper, smooth scroll and the light.
// Everything that belongs to a page starts on each page load and is stopped before the next page swaps in.
import { paper } from './paper.js';
import { intro, flash } from './intro.js';
import { startSmooth } from './smooth.js';
import { startLight } from './light.js';
import { words } from './words.js';
import { scene } from './scene.js';
import { page } from './page.js';
import { spills } from './spill.js';
import { caseStudy } from './case.js';
import { startTransitions } from './transition.js';

paper();
intro();
startSmooth();
startLight();
startTransitions();

let stops = [];
document.addEventListener('astro:page-load', () => {
  stops = [words(), scene(), page(), spills(), caseStudy()].filter(Boolean);
});
document.addEventListener('astro:before-swap', () => { stops.forEach((f) => f()); stops = []; });
// arriving on About from inside the site: a quick flash of the opening's light
document.addEventListener('astro:after-swap', () => { if (location.pathname.replace(/\/$/, '') === '/about') flash(); });
