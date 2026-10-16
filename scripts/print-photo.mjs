// Print a photo the way the site prints things: as a cyanotype (Prussian blue shadows, paper highlights) and as a
// warm black and white on the same paper. Usage: node scripts/print-photo.mjs <input> <output-base>
// Writes <output-base>-cyanotype.jpg and <output-base>-bw.jpg.
// Optional third argument: exposure as a gamma (default 1). Above 1 prints darker, for bright photos like snow or a sunlit sky.
// Optional third argument: exposure as a gamma (default 1). Above 1 prints darker, for bright photos like snow or a sunlit sky.
import sharp from 'sharp';

const [, , input, base, g = '1'] = process.argv;
const gamma = Number(g);
if (!input || !base) { console.error('usage: node scripts/print-photo.mjs <input> <output-base>'); process.exit(1); }

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// a ramp of colour stops from shadow (0) to highlight (1)
const ramps = {
  cyanotype: [[0, hex('#14295F')], [0.32, hex('#4C6CB5')], [0.62, hex('#A3B7E0')], [1, hex('#F2EFE8')]],
  bw: [[0, hex('#1C1A17')], [1, hex('#F2EFE8')]],
};
const at = (stops, t) => {
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    if (t <= p1) { const [p0, c0] = stops[i - 1]; const k = (t - p0) / (p1 - p0); return c0.map((v, j) => v + (c1[j] - v) * k); }
  }
  return stops[stops.length - 1][1];
};

const { data, info } = await sharp(input).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
// a gentle S-curve so the print has body: deeper shadows, cleaner highlights
const curve = (t) => { const s = t * t * (3 - 2 * t); return t * 0.45 + s * 0.55; };
for (const [name, stops] of Object.entries(ramps)) {
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const c = at(stops, curve(Math.pow(data[i] / 255, gamma)));
    out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2];
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 90, mozjpeg: true }).toFile(`${base}-${name}.jpg`);
  console.log('wrote', `${base}-${name}.jpg`);
}
