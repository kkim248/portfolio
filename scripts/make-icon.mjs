// The tab icon: the top sprig of Anna Atkins's cyanotype of Spiraea aruncus (ca. 1851-54, public domain, the Met),
// lifted out of the plate and printed in the site's blue and paper.
// usage: node scripts/make-icon.mjs <atkins-spiraea.jpg> <outdir>
import sharp from 'sharp';
const [, , src, out] = process.argv;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ink = hex('#1F3A93'), paper = hex('#F1EEE6');
// the three-leaflet sprig at the top of the plate, traced in plate pixels (1280 x 1800), and the square around it
const leaf = [[690, 40], [750, 110], [822, 190], [832, 250], [962, 212], [958, 262], [920, 332], [882, 402], [812, 470], [762, 482], [742, 508], [658, 502], [578, 452], [512, 328], [578, 312], [636, 330], [615, 262], [618, 180], [655, 108]];
const box = { left: 460, top: 0, width: 560, height: 560 };
const S = 512, f = S / box.width;
const pts = leaf.map(([x, y]) => `${((x - box.left) * f).toFixed(1)},${((y - box.top) * f).toFixed(1)}`).join(' ');
const keep = Buffer.from(`<svg width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="#000"/><polygon points="${pts}" fill="#fff"/></svg>`);
const grey = await sharp(src).extract(box).resize(S, S).greyscale().normalise().toColourspace('srgb').png().toBuffer();
const { data } = await sharp(grey).composite([{ input: await sharp(keep).blur(1.5).png().toBuffer(), blend: 'multiply' }]).greyscale().raw().toBuffer({ resolveWithObject: true });
const px = Buffer.alloc(S * S * 3);
for (let i = 0; i < S * S; i++) {
  const t = Math.min(1, Math.max(0, (data[i] / 255 - 0.36) / 0.44));   // firm the edge so the leaf reads at 16px
  const k = t * t * (3 - 2 * t);
  for (let j = 0; j < 3; j++) px[i * 3 + j] = ink[j] + (paper[j] - ink[j]) * k;
}
const base = await sharp(px, { raw: { width: S, height: S, channels: 3 } }).png().toBuffer();
const mask = Buffer.from(`<svg width="${S}" height="${S}"><rect width="${S}" height="${S}" rx="${S * 0.22}" fill="#fff"/></svg>`);
const rounded = await sharp(base).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp(rounded).resize(64, 64).png().toFile(`${out}/favicon.png`);
await sharp(base).resize(180, 180).png().toFile(`${out}/apple-touch-icon.png`);
