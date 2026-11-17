// Retones the About photos from the old slate-blue grade to the site's warm film tone: the photo's own light and
// dark (stretched a little), mapped through olive-grey shadows, a warm grey middle and cream highlights, with the
// blacks lifted like a print. Writes src/assets/about/warm-<name>.jpg next to each slate-<name>.jpg.
//   node scripts/tone-about.mjs
import sharp from 'sharp';
const names = ['beach', 'bridge', 'trail', 'group'];
// the tone: stops from shadow to highlight (0..1 -> rgb)
const stops = [[0, [55, 56, 51]], [0.45, [134, 134, 126]], [0.78, [200, 198, 190]], [1, [240, 237, 230]]];   // greyed down a little (2026-11-17)
const tone = (v) => {
  for (let i = 1; i < stops.length; i++) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i];
    if (v <= b) { const k = (v - a) / (b - a); return ca.map((c, j) => c + (cb[j] - c) * k); }
  }
  return stops.at(-1)[1];
};
for (const n of names) {
  const src = `src/assets/about/slate-${n}.jpg`;
  const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true });
  const hist = new Uint32Array(256); for (const v of data) hist[v]++;
  const pct = (q) => { let s = 0; for (let i = 0; i < 256; i++) { s += hist[i]; if (s >= q * data.length) return i; } return 255; };
  const lo = pct(0.01), hi = pct(0.995);
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < data.length; i++) {
    let v = Math.min(1, Math.max(0, (data[i] - lo) / (hi - lo)));
    v = Math.pow(v, 0.92);                                   // a touch brighter in the middle, like sun on paper
    const [r, g, b] = tone(v); out[i * 3] = r; out[i * 3 + 1] = g; out[i * 3 + 2] = b;
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 88, mozjpeg: true }).toFile(`src/assets/about/warm-${n}.jpg`);
  console.log(n, info.width, info.height, 'range', lo, hi);
}
