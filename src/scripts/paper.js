/* ---------- paper: a seamless 512px tile of fibres, mottling and specks ---------- */
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
    const x = rnd() * S, y = rnd() * S, r = 70 + rnd() * 150, a = 0.004 + rnd() * 0.007;
    wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(90,80,60,${a})`); gr.addColorStop(1, 'rgba(90,80,60,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
  }
  for (let i = 0; i < 900; i++) {
    const x = rnd() * S, y = rnd() * S, len = 4 + rnd() * 22, ang = rnd() * Math.PI, bend = (rnd() - 0.5) * 6;
    const a = 0.03 + rnd() * 0.06, w = 0.4 + rnd() * 0.7;
    wrap(() => {
      g.strokeStyle = `rgba(70,62,48,${a})`; g.lineWidth = w; g.beginPath();
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + bend, (y + y2) / 2 - bend, x2, y2); g.stroke();
    });
  }
  for (let i = 0; i < 160; i++) {
    const x = rnd() * S, y = rnd() * S, r = 0.3 + rnd() * 0.8;
    wrap(() => { g.fillStyle = `rgba(60,50,40,${0.12 + rnd() * 0.2})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
  }
  c.toBlob((b) => { url = `url(${URL.createObjectURL(b)})`; apply(); });
}
