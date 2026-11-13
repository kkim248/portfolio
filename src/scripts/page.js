import { reduce, fine } from './util.js';
import { light } from './light.js';

// quiet reveals, the cursor pill and hover-into-sun
export function page() {
  const els = document.querySelectorAll('.reveal');
  let io;
  if (reduce) els.forEach((e) => e.classList.add('is-in'));
  else {
    io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
    els.forEach((e) => io.observe(e));
  }

  // loose sheets: anything with data-depth drifts a little against the page as it scrolls, nearer sheets further,
  // so the layers of paper slide over one another
  const sheets = [...document.querySelectorAll('[data-depth]')]; let drift = 0;
  const float = () => { sheets.forEach((el) => { const r = el.getBoundingClientRect(); const off = r.top + r.height / 2 - innerHeight / 2 - (parseFloat(el.style.getPropertyValue('--drift')) || 0); el.style.setProperty('--drift', `${(-off * +el.dataset.depth).toFixed(1)}px`); }); drift = requestAnimationFrame(float); };
  if (!reduce && sheets.length) drift = requestAnimationFrame(float);
  const ac = new AbortController(), on = { signal: ac.signal };
  const cleanup = () => { io?.disconnect(); ac.abort(); cancelAnimationFrame(drift); };
  const cur = document.querySelector('.cursor');
  cur?.classList.remove('is-on');
  if (!fine || !cur) return cleanup;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; cur.style.transform = `translate(${x}px, ${y}px)`; raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true, ...on });
  // over a cover the light leans in; there is no pill on the cards
  document.querySelectorAll('.wcard__cover').forEach((m) => {
    m.addEventListener('pointerenter', () => { light.hover = m; }, on);
    m.addEventListener('pointerleave', () => { if (light.hover === m) light.hover = null; }, on);
  });
  return () => { cleanup(); cancelAnimationFrame(raf); cur.classList.remove('is-on'); };
}
