// The opening: a sweep of sunlight and a warm flare, on every full page load (Base.astro decides before first
// paint; page-to-page navigation skips it). The animation itself is CSS; this removes the overlay when the flare
// has settled, and lets any click, key or scroll finish it straight away.
// A quicker flash of the same light, for arriving on a page from inside the site (About). It reuses the opening's
// overlay, which every page carries hidden.
export function flash() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const html = document.documentElement;
  html.setAttribute('data-intro', ''); html.classList.add('is-quick');
  intro();
}

export function intro() {
  const html = document.documentElement;
  if (!html.hasAttribute('data-intro')) return;
  const el = document.querySelector('.intro');
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  const skip = () => html.classList.add('is-skipping');
  const done = () => {
    html.removeAttribute('data-intro'); html.classList.remove('is-skipping', 'is-quick'); el?.remove();
    events.forEach((t) => removeEventListener(t, skip));
  };
  events.forEach((t) => addEventListener(t, skip, { passive: true }));
  el?.addEventListener('animationend', (e) => { if (e.animationName.startsWith('intro-flare')) done(); });
  setTimeout(done, 2500);   // never leave it up, whatever happens
}
