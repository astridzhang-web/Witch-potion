# Milestone 3B · index 0 moon-glass sample

Historical 3B treatments are retained through `?glass=original` / `?glass=candle`.
The default 3C artwork and measured cavity are documented in [star-moon-glass.md](star-moon-glass.md).

## Source and web asset

- User upload: `透明玻璃月影药瓶.zip` → `透明玻璃月影药瓶.png`.
- Unmodified original: [reference/透明玻璃月影药瓶.png](reference/透明玻璃月影药瓶.png).
  **1086×1448, RGBA, 1,153,218 bytes**.
  SHA-256 `c5bf18b93ccfa1849ecf1e57c61dfdcd7a1acee9edf23adb31dc7964449e5643`.
- Served texture: [../public/assets/bottles/moon-glass-source.webp](../public/assets/bottles/moon-glass-source.webp).
  **1086×1448, lossless WebP, 776,836 bytes** (32.6% smaller).
  SHA-256 `57f8113e690789e6fec9b1c0eed59e5e1cbcc2c20d79ed7c95651790ed5da368`.
  Decoded RGBA pixels were compared to the PNG and are **identical**, including transparency.
  No resize, repaint, shape replacement or baked liquid was used.
- To reproduce the format conversion with Pillow: open the original and call
  `image.save(output, lossless=True, method=6, exact=True)` with a `.webp` destination.
  Pillow is an offline asset tool, not a runtime dependency.

## Original 3B alpha inspection and non-destructive treatment

The original contains **976,336 alpha-zero**, **596,132 partially transparent** and **60 fully opaque** pixels.
Its nonzero-alpha bounding box is `(66,2)–(1063,1448)`, including detached low-alpha residue;
the principal glass silhouette lies approximately in `(164,23)–(922,1411)`.

| Source region (pixel bounds) | Mean original alpha / 255 | Mean rendered alpha / 255, approximately |
| --- | --- | --- |
| Central belly, (420,900)–(660,1150) | 10.52 / 255 = 4.1% | 4.73 / 255 = 1.9% |
| Central neck, (515,250)–(565,560) | 252.18 / 255 = 98.9% | 92.03 / 255 = 36.1% |
| Shoulder, (460,650)–(630,760) | 242.97 / 255 = 95.3% | 96.63 / 255 = 37.9% |

Original values are direct pixel measurements. Rendered values are sampled from the actual
empty `BottleArt` rendered by Chromium on a transparent background at 4× density, mapped
back to the same regions (sampling/antialiasing make these approximate).
The normal acceptance captures retain the real wooden cabinet.

`MoonGlass.tsx` draws the same lossless texture in two foreground passes:

1. An SVG luminance mask retains the outer glass at `#ddd`, attenuates the cavity at
   `#707070`, and the formerly opaque neck at `#444`. A hand-measured outer clip removes
   detached matte residue. The original belly is already transparent; this preserves its
   visibility through to the wood and dynamic liquid.
2. A warm-detail pass uses a clamped `4×(R−B)` alpha key, composited with the original
   source alpha, to retain the gold moon, star/chain ornaments and warm rim highlights
   without restoring the opaque blue-gray neck. Original RGB texture detail is preserved.

These are reversible rendering operations; no alpha changes are burned into the PNG/WebP.
The art stays recognizable at phone size, but the pendant and fine chains are inevitably
only a few screen pixels. Broad original reflections still gently lighten color near the
belly edge, especially pale gold; the middle stays readable. This is not perfect glass
refraction or background displacement, and highlights rotate with the illustrated bottle
rather than with a simulated light source.

## Geometry and layer ordering

`bottleAppearance(index)` explicitly returns `moon-glass` only for **index 0**.
Slots 1–8 keep the three 3A appearances, including both other round slots. The same selector
is used for resting, flying and receiving sprites; this is not persisted game state.

`moonGlass.ts` maps artwork mouth **(543,52)** to SVG **(50,10)** and contact **(543,1410)**
to **(50,134)** using a single uniform scale **124/1358**. Both axes share this transform,
preserving the native 1086:1448 ratio, existing shelf placement and hit box. The art's
outer silhouette, cavity, mouth/lip and base were measured separately from the old round
prototype. Cavity bottom is source y1328, leaving the illustrated thick glass foot clear;
four units reach source y815. The downhill mouth radius is **10.3 SVG units** (prototypes
retain 7). The existing 2D area/tilt solve uses the new cavity and lip.

Layer order: dynamic clipped liquid → internal receiving stream/ripple → masked glass
and original gold detail → wet lip/external stream. The receiver's inner stream is behind
the glass rather than painted over its ornaments. Glass and liquid share the SVG/viewBox;
only the liquid counter-rotates to keep its surfaces horizontal.

The 260/640/920ms timeline, commit/finalization, interruption handling and reduced motion
are unchanged. No changes to the cabinet, slot coordinates, HUD, palette, game rules,
rewards, saves, panel mechanism or other eight bottles.

## Validation and evidence

**85 unit tests and 96 Playwright cases passed; production build passed.** Added coverage
for the formal cavity's area/tilt and exact slot selection, natural texture aspect and
mouth/base transforms, source/receiver texture continuity, landing/undo/reload and reduced
motion. Existing alignment, gameplay, settlement, crystal and save regressions passed.

Same-state 390×844 comparison against 3A shows the intended large change at slot 0.
Other bottles differ by at most 2/255 per RGB channel (browser raster/compositing rounding);
empty slots 7/8 and HUD pixels are identical. No other bottle geometry/art was changed.

[Real browser gallery and recording](../docs/screenshots/milestone3b-preview.md).
Physical iOS/Safari and low-end device filter performance remain unverified. Stop after
this single sample; do not distribute the formal art to additional slots automatically.

## 3B Patch · 2026-11-05

The original PNG and lossless WebP remain byte-for-byte unchanged. The following overrides
apply to the original treatment documented above; its alpha sample figures describe 3B,
not this patch.

- `MoonGlass.tsx`: outer mask `#ddd → #b8b8b8`, cavity `#707070 → #606060`;
  neck attenuation remains `#444`. A mild sRGB color matrix shifts the existing cool-white
  reflection toward candlelight, leaving the liquid and separate original gold detail untinted.
- A shared luminance gradient over SVG y121–134 attenuates both texture passes at the foot
  from 100% to 60%, preventing the gold-detail pass from restoring the brightest bottom ring.
  It does not affect liquid capacity or color. There is no new glow, opaque tint or painted art.
- `cabinetLayout.ts` enlarges only index 0 by **1.13×**, about the original shelf foot y134.
  Its hit box keeps source width170 and grows height255→288.15. The SVG viewport is centered
  at width113% (192.1 source units), preserving uniform scale and the natural image ratio.
  Visible glass remains inside the original-width target; enlarged empty SVG margins have
  pointer events disabled so adjacent controls cannot be intercepted. Other targets stay unchanged.
- `styles.css` applies the scoped SVG viewport variables. The existing animation measures its
  actual screen transform, so source/receiver overlays and the lip/stream inherit the new scale.
  No changes to geometry, liquid math, selection lift, timeline or atomic game-state commits.
- HUD whole-group anchors are mirrored at x20% / 80%, both at y6.738%. The existing shoulder
  clearance remains; fonts, text, help button and all other controls are unchanged.

[Patch screenshots and source/receiver recording](../docs/screenshots/milestone3b-patch-preview.md).
Reflections remain illustrated rather than physically simulated; the pale liquid edge may still
brighten slightly. Physical Safari/iOS and low-end device performance remain unverified.

## Visual Polish II · reversible candle comparison (2026-11-05)

- `?glass=original` selects the exact 3B Patch treatment; `?glass=candle` or no query selects
  this experiment. This page-level selection is shared by resting/flying/receiving instances,
  has no UI and writes no save state. Reload after changing the query.
- New `public/assets/bottles/moon-glass-candle.webp`: **1086×1448, 667,298 bytes**, lossless.
  The supplied PNG and `moon-glass-source.webp` remain unchanged. The variant's alpha bytes
  are also identical to the original. No geometry, size, palette or cavity edits.
- Reproduce offline with `python scripts/prepare-moon-glass.py` (Pillow and NumPy required).
  Source-alpha-weighted RGB smoothing (4 source-pixel radius, ≈0.32 CSS px at 390×844)
  is blended only in the neck/shoulder and foot bands. It preserves the source alpha and
  protects warm-metal pixels. The mouth and broad belly aren't globally blurred.
- A restrained champagne luminance mix varies from stronger candle reflection on the left
  to more retained cool reflection on the right. This is baked only into the separate glass
  variant, not the liquid. Runtime does not add a blur filter to animated sprites.
- Runtime cavity/neck masks are `#585858` / `#383838` (original `#606060` / `#444`);
  the foot fade ends at `#666` instead of `#999`. The original separate warm-gold detail
  pass still reads the unmodified original texture, preserving star, chain and moon detail.
- The internal original branch retains its previous mask values, matrix and texture exactly.
  It is a comparison/rollback option, not a final art selection. Both share the same 13%
  scale and timing. The additional cached variant costs ~652 KiB; no new runtime library.

[Same-state comparisons, HUD measurements and actual browser recording](../docs/screenshots/milestone3b-polish2-preview.md).
This changes illustrated highlights, not physical refraction; reflected light still rotates
with the artwork. Actual Safari/iOS and low-end-device performance remain unverified.
