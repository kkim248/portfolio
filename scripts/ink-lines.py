"""Ink line vectors for the site: tapered pen strokes, dry-brush breaks, stipple and engraving hatch.
Every mark is a filled outline, so it scales cleanly and recolours in one click in Figma.
usage: python3 scripts/ink-lines.py <outdir> [hex colour]
"""
import math, os, random, sys

OUT = sys.argv[1]; COL = sys.argv[2] if len(sys.argv) > 2 else '#1F3A93'
os.makedirs(OUT, exist_ok=True)

# ---------- smooth 1D noise, so wobble and width breathe instead of jitter ----------
class Noise:
    def __init__(self, seed, n=64):
        r = random.Random(seed); self.v = [r.uniform(-1, 1) for _ in range(n)]; self.n = n
    def __call__(self, x):
        i = math.floor(x); f = x - i; f = f * f * (3 - 2 * f)
        a = self.v[i % self.n]; b = self.v[(i + 1) % self.n]
        return a + (b - a) * f

def catmull(pts, steps=60):
    """a smooth curve through the given points"""
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for s in range(steps):
            t = s / steps; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3) for k in (0, 1)))
    out.append(pts[-1]); return out

def taper(t, a=0.18, b=0.3, power=1.6):
    """thin at the start, full in the middle, a long fade at the end, like a pen lifting"""
    if t < a: return (t / a) ** 0.8
    if t > 1 - b: return ((1 - t) / b) ** power
    return 1.0

def stroke(path, width, seed=1, wobble=0.0, rough=0.12, gaps=0, taper_a=0.18, taper_b=0.3, grain=0, breathe=0.25):
    """a pen stroke along a polyline: varying width, slightly rough edges, optional dry-brush gaps and specks"""
    n1 = Noise(seed); n2 = Noise(seed + 9); n3 = Noise(seed + 17)
    if len(path) < 24:   # a straight stroke given by its ends: fill it in, so the taper has room to work
        dense = []
        for i in range(len(path) - 1):
            (x0, y0), (x1, y1) = path[i], path[i + 1]
            dense += [(x0 + (x1 - x0) * k / 40, y0 + (y1 - y0) * k / 40) for k in range(40)]
        path = dense + [path[-1]]
    N = len(path)
    # arc length
    L = [0.0]
    for i in range(1, N): L.append(L[-1] + math.dist(path[i], path[i - 1]))
    tot = L[-1] or 1
    # wobble the spine a touch
    spine = []
    for i, (x, y) in enumerate(path):
        j = min(N - 1, i + 1); k = max(0, i - 1)
        dx, dy = path[j][0] - path[k][0], path[j][1] - path[k][1]; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = wobble * n3(L[i] / 40)
        spine.append((x + nx * w, y + ny * w, nx, ny, L[i] / tot))
    # dry-brush: a few short breaks where the pen skipped
    r = random.Random(seed)
    breaks = sorted((r.uniform(0.25, 0.85), r.uniform(0.008, 0.025)) for _ in range(gaps))
    segs, cur = [], []
    for p in spine:
        t = p[4]
        if any(abs(t - c) < h for c, h in breaks):
            if len(cur) > 2: segs.append(cur)
            cur = []
        else: cur.append(p)
    if len(cur) > 2: segs.append(cur)
    out = []
    for seg in segs:
        left, right = [], []
        for x, y, nx, ny, t in seg:
            w = width * taper(t, taper_a, taper_b) * (1 + breathe * n1(t * 9)) / 2
            e1 = 1 + rough * n2(t * 140); e2 = 1 + rough * n2(t * 140 + 33)
            left.append((x + nx * w * e1, y + ny * w * e1)); right.append((x - nx * w * e2, y - ny * w * e2))
        ring = left + right[::-1]
        out.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in ring) + ' Z')
    # specks: a little ink thrown off the line
    for _ in range(grain):
        x, y, nx, ny, t = spine[r.randrange(N)]
        off = r.uniform(1.5, 5) * width * (1 if r.random() < 0.5 else -1)
        out.append(dot(x + nx * off, y + ny * off, r.uniform(0.25, 0.6) * width, r))
    return out

def dot(x, y, rad, r=None):
    """an ink dot, not a perfect circle"""
    r = r or random.Random(int(x * 7 + y * 13))
    pts = []
    for k in range(10):
        a = k / 10 * math.tau; rr = rad * (1 + r.uniform(-0.18, 0.18))
        pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr))
    return 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in pts) + ' Z'

def save(name, w, h, paths, note=''):
    body = '\n'.join(f'<path d="{d}"/>' for d in paths)
    with open(os.path.join(OUT, name + '.svg'), 'w') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="{COL}">\n<!-- {note} -->\n{body}\n</svg>\n')

R = random.Random(11)

# 01  the loop: one long confident stroke with a single turn, dry where the pen speeds up
save('01-pen-loop', 1000, 520, stroke(catmull([(30, 490), (200, 440), (380, 300), (520, 210), (640, 200), (650, 280), (560, 300), (560, 220), (700, 110), (970, 40)], 80), 5, seed=3, wobble=1.2, gaps=3, grain=6), 'a long pen stroke with one loop')

# 02  the flick: a brush flick, heavy at the start, hair-thin at the end
save('02-flick', 900, 300, stroke(catmull([(20, 250), (260, 210), (520, 120), (880, 40)], 90), 9, seed=5, wobble=0.8, taper_a=0.05, taper_b=0.7, gaps=2, grain=4), 'a brush flick')

# 03  the pair: two strokes drawn side by side, one heavy, one hairline
save('03-pair', 900, 360, stroke(catmull([(20, 320), (300, 300), (520, 120), (880, 60)], 80), 5, seed=7, wobble=1) + stroke(catmull([(40, 340), (320, 322), (540, 146), (880, 84)], 80), 1.4, seed=8, wobble=1.4, gaps=4), 'two strokes, heavy and hairline')

# 04  the stipple trail: ink dots along a curve, larger and denser at the start, thinning out
pts = catmull([(20, 300), (240, 290), (420, 140), (780, 50)], 120); paths = []
for i, (x, y) in enumerate(pts):
    t = i / len(pts)
    if R.random() < 0.55 * (1 - t) + 0.1:
        paths.append(dot(x + R.uniform(-6, 6) * t, y + R.uniform(-6, 6) * t, 2.6 * (1 - t) + 0.7, R))
save('04-stipple-trail', 800, 340, paths, 'ink dots fading along a curve')

# 05  the spatter: an ink flick that landed, a blot with drops thrown off one side
paths = [dot(160, 160, 9, R)]
for _ in range(70):
    a = R.gauss(-0.4, 0.6); d = R.uniform(14, 150) ** 1.05
    paths.append(dot(160 + math.cos(a) * d, 160 + math.sin(a) * d, max(0.6, 5 - d / 34) * R.uniform(0.5, 1.1), R))
save('05-spatter', 360, 320, paths, 'an ink spatter')

# 06  engraving hatch: short parallel strokes like the shading in a botanical plate
paths = []
for i in range(26):
    x = 20 + i * 11 + R.uniform(-1, 1); L = 60 + 70 * math.sin(i / 25 * math.pi) + R.uniform(-10, 10)
    paths += stroke(catmull([(x, 170 - L / 2), (x + 10, 170 + L / 2)], 20), 1.6, seed=40 + i, taper_a=0.25, taper_b=0.35, rough=0.2)
save('06-hatch', 320, 300, paths, 'engraving hatch')

# 07  engraved rings: three hairline circles, unevenly broken, like a plate's border
paths = []
for k, rad in enumerate([120, 108, 64]):
    ring = [(150 + math.cos(a) * rad, 150 + math.sin(a) * rad) for a in [i / 220 * math.tau - 1.2 for i in range(221)]]
    paths += stroke(ring, 1.5 if k != 1 else 0.9, seed=60 + k, taper_a=0.04, taper_b=0.06, gaps=3 + k, rough=0.18, breathe=0.35)
save('07-engraved-rings', 300, 300, paths, 'engraved rings')

# 08  the sun: tapered rays of uneven length around a small open ring
paths = []
for k in range(24):
    a = k / 24 * math.tau + R.uniform(-0.03, 0.03); L = (60 if k % 2 == 0 else 34) + R.uniform(-6, 8)
    paths += stroke([(160 + math.cos(a) * (30 + L * f), 160 + math.sin(a) * (30 + L * f)) for f in [i / 20 for i in range(21)]], 3.2 if k % 2 == 0 else 2, seed=80 + k, taper_a=0.1, taper_b=0.75)
ring = [(160 + math.cos(a) * 20, 160 + math.sin(a) * 20) for a in [i / 120 * math.tau for i in range(112)]]
paths += stroke(ring, 1.8, seed=79, taper_a=0.05, taper_b=0.2)
save('08-sun', 320, 320, paths, 'a sun of tapered rays')

# 09  halftone fade: a band of ink dots shrinking across, like a print running out of ink
paths = []
for gx in range(46):
    for gy in range(9):
        t = gx / 45; x = 12 + gx * 14 + (7 if gy % 2 else 0); y = 12 + gy * 14
        rad = 5.2 * (1 - t) ** 1.4 * R.uniform(0.8, 1.1)
        if rad > 0.5: paths.append(dot(x, y, rad, R))
save('09-halftone-fade', 680, 140, paths, 'a halftone fade')

# 10  the underline swash: for sitting under a word
save('10-underline', 600, 90, stroke(catmull([(14, 60), (180, 40), (420, 38), (590, 22)], 80), 5, seed=101, wobble=1.4, taper_a=0.08, taper_b=0.5, grain=3), 'an underline swash')

# 11  the circling: a loose loop drawn around a word, overshooting where it closes
c = [(300 + math.cos(a) * 270 * (1 + 0.04 * math.sin(a * 3)), 110 + math.sin(a) * 82) for a in [-2.6 + i / 200 * 7.0 for i in range(201)]]
save('11-circling', 600, 220, stroke(c, 3.4, seed=111, wobble=1.6, taper_a=0.08, taper_b=0.3, gaps=1), 'a loose circling')

# 12  the arrow: a curved stroke with a two-stroke head
paths = stroke(catmull([(20, 200), (140, 190), (260, 120), (330, 40)], 70), 3.6, seed=121, wobble=1, taper_a=0.06, taper_b=0.06)
paths += stroke(catmull([(330, 40), (318, 76)], 20), 3.2, seed=122, taper_a=0.05, taper_b=0.6) + stroke(catmull([(330, 40), (296, 54)], 20), 3.2, seed=123, taper_a=0.05, taper_b=0.6)
save('12-arrow', 360, 230, paths, 'a curved arrow')

# 13  the asterisk: six tapered strokes, not quite even
paths = []
for k in range(6):
    a = k / 6 * math.pi + R.uniform(-0.06, 0.06); L = 70 + R.uniform(-8, 8)
    paths += stroke([(100 - math.cos(a) * L, 100 - math.sin(a) * L), (100 + math.cos(a) * L, 100 + math.sin(a) * L)], 4.2, seed=130 + k, taper_a=0.3, taper_b=0.3, rough=0.14)
save('13-asterisk', 200, 200, paths, 'a drawn asterisk')

# 14  the spark: four sharp points with deeply curved sides (an astroid), the edge a hair uneven
pts = []
for i in range(240):
    a = i / 240 * math.tau; c, sn = math.cos(a), math.sin(a)
    rr = 1 + R.uniform(-0.006, 0.006)
    pts.append((100 + 92 * rr * c * abs(c) ** 2.8, 100 + 92 * rr * sn * abs(sn) ** 2.8))
save('14-spark', 200, 200, ['M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'], 'a four-point spark')

# 15  the vine: a fine stem with small leaf strokes, drawn in one go
spine = catmull([(20, 330), (200, 280), (360, 170), (520, 120), (760, 40)], 80)
paths = stroke(spine, 2.2, seed=150, wobble=1, taper_a=0.04, taper_b=0.25)
for i in range(18, len(spine) - 30, 26):
    x, y = spine[i]; x2, y2 = spine[i + 1]; ang = math.atan2(y2 - y, x2 - x); side = 1 if (i // 26) % 2 else -1
    la = ang + side * 0.8; L = 52 - i / len(spine) * 20
    paths += stroke(catmull([(x, y), (x + math.cos(la) * L * 0.5 + math.cos(ang) * 6, y + math.sin(la) * L * 0.5 + math.sin(ang) * 6), (x + math.cos(la) * L + math.cos(ang) * 14, y + math.sin(la) * L + math.sin(ang) * 14)], 20), 9, seed=160 + i, taper_a=0.35, taper_b=0.65, rough=0.1)
save('15-vine', 780, 360, paths, 'a fine vine')

# 16  the rule: a long hairline, drawn not ruled, with a dot pressed at each end
paths = stroke([(20 + i * 2, 20 + 0.6 * math.sin(i / 37)) for i in range(431)], 1.6, seed=170, taper_a=0.02, taper_b=0.02, rough=0.25, breathe=0.4, gaps=2)
paths += [dot(20, 20, 4.2, R), dot(880, 20, 4.2, R)]
save('16-drawn-rule', 900, 40, paths, 'a drawn hairline rule')

# 17  the waves: three hairlines rippling together, like air over heat
paths = []
for k in range(3):
    paths += stroke([(20 + i * 3, 40 + k * 16 + 9 * math.sin(i / 22 + k * 0.6)) for i in range(254)], 2.4 - k * 0.4, seed=180 + k, taper_a=0.12, taper_b=0.3, gaps=2)
save('17-waves', 800, 110, paths, 'three rippling hairlines')

# 18  dust: a field of fine specks to lay over an image or a corner
paths = [dot(R.uniform(0, 500), R.uniform(0, 300), R.choice([0.6, 0.8, 1.0, 1.3, 1.8]), R) for _ in range(260)]
save('18-dust', 500, 300, paths, 'a field of ink dust')

# 19  the bracket: a tall drawn brace for grouping
save('19-brace', 80, 420, stroke(catmull([(60, 10), (30, 40), (34, 170), (12, 210), (34, 250), (30, 380), (60, 410)], 60), 3.2, seed=190, wobble=0.8, taper_a=0.12, taper_b=0.12), 'a drawn brace')

# 20  the crosshair: two drawn strokes and a broken ring
paths = stroke([(80, 8), (80, 152)], 2, seed=200, taper_a=0.2, taper_b=0.2) + stroke([(8, 80), (152, 80)], 2, seed=201, taper_a=0.2, taper_b=0.2)
paths += stroke([(80 + math.cos(a) * 30, 80 + math.sin(a) * 30) for a in [i / 100 * math.tau for i in range(92)]], 1.6, seed=202, taper_a=0.05, taper_b=0.25)
save('20-crosshair', 160, 160, paths, 'a drawn crosshair')
print('done', len([f for f in os.listdir(OUT) if f.endswith('.svg')]))
