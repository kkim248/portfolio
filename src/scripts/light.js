import { reduce, fine, smooth, glProgram, texture, VS } from './util.js';

/* ---------- one fixed palette: late morning sun, sky-blue shade, a touch vibrant ---------- */
const PALETTE = { sun: [0.985, 0.965, 0.92], shade: [0.77, 0.835, 0.965], warm: [1.0, 0.95, 0.885], cool: [0.86, 0.92, 1.0], strength: 1.05 };

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
  uniform vec3 uSun; uniform vec3 uShade; uniform vec3 uWarm; uniform vec3 uCool; uniform float uStrength;
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
  // where on Ian's painting this pixel's light comes from: cover-mapped, tilted, moved by wind
  vec2 leafUV(vec2 p, float t) {
    float sa = uRes.x / uRes.y, ta = uTexSize.x / uTexSize.y;
    vec2 s = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
    vec2 uv = (p - 0.5) * s / 1.35;
    float a = -0.12; uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv + vec2(0.52, 0.46);
    vec2 w = vec2(noise(uv * 3.0 + vec2(t * 0.07, 0.0)), noise(uv * 3.0 + vec2(5.2, -t * 0.06))) - 0.5;
    float sway = sin(t * 0.55 + uv.y * 5.0) * 0.6 + sin(t * 0.33 + uv.x * 4.0) * 0.4;
    float g = 1.15 + 1.0 * gust(t);
    uv += (w * 0.042 + vec2(sway * 0.01, sway * 0.004)) * g * (1.0 - p.y * 0.6) + uPointer * 0.012;
    uv += vec2(sin(t * 0.031), cos(t * 0.026)) * 0.018;        // the whole canopy drifts very slowly
    return uv;
  }
  // where the light is strongest on screen: top right, plus one patch wandering over the statement
  float lightMask(vec2 p, float t) {
    float base = smoothstep(0.15, 0.95, p.x * 0.85 + (1.0 - p.y) * 0.45);
    vec2 lc = vec2(0.1 + 0.5 * (0.5 + 0.5 * sin(t * 0.055)), 0.76 + 0.06 * sin(t * 0.04));
    vec2 d = (p - lc) * vec2(1.0, 1.9);
    float cloud = 0.8 + 0.2 * smoothstep(0.2, 0.8, noise(vec2(t * 0.045, 3.7)));
    return clamp(max(base, exp(-dot(d, d) / 0.05) * 0.85) * cloud * uStrength * uFade, 0.0, 1.0);
  }
  // motes: soft, out-of-focus specks drifting up through the light, nearer ones larger and faster
  float motes(vec2 p, float t) {
    float sa = uRes.x / uRes.y, m = 0.0;
    for (int i = 0; i < 28; i++) {
      float fi = float(i), depth = hash(vec2(fi, 7.0));
      float speed = mix(0.4, 1.3, depth), r = mix(0.009, 0.03, depth);
      vec2 c = vec2(hash(vec2(fi, 1.0)), hash(vec2(fi, 2.0)));
      c += vec2(sin(t * 0.05 * speed + fi) * 0.05, -t * 0.0045 * speed) + uPointer * 0.02 * depth;
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
    vec2 local = vec2(p.x * sa, p.y) - vec2(sa * 1.02, -0.12) + uPointer * 0.05;
    float sway = sin(t * 0.62) * 0.03 + sin(t * 0.27 + 1.3) * 0.02 + gust(t) * 0.045 * sin(t * 1.6);
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
    vec2 uv = leafUV(p, t);
    // focus breathes: leaf shadows slowly sharpen and soften, like a lens pulling focus
    float lod = mix(1.6, 4.4, noise(uv * 2.0 + 11.0)) + 0.9 * sin(t * 0.21);
    float lit = smoothstep(0.32, 0.68, lum(textureLod(uTex, uv, max(lod, 0.8)).rgb));
    // softer than before, but still a little sharper than the trees behind it
    lit *= 1.0 - flowerShadow(p, t, 2.6 + 0.4 * sin(t * 0.21)) * 0.85;
    float inside = hoverMask(p);
    lit = mix(lit, 1.0, inside);
    vec3 c = mix(uShade, uSun, lit);
    float tooth = noise(gl_FragCoord.xy * 0.9) * 0.6 + noise(gl_FragCoord.xy * 2.1) * 0.4;
    c *= 1.0 - 0.05 * lit * (tooth - 0.5);
    float k = max(lightMask(p, t), inside * 0.9);
    vec3 leaf = mix(vec3(1.0), c, k);
    float sa = uRes.x / uRes.y; vec2 ap = vec2(p.x * sa, p.y);
    vec2 g1 = vec2((0.86 + 0.06 * sin(t * 0.05)) * sa, 0.1 + 0.08 * cos(t * 0.04));
    vec2 g2 = vec2((0.1 + 0.08 * cos(t * 0.035)) * sa, 0.98 + 0.05 * sin(t * 0.03));
    float a1 = exp(-dot(ap - g1, ap - g1) / 0.55), a2 = exp(-dot(ap - g2, ap - g2) / 0.7);
    vec3 tint = mix(mix(vec3(1.0), uWarm, a1), uCool, a2 * (1.0 - 0.5 * a1));
    vec3 col = leaf * tint;
    // refracted light: a faint network of bright threads drifting through the shade, like sun through water or
    // glass, where two slow noise fields cross; strongest during a breeze
    vec2 cp = uv * 5.0 + vec2(t * 0.05, -t * 0.035);
    float n1 = noise(cp + vec2(sin(t * 0.21), cos(t * 0.17)) * 0.6), n2 = noise(cp * 1.25 + vec2(4.2, 1.7) - t * 0.04);
    float threads = pow(1.0 - abs(n1 - n2), 14.0) * (0.55 + 0.45 * gust(t));
    col = mix(col, vec3(1.0, 0.995, 0.975), threads * (1.0 - lit) * k * 0.75);
    col = mix(col, vec3(1.0, 0.995, 0.975), motes(p, t) * clamp(lightMask(p, t) * 1.6, 0.0, 1.0));
    o = vec4(mix(col, vec3(1.0), imgMask(p) * 0.35), 1.0);
  }`;

const FS_GLINT = GLSL_COMMON + `
  void main() {
    vec2 p = screenP(); float t = uTime;
    vec2 uv = leafUV(p, t);
    // the brightest gaps in the canopy, seen nearly in focus
    float gap = smoothstep(0.58, 0.82, lum(textureLod(uTex, uv, 1.4).rgb)) * (1.0 - flowerShadow(p, t, 2.6));
    // tiny points of sun that twinkle slowly, each on its own rhythm
    vec2 cell = uv * 85.0 + vec2(t * 0.35, -t * 0.22);
    float sp = smoothstep(0.74, 0.95, noise(cell));
    float tw = 0.5 + 0.5 * sin(t * 1.4 + hash(floor(cell)) * 6.283);
    float glint = sp * tw * gap * (1.2 + 0.9 * gust(t));
    // and a soft bloom where the light pours through
    float bloom = smoothstep(0.6, 0.92, lum(textureLod(uTex, uv, 5.2).rgb));

    float k = lightMask(p, t) * (1.0 - hoverMask(p)) * (1.0 - imgMask(p) * 0.35);
    o = vec4(vec3(0.93, 0.97, 1.0) * (glint * 0.8 + bloom * 0.12) * k, 1.0);
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
  // pages meant for reading (case studies) mark their body data-light="quiet": past the first screen the light
  // drops to about a quarter, so moving shadows never sweep across paragraphs
  let first = null, foot = null, quiet = false;
  let pics = [];
  const PICS = '.scene__cover, .stack__cover, .cs-cover, .ab__photo, .gallery figure > img, .gallery .clip, .shot, .annotated__shot, .compare__frame, .tierrow__shot, .story, .phones img';
  const find = () => { first = document.querySelector('.first'); foot = document.querySelector('.foot'); quiet = !!document.querySelector('[data-light="quiet"]'); light.hover = null; pics = [...document.querySelectorAll(PICS)]; };
  find(); document.addEventListener('astro:page-load', find); document.addEventListener('astro:after-swap', find);
  let px = 0, py = 0, tx = 0, ty = 0, fade = 1, clearAmt = 0, rect = [0, 0, 0, 0];
  const boxes = new Float32Array(64);
  const t0 = performance.now() - 8000;

  let lastDraw = 0;
  function draw(now) {
    if (touch && now - lastDraw < 32) return; lastDraw = now;
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    // the light is full on the first screen, softer down the page, and fades out at the closing note
    let f = 1 - (quiet ? 0.75 : 0.4) * smooth(0, (first ? first.offsetHeight : innerHeight) * 0.9, scrollY);
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
      gl.uniform3fv(U('uSun'), P.sun); gl.uniform3fv(U('uShade'), P.shade); gl.uniform3fv(U('uWarm'), P.warm); gl.uniform3fv(U('uCool'), P.cool); gl.uniform1f(U('uStrength'), P.strength);
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
