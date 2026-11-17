/* ---------- paper: a seamless 512px tile of very faint mottling only; the fine film grain on top (body::after) does
   the rest, so the paper reads as smooth, minimal stock rather than fibrous ---------- */
let url = '';
const apply = () => url && document.documentElement.style.setProperty('--paper-tex', url);

// made once; re-applied after each page swap, because the swap resets <html>'s attributes
export function paper() {
  document.addEventListener('astro:after-swap', apply);
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  const wrap = (fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 120; i++) {
    const x = rnd() * S, y = rnd() * S, r = 70 + rnd() * 150, a = 0.0025 + rnd() * 0.004;
    wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(90,80,60,${a})`); gr.addColorStop(1, 'rgba(90,80,60,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
  }
  c.toBlob((b) => { url = `url(${URL.createObjectURL(b)})`; apply(); });
}
