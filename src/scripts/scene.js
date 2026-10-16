import { clamp, smooth } from './util.js';

// work scene: pinned; each project holds for a stretch of scroll, then one linked transition
export function scene() {
  const scene = document.querySelector('.scene'); if (!scene) return;
  const covers = scene.querySelectorAll('.scene__cover'), texts = scene.querySelectorAll('.scene__text'), lis = scene.querySelectorAll('.scene__list li'), bar = scene.querySelector('.scene__bar');
  const n = covers.length, HOLD = 0.55;   // within each 130svh chapter: hold for 55%, then transition
  let last = -1, raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (getComputedStyle(scene).display === 'none') return;
    const L = innerHeight * 1.3, p = clamp(-scene.getBoundingClientRect().top / L, 0, n - 1);
    if (Math.abs(p - last) < 0.0005) return; last = p;
    for (let k = 0; k < n; k++) {
      // t: how far the transition INTO project k has progressed (0 before, 1 after)
      const t = k === 0 ? 1 : smooth(0, 1, (p - (k - 1) - HOLD) / (1 - HOLD));
      // tOut: how far project k has been covered by the next one
      const tOut = k === n - 1 ? 0 : smooth(0, 1, (p - k - HOLD) / (1 - HOLD));
      const c = covers[k], img = c.firstElementChild;
      c.style.zIndex = k;
      // stack: the next project rises from below the screen as a whole card; the covered one sinks back and dims
      // always start at least a full screen below, even before the scene is pinned, so a waiting card never shows
      const below = Math.max(innerHeight, innerHeight - c.parentElement.getBoundingClientRect().top) + 24;
      const e = 1 - Math.pow(1 - t, 3);
      c.style.transform = `translateY(${(1 - e) * below}px) scale(${1 - tOut * 0.05})`;
      c.style.boxShadow = k > 0 && t < 1 ? `0 -24px 60px rgb(20 20 20 / ${0.12 * Math.sin(t * Math.PI)})` : 'none';
      img.style.filter = `brightness(${1 - tOut * 0.22})`;
      // text hands over in sequence: the old line leaves in the first half, the new one arrives in the second
      const tin = smooth(0.5, 1, t), tout = smooth(0, 0.5, tOut), vis = Math.min(tin, 1 - tout);
      texts[k].style.opacity = vis;
      texts[k].style.transform = `translateY(${(1 - tin) * 24 - tout * 24}px)`;
      texts[k].style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
      texts[k].inert = vis < 0.5;
    }
    // the next project becomes active halfway through its transition
    const active = clamp(Math.floor(p + 1 - HOLD - (1 - HOLD) / 2), 0, n - 1);
    lis.forEach((l, j) => l.classList.toggle('is-on', j === active));
    bar.style.setProperty('--p', (p + 1) / n);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
