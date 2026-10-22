// The case study plate: the backdrop every product screen sits on. Ian's Crissy Field photo in his About slate,
// blurred until only the horizon's light and shade are left, with the paper grain.
// usage: node scripts/make-plate.mjs   (writes public/assets/plate-slate.jpg)
import sharp from 'sharp';
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const stops = [[0, hex('#5A6180')], [0.5, hex('#9CA3BC')], [1, hex('#E4E5EC')]];
const at = (t) => { for (let i = 1; i < stops.length; i++) { const [p1, c1] = stops[i]; if (t <= p1) { const [p0, c0] = stops[i - 1]; const k = (t - p0) / (p1 - p0); return c0.map((v, j) => v + (c1[j] - v) * k); } } return stops[2][1]; };
const { data, info } = await sharp('src/assets/about/src/ian-beach.webp').resize(1600, 1000, { fit: 'cover' }).greyscale().blur(38).raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) { const c = at(0.25 + 0.75 * data[i] / 255); out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; }
const grain = await sharp('public/assets/grain-tile.png').greyscale().linear(0.14, 255 * 0.86).toBuffer();
await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).composite([{ input: grain, tile: true, blend: 'multiply' }]).jpeg({ quality: 82, mozjpeg: true }).toFile('public/assets/plate-slate.jpg');
console.log('wrote public/assets/plate-slate.jpg');
