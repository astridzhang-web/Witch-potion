"""3G reversible highlight preparation. Offline Pillow/NumPy/SciPy only.

Reads the retained 3F WebP; never edits the source. Compresses bright neutral glass
by region, protects the complete shoulder ornament, and exports a separate response
mask for world-space lighting. No blur, geometry edits or new opaque belly pixels.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt

root = Path(__file__).resolve().parent.parent
source = root / 'public/assets/bottles/star-moon-glass.webp'
p = np.asarray(Image.open(source).convert('RGBA')).copy()
rgb, alpha = p[:, :, :3].astype(float), p[:, :, 3].astype(float)
y, x = np.mgrid[:p.shape[0], :p.shape[1]]

def smooth(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

# Neutral bright reflections only; saturated warm glass remains largely untouched.
chroma = rgb.max(2) - rgb.min(2)
neutral = (1 - smooth(35, 110, chroma)) * smooth(115, 220, rgb.mean(2))
# Protect the entire star–bead–moon–bead–star ring, not just a color threshold.
metal = (x >= 340) & (x <= 690) & (y >= 675) & (y <= 805)
protect = smooth(325, 340, x) * (1 - smooth(690, 705, x)) * smooth(660, 675, y) * (1 - smooth(805, 820, y))
neutral *= 1 - protect
depth = distance_transform_edt(alpha > 3)
interior = smooth(2, 16, depth)
foot = smooth(1300, 1370, y)
mouth = 1 - smooth(170, 205, y)
# Interior white patches and the dense foot lose more energy than the thin silhouette.
compression = neutral * (.13 + .09 * interior + .10 * foot - .035 * mouth)
attenuation = neutral * (.13 + .23 * interior + .16 * foot - .03 * mouth)
out = p.copy()
tone = rgb * (1 - compression[:, :, None])
# Very small warm-white shift only in the neutral highlights being compressed.
tone[:, :, 1] *= 1 - neutral * .018
tone[:, :, 2] *= 1 - neutral * .055
out[:, :, :3] = np.uint8(np.clip(tone, 0, 255) + .5)
out[:, :, 3] = np.uint8(np.clip(alpha * (1 - attenuation), 0, 255) + .5)
out[metal] = p[metal]
out[out[:, :, 3] == 0, :3] = 0

# Alpha-only response is restricted to existing neutral reflection pixels. It cannot
# light transparent wood/liquid center, the ornaments, or anything outside the art.
response = np.zeros_like(p)
response[:, :, :3] = 255
response[:, :, 3] = np.uint8(np.clip(alpha * neutral * 1.1, 0, 165) + .5)
response[metal, 3] = 0
response[response[:, :, 3] == 0, :3] = 0
outputs = {'soft': root / 'public/assets/bottles/star-moon-glass-soft.webp',
           'response': root / 'public/assets/bottles/star-moon-glass-response.webp'}
for name, pixels in [('soft', out), ('response', response)]:
    Image.fromarray(pixels).save(outputs[name], lossless=True, method=6, exact=True)

regions = {'mouth': (350, 112, 675, 185), 'neck': (400, 205, 625, 650),
           'belly_center': (440, 1000, 580, 1190), 'belly_edge': (150, 920, 305, 1230),
           'foot': (280, 1345, 740, 1447)}
stats = {}
for name, (l, t, r, b) in regions.items():
    old, new = p[t:b, l:r].astype(float), out[t:b, l:r].astype(float)
    # Premultiplied luma measures reflected energy independently of a preview's matte.
    luma = np.array([.2126, .7152, .0722])
    energy = lambda a: float(((a[:, :, :3] @ luma) * a[:, :, 3] / 255).mean())
    stats[name] = {'bounds': [l, t, r, b], 'before_energy': energy(old), 'soft_energy': energy(new),
                   'before_alpha': float(old[:, :, 3].mean()), 'soft_alpha': float(new[:, :, 3].mean())}
report = {'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'dimensions': [p.shape[1], p.shape[0]], 'ornament_rgba_identical': bool(np.array_equal(out[metal], p[metal])),
          'alpha_never_increased': bool(np.all(out[:, :, 3] <= p[:, :, 3])),
          'response_inside_source': bool(np.all(response[:, :, 3][alpha == 0] == 0)),
          'regions': stats, 'exports': {k: {'bytes': v.stat().st_size, 'sha256': hashlib.sha256(v.read_bytes()).hexdigest()} for k, v in outputs.items()}}
(root / 'assets/star-moon-soft-analysis.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
