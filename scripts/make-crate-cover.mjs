// The Crate cover, in the style of Ian's Moober and Buzzit covers: the product's own colour as the backdrop with its
// own motif (Crate's deep indigo, and the ring of ticks from its Listen player), and a few real pieces of its UI laid
// over it. The UI pieces are captured from the live demo at 2x (scripts/capture-crate-ui.mjs).
//   node scripts/make-crate-cover.mjs <folder of captured pieces> [out]
import sharp from 'sharp';

const [, , dir, out = 'src/assets/covers/crate-cover.jpg'] = process.argv;
const W = 2000, H = 1424;   // the site's cover ratio

// the backdrop: Crate's ink, lifting toward its wisteria at the top right, with the Listen ring's ticks, very faint
const cx = 1480, cy = 760, ticks = 120;
const ring = Array.from({ length: ticks }, (_, i) => {
  const a = (i / ticks) * Math.PI * 2, r0 = 470, r1 = i % 5 === 0 ? 540 : 515;
  return `<line x1="${cx + Math.cos(a) * r0}" y1="${cy + Math.sin(a) * r0}" x2="${cx + Math.cos(a) * r1}" y2="${cy + Math.sin(a) * r1}"/>`;
}).join('');
const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="0.78" cy="0.2" r="1.05"><stop offset="0" stop-color="#4A4985"/><stop offset="0.55" stop-color="#302F52"/><stop offset="1" stop-color="#1E1D32"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g stroke="#F3F2F7" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round">${ring}</g>
  <circle cx="${cx}" cy="${cy}" r="640" fill="none" stroke="#F3F2F7" stroke-opacity="0.07" stroke-width="2"/>
</svg>`);

// one piece of UI: scaled, its corners rounded like the app's panels, with a soft shadow in Crate's ink
async function piece(name, { x, y, w, radius = 26 }) {
  const { data, info } = await sharp(`${dir}/${name}.png`).resize(Math.round(w)).ensureAlpha().png().toBuffer({ resolveWithObject: true });
  const mask = Buffer.from(`<svg width="${info.width}" height="${info.height}"><rect width="100%" height="100%" rx="${radius}"/></svg>`);
  const img = await sharp(data).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const pad = 140;
  const shadow = await sharp(Buffer.from(`<svg width="${info.width + pad * 2}" height="${info.height + pad * 2}"><rect x="${pad}" y="${pad + 34}" width="${info.width}" height="${info.height}" rx="${radius}" fill="rgb(10,10,24)" fill-opacity="0.5"/></svg>`)).blur(44).png().toBuffer();
  return [{ input: shadow, left: Math.round(x) - pad, top: Math.round(y) - pad }, { input: img, left: Math.round(x), top: Math.round(y) }];
}

const layers = [
  ...(await piece('library', { x: 100, y: 260, w: 960 })),
  ...(await piece('detail', { x: 1000, y: 130, w: 520 })),
  ...(await piece('recap-b', { x: 1420, y: 700, w: 500 })),
];
await sharp(backdrop).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
console.log('wrote', out);
