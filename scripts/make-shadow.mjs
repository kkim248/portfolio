// Ian's shadow for the hero: his silhouette (cut from a photo by macOS Vision person segmentation, see
// scripts/segment-person.js), turned into a soft shadow in the light's own blue-grey with a transparent background.
//   node scripts/make-shadow.mjs <mask.png> <out.png>
import sharp from 'sharp';
const [, , mask, out] = process.argv;
// crop to the person: the bounds of the clearly-solid part of the mask, so faint specks elsewhere are left out
const src = await sharp(mask).greyscale().raw().toBuffer({ resolveWithObject: true });
let x0 = src.info.width, y0 = src.info.height, x1 = 0, y1 = 0;
for (let y = 0; y < src.info.height; y++) for (let x = 0; x < src.info.width; x++) if (src.data[y * src.info.width + x] > 160) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
const trimmed = await sharp(mask).greyscale().extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).toBuffer({ resolveWithObject: true });
const { width: w, height: h } = trimmed.info;
const pad = Math.round(w * 0.25);
const alpha = await sharp(trimmed.data).extend({ top: pad, bottom: 0, left: pad, right: pad, background: '#000' }).blur(Math.max(2, w / 160)).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const W = alpha.info.width, H = alpha.info.height;
const px = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) px.set([62, 74, 112, alpha.data[i]], i * 4);   // the shade of the light: a soft slate blue
await sharp(px, { raw: { width: W, height: H, channels: 4 } }).resize({ height: 1400 }).png().toFile(out);
console.log('wrote', out);
