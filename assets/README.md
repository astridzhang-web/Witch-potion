# Cabinet reference asset

The user supplied `shelf.zip` for Milestone 2A. Its sole file, `shelf.png`, is preserved byte-for-byte in `source/shelf.png` (941 × 1672, 2,168,603 bytes).

SHA-256: `70b372ee8aea067fa45a70f2b0e02b6141710d142ad7d406cd6c5c7653b48614`.

The browser loads `public/assets/shelf.webp` (941 × 1672, 296,034 bytes), about 86% smaller. It uses quality-90 WebP encoding with no resizing, cropping or repainting. The original remains available for future exports. No separate license or attribution information was supplied with the image; this record documents its source, not a license grant.

Reproduce the optimized export from the repository root with FFmpeg:

```sh
ffmpeg -hide_banner -loglevel error -i assets/source/shelf.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 public/assets/shelf.webp
```

`src/scene/cabinetLayout.ts` maps image coordinates to percentages within one aspect-preserving stage. Bottle centers are x=265, 470.5, 676; shelf contact planes are y=628, 976, 1324. The existing SVG's glass base is y=134 in its 100 × 150 viewBox. Button hit regions align with the left and right wooden panels; the center panel remains decoration. Bottle art, liquids and controls remain live DOM/SVG elements. The existing pouring portal measures their rendered coordinates and floats above the scene.

## Tall-phone cabinet — prepared only (2026-10-22)

A second user-supplied `shelf.zip` contains a redrawn `shelf.png`. It is preserved byte-for-byte under a distinct name, `source/shelf-tall.png`; the previous `source/shelf.png` and active `public/assets/shelf.webp` remain unchanged.

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

### Calibration required before a separately authorized replacement

The active scene still uses the old 941 × 1672 image and its existing coordinates. This redrawn composition is not a uniform stretch of that image, so do not reuse the old coordinates by merely changing the stage ratio.

- Remeasure each of the three shelf contact planes, then the three horizontal bottle centers per shelf (all nine bottle positions). Recheck bottle size, shelf/flower clearance and touch spacing; use the existing SVG base at viewBox y=134 as the contact point.
- Remeasure the left undo and right restart inset bounds, center anchors and hit regions; keep the central inset decorative. Check minimum 44 px touch regions after responsive scaling.
- At replacement time, update the shared image coordinate system and portrait aspect ratio together, then verify top information/safe-area clearance and floating-bottle departure/return alignment at the supported viewports.

No new layout coordinates are applied in this preparation task. Neither the new PNG nor the new WebP is referenced by the game. Replacement and Milestone 2B require a further user instruction.
