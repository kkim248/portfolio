// Page transition: the cover travels between the homepage and its case study. Exactly one element on each side
// carries the name "cover": the case study's cover has it in its markup; on the homepage we name the visible cover
// of the project being opened (or returned from) just before the browser takes its snapshot.
import { light } from './light.js';

const slugOf = (url) => url.pathname.match(/^\/work\/([^/]+)/)?.[1];
const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
const homeCover = (doc, slug) => doc.querySelector(`.wcard__cover[data-slug="${slug}"]`);

let flight = null;

export function startTransitions() {
  // leaving: name the old page's cover (runs before the old snapshot is taken)
  document.addEventListener('astro:before-preparation', (e) => {
    // the light carries through the page change: full when going home; otherwise a soft pass of leaf light while the
    // pages cross, which fades away slowly once the new page has arrived
    light.next = e.to.pathname.replace(/\/$/, '') === '' ? 'home' : 'pass';
    document.querySelectorAll('.wcard__cover').forEach((c) => (c.style.viewTransitionName = ''));
    const slug = slugOf(e.to);
    const c = slug && homeCover(document, slug);
    if (c && onScreen(c)) c.style.viewTransitionName = 'cover';
    // remember where the travelling cover starts, so the light can follow it
    const from = document.querySelector('.cs-cover') || (c && onScreen(c) ? c : null);
    flight = from ? from.getBoundingClientRect() : null;
  });
  // arriving: name the new page's cover
  document.addEventListener('astro:before-swap', (e) => {
    // arriving from another page: the transition is the entrance, so the new page doesn't wait to rise in again
    e.newDocument.documentElement.setAttribute('data-nav', '');
    // the pass of light lasts until the pages have finished crossing, then the new page's own level takes over
    const settle = () => { light.next = null; };
    if (e.viewTransition) e.viewTransition.finished.then(settle, settle); else settle();
    setTimeout(settle, 1500);
    const slug = slugOf(e.from);
    if (!slug || slugOf(e.to)) return;
    const c = homeCover(e.newDocument, slug);
    if (c) c.style.viewTransitionName = 'cover';
  });
  // landed: the light follows the cover from where it started to its new element
  document.addEventListener('astro:after-swap', () => {
    const to = document.querySelector('.cs-cover, .wcard__cover[style*="cover"]');
    light.morph = flight && to ? { from: flight, el: to, t0: performance.now() } : null;
    flight = null;
  });
}
