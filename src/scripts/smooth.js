import Lenis from 'lenis';
import { reduce, fine } from './util.js';

// smooth scroll, skipped for reduced motion. One instance for the whole visit.
export function startSmooth() {
  // phones and tablets keep their own native scrolling. Lenis only smooths the mouse wheel anyway, and on iOS it
  // fought the address bar as it slid away: the page seemed to grow and content jumped back down mid-scroll.
  if (reduce || !fine) return;
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // a new page starts at the top (or wherever the router put it); let Lenis pick up from there
  document.addEventListener('astro:after-swap', () => { lenis.scrollTo(scrollY, { immediate: true, force: true }); lenis.resize(); });
}
