import { reduce, clamp, smooth, glProgram, texture, VS } from './util.js';

// Watercolor blotch: blue watercolor that spills onto the page as it scrolls into view. Water runs ahead,
// pigment follows, drifts while wet, blooms and lightens as it dries. The same blue as the light's shade.
// Each <canvas class="spill"> runs its own small WebGL shader.
//   data-src       optional: a painting to hold back as a white silhouette inside the wash
//   data-crop      "x0 y0 x1 y1": the part of the sheet to use, 0 to 1
//   data-origin    "x y": where the spill starts, 0 to 1 within the canvas
//   data-seed      varies the wash
//   data-strength  how strong the paint is, 1 by default; delicate accents use less
//   data-aspect    a blotch's shape, width / height
const FS = `#version 300 es
  precision highp float;
  uniform sampler2D uTex; uniform vec4 uCrop; uniform vec2 uRes; uniform vec2 uOrigin;
  uniform float uP; uniform float uDry; uniform float uSeed; uniform float uT; uniform float uStrength; uniform float uTexOn;
  out vec4 o;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
  float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
  float sat(vec3 c) { return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)); }
  // how much "paint" the original has here, judged against its own nearby paper, so cream, stained or
  // uneven sheets never read as paint: darker than the paper around it, or more coloured than it
  float ink(vec2 tuv, float lod) {
    vec3 c = textureLod(uTex, tuv, lod).rgb;
    // the paper nearby: the brightest, least coloured of a few soft samples around this point, which is clean
    // paper even right next to a flower
    float pl = 0.0, ps = 1.0;
    for (int i = 0; i < 5; i++) {
      vec2 off = i == 0 ? vec2(0.0) : vec2(i < 3 ? (i == 1 ? 0.12 : -0.12) : 0.0, i >= 3 ? (i == 3 ? 0.12 : -0.12) : 0.0);
      vec3 s = textureLod(uTex, clamp(tuv + off, 0.0, 1.0), 6.0).rgb;
      pl = max(pl, lum(s)); ps = min(ps, sat(s));
    }
    return clamp((pl - 0.035 - lum(c)) * 2.8 + (sat(c) - ps - 0.05) * 1.8, 0.0, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1.0 - uv.y;
    float asp = uRes.x / uRes.y;
    vec2 q = (uv - 0.5) * vec2(asp, 1.0);
    float sd = uSeed * 13.7;
    vec2 tuv = mix(uCrop.xy, uCrop.zw, uv);

    // the flower, and a wide soft version of it that shapes the wash around it
    // the flower, simplified: a soft silhouette with a brush-wobbled outline, and only a hint of its detail
    vec2 wob = (vec2(fbm(uv * 6.0 + sd), fbm(uv * 6.0 + sd + 4.3)) - 0.5) * 0.012;
    float shape = uTexOn * smoothstep(0.05, 0.3, ink(tuv + wob, 2.0));
    float detail = uTexOn * ink(tuv, 0.9) * shape;
    // the wash: it reaches out unevenly and fades into the paper at its far edge. Around a flower it follows the
    // flower; on its own it is a lopsided blotch.
    float reach = (fbm(uv * 1.8 + sd) - 0.5) * 0.2 + (fbm(uv * 6.0 + sd * 3.0) - 0.5) * 0.06;
    vec2 e = (uv - 0.5) * 2.0;
    float ang = atan(e.y, e.x);
    float blob = 0.32 - length(e) * 0.36 + (fbm(vec2(cos(ang), sin(ang)) * 1.4 + sd) - 0.5) * 0.24;
    float halo = (uTexOn > 0.5 ? ink(tuv, 6.4) * 1.25 : blob) + reach;
    float washEdge = smoothstep(-0.01, 0.12, halo);
    float rim = smoothstep(0.0, 0.05, halo) * (1.0 - smoothstep(0.05, 0.12, halo)) * smoothstep(0.45, 0.7, fbm(uv * 5.0 + sd * 4.0));
    float fl = shape;

    // the spill: water runs out from the origin first, fingering ahead; pigment follows a little behind
    vec2 o0 = (uOrigin - 0.5) * vec2(asp, 1.0);
    float d = length(q - o0) / (1.4 * max(asp, 1.0));
    float df = d + (fbm(uv * 3.2 + sd * 3.0) - 0.5) * 0.3 + (noise(uv * 14.0 + sd) - 0.5) * 0.08 + (noise(uv * 32.0 + sd) - 0.5) * 0.03;
    float front = uP * 1.15;
    float painted = smoothstep(front + 0.01, front - 0.035, df);       // a soft, feathered front, as on wet paper
    float water = smoothstep(front + 0.1, front + 0.06, df);

    // the pigment drifts while wet, settles unevenly, and granulates into the paper's tooth
    vec2 flow = vec2(0.01, 0.026) * uT * (1.0 - uDry);
    float settle = 0.55 + 0.45 * fbm(uv * 3.6 + sd * 7.0 + flow);
    float gran = 0.8 + 0.4 * noise(gl_FragCoord.xy * 0.6) * (0.6 + 0.4 * noise(gl_FragCoord.xy * 0.13));
    float wetFront = smoothstep(front - 0.08, front, df) * painted * (1.0 - uDry);

    // the wash carries the pigment, a little deeper at its rim; the flower is held back as paper, with a faint
    // trace of its petals and veins
    float wash = washEdge * (0.55 + 0.3 * settle) + rim * 0.2;
    float dens = (wash * (1.0 - fl * 0.9) + detail * 0.16) * gran + wetFront * 0.2 * washEdge * (1.0 - fl);

    // as it dries, water pushes back into pale cauliflower blooms with darker edges, mostly in the wash
    float b = fbm(uv * 4.8 + sd * 5.0 + flow * 0.5);
    float bloom = smoothstep(0.6, 0.67, b), bloomEdge = smoothstep(0.55, 0.6, b) - smoothstep(0.6, 0.65, b);
    dens += (bloomEdge * 0.22 - bloom * 0.18) * uDry * washEdge * (1.0 - fl);

    // the tide line where the water stopped, and the wet paper just ahead of the paint
    float tide = exp(-pow((df - (front + 0.09)) / 0.014, 2.0)) * washEdge * (1.0 - smoothstep(0.9, 1.0, uP) * 0.6);
    float wetPaper = clamp(water - painted, 0.0, 1.0) * 0.07 * (1.0 - uDry * 0.8) * washEdge;

    // spatter thrown by the first surge, just outside the wash
    float ring = smoothstep(0.0, 0.03, 0.05 - halo) * smoothstep(0.0, 0.02, halo - 0.005);
    float drop = smoothstep(0.88, 0.92, noise(q * 38.0 + sd)) * ring * smoothstep(0.05, 0.25, uP);

    dens = clamp(dens * painted + tide * 0.08 + wetPaper + drop * 0.45, 0.0, 1.0);

    // two blues mixed on the paper, ultramarine and cerulean; wet paint is deeper, it dries lighter
    // the same sky-leaning blue as the light's shade, so paint and light read as one colour
    vec3 ultra = vec3(0.16, 0.27, 0.62), ceru = vec3(0.28, 0.47, 0.78);
    vec3 col = mix(ultra, ceru, smoothstep(0.35, 0.7, fbm(uv * 2.4 + sd * 9.0)));
    float dryness = clamp(uDry + smoothstep(front, front - 0.5, df) * 0.5, 0.0, 1.0);
    col = mix(col * 0.82, mix(col, vec3(0.42, 0.53, 0.8), 0.35), dryness);
    // fade out toward the canvas edges, so a rectangle can never show
    float edge = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x) * smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
    o = vec4(mix(vec3(1.0), col, dens * 0.82 * uStrength * edge), 1.0);
  }`;


function setup(canvas, img, texOn) {
  const p = glProgram(canvas, VS, FS); if (!p) return null;
  const { gl, U } = p;
  texture(gl, 0, img, gl.CLAMP_TO_EDGE);
  const crop = (canvas.dataset.crop || '0 0 1 1').split(/\s+/).map(Number), origin = (canvas.dataset.origin || '0.5 0.5').split(/\s+/).map(Number);
  gl.uniform4f(U('uCrop'), crop[0], crop[1], crop[2], crop[3]);
  gl.uniform2f(U('uOrigin'), origin[0], origin[1]);
  gl.uniform1f(U('uSeed'), +(canvas.dataset.seed || 1));
  gl.uniform1f(U('uStrength'), +(canvas.dataset.strength || 1));
  gl.uniform1f(U('uTexOn'), texOn ? 1 : 0);
  // the canvas takes the shape of the cropped sheet, so a painting is never stretched
  canvas.style.aspectRatio = texOn ? `${(crop[2] - crop[0]) * img.naturalWidth} / ${(crop[3] - crop[1]) * img.naturalHeight}` : (canvas.dataset.aspect || '1');
  const size = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U('uRes'), canvas.width, canvas.height);
  };
  return { gl, U, size };
}

export function spills() {
  const stops = [];
  document.querySelectorAll('canvas.spill').forEach((canvas) => {
    let dead = false, raf = 0, ro, io, gl;
    stops.push(() => { dead = true; cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); gl?.getExtension('WEBGL_lose_context')?.loseContext(); });
    // a blotch has no painting: a blank white sheet stands in, and the shader ignores it
    const texOn = !!canvas.dataset.src;
    let img;
    if (texOn) { img = new Image(); img.src = canvas.dataset.src; }
    else { img = document.createElement('canvas'); img.width = img.height = 4; const g = img.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); }
    (texOn ? img.decode() : Promise.resolve()).then(() => {
      if (dead) return;
      const s = setup(canvas, img, texOn); if (!s) return;
      const { U, size } = s; gl = s.gl;
      let start = 0;
      const draw = (p, dry, t = 12) => { gl.uniform1f(U('uP'), p); gl.uniform1f(U('uDry'), dry); gl.uniform1f(U('uT'), t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      size();
      ro = new ResizeObserver(() => { size(); if (!raf) draw(start || reduce ? 1 : 0, start || reduce ? 1 : 0); });
      ro.observe(canvas);
      if (reduce) { draw(1, 1); return; }
      draw(0, 0);
      // a strong surge, then a long slow creep; it stays wet a while, then dries lighter
      const tick = (now) => {
        const t = (now - start) / 1000;
        const p = 1 - Math.pow(1 - clamp(t / 5.6, 0, 1), 3.2);
        const dry = smooth(3.0, 11, t);
        draw(p, dry, t);
        raf = dry < 1 ? requestAnimationFrame(tick) : 0;
      };
      io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect(); start = performance.now(); raf = requestAnimationFrame(tick);
      }, { threshold: 0.3 });
      io.observe(canvas);
    }).catch(() => {});
  });
  return () => stops.forEach((f) => f());
}
