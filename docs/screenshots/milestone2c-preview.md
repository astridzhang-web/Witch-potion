# Milestone 2C — real browser previews

Captured from the production build in Linux Chromium, using preset `moon-1` with the original color mapping. The complete board contains its verified 34-move solution; the crystal shows actual moves. These are real rendered pages, not illustration mockups.

| State | Browser capture |
| --- | --- |
| Normal 390×844 | [Full page](milestone2c-normal-390x844.png) |
| Normal 360×640 | [Full page](milestone2c-normal-360x640.png) |
| Crystal settlement, 390×844 | [Screenshot](milestone2c-settlement-390x844.png) |
| Dismissed settlement / new-puzzle panel, 390×844 | [Full page](milestone2c-complete-390x844.png) |
| Star face | [Direct browser clip](milestone2c-panel-star-detail.png) |
| During rotation | [Direct browser clip](milestone2c-panel-turn-detail.png) |
| Back face and neighboring panels | [3× device-scale browser clip](milestone2c-panel-back-detail.png) |
| Forward and reverse flip | [GIF](milestone2c-panel-flip.gif) |

The flip uses the actual 550ms CSS transition. The GIF samples rendered frames every 50ms by pausing/seeking the browser's transition through the Web Animations API; endpoint holds make each face easier to inspect. It shows both settlement dismissal and manual new-puzzle return. It does not measure live device rendering FPS. No image-editor compositing was used. Full-page screenshots retain the fixed requested viewport; detail clips retain the same 390×844 CSS viewport.

The front is extracted from the original star art, the back from its left neighboring wooden/brass panel, and an opaque dark wood recess covers the baked-in star while the panel turns. The existing full cabinet background is unchanged. See [texture provenance](../../assets/README.md).

Limits: the panel is a CSS plane without modeled thickness/hinges; the back reuses existing ornament rather than bespoke new art. The crystal is a lightweight SVG visual with no currency/reward claims. Physical Safari/iOS remains untested.
