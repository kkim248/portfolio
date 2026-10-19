// Cut a botanical plate out of its paper: a transparent PNG in full colour, plus the same cut-out printed in the
// site's cyanotype blues. Works on plates and scans with a plain, light background.
// usage: node scripts/cutout.mjs <input> <output-base> [bottom]   (bottom: a 0-1 line below which the caption is dropped)
// Writes <output-base>-colour.png and <output-base>-cyanotype.png, trimmed to the plant.
import sharp from 'sharp';

const [, , input, base, bottomArg = '1'] = process.argv;
const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H, cut = Math.round(H * Number(bottomArg));

// the paper colour: the median of a band around the edges
const edge = [];
for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
  if (x > W * 0.06 && x < W * 0.94 && y > H * 0.04 && y < H * 0.96) continue;
  const i = (y * W + x) * 3; edge.push([data[i], data[i + 1], data[i + 2]]);
}
const med = (k) => edge.map((p) => p[k]).sort((a, b) => a - b)[edge.length >> 1];
const bg = [med(0), med(1), med(2)];

// alpha: how far each pixel is from the paper, eased so faint paper texture drops out and fine stems stay
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const alpha = new Float32Array(N);
for (let p = 0; p < N; p++) {
  if (Math.floor(p / W) >= cut) continue;
  const i = p * 3, dr = bg[0] - data[i], dg = bg[1] - data[i + 1], db = bg[2] - data[i + 2];
  const d = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
  alpha[p] = ss(6, 34, d);   // pale petals are only a few levels off the paper, so the ramp starts low
}
// lift tiny isolated specks: a pixel needs some neighbours to survive
const keep = new Float32Array(N);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const p = y * W + x; if (alpha[p] === 0) continue;
  let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (alpha[p + dy * W + dx] > 0.2) n++;
  keep[p] = n >= 3 ? alpha[p] : 0;
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ramp = [[0, hex('#14295F')], [0.32, hex('#4C6CB5')], [0.62, hex('#A3B7E0')], [1, hex('#F2EFE8')]];
const at = (t) => { for (let i = 1; i < ramp.length; i++) { const [p1, c1] = ramp[i]; if (t <= p1) { const [p0, c0] = ramp[i - 1]; const k = (t - p0) / (p1 - p0); return c0.map((v, j) => v + (c1[j] - v) * k); } } return ramp[ramp.length - 1][1]; };

const colour = Buffer.alloc(N * 4), cyan = Buffer.alloc(N * 4);
for (let p = 0; p < N; p++) {
  const a = keep[p], i = p * 3;
  // un-mix the paper from the edge pixels, so the cut-out has no pale fringe
  const c = [0, 1, 2].map((k) => a > 0.02 ? Math.min(255, Math.max(0, (data[i + k] - (1 - a) * bg[k]) / a)) : 0);
  colour[p * 4] = c[0]; colour[p * 4 + 1] = c[1]; colour[p * 4 + 2] = c[2]; colour[p * 4 + 3] = Math.round(a * 255);
  // the print: darker parts of the plant read as deeper blue; pale petals stay light
  const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255, t = Math.pow(lum, 1.15) * 0.9;
  const b = at(t); cyan[p * 4] = b[0]; cyan[p * 4 + 1] = b[1]; cyan[p * 4 + 2] = b[2]; cyan[p * 4 + 3] = Math.round(a * 255);
}
for (const [buf, name] of [[colour, 'colour'], [cyan, 'cyanotype']]) {
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(`${base}-${name}.png`);
  console.log('wrote', `${base}-${name}.png`);
}
