// Work covers on a neutral ground, to sit with the greyed site (2026-11-17): the real product screens on a flat warm
// grey with the paper's faint grain and a soft fall of light from the top left; shadows are warm grey, never navy.
//   node scripts/make-neutral-cover.mjs <config.json>
// config: { "out": "src/assets/covers/x.jpg", "screens": [ { "src": "path", "x": 0.1, "y": 0.12, "w": 0.6, "radius": 0.012 } ] }
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const W = 2000, H = 1424;   // --cover-ratio
const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const GROUND = [246, 244, 238], SHADE = [44, 42, 38];

async function ground() {
  // light falls from the top left: a very slight lift there, a very slight dip toward the bottom right
  const svg = `<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.2" cy="0.1" r="1.2">
    <stop offset="0" stop-color="#fff" stop-opacity="0.08"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.025"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  const grain = await sharp('public/assets/grain-tile.png').greyscale().linear(0.1, 255 * 0.9).toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: { r: GROUND[0], g: GROUND[1], b: GROUND[2] } } })
    .composite([{ input: Buffer.from(svg) }, { input: grain, tile: true, blend: 'multiply' }]).png().toBuffer();
}

async function screen({ src, x, y, w, radius = 0 }) {
  const width = Math.round(w * W);
  const { data, info } = await sharp(src).resize(width).ensureAlpha().png().toBuffer({ resolveWithObject: true });
  let img = data;
  if (radius) { const r = Math.round(radius * W); const mask = Buffer.from(`<svg width="${info.width}" height="${info.height}"><rect width="${info.width}" height="${info.height}" rx="${r}"/></svg>`);
    img = await sharp(data).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(); }
  const pad = 140, sw = info.width + pad * 2, sh = info.height + pad * 2;
  const shape = await sharp(img).extractChannel(3).toColourspace('b-w').png().toBuffer();
  const silhouette = async (opacity, blur, dy) => {
    const alpha = await sharp(shape).extend({ top: pad + dy, bottom: pad - dy, left: pad, right: pad, background: '#000' }).blur(blur).linear(opacity, 0).png().toBuffer();
    const ink = await sharp({ create: { width: sw, height: sh, channels: 3, background: { r: SHADE[0], g: SHADE[1], b: SHADE[2] } } }).png().toBuffer();
    return sharp(ink).joinChannel(await sharp(alpha).extractChannel(0).raw().toBuffer(), { raw: { width: sw, height: sh, channels: 1 } }).png().toBuffer();
  };
  const left = Math.round(x * W), top = Math.round(y * H);
  return [
    { input: await silhouette(0.22, 44, 30), left: left - pad, top: top - pad },
    { input: await silhouette(0.12, 3, 2), left: left - pad, top: top - pad },
    { input: img, left, top },
  ];
}

const layers = [];
for (const s of cfg.screens) layers.push(...(await screen(s)));
await sharp(await ground()).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(cfg.out);
console.log('wrote', cfg.out);
