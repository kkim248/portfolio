import { reduce } from './util.js';

// split big type into masked words that rise in when they come into view
export function words() {
  const els = document.querySelectorAll('.words:not(.is-split)');
  els.forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 1) { walk(c); return; }
        if (c.nodeType !== 3 || !c.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--wi', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        c.replaceWith(frag);
      });
    };
    walk(el); el.classList.add('is-split');
  });
  if (reduce) { els.forEach((e) => e.classList.add('is-in')); return; }
  const write = (el) => el.classList.add('is-in');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { write(e.target); io.unobserve(e.target); } }), { threshold: 0.3 });
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}
