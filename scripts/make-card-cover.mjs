// Homepage and case study covers, all made the same way: the paper-light plate (public/assets/plate-paper.jpg),
// real product screens set on it with soft shadows that follow each screen's own shape. Usage:
//   node scripts/make-card-cover.mjs <config.json>
// config: { "out": "src/assets/covers/x.jpg",
//           "screens": [ { "src": "path", "x": 0.1, "y": 0.12, "w": 0.6, "radius": 0.012 } ] }
// x, y, w are fractions of the canvas; radius rounds a screen with square corners (phones already have their own).
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const W = 2000, H = 1424;   // the cover ratio the site uses everywhere (--cover-ratio)
const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const backdrop = await sharp('public/assets/plate-paper.jpg').resize(W, H, { fit: 'cover' }).png().toBuffer();

async function screen({ src, x, y, w, radius = 0 }) {
  const width = Math.round(w * W);
  const { data, info } = await sharp(src).resize(width).ensureAlpha().png().toBuffer({ resolveWithObject: true });
  let img = data;
  if (radius) { const r = Math.round(radius * W); const mask = Buffer.from(`<svg width="${info.width}" height="${info.height}"><rect width="${info.width}" height="${info.height}" rx="${r}"/></svg>`);
    img = await sharp(data).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(); }
  // the shadow is the screen's own silhouette, darkened and blurred: a soft long shadow and a tight contact one
  const pad = 140, sw = info.width + pad * 2, sh = info.height + pad * 2;
  const shape = await sharp(img).extractChannel(3).toColourspace('b-w').png().toBuffer();
  const silhouette = async (opacity, blur, dy) => {
    const alpha = await sharp(shape).extend({ top: pad + dy, bottom: pad - dy, left: pad, right: pad, background: '#000' }).blur(blur).linear(opacity, 0).png().toBuffer();
    const ink = await sharp({ create: { width: sw, height: sh, channels: 3, background: { r: 24, g: 30, b: 52 } } }).png().toBuffer();
    return sharp(ink).joinChannel(await sharp(alpha).extractChannel(0).raw().toBuffer(), { raw: { width: sw, height: sh, channels: 1 } }).png().toBuffer();
  };
  const left = Math.round(x * W), top = Math.round(y * H);
  return [
    { input: await silhouette(0.5, 34, 30), left: left - pad, top: top - pad },
    { input: await silhouette(0.22, 3, 3), left: left - pad, top: top - pad },
    { input: img, left, top },
  ];
}

const layers = [];
for (const s of cfg.screens) layers.push(...(await screen(s)));
await sharp(backdrop).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(cfg.out);
console.log('wrote', cfg.out);
