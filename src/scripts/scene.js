import { clamp, smooth } from './util.js';

// work scene: pinned; each project holds for a stretch of scroll, then one linked transition
export function scene() {
  const scene = document.querySelector('.scene'); if (!scene) return;
  const covers = scene.querySelectorAll('.scene__cover'), texts = scene.querySelectorAll('.scene__text'), lis = scene.querySelectorAll('.scene__list li'), bar = scene.querySelector('.scene__bar');
  const n = covers.length, HOLD = 0.55;   // within each 130svh chapter: hold for 55%, then transition
  // shown[k]: how far the change INTO project k has gone. Scrolling up, it follows the scroll exactly. Scrolling down,
  // once a change has begun it plays on by itself, so moving on to the next project takes less scrolling.
  const wide = matchMedia('(min-width: 1024px)');
  const shown = new Float32Array(n).fill(0); shown[0] = 1;
  let last = -1, lastP = 0, down = true, then = performance.now(), raf = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (!wide.matches) return;   // phones and tablets get the plain stack instead
    const dt = Math.min(64, now - then); then = now;
    const L = innerHeight * 1.3, p = clamp(-scene.getBoundingClientRect().top / L, 0, n - 1);
    if (Math.abs(p - lastP) > 0.0005) { down = p > lastP; lastP = p; }
    let moving = false;
    for (let k = 1; k < n; k++) {
      const raw = smooth(0, 1, (p - (k - 1) - HOLD) / (1 - HOLD));
      let s = shown[k];
      if (down && raw > 0.04) s = Math.max(raw, s + (1 - s) * (1 - Math.exp(-dt / 160)));
      else s += (raw - s) * (down ? 1 : 1 - Math.exp(-dt / 70));
      if (Math.abs(s - shown[k]) > 0.0005) moving = true;
      shown[k] = s > 0.999 ? 1 : s < 0.001 ? 0 : s;
    }
    if (!moving && Math.abs(p - last) < 0.0005) return; last = p;
    for (let k = 0; k < n; k++) {
      // t: how far the change into project k has gone; tOut: how far project k has been covered by the next one
      const t = shown[k], tOut = k === n - 1 ? 0 : shown[k + 1];
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
    // the next project becomes active halfway through its change
    let active = 0; for (let k = 1; k < n; k++) if (shown[k] >= 0.5) active = k;
    lis.forEach((l, j) => l.classList.toggle('is-on', j === active));
    bar.style.setProperty('--p', (p + 1) / n);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
