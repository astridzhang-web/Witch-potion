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

The bottle lanes balance the usable span between the side posts and the low flower clusters. The slender glass bases rest beside the flowers; broader bodies stay higher. The three rows retain generous headroom for future longer-neck art. The entire button rectangles, not just their centers, must remain inside the painted side insets, and adjacent bottle hit regions must not overlap. The center star inset has no interaction.

## Applied placement

`src/scene/cabinetLayout.ts` chooses contact heights **668 / 1088 / 1500**, horizontal centers **250 / 420.5 / 591**, and a **170 × 255** SVG viewport. The existing glass base is at (50, 134) in its unchanged 100 × 150 viewBox. This preserves the bottle art's ratio and places its contact point on each shelf surface.

Undo uses `{x:77, y:1542, width:200, height:132}`; restart uses `{x:564, y:1542, width:200, height:132}`. They are center-anchored vertically, so the existing 44 CSS px minimum height expands symmetrically if necessary.

Artwork, bottle hit regions and panels share one stage with aspect ratio **841 / 1870**. Existing safe-area padding and `viewport-fit=cover` remain in effect. At 390×844 and 360×640, the whole image fits in the viewport. At 320×568, the existing minimum stage width of 280px produces about 623px of page height: the base controls are visible, and scrolling reveals the footer and remaining artwork. Desktop centers the portrait stage. No cropping or stretching is applied.

The unchanged foreground animation measures actual SVG coordinates after scaling. Its 920ms timing, curves, tilt, stream and liquid rendering are retained. Top HUD, new-puzzle entry, symbol setting and save status retain their existing layout and functionality.
