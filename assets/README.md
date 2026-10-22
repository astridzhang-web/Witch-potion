# Cabinet reference asset

The user supplied `shelf.zip` for Milestone 2A. Its sole file, `shelf.png`, is preserved byte-for-byte in `source/shelf.png` (941 × 1672, 2,168,603 bytes).

SHA-256: `70b372ee8aea067fa45a70f2b0e02b6141710d142ad7d406cd6c5c7653b48614`.

Milestone 2A loaded `public/assets/shelf.webp` (preserved; no longer the active scene) (941 × 1672, 296,034 bytes), about 86% smaller. It uses quality-90 WebP encoding with no resizing, cropping or repainting. The original remains available for future exports. No separate license or attribution information was supplied with the image; this record documents its source, not a license grant.

Reproduce the optimized export from the repository root with FFmpeg:

```sh
ffmpeg -hide_banner -loglevel error -i assets/source/shelf.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 public/assets/shelf.webp
```

The Milestone 2A layout mapped image coordinates to percentages within one aspect-preserving stage. Its historical bottle centers were x=265, 470.5, 676; shelf contact planes were y=628, 976, 1324. The existing SVG's glass base is y=134 in its 100 × 150 viewBox. Button hit regions align with the left and right wooden panels; the center panel remains decoration. Bottle art, liquids and controls remain live DOM/SVG elements. The existing pouring portal measures their rendered coordinates and floats above the scene.

## Tall-phone cabinet — preparation record (2026-10-22)

A second user-supplied `shelf.zip` contains a redrawn `shelf.png`. It is preserved byte-for-byte under a distinct name, `source/shelf-tall.png`; the previous `source/shelf.png` and `public/assets/shelf.webp` remain unchanged.

| Property | New asset |
| --- | --- |
| Dimensions | 841 × 1870 px |
| Width : height | 841 : 1870 ≈ 0.449733 : 1 (approximately 9 : 20) |
| Original PNG | 2,204,564 bytes |
| Optimized WebP | `public/assets/shelf-tall.webp`, 302,590 bytes (about 86.3% smaller) |
| Original SHA-256 | `27dc4bbf95937a27f19f5873c8a72ddc6f488cb00098112a930d64fc1709598f` |

The WebP retains the full 841 × 1870 image without resizing or cropping. Reproduce the quality-90 export:

```sh
ffmpeg -hide_banner -loglevel error -i assets/source/shelf-tall.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 public/assets/shelf-tall.webp
```

### Calibration scope recorded during preparation

At preparation commit `9ab4eb9`, the active scene still used the old 941 × 1672 image and its existing coordinates. This redrawn composition is not a uniform stretch of that image, so do not reuse the old coordinates by merely changing the stage ratio.

- Remeasure each of the three shelf contact planes, then the three horizontal bottle centers per shelf (all nine bottle positions). Recheck bottle size, shelf/flower clearance and touch spacing; use the existing SVG base at viewBox y=134 as the contact point.
- Remeasure the left undo and right restart inset bounds, center anchors and hit regions; keep the central inset decorative. Check minimum 44 px touch regions after responsive scaling.
- At replacement time, update the shared image coordinate system and portrait aspect ratio together, then verify top information/safe-area clearance and floating-bottle departure/return alignment at the supported viewports.

No layout coordinates were applied at that preparation checkpoint. The subsequent authorized Milestone 2B now activates the tall WebP and recalibrates the layout as recorded below.


## Milestone 2B: active tall cabinet

The game now references **`/assets/shelf-tall.webp`** with a shared **841 × 1870** scene coordinate system. Both PNGs and both WebP files remain byte-for-byte unchanged. No image was repainted, cropped, resized or re-encoded for this replacement.

See [the new artwork measurements and placement notes](cabinet-tall-layout.md) for the measured shelf/clearance bands, chosen nine bottle positions, side-panel hit regions and short-screen scroll behavior. The current layout is defined in `src/scene/cabinetLayout.ts`; independent artwork-region checks are in `tests/cabinet.spec.ts`. The existing SVG art, foreground animation, HUD and footer remain intact.


## Milestone 2C: independent center panel textures

The user explicitly authorized extracting/combining local panel art. The full PNG and WebP cabinet files remain unchanged. These three lossless crops come from the **displayed tall WebP**, ensuring the star front matches its compression/colors:

| File in `public/assets/` | Source crop x, y, width, height | Purpose |
| --- | --- | --- |
| `panel-star.webp` | 300, 1540, 241, 138 | Original central star face |
| `panel-back.webp` | 74, 1540, 208, 138 | Existing left blank brass-edged wooden panel; fitted to center face |
| `panel-wood.webp` | 300, 1300, 241, 138 | Plain wood; darkened in CSS as an opaque recess behind the rotating board |

Reproduce each crop using the corresponding dimensions/offsets (example: star):

```sh
ffmpeg -hide_banner -loglevel error -i public/assets/shelf-tall.webp -vf 'crop=241:138:300:1540:exact=1' -c:v libwebp -lossless 1 -frames:v 1 public/assets/panel-star.webp
```

All three combined are about 88 KiB. No new full-cabinet image was generated. The center face occupies x=300–541, y=1540–1678 in the shared 841×1870 scene. The recess covers the baked-in star even when the board turns edge-on; backface hiding prevents mirrored text/double faces. The reverse reuses neighboring ornament and scales its width, so it is a small art integration rather than bespoke final hinge art.

The settlement crystal is an original inline geometric SVG in `Settlement.tsx`; it conveys completion only and has no associated currency/reward data. Milestone 2C replaces the historical HUD/footer entry placement described in the earlier records.
