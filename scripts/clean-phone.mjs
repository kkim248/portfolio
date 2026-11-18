// Re-cut a phone screenshot just inside its own edge, so no trace of the background it was exported on (a thin
// teal rim on the Buzzit screens) shows: the outer few pixels go, and a fresh rounded corner is cut.
//   node scripts/clean-phone.mjs <in.png> <out.png> [inset=3] [radius=80]
import sharp from 'sharp';
const [, , src, out, insetArg = '3', radiusArg = '80'] = process.argv;
const inset = +insetArg, r = +radiusArg;
const { width: W, height: H } = await sharp(src).metadata();
const w = W - inset * 2, h = H - inset * 2;
const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r - inset}"/></svg>`);
await sharp(src).extract({ left: inset, top: inset, width: w, height: h }).ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out);
console.log('wrote', out, w, 'x', h);
