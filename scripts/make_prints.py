"""Print treatments for the portfolio. Pillow + NumPy only.

Usage examples:
  python make_prints.py bw     in.jpg out.jpg              # black and white with grain (blue plates are CSS)
  python make_prints.py cyano  in.jpg out.jpg              # cyanotype in the site blue family
  python make_prints.py halftone in.jpg out_blue.png out_orange.png   # two transparent ink plates
  python make_prints.py halftone-flat in.jpg out.jpg       # both plates flattened on paper (loupe images)

Never quantize UI screenshots. Resize and save as high quality JPEG.
"""
import sys
import numpy as np
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw

PAPER = (251, 251, 249)
BLUE = (31, 58, 147)       # --ink-blue  #1F3A93
ORANGE = (232, 100, 42)    # --ink-orange #E8642A
CYANO_STOPS = [(0.0, (18, 34, 90)), (0.45, BLUE), (0.75, (118, 134, 196)), (1.0, (236, 236, 238))]
rng = np.random.default_rng(7)

def bw(src, dst, width=1100):
    im = Image.open(src).convert("L")
    im = ImageOps.autocontrast(im, cutoff=1)
    im = ImageEnhance.Contrast(im).enhance(1.25)
    im = im.resize((width, int(width * im.height / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(float) + rng.normal(0, 34, (im.height, im.width))
    Image.fromarray(np.clip(a, 0, 255).astype("uint8")).save(dst, quality=72)

def cyano(src, dst, blur=2.0):
    g = ImageOps.autocontrast(Image.open(src).convert("L"), cutoff=2).filter(ImageFilter.GaussianBlur(blur))
    l = np.asarray(g).astype(float) / 255
    out = np.zeros(l.shape + (3,))
    for (a, ca), (b, cb) in zip(CYANO_STOPS[:-1], CYANO_STOPS[1:]):
        m = (l >= a) & (l <= b)
        t = ((l - a) / (b - a))[m][:, None]
        out[m] = np.array(ca) * (1 - t) + np.array(cb) * t
    out = out + rng.normal(0, 10, out.shape)
    Image.fromarray(np.clip(out, 0, 255).astype("uint8")).save(dst, quality=82)

def _plates(src, cell=11):
    im = Image.open(src).convert("RGB").filter(ImageFilter.GaussianBlur(2))
    a = np.asarray(im).astype(float)
    R, B = a[..., 0], a[..., 2]
    lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]) / 255
    blue_v = np.clip((1 - lum - 0.28) / 0.62, 0, 1)
    orange_v = np.clip((R - B - 30) / 140, 0, 1)
    W, H = im.size
    def plate(val, color, off, gamma, scale):
        out = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(out)
        for y in range(off, H + cell, cell):
            for x in range(off, W + cell, cell):
                r = (cell / 2) * scale * (val[min(y, H - 1), min(x, W - 1)] ** gamma)
                if r > 0.6:
                    d.ellipse((x - r, y - r, x + r, y + r), fill=color + (255,))
        return out
    return plate(blue_v, BLUE, cell // 2, 1.3, 1.2), plate(orange_v, ORANGE, 0, 1.1, 1.15)

def halftone(src, dst_blue, dst_orange):
    b, o = _plates(src)
    b.save(dst_blue, optimize=True); o.save(dst_orange, optimize=True)

def halftone_flat(src, dst):
    b, o = _plates(src, cell=8)
    base = np.ones((b.height, b.width, 3)) * np.array(PAPER) / 255
    for p in (o, b):
        q = np.asarray(p).astype(float) / 255; al = q[..., 3:4]
        base = base * (1 - al) + base * q[..., :3] * al
    out = base * 255 + rng.normal(0, 7, base.shape)
    Image.fromarray(np.clip(out, 0, 255).astype("uint8")).save(dst, quality=80)

if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    {"bw": bw, "cyano": cyano, "halftone": halftone, "halftone-flat": halftone_flat}[cmd](*args)
