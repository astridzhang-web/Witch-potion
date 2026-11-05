# Milestone 3C · warm star–bead–moon–bead–star glass

## Supplied art and transparency

The archive contains one image, `长颈玻璃瓶.png`, matching the requested regular stars,
small beads and crescent on a fine shoulder ring. No long pendant or added base.
The original is retained unmodified at `assets/reference/长颈玻璃瓶.png`:
**1024×1536 RGBA, 1,585,282 bytes**, SHA-256
`bd17fb6e655b324314a830d59517a318ad8fc93869ba75144d87c98aa9cb5316`.
All old source PNGs and WebPs remain unchanged.

Alpha is measured, not inferred from a black preview: **973,783 zero / 599,081 partial /
0 fully opaque pixels**. The central belly rectangle `(440,1000)–(580,1190)` averages
only **0.377/255** alpha (max 2), so the black-looking center really is transparent.
The neck averages **153.40/255**, shoulder **98.69/255**, and inner left belly **97.25/255**;
these broad pale regions need attenuation to keep liquid readable.
[Measured source/web regions](star-moon-alpha.json).

## Reversible preparation

`python scripts/prepare-star-moon-glass.py` requires Pillow, NumPy and SciPy offline only.
The checked-in output needs none of these at runtime.

- Select the principal connected artwork above alpha 8, with a 3px feathered allowance.
  Reject isolated matte and negligible alpha 0–2 noise outside/inside the illustration.
- Continuously attenuate neutral inner-glass opacity according to distance from the real
  silhouette, retaining stronger edge structure and native warm highlights/metal.
  Mouth and foot have their own structural opacity floor. There is no circular belly cutout.
- Suppress highly saturated fringe pixels only at the extreme outer edge. No contour,
  star, bead, crescent, ring, mouth or foot is redrawn, warped or repositioned.
- **Every retained visible RGB byte is identical to the supplied PNG**, verified after
  decoding the lossless WebP. Only alpha changes. Fully invisible RGB is zeroed for size.
  No tint, color matrix, blur or extra highlight image is applied to this new renderer.

Output: `public/assets/bottles/star-moon-glass.webp`, **1024×1536, 545,660 bytes**,
65.6% smaller than the PNG. SHA-256
`9cb5396789d4d8b512d9ca25a19312a8411f129a0f7de248401306b0ab643134`.
Its nonzero-alpha bounds are `(132,112)–(892,1447)`; compare the source's noisy
`(0,7)–(1014,1536)` extent. Mean neck/shoulder/inner-belly alpha becomes
**27.05 / 16.79 / 17.16 out of 255**. Broad glass reflection remains visible on dark wood;
the original near-zero central belly stays clear.

## Geometry and shared rendering

`src/scene/starMoonGlass.ts` measures the new image independently:

- Inner mouth center **(512,143)** maps to SVG **(50,10)**.
- Dense glass foot **(512,1440)** maps to SVG **(50,134)**; remaining soft fringe extends
  about half a CSS pixel below this at the 390px viewport.
- A single scale **124/1297** preserves the native 2:3 aspect. Current index-0 1.13×
  viewport and cabinet contact are unchanged. New maximum visible width is about 63px,
  comparable with the previous ≈60px formal bottle; adjacent hit targets remain separate.
- Inner aperture is approximately x374–650, lip radius **13.2 SVG units**.
- Cavity follows the inner neck/shoulder and the independently measured belly walls
  (leftmost interior near x171,y1077), with floor **y1335** and four-unit line **y850**.
  This is a capacity-equivalent 2D area model, not uniform rectangular layer heights.

`bottleAppearance(0)` still selects the sole textured sample; slots 1–8 retain 3A art.
The internal material choice selects both artwork and geometry once per page load:

| URL parameter | Art and geometry |
| --- | --- |
| none / `?glass=star-moon` | New 3C warm star–moon PNG-derived foreground and measured cavity |
| `?glass=candle` | Exact previous 3B warm experiment and old measured cavity |
| `?glass=original` | Previous original 3B treatment and old measured cavity |

This selector has no player UI and is never written to a save. Reload after changing it.
The new `StarMoonGlass` branch bypasses all old MoonGlass opacity masks, matrices and
foot-fade filters. Resting, flying, receiving and returned bottles use the same branch.
Liquid rendering, gravity correction, lip-contact solve and **640ms commit / 920ms return**
are preserved; `Bottle.tsx`, `PourAnimation.tsx`, cabinet positions and `src/game/` are unchanged.

## HUD and evidence

A single inline-flex wrapper translates the right group's visible content **1 CSS px**.
The outer 18% / 82% shoulder anchors, common 7.3% top (and existing narrow fallback),
container size, font/weight, 6px internal gap, left text and help remain unchanged.
Browser captures compare 0 / 1 / 1.5px on the same actual page and include ink bounds,
rather than relying on outer-container coordinates alone.

[Browser gallery, light-background diagnostics, HUD comparisons and real pour recording](../docs/screenshots/milestone3c-preview.md).
This is transparent illustration over independent SVG liquid, not physical refraction.
Fine ornaments occupy only a few phone pixels; mild original edge reflections remain.
Physical Safari/iOS and low-end-device performance are not verified. Stop after this sample.
