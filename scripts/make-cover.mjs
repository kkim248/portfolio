// Case study covers, all made the same way so every project matches: one canvas size, one backdrop recipe, one
// screen treatment (radius, shadow), one scale. Usage:
//   node scripts/make-cover.mjs <config.json>
// config: { "out": "src/assets/covers/x.jpg", "backdrop": "light" | "blue",
//           "screens": [ { "src": "path", "x": 0.09, "y": 0.13, "w": 0.65 } ] }   (x, y, w as fractions of the canvas)
// The canvas matches the homepage stage and the case study hero (about 1.4 : 1), so covers drop in without layout change.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const W = 2000, H = 1424;
const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const RADIUS = 18;                       // product screens: the site's --r-s, at cover scale
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// the backdrop: paper or cyanotype blue, with the same leaf shadows the site's light casts, and the paper's grain
async function backdrop(mode) {
  const base = mode === 'blue' ? hex('#1F3A93') : hex('#ECE9E1');
  const shadeTo = mode === 'blue' ? [0.62, 0.66, 0.8] : [0.8, 0.86, 0.97];   // how deep the leaf shadows go
  const strength = mode === 'blue' ? 0.5 : 0.38;
  const { data, info } = await sharp('public/assets/plate-forest-bw.jpg').resize(W, H, { fit: 'cover' }).greyscale().blur(24).normalise().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const lit = Math.min(1, Math.max(0, (data[i] / 255 - 0.3) / 0.45));     // 1 in the sun, 0 in shade
    const k = (1 - lit) * strength;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = base[c] * (1 - k * (1 - shadeTo[c]));
  }
  // the paper's grain, very faint
  const grain = await sharp('public/assets/grain-tile.png').greyscale().linear(0.12, 255 * 0.88).toBuffer();
  return sharp(out, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: grain, tile: true, blend: 'multiply' }]).png().toBuffer();
}

// one product screen: scaled, rounded, with a soft contact shadow and a long soft shadow
async function screen({ src, x, y, w }) {
  const width = Math.round(w * W);
  const img = sharp(src, { pages: 1 }).resize(width);
  const meta = await img.clone().png().toBuffer({ resolveWithObject: true });
  const h = meta.info.height;
  const mask = Buffer.from(`<svg width="${width}" height="${h}"><rect width="${width}" height="${h}" rx="${RADIUS}" ry="${RADIUS}"/></svg>`);
  const rounded = await sharp(meta.data).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const pad = 120;
  // render the shadow shape first, then blur it in its own pass (sharp composites after every other operation)
  const shape = await sharp(Buffer.from(`<svg width="${width + pad * 2}" height="${h + pad * 2}"><rect x="${pad}" y="${pad + 30}" width="${width}" height="${h}" rx="${RADIUS}" fill="rgb(20,24,40)" fill-opacity="0.2"/></svg>`)).png().toBuffer();
  const shadow = await sharp(shape).blur(40).png().toBuffer();
  const contact = await sharp(Buffer.from(`<svg width="${width + pad * 2}" height="${h + pad * 2}"><rect x="${pad}" y="${pad + 2}" width="${width}" height="${h}" rx="${RADIUS}" fill="rgb(20,24,40)" fill-opacity="0.12"/></svg>`)).blur(2).png().toBuffer();
  return [
    { input: shadow, left: Math.round(x * W) - pad, top: Math.round(y * H) - pad },
    { input: contact, left: Math.round(x * W) - pad, top: Math.round(y * H) - pad },
    { input: rounded, left: Math.round(x * W), top: Math.round(y * H) },
  ];
}

const layers = [];
for (const s of cfg.screens) layers.push(...(await screen(s)));
await sharp(await backdrop(cfg.backdrop)).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(cfg.out);
console.log('wrote', cfg.out);
