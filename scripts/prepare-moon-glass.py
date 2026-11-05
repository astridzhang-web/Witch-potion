"""Reversible glass-only candle variant; original PNG/WebP are never modified.
Requires Pillow + NumPy offline. Runtime separately restores the original gold detail.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'assets/reference/透明玻璃月影药瓶.png').convert('RGBA')
pixels = np.asarray(source).astype(float) / 255
rgb, alpha = pixels[:, :, :3], pixels[:, :, 3:4]
y, x = np.mgrid[:source.height, :source.width]
# Alpha-weighted RGB avoids dragging transparent matte into the glass highlights.
premult = Image.fromarray(np.uint8(np.concatenate((rgb * alpha, alpha), axis=2) * 255))
blur = np.asarray(premult.filter(ImageFilter.GaussianBlur(4))).astype(float) / 255
soft_rgb = blur[:, :, :3] / np.maximum(blur[:, :, 3:4], 1 / 255)
def band(start, end, feather):
    return np.clip((y - start) / feather, 0, 1) * np.clip((end - y) / feather, 0, 1)
# Only neck/shoulder and foot highlights soften; rim, belly and silhouette stay crisp.
softness = .62 * np.maximum(band(85, 835, 65), band(1270, 1410, 40))
metal = np.clip((rgb[:, :, 0] - rgb[:, :, 2]) * 5, 0, 1)
softness *= 1 - metal
smooth = rgb * (1 - softness[:, :, None]) + soft_rgb * softness[:, :, None]
luminance = smooth @ np.array([.2126, .7152, .0722])
champagne = np.clip(luminance[:, :, None] * [1.08, .96, .76], 0, 1)
# Stronger candle reflection on the left; retain restrained cool moonlight on the right.
warmth = .84 - .25 * np.clip((x - 520) / 300, 0, 1)
result = (smooth * (1 - warmth[:, :, None]) + champagne * warmth[:, :, None]) * .95
# Retain the source warm-metal pixels as well as the separate, unprocessed gold pass.
result = result * (1 - metal[:, :, None]) + rgb * metal[:, :, None]
output = Image.fromarray(np.uint8(np.clip(np.concatenate((result, alpha), axis=2), 0, 1) * 255 + .5))
path = root / 'public/assets/bottles/moon-glass-candle.webp'
output.save(path, lossless=True, method=6, exact=True)
print(f'{path.relative_to(root)}: {path.stat().st_size} bytes; {source.size}; alpha unchanged: {np.array_equal(np.asarray(source)[:,:,3], np.asarray(output)[:,:,3])}')
