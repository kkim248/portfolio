import { reduce, clamp } from './util.js';
import { light } from './light.js';

// Case study helpers. Each piece looks for its own markup, so any case study can use any of them.
export function caseStudy() {
  const stops = [];

  // before and after, wiped by scroll; while it is pinned the leaf shadows clear over it, as on cover hover
  const compare = document.querySelector('[data-compare]');
  if (compare) {
    const frame = compare.querySelector('.compare__frame');
    let raf = 0, lastY = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (scrollY === lastY) return; lastY = scrollY;
      // hold the empty search a moment, wipe across, then hold the result
      const r = compare.getBoundingClientRect(), span = r.height - innerHeight;
      const t = clamp(-r.top / span, 0, 1), p = clamp((t - 0.2) / 0.55, 0, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      frame.style.setProperty('--p', e.toFixed(4));
      compare.classList.toggle('is-after', e > 0.5);
    };
    raf = requestAnimationFrame(loop);
    stops.push(() => cancelAnimationFrame(raf));
  }

  // product screens are held out of the leaf shadows while they cross the middle of the screen, so they stay legible
  const screens = [...document.querySelectorAll('.compare__frame, .shot, .tierlist, .annotated')];
  if (screens.length) {
    let raf = 0, lastY = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (scrollY === lastY) return; lastY = scrollY;
      if (document.querySelector('.is-held')) return;
      const lit = screens.find((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4; });
      if (lit) light.hover = lit; else if (screens.includes(light.hover)) light.hover = null;
    };
    raf = requestAnimationFrame(loop);
    stops.push(() => { cancelAnimationFrame(raf); if (screens.includes(light.hover)) light.hover = null; });
  }

  // the index: the section nearest the top of the screen is marked
  const links = [...document.querySelectorAll('.cs-index li a')];
  const targets = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  if (targets.length) {
    let raf = 0, lastY = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (scrollY === lastY) return; lastY = scrollY;
      let cur = 0;
      targets.forEach((t, i) => { if (t.getBoundingClientRect().top < innerHeight * 0.35) cur = i; });
      links.forEach((l, i) => l.classList.toggle('is-on', i === cur));
    };
    raf = requestAnimationFrame(loop);
    stops.push(() => cancelAnimationFrame(raf));
  }

  // the number counts up as it arrives
  const count = document.querySelector('[data-count]');
  if (count) {
    const el = count.querySelector('[data-to]'), to = +el.dataset.to;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      if (reduce) return;
      const t0 = performance.now();
      const tick = (now) => { const k = clamp((now - t0) / 1400, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = '0'; requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(count); stops.push(() => io.disconnect());
  }

  // scrolly: a scene pinned while you scroll. Progress through it picks the step, so every step is seen in order;
  // the progress line fills as you go. In the rider tour the zoom itself follows the scroll: it holds on each
  // feature for most of that step's stretch, then glides to the next, so it moves exactly as fast as the reader.
  document.querySelectorAll('[data-scrolly]').forEach((sc) => {
    const stage = sc.querySelector('.scrolly__stage');
    const steps = [...sc.querySelectorAll('.scrolly__step')], bars = [...sc.querySelectorAll('.scrolly__progress i')];
    const tour = sc.hasAttribute('data-tour') && sc.querySelector('.tour__view');
    const img = tour && tour.querySelector('.tour__img');
    const n = steps.length, HOLD = 0.55;
    // where the camera sits for each feature: the feature fills about half the view, centred, never past the edges
    const views = tour ? steps.map((st) => {
      const [x, y, w, h] = st.dataset.zoom.split(' ').map(Number);
      const k = Math.min(2.1, Math.max(1.3, 0.5 / Math.max(w, h * 1.4)));
      const tx = clamp(0.5 - k * (x + w / 2), 1 - k, 0), ty = clamp(0.5 - k * (y + h / 2), 1 - k, 0);
      return { k, tx, ty, x, y, w, h };
    }) : [];
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const lerp = (a, b, t) => a + (b - a) * t;
    const place = (p) => {
      const i = Math.min(n - 1, Math.floor(p)), local = p - i;
      const t = i < n - 1 ? ease(clamp((local - HOLD) / (1 - HOLD), 0, 1)) : 0;
      const A = views[i], B = views[Math.min(n - 1, i + 1)];
      const k = lerp(A.k, B.k, t), tx = lerp(A.tx, B.tx, t), ty = lerp(A.ty, B.ty, t);
      const x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t), w = lerp(A.w, B.w, t), h = lerp(A.h, B.h, t);
      img.style.transform = `translate3d(${tx * 100}%, ${ty * 100}%, 0) scale(${k})`;
      // the ring hugs the feature with a little breathing room, in the zoomed view's coordinates
      const px = 0.012, py = 0.018;
      tour.style.setProperty('--fx', `${(tx + k * x) * 100 - px * 100}%`); tour.style.setProperty('--fy', `${(ty + k * y) * 100 - py * 100}%`);
      tour.style.setProperty('--fw', `${(k * w + px * 2) * 100}%`); tour.style.setProperty('--fh', `${(k * h + py * 2) * 100}%`);
      return t > 0.5 ? i + 1 : i;
    };
    let raf = 0, lastY = -1, cur = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (scrollY === lastY && cur !== -1) return; lastY = scrollY;
      const r = sc.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight);
      const p = clamp(-r.top / span, 0, 0.9999) * n;
      bars.forEach((b, j) => b.style.setProperty('--f', clamp(p - j, 0, 1).toFixed(3)));
      const i = tour ? place(p) : Math.min(n - 1, Math.floor(p));
      if (i !== cur) {
        cur = i; stage.dataset.active = i;
        steps.forEach((st, j) => st.classList.toggle('is-on', j === i));
      }
    };
    raf = requestAnimationFrame(loop);
    stops.push(() => cancelAnimationFrame(raf));
  });

  // annotated screens: draw a fine leader line from each note in the margin to the spot it names
  document.querySelectorAll('[data-annotated]').forEach((fig) => {
    const svg = fig.querySelector('.annotated__lines');
    const draw = () => {
      if (getComputedStyle(svg).display === 'none') return;
      const box = fig.getBoundingClientRect(), shot = fig.querySelector('.annotated__shot').getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = [...fig.querySelectorAll('[data-note]')].map((note) => {
        const dot = fig.querySelector(`[data-dot="${note.dataset.note}"]`).getBoundingClientRect(), r = note.getBoundingClientRect();
        const left = note.classList.contains('annotated__note--l');
        const y0 = r.top - box.top + 12, x0 = left ? r.right - box.left + 10 : r.left - box.left - 10;
        const xe = left ? shot.left - box.left - 14 : shot.right - box.left + 14;
        const x1 = dot.left + dot.width / 2 - box.left, y1 = dot.top + dot.height / 2 - box.top;
        return `<path d="M${x0} ${y0} H ${xe} L ${x1} ${y1}" />`;
      }).join('');
    };
    const ro = new ResizeObserver(draw); ro.observe(fig);
    draw(); stops.push(() => ro.disconnect());
  });

  // the reel plays only while it is on screen
  document.querySelectorAll('video[data-autoplay]').forEach((v) => {
    if (reduce) { v.controls = true; return; }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.3 });
    io.observe(v); stops.push(() => { io.disconnect(); v.pause(); });
  });

  return () => stops.forEach((f) => f());
}
