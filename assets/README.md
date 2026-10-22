# Cabinet reference asset

The user supplied `shelf.zip` for Milestone 2A. Its sole file, `shelf.png`, is preserved byte-for-byte in `source/shelf.png` (941 × 1672, 2,168,603 bytes).

SHA-256: `70b372ee8aea067fa45a70f2b0e02b6141710d142ad7d406cd6c5c7653b48614`.

The browser loads `public/assets/shelf.webp` (941 × 1672, 296,034 bytes), about 86% smaller. It uses quality-90 WebP encoding with no resizing, cropping or repainting. The original remains available for future exports. No separate license or attribution information was supplied with the image; this record documents its source, not a license grant.

Reproduce the optimized export from the repository root with FFmpeg:

```sh
ffmpeg -hide_banner -loglevel error -i assets/source/shelf.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 public/assets/shelf.webp
```

`src/scene/cabinetLayout.ts` maps image coordinates to percentages within one aspect-preserving stage. Bottle centers are x=265, 470.5, 676; shelf contact planes are y=628, 976, 1324. The existing SVG's glass base is y=134 in its 100 × 150 viewBox. Button hit regions align with the left and right wooden panels; the center panel remains decoration. Bottle art, liquids and controls remain live DOM/SVG elements. The existing pouring portal measures their rendered coordinates and floats above the scene.
