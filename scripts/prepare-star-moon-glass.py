"""Prepare the supplied 3C star–bead–moon–bead–star artwork without repainting.
Offline only: Pillow, NumPy, SciPy. Retains every visible RGB byte; adjusts alpha and discards invisible RGB.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'assets/reference/长颈玻璃瓶.png').convert('RGBA')
p = np.array(source)
a = p[:, :, 3].astype(float)
rgb = p[:, :, :3].astype(float)
y, x = np.mgrid[:source.height, :source.width]
# Keep the principal connected artwork, including all five ring ornaments.
labels, count = ndimage.label(a > 8)
sizes = np.bincount(labels.ravel()); sizes[0] = 0
main = labels == sizes.argmax()
# A narrow, feathered allowance retains genuine antialiasing but rejects isolated matte.
near = np.clip(1 - ndimage.distance_transform_edt(~main) / 3, 0, 1)
left, right = np.zeros(source.height), np.zeros(source.height)
for row in range(source.height):
    cols = np.flatnonzero(main[row])
    left[row], right[row] = (cols[0], cols[-1]) if len(cols) else (source.width, 0)
depth = np.minimum(x - left[:, None], right[:, None] - x)
# Native warm highlights/metal remain prominent. Dense neutral inner glass softens
# continuously with distance from the silhouette, not with a cut-out belly circle.
warm = np.clip((rgb[:, :, 0] - rgb[:, :, 2] - 12) / 48, 0, 1)
edge = np.clip(1 - np.maximum(0, depth - 5) / 42, 0, 1)
neutral_gain = .17 + .60 * edge
# Retain enough neutral glass at the mouth and thick foot to read their structure.
neutral_gain = np.where(y < 180, .58 + .25 * edge, neutral_gain)
neutral_gain = np.where(y > 1345, .45 + .30 * edge, neutral_gain)
gain = neutral_gain + (1 - neutral_gain) * warm
# Suppress very saturated fringe pixels only at the extreme outer edge.
saturation = (rgb.max(2) - rgb.min(2)) / np.maximum(1, rgb.max(2))
fringe = np.where((depth < 2) & (saturation > .72), .45, 1)
result = p.copy()
result[:, :, 3] = np.uint8(np.clip(a * gain * near * fringe * np.clip((a - 2) / 6, 0, 1), 0, 255) + .5)
# Hidden RGB is irrelevant to compositing; zero it to avoid shipping matte noise.
visible = result[:, :, 3] > 0
result[~visible, :3] = 0
output = root / 'public/assets/bottles/star-moon-glass.webp'
Image.fromarray(result).save(output, lossless=True, method=6, exact=True)
regions = {'belly_center': (440, 1000, 580, 1190), 'neck': (455, 240, 565, 580), 'shoulder': (430, 790, 590, 880), 'belly_inner_edge': (200, 1000, 300, 1180)}
stats = {}
for name, (l,t,r,b) in regions.items():
    stats[name] = {'bounds': [l,t,r,b], 'source_mean_alpha_255': float(a[t:b,l:r].mean()), 'web_mean_alpha_255': float(result[t:b,l:r,3].mean())}
report = {'dimensions': list(source.size), 'source_alpha_zero_partial_opaque': [int((a == 0).sum()), int(((a > 0) & (a < 255)).sum()), int((a == 255).sum())],
          'source_nonzero_bounds': list(source.getchannel('A').getbbox()), 'web_nonzero_bounds': list(Image.fromarray(result[:,:,3]).getbbox()),
          'connected_components_above_8': count, 'visible_rgb_identical': bool(np.array_equal(result[:,:,:3][visible],p[:,:,:3][visible])), 'regions': stats, 'web_bytes': output.stat().st_size}
(root / 'assets/star-moon-alpha.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
