#!/usr/bin/env python3
"""Makes every logo/icon file the site needs from ONE source picture.

Usage (from the repo root):
    pip install pillow numpy
    python3 tools/make_icons.py tools/logo-source.jpeg

Writes: apple-touch-icon.png, ura-logo.png (header logo, transparent),
        icon-192.png, icon-512.png, icon-maskable-512.png, favicon-32.png
The source should be the logo on a plain light background (any light colour: beige, white...).
After changing icons, bump the version in sw.js (const V="ura-v6" -> "ura-v7") so installed copies update.
"""
import sys, os
import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else "tools/logo-source.jpeg"
im = Image.open(src).convert("RGB")
A = np.asarray(im).astype(float)
bg = A[:6, :6].reshape(-1, 3).mean(axis=0)              # background colour = top-left corner
diff = np.abs(A - bg).max(axis=2)
ys, xs = np.nonzero(diff > 18)
crop_box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)   # tight box around the logo
A = np.asarray(im.crop(crop_box)).astype(float)
W = np.clip(A * 255 / np.maximum(bg, 1), 0, 255)         # background -> pure white

# header logo: white becomes transparent (soft edges kept)
al = (255 - W).max(axis=2) / 255
al = np.where(al < 0.05, 0, al)
C = np.where(al[..., None] > 0, (W - 255 * (1 - al[..., None])) / np.maximum(al[..., None], 1e-6), 255)
logo = Image.fromarray(np.dstack([np.clip(C, 0, 255), al * 255]).astype("uint8"), "RGBA")
pad = 10
hl = Image.new("RGBA", (logo.width + 2 * pad, logo.height + 2 * pad), (0, 0, 0, 0))
hl.paste(logo, (pad, pad))
hl = hl.resize((round(hl.width * 160 / hl.height), 160), Image.LANCZOS)

white = Image.fromarray(W.astype("uint8"), "RGB")
def icon(size, frac):                                     # logo centred on white square
    out = Image.new("RGB", (size, size), (255, 255, 255))
    w = round(size * frac); h = round(white.height * w / white.width)
    out.paste(white.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return out

hl.save("ura-logo.png", optimize=True)
icon(512, .84).save("icon-512.png", optimize=True)
icon(192, .84).save("icon-192.png", optimize=True)
icon(512, .62).save("icon-maskable-512.png", optimize=True)   # extra margin: Android crops it
icon(180, .84).save("apple-touch-icon.png", optimize=True)
icon(64, .9).save("favicon-32.png", optimize=True)
print("done: header logo, 3 app icons, apple-touch-icon, favicon")
print("note: index.html contains the header logo embedded as base64. To change the header logo, re-embed ura-logo.png (see README).")
