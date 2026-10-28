// The case study plate: paper light. A quiet gradient from the site's paper to a pale blue, with a very faint
// watercolor wash (the same family as the About and footer spills) and the paper's grain.
//   node scripts/make-plate-paper.mjs [wash strength, 0 to 1, default 0.6] [out]
import sharp from 'sharp';
const W = 1200, H = 800;                     // painted at half size, then enlarged; the wash is soft anyway
const strength = Number(process.argv[2] ?? 0.6);
const out = process.argv[3] ?? 'public/assets/plate-paper.jpg';

// value noise and fbm, seeded, so the wash is the same every build
const rnd = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + 7.3) * 43758.5453; return s - Math.floor(s); };
const sm = (t) => t * t * (3 - 2 * t);
const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
  const a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
const fbm = (x, y) => { let v = 0, amp = 0.5; for (let i = 0; i < 5; i++) { v += amp * noise(x, y); x *= 2.03; y *= 2.03; amp *= 0.5; } return v; };
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

const paper = [244, 242, 236], pale = [220, 224, 235], deep = [185, 193, 217], ink = [96, 118, 182];
// two blooms, each spreading from just off a corner; [x, y, reach]
const blooms = [[-0.02, 1.0, 0.62], [1.02, 0.02, 0.5]];
const px = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const u = x / W, v = y / H;
  // the light: paper in the top left, settling into pale blue toward the bottom right
  const d = Math.hypot((u - 0.28) * 1.1, v - 0.18) / 1.15;
  const t1 = step(0, 0.55, d), t2 = step(0.55, 1, d);
  let c = paper.map((p, i) => mix(mix(p, pale[i], t1), deep[i], t2 * 0.9));
  // the wash: how far into a bloom this point is, its edge pushed around by noise
  let pig = 0, rim = 0;
  for (const [bx, by, r] of blooms) {
    const n = fbm(u * 3.2 + bx * 9, v * 3.2 + by * 9);
    const dist = Math.hypot((u - bx) * 1.5, v - by) / r + (n - 0.5) * 0.55;
    const inside = 1 - step(0.78, 1.0, dist);
    pig = Math.max(pig, inside * (0.45 + 0.55 * fbm(u * 7 + 3, v * 7 + bx)));   // uneven pigment inside
    rim = Math.max(rim, Math.exp(-((dist - 0.93) ** 2) / 0.0016));            // a thin darker line where it dried
  }
  const k = strength * (pig * 0.16 + rim * 0.12);
  c = c.map((p, i) => mix(p, ink[i], k));
  px.set(c.map(Math.round), (y * W + x) * 3);
}
const grain = await sharp('public/assets/grain-tile.png').greyscale().linear(0.12, 255 * 0.88).toBuffer();
const base = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).blur(2.5).resize(W * 2, H * 2).png().toBuffer();
await sharp(base).composite([{ input: grain, tile: true, blend: 'multiply' }]).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log('wrote', out);
