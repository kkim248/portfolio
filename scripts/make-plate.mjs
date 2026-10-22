// The case study plate: the backdrop every product screen sits on, like a print laid in the site's dappled light.
// Paper, soft blue canopy shadow broken by patches and spots of sun (procedural, fixed seed), and the paper grain.
// usage: node scripts/make-plate.mjs   (writes public/assets/plate-light.jpg)
import sharp from 'sharp';
const W = 1600, H = 1000;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const G = 64, grid = Array.from({ length: G * G }, rnd);
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = (t) => t * t * (3 - 2 * t);
  const g = (i, j) => grid[((j % G + G) % G) * G + ((i % G + G) % G)];
  const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1), u = s(xf), v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y) => { let t = 0, a = 0.5; for (let o = 0; o < 4; o++) { t += a * vn(x, y); x *= 2.03; y *= 2.03; a *= 0.5; } return t; };
// bokeh discs: round spots of sun, flat with a soft rim, like light through gaps in the leaves
const spots = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, r: 14 + rnd() * 36, a: 0.35 + rnd() * 0.55 }));
const sun = [0.95, 0.94, 0.915], shade = [0.80, 0.83, 0.885];
const out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const n = fbm(x / 180 + 3, y / 180 + 5);
  let lit = 0.35 * Math.min(1, Math.max(0, (n - 0.45) / 0.15));                 // canopy: broad patches of sun and shade
  for (const s of spots) { const d = Math.hypot(x - s.x, y - s.y) / s.r; if (d < 1.2) lit = Math.max(lit, s.a * (1 - Math.min(1, Math.max(0, (d - 0.8) / 0.25)))); }
  const i = (y * W + x) * 3;
  for (let c = 0; c < 3; c++) out[i + c] = 255 * (shade[c] + (sun[c] - shade[c]) * lit);
}
const grain = await sharp('public/assets/grain-tile.png').greyscale().linear(0.14, 255 * 0.86).toBuffer();
const base = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).blur(4).png().toBuffer();
await sharp(base).composite([{ input: grain, tile: true, blend: 'multiply' }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/assets/plate-light.jpg');
console.log('wrote public/assets/plate-light.jpg');
