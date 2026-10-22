# Tall cabinet layout measurements (Milestone 2B)

Reference: the unchanged `assets/source/shelf-tall.png`, **841 × 1870 px**. The browser uses the existing `public/assets/shelf-tall.webp` at the same dimensions. Coordinates below are source-image pixels, measured from the top-left. They are not a rescale of the previous cabinet.

## Artwork inspection landmarks

These bands describe the visible wood surfaces and inset regions. The browser tests use these independent ranges, rather than importing the layout constants or comparing duplicated anchor values.

| Region | Measured image-space range |
| --- | --- |
| Upper shelf landing surface | y=660–674 |
| Middle shelf landing surface | y=1080–1096 |
| Lower shelf landing surface | y=1490–1510 |
| Left, center, right bottle center lanes | x=240–260, 410–431, 581–601 |
| Left inset face | x=75–281, y=1540–1677; visual center x=170–185, y=1598–1618 |
| Right inset face | x=560–770, y=1540–1677; visual center x=655–674, y=1598–1618 |

The bottle lanes balance the usable span between the side posts and the low flower clusters. The slender glass bases rest beside the flowers; broader bodies stay higher. The three rows retain generous headroom for future longer-neck art. The entire button rectangles, not just their centers, must remain inside the painted side insets, and adjacent bottle hit regions must not overlap. The center star inset has no interaction during normal play; Milestone 2C reveals its new-puzzle control after settlement dismissal.

## Applied placement

`src/scene/cabinetLayout.ts` chooses contact heights **668 / 1088 / 1500**, horizontal centers **250 / 420.5 / 591**, and a **170 × 255** SVG viewport. The existing glass base is at (50, 134) in its unchanged 100 × 150 viewBox. This preserves the bottle art's ratio and places its contact point on each shelf surface.

Undo uses `{x:77, y:1542, width:200, height:132}`; restart uses `{x:564, y:1542, width:200, height:132}`. They are center-anchored vertically, so the existing 44 CSS px minimum height expands symmetrically if necessary.

Artwork, bottle hit regions and panels share one stage with aspect ratio **841 / 1870**. Existing safe-area padding and `viewport-fit=cover` remain in effect. At 390×844 and 360×640, the whole image fits in the viewport. At 320×568, the existing minimum stage width of 280px produces about 623px of page height: the base controls are visible, and scrolling reveals the footer and remaining artwork. Desktop centers the portrait stage. No cropping or stretching is applied.

The unchanged foreground animation measures actual SVG coordinates after scaling. Its 920ms timing, curves, tilt, stream and liquid rendering are retained. This was the Milestone 2B behavior. Milestone 2C changes HUD/settings/new-puzzle entry placement without changing bottle or side-panel geometry.

## Contact-shadow visual review (after Milestone 2B)

The first row was re-inspected in a live 390×844 browser and in 3× device-scale detail captures. Its glass bases already land inside the upper shelf's y=660–674 surface band. The side bottles are clear of the posts and sit beside the low flower clusters; after removing the detached ellipses, no independent horizontal or vertical placement defect justified moving them. All three rows therefore retain the coordinates, dimensions and hit regions above.

The previous shared `BottleArt` ellipse had center y=140 while the glass base is y=134. Its hard 64×8 SVG-unit footprint sat below the glass and, against the original warm shelf highlights, looked like a separate pad. Because that ellipse belonged to the shared SVG, the flying sprite also carried it.

The replacement is one stationary `.bottle-contact-shadow` element per bottle button, drawn behind the glass. A dark radial gradient is centered at y=134/150, with a 48%-wide and 2.4%-high box (48×3.6 in the SVG coordinate proportions). It adds no orange light. The selected source's shadow is dimmed at the shelf plane; during flight it is hidden immediately, then restored after landing. The receiver retains its one stationary shadow. Shared `BottleArt` now contains only the original glass/liquid drawing, so neither portal sprite carries a shelf-contact ellipse. The existing animation mechanism remains unchanged.

See [the before/after browser captures](../docs/screenshots/milestone2b-contact-comparison.md). No background art, bottle shape, size, palette, HUD, footer or layout coordinates changed in this visual correction.


## Milestone 2C center panel

The measured middle inset face spans approximately x=298–544, y=1538–1680; the carved star sits inside x≈337–506, y≈1560–1658. The independent panel is placed at x=300, y=1540, width=241, height=138. At the minimum 280px scene width this gives approximately 80×46 CSS px, preserving the ≥44px touch requirement without overlapping either side panel. Text shares the face center. Its separate star front, blank ornamented back and opaque wood recess are documented in [asset notes](README.md). Existing bottle and side-button coordinates are unchanged.
