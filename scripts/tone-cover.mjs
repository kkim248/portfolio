// Tone a cover down toward the paper: less saturated, a little lighter and warmer, like the About photos.
//   node scripts/tone-cover.mjs <in.jpg> <out.jpg> <saturation 0-1> <paper mix 0-1>
import sharp from 'sharp';
const [, , src, out, satArg, mixArg] = process.argv;
const sat = +satArg, mix = +mixArg, PAPER = [244, 242, 236];   // --paper
// desaturate by mixing each pixel toward its own grey (keeps the hue; sharp's modulate pushed the blue toward purple)
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 3) {
  const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  for (let c = 0; c < 3; c++) data[i + c] = Math.round((y + (data[i + c] - y) * sat) * (1 - mix) + PAPER[c] * mix);
}
await sharp(data, { raw: info }).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
console.log('wrote', out);
