// Renders each work cover flat, from the same layers the homepage draws live (src/data/covers.json), for the case
// study to open with, so the cover that travels from the homepage lands on the same picture.
//   node scripts/make-layered-cover.mjs          -> src/assets/covers/<slug>-neutral.jpg
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const W = 2000, H = 1424, M = 500;               // --cover-ratio; M: room for screens that run off the edge
const PLATE = { r: 0xEA, g: 0xE8, b: 0xE3 };     // --plate
const covers = JSON.parse(readFileSync('src/data/covers.json', 'utf8'));

async function layer({ src, x, y, w, r }) {
  const width = Math.round((w / 100) * W);
  let img = await sharp(`src/assets/${src}`).resize(width).ensureAlpha().png().toBuffer();
  const { height } = await sharp(img).metadata();
  if (r) { const rad = Math.round((r / 100) * W);
    img = await sharp(img).composite([{ input: Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${rad}"/></svg>`), blend: 'dest-in' }]).png().toBuffer(); }
  // the CSS drop shadows: a tight contact one and a soft one below
  const pad = 120, sw = width + pad * 2, sh = height + pad * 2;
  const shape = await sharp(img).extractChannel(3).toColourspace('b-w').png().toBuffer();
  const shadow = async (op, blur, dy) => {
    const a = await sharp(shape).extend({ top: pad + dy, bottom: pad - dy, left: pad, right: pad, background: '#000' }).blur(blur).linear(op, 0).png().toBuffer();
    const ink = await sharp({ create: { width: sw, height: sh, channels: 3, background: { r: 34, g: 31, b: 27 } } }).png().toBuffer();
    return sharp(ink).joinChannel(await sharp(a).extractChannel(0).raw().toBuffer(), { raw: { width: sw, height: sh, channels: 1 } }).png().toBuffer();
  };
  const left = Math.round((x / 100) * W) + M, top = Math.round((y / 100) * H) + M;
  return [
    { input: await shadow(0.07, 16, 18), left: left - pad, top: top - pad },
    { input: await shadow(0.08, 1, 2), left: left - pad, top: top - pad },
    { input: img, left, top },
  ];
}

for (const [slug, layers] of Object.entries(covers)) {
  if (slug === '_') continue;
  const parts = [];
  for (const l of layers) parts.push(...(await layer(l)));
  const big = await sharp({ create: { width: W + M * 2, height: H + M * 2, channels: 3, background: PLATE } }).composite(parts).png().toBuffer();
  await sharp(big).extract({ left: M, top: M, width: W, height: H }).jpeg({ quality: 90, mozjpeg: true }).toFile(`src/assets/covers/${slug}-neutral.jpg`);
  console.log('wrote', slug);
}
