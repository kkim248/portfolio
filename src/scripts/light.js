import { reduce, fine, smooth, glProgram, texture, VS } from './util.js';

/* ---------- one fixed palette: late morning sun and real shadow, grey with a distant sage in it (like leaves seen
   through mist), plus a faint haze of ochre, terracotta rose and sage on the hero only; every other page is neutral paper ---------- */
const PALETTE = { sun: [1.0, 0.982, 0.945], shade: [0.745, 0.762, 0.705], warm: [1.0, 0.965, 0.915], cool: [0.95, 0.965, 0.935], rose: [1.0, 0.955, 0.94], strength: 1.0 };

/* ---------- the light: two fixed WebGL layers over the whole page ----------
   shade: leaf shadows and the colour wash, multiplied onto the page
   glint: points of sun shimmering through the leaves and a soft bloom, screened onto the page
   Both share one leaf field, so glints always sit in the gaps between the shadows. */
export const light = { hover: null, morph: null };
// the cover's flight between pages (set by transition.js): where it started and the element it lands on.
// Its box is eased the same way as ::view-transition-group(cover), so the light follows it the whole way.
const MORPH_MS = 900;
const bez = (x1, y1, x2, y2) => (t) => {
  let u = t;
  for (let i = 0; i < 8; i++) { const x = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - t; const d = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u; if (Math.abs(d) < 1e-6) break; u -= x / d; }
  return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
};
const morphEase = bez(0.6, 0, 0.15, 1);
const GLSL_COMMON = `#version 300 es
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uRes; uniform vec2 uTexSize; uniform float uTime; uniform vec2 uPointer;
  uniform vec3 uSun; uniform vec3 uShade; uniform vec3 uWarm; uniform vec3 uCool; uniform vec3 uRose; uniform float uStrength;
  uniform float uFade; uniform vec4 uClear; uniform float uClearAmt; uniform sampler2D uFlower;
  uniform vec4 uImgs[16]; uniform int uImgN;
  out vec4 o;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
  vec2 screenP() { vec2 p = gl_FragCoord.xy / uRes; p.y = 1.0 - p.y; return p; }
  // now and then a breeze picks up for a few seconds, then settles
  float gust(float t) { return smoothstep(0.45, 0.9, noise(vec2(t * 0.12, 1.3))); }
  // a thin cloud crossing the sun now and then: the light dims a little and every shadow goes soft, then the sun
  // comes back and they sharpen again (1 = clear sun)
  float sunny(float t) { return 1.0 - 0.3 * smoothstep(0.62, 0.92, noise(vec2(t * 0.035, 8.3))); }
  // the wind: a light constant breeze, the gusts on top, and a little restless turbulence
  float wind(float t) { return 0.35 + 0.65 * gust(t) + 0.3 * (noise(vec2(t * 0.45, 4.1)) - 0.5); }
  // where on the canopy plate this pixel's light comes from, for one layer of leaves. k: how close the layer is
  // (larger = nearer, so larger leaves). Like real shadows, a layer moves as one piece: the branch it hangs from is
  // pushed downwind and swings back around a pivot out of frame, slowly, at its own rate (f) and a beat after the
  // layers behind it (lag). Nothing warps; the far canopy is almost still, nearer layers swing further (amp).
  vec2 canopyUV(vec2 p, float t, float k, vec2 c, float a, float amp, float lag, float f) {
    float sa = uRes.x / uRes.y, ta = uTexSize.x / uTexSize.y;
    vec2 s = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
    // on wide screens the canopy is brought closer, so its shadows are as large and soft as they are on a phone
    float near = mix(1.0, 1.55, smoothstep(0.75, 1.5, sa));
    vec2 q = (p - vec2(0.7, -0.35)) * s;                     // measured from the pivot, above the top of the page
    float wd = wind(t - lag);
    float ang = (wd * 0.6 + sin(t * f) * (0.25 + 0.75 * wd) + sin(t * f * 0.43 + 2.0) * 0.3) * 0.022 * amp;
    q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
    vec2 uv = (q + vec2(0.7, -0.35) * s - 0.5 * s) / (1.35 * near * k);
    uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv + c;
    uv += uPointer * 0.006 * k;   // the cursor nudges the light only a little, and slowly
    uv += vec2(sin(t * 0.021), cos(t * 0.017)) * 0.008 / k;        // the sun itself creeps, very slowly
    return uv;
  }
  // the far canopy: the softest, palest shadows
  vec2 leafUV(vec2 p, float t) { return canopyUV(p, t, 1.0, vec2(0.52, 0.46), -0.12, 0.3, 0.0, 0.45); }
  // nearer leaves from another part of the same trees: larger, sharper, darker, and they move more
  vec2 midUV(vec2 p, float t) { return canopyUV(p, t, 1.75, vec2(0.3, 0.64), 0.55, 1.0, 0.7, 0.95); }
  // where the light is strongest on screen: top right, plus one patch wandering over the statement
  float lightMask(vec2 p, float t) {
    float base = smoothstep(0.15, 0.95, p.x * 0.85 + (1.0 - p.y) * 0.45);
    vec2 lc = vec2(0.1 + 0.5 * (0.5 + 0.5 * sin(t * 0.055)), 0.76 + 0.06 * sin(t * 0.04));
    vec2 d = (p - lc) * vec2(1.0, 1.9);
    float cloud = 0.25 + 0.75 * sunny(t);
    return clamp(max(base, exp(-dot(d, d) / 0.05) * 0.85) * cloud * uStrength * uFade, 0.0, 1.0);
  }
  // motes: soft, out-of-focus specks drifting up through the light, nearer ones larger and faster
  float motes(vec2 p, float t) {
    float sa = uRes.x / uRes.y, m = 0.0;
    for (int i = 0; i < 28; i++) {
      float fi = float(i), depth = hash(vec2(fi, 7.0));
      float speed = mix(0.4, 1.3, depth), r = mix(0.009, 0.03, depth);
      vec2 c = vec2(hash(vec2(fi, 1.0)), hash(vec2(fi, 2.0)));
      c += vec2(sin(t * 0.05 * speed + fi) * 0.05, -t * 0.0045 * speed) + uPointer * 0.01 * depth;
      c = fract(c);
      float dist = length((p - c) * vec2(sa, 1.0));
      float disk = smoothstep(r, r * 0.5, dist) * (0.7 + 0.3 * smoothstep(r * 0.45, r * 0.9, dist));   // soft disk, faint bright rim
      m += disk * (0.6 + 0.4 * sin(t * (0.6 + depth) + fi * 3.1)) * mix(0.45, 0.9, depth);
    }
    return clamp(m, 0.0, 1.0);
  }
  vec2 rot(vec2 v, float a) { return vec2(cos(a) * v.x - sin(a) * v.y, sin(a) * v.x + cos(a) * v.y); }
  // a flowering branch (Redouté's rose) hangs in at the window, top right. It is closer than the trees, so its
  // shadow is a little sharper, it sways more, and it shifts more with the cursor.
  float flowerShadow(vec2 p, float t, float lod) {
    float sa = uRes.x / uRes.y;
    vec2 local = vec2(p.x * sa, p.y) - vec2(sa * 1.02, -0.12) + uPointer * 0.022;
    // the nearest branch: pushed by the wind a beat after the trees, springing back and trembling a little
    float wd = wind(t - 1.3);
    float sway = wd * 0.04 + sin(t * 1.5) * (0.008 + 0.027 * wd) + sin(t * 0.62 + 1.3) * 0.01;   // a pendulum: about four seconds a swing
    vec2 iuv = vec2(0.47, 0.98) + rot(local, -3.785 + sway) / vec2(1.05 * 0.776, 1.05);   // stem at the anchor, blooms reaching down and left
    if (iuv.x < 0.0 || iuv.y < 0.0 || iuv.x > 1.0 || iuv.y > 1.0) return 0.0;
    vec3 c = textureLod(uFlower, mix(vec2(0.09, 0.08), vec2(0.88, 0.86), iuv), lod).rgb;
    float s = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    // grain: the edge is speckled and the shadow itself a little uneven, like the rest of the light on the paper
    float grain = noise(gl_FragCoord.xy * 0.85) - 0.5;
    float v = (0.86 - lum(c)) * 1.6 + s * 1.3 + grain * 0.14;
    return smoothstep(0.08, 0.34, v) * (0.88 + 0.24 * noise(gl_FragCoord.xy * 0.45));
  }
  // every image on screen: the light falls on photos, screens and covers at about two thirds, so they stay readable
  // but still sit in the same light as the paper
  float imgMask(vec2 p) {
    float m = 0.0, e = 0.004;
    for (int i = 0; i < 16; i++) {
      if (i >= uImgN) break;
      vec4 r = uImgs[i];
      m = max(m, smoothstep(r.x - e, r.x + e, p.x) * (1.0 - smoothstep(r.z - e, r.z + e, p.x)) * smoothstep(r.y - e, r.y + e, p.y) * (1.0 - smoothstep(r.w - e, r.w + e, p.y)));
    }
    return m;
  }
  float hoverMask(vec2 p) {
    float sa = uRes.x / uRes.y, fx = 0.025, fy = 0.025 * sa;
    return smoothstep(uClear.x - fx, uClear.x + fx, p.x) * (1.0 - smoothstep(uClear.z - fx, uClear.z + fx, p.x))
         * smoothstep(uClear.y - fy, uClear.y + fy, p.y) * (1.0 - smoothstep(uClear.w - fy, uClear.w + fy, p.y)) * uClearAmt;
  }`;

const FS_SHADE = GLSL_COMMON + `
  void main() {
    vec2 p = screenP(); float t = uTime;
    vec2 uv = leafUV(p, t), um = midUV(p, t);
    // three depths of shadow, like light falling through a real tree: the far canopy soft and pale, nearer leaves
    // sharper and darker, and the nearest branch sharpest of all. Where they overlap the shade deepens.
    float haze = (1.0 - sunny(t)) * 4.0;   // under a cloud, the shadows lose their edges
    float lodF = mix(3.4, 5.0, noise(uv * 2.0 + 11.0)) + haze;
    float litF = smoothstep(0.34, 0.64, lum(textureLod(uTex, uv, max(lodF, 0.8)).rgb));
    float lodM = mix(1.7, 2.7, noise(um * 2.0 + 3.0)) + haze;
    // only the densest clusters of the nearer leaves cast a shadow, mostly toward the top where the branches reach in
    float reach = smoothstep(1.05, 0.35, p.y + (1.0 - p.x) * 0.35);
    float shM = (1.0 - smoothstep(0.1, 0.34, lum(textureLod(uTex, um, max(lodM, 0.8)).rgb))) * reach;
    float lit = mix(1.0, litF, 0.92) * (1.0 - shM * 0.75);
    lit *= 1.0 - flowerShadow(p, t, 1.9 + haze * 0.8) * 0.92;
    float inside = hoverMask(p) * clamp(uFade * 4.0, 0.0, 1.0);   // no light, no hover glow
    lit = mix(lit, 1.0, inside);
    vec3 c = mix(uShade, uSun, lit);
    float tooth = noise(gl_FragCoord.xy * 0.9) * 0.6 + noise(gl_FragCoord.xy * 2.1) * 0.4;
    c *= 1.0 - 0.05 * lit * (tooth - 0.5);
    float k = max(lightMask(p, t), inside * 0.9);
    vec3 leaf = mix(vec3(1.0), c, k);
    float sa = uRes.x / uRes.y; vec2 ap = vec2(p.x * sa, p.y);
    vec2 g1 = vec2((0.86 + 0.06 * sin(t * 0.05)) * sa, 0.1 + 0.08 * cos(t * 0.04));
    vec2 g2 = vec2((0.1 + 0.08 * cos(t * 0.035)) * sa, 0.98 + 0.05 * sin(t * 0.03));
    vec2 g3 = vec2((0.22 + 0.1 * sin(t * 0.03)) * sa, 0.28 + 0.06 * cos(t * 0.045));
    // three soft fields of colour, stretched sideways like a long exposure: ochre high on the right, sage low on the
    // left, a terracotta rose drifting between them
    vec2 sq = vec2(0.45, 1.6);
    float a1 = exp(-dot((ap - g1) * sq, (ap - g1) * sq) / 0.32), a2 = exp(-dot((ap - g2) * sq, (ap - g2) * sq) / 0.4), a3 = exp(-dot((ap - g3) * sq, (ap - g3) * sq) / 0.22);
    vec3 tint = mix(mix(mix(vec3(1.0), uWarm, a1), uCool, a2 * (1.0 - 0.5 * a1)), uRose, a3 * 0.85 * (1.0 - 0.6 * a1));
    vec3 col = leaf * mix(vec3(1.0), tint, clamp(uFade * 1.2, 0.0, 1.0));   // the colour wash lives with the light: on the hero only
    col = mix(col, vec3(1.0, 0.995, 0.975), motes(p, t) * clamp(lightMask(p, t) * 1.6, 0.0, 1.0));
    o = vec4(mix(col, vec3(1.0), imgMask(p) * 0.35), 1.0);
  }`;

const FS_GLINT = GLSL_COMMON + `
  void main() {
    vec2 p = screenP(); float t = uTime;
    vec2 uv = leafUV(p, t);
    // the brightest gaps in the canopy, seen nearly in focus
    float gap = smoothstep(0.58, 0.82, lum(textureLod(uTex, uv, 1.4).rgb)) * smoothstep(0.4, 0.75, lum(textureLod(uTex, midUV(p, t), 2.2).rgb)) * (1.0 - flowerShadow(p, t, 2.6));
    // tiny points of sun that twinkle slowly, each on its own rhythm
    vec2 cell = uv * 85.0 + vec2(t * 0.35, -t * 0.22);
    float sp = smoothstep(0.74, 0.95, noise(cell));
    float tw = 0.5 + 0.5 * sin(t * 1.4 + hash(floor(cell)) * 6.283);
    float glint = sp * tw * gap * (1.2 + 0.9 * gust(t));
    // and a soft bloom where the light pours through
    float bloom = smoothstep(0.6, 0.92, lum(textureLod(uTex, uv, 5.2).rgb));

    float k = lightMask(p, t) * (1.0 - hoverMask(p)) * (1.0 - imgMask(p) * 0.35);
    o = vec4(vec3(1.0, 0.98, 0.94) * (glint * 0.8 + bloom * 0.12) * k, 1.0);
  }`;

// started once; the canvases persist across page changes, so the light carries on through navigation
export function startLight() {
  const canvases = [...document.querySelectorAll('.light-gl')];
  const layers = [];
  // phones and tablets: the glints are left out and the shade draws at a lower resolution and 30fps, so scrolling
  // stays smooth; the light moves slowly enough that nobody can tell
  const touch = !fine;
  for (const canvas of canvases) {
    const glint = canvas.dataset.layer === 'glint';
    if (glint && touch) { canvas.remove(); continue; }
    const p = glProgram(canvas, VS, glint ? FS_GLINT : FS_SHADE);
    if (!p) return;
    layers.push({ canvas, ...p, scale: glint ? 0.75 : touch ? 0.4 : 0.5 });
  }
  // the light covers the LARGE viewport (100lvh) from the top, so it never resizes or stretches while a phone's
  // address bar slides away; boxes are measured against that height
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  let VH = probe.offsetHeight || innerHeight;

  // the first screen and the closing note set how strong the light is; looked up again on every page
  // pages meant for reading mark data-light on their main: "quiet" for case studies, "soft" for About
  // the light lives on the homepage's first screen only: it fades out as the hero scrolls away, and pages marked
  // data-light (About, case studies) are blank paper, so whatever sits on them carries its own look
  const LEVELS = { home: [1, 0], quiet: [0, 0], soft: [0, 0] };
  let first = null, foot = null, level = LEVELS.home;
  let pics = [];
  const PICS = '.wcard__cover, .cs-cover, .ab__photo, .gallery figure > img, .gallery .clip, .shot, .plate, .compare__frame, .phones img';
  const find = () => { first = document.querySelector('.first'); foot = document.querySelector('.foot'); level = LEVELS[document.querySelector('[data-light]')?.dataset.light] || LEVELS.home; light.hover = null; pics = [...document.querySelectorAll(PICS)]; };
  find(); document.addEventListener('astro:page-load', find); document.addEventListener('astro:after-swap', find);
  let px = 0, py = 0, tx = 0, ty = 0, fade = 1, clearAmt = 0, rect = [0, 0, 0, 0];
  const boxes = new Float32Array(64);
  const t0 = performance.now() - 8000;

  let lastDraw = 0;
  function draw(now) {
    if (touch && now - lastDraw < 32) return; lastDraw = now;
    px += (tx - px) * 0.015; py += (ty - py) * 0.015;   // eases after the cursor over a couple of seconds
    // the light is full on the first screen, softer down the page, and fades out at the closing note
    let f = level[0] + (level[1] - level[0]) * smooth(0, (first ? first.offsetHeight : innerHeight) * 0.9, scrollY);
    if (foot) f *= 1 - 0.85 * smooth(0, innerHeight * 0.8, innerHeight - foot.getBoundingClientRect().top);
    fade += (f - fade) * 0.1;
    const h = light.hover;
    if (h && !h.isConnected) light.hover = null;
    else if (h) { const r = h.getBoundingClientRect(); rect = [r.left / innerWidth, r.top / VH, r.right / innerWidth, r.bottom / VH]; }
    clearAmt += ((h ? 1 : 0) - clearAmt) * 0.08;
    // the images on screen right now, as fractions of the viewport (at most 16)
    let n = 0;
    const m = light.morph;
    if (m && now - m.t0 > MORPH_MS) light.morph = null;
    else if (m) {
      const e = morphEase(Math.max(0, now - m.t0) / MORPH_MS), b = m.el.getBoundingClientRect();
      const r = [m.from.left + (b.left - m.from.left) * e, m.from.top + (b.top - m.from.top) * e, m.from.right + (b.right - m.from.right) * e, m.from.bottom + (b.bottom - m.from.bottom) * e];
      boxes.set([r[0] / innerWidth, r[1] / VH, r[2] / innerWidth, r[3] / VH], 0); n = 1;
    }
    for (const el of pics) {
      if (m && el === m.el) continue;
      if (n >= 16) break;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
      boxes.set([r.left / innerWidth, r.top / VH, r.right / innerWidth, r.bottom / VH], n * 4); n++;
    }
    for (const { gl, U } of layers) {
      gl.uniform1f(U('uTime'), reduce ? 20 : (now - t0) / 1000);
      gl.uniform2f(U('uPointer'), px, py);
      gl.uniform1f(U('uFade'), fade);
      gl.uniform4f(U('uClear'), rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(U('uClearAmt'), clearAmt);
      gl.uniform4fv(U('uImgs'), boxes); gl.uniform1i(U('uImgN'), n);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  const img = new Image(); img.src = '/assets/plate-forest-bw.jpg';
  const flower = new Image(); flower.src = '/assets/botanicals/redoute-rose.jpg';
  Promise.all([img.decode(), flower.decode()]).then(() => {
    for (const { canvas, gl, U, scale } of layers) {
      texture(gl, 1, flower, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U('uFlower'), 1);
      texture(gl, 0, img, gl.MIRRORED_REPEAT);
      gl.uniform1i(U('uTex'), 0);
      gl.uniform2f(U('uTexSize'), img.naturalWidth, img.naturalHeight);
      const P = PALETTE;
      gl.uniform3fv(U('uSun'), P.sun); gl.uniform3fv(U('uShade'), P.shade); gl.uniform3fv(U('uWarm'), P.warm); gl.uniform3fv(U('uCool'), P.cool); gl.uniform3fv(U('uRose'), P.rose); gl.uniform1f(U('uStrength'), P.strength);
      // the shade is soft, so half resolution is plenty; glints need a little more
      // resize only when the width or the large viewport changes (a rotation, a window resize), never for the address bar
      let w0 = 0, h0 = 0;
      const size = () => { VH = probe.offsetHeight || innerHeight; if (innerWidth === w0 && VH === h0) return; w0 = innerWidth; h0 = VH; canvas.width = Math.max(1, Math.round(innerWidth * scale)); canvas.height = Math.max(1, Math.round(VH * scale)); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U('uRes'), canvas.width, canvas.height); };
      size(); addEventListener('resize', size);
    }
    if (fine) addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    const loop = (now) => { draw(now); requestAnimationFrame(loop); };
    requestAnimationFrame((now) => { draw(now); layers.forEach((l) => l.canvas.classList.add('is-on')); requestAnimationFrame(loop); });
  }).catch(() => {});
}
