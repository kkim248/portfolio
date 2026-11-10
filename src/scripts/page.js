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

  const ac = new AbortController(), on = { signal: ac.signal };
  const cleanup = () => { io?.disconnect(); ac.abort(); };
  const cur = document.querySelector('.cursor');
  cur?.classList.remove('is-on');
  if (!fine || !cur) return cleanup;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; cur.style.transform = `translate(${x}px, ${y}px)`; raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true, ...on });
  // the pill names what a click will do: projects without a case study yet say so
  const pill = cur.querySelector('span');
  document.querySelectorAll('.wcard__cover').forEach((m) => {
    m.addEventListener('pointerenter', (e) => { pill.textContent = m.hasAttribute('data-soon') ? 'Coming soon' : 'View case study'; x = tx = e.clientX; y = ty = e.clientY; cur.style.transform = `translate(${x}px, ${y}px)`; cur.classList.add('is-on'); light.hover = m; }, on);
    m.addEventListener('pointerleave', () => { cur.classList.remove('is-on'); if (light.hover === m) light.hover = null; }, on);
  });
  return () => { cleanup(); cancelAnimationFrame(raf); cur.classList.remove('is-on'); };
}
