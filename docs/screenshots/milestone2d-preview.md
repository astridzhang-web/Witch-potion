# Milestone 2D — actual browser evidence

Captured from the current production build in Linux Chromium on 2026-10-23. All scenes use the real 841×1870 cabinet and live completed SVG bottles. The supplied concept images are not used as screenshots or game backgrounds.

| View | Screenshot |
| --- | --- |
| Single crystal, 390×844 | [35-move completion / +1](milestone2d-single-390x844.png) |
| Two crystals, 390×844 | [34-move completion / +2](milestone2d-double-390x844.png) |
| Narrow 360×640 | [Two-crystal settlement](milestone2d-double-360x640.png) |
| Narrow 320×568 | [Two-crystal settlement](milestone2d-double-320x568.png) |
| Desktop 1280×900 | [Centered settlement](milestone2d-double-desktop.png) |
| Enabled central panel | [390×844](milestone2d-panel-active-390x844.png) · [3× detail](milestone2d-panel-active-detail.png) |
| Keyboard focus | [390×844](milestone2d-panel-focus-390x844.png) · [3× detail](milestone2d-panel-focus-detail.png) |

The 34-move example follows `moon-1`'s verified witness. The 35-move example replaces its first 1→8 transfer with legal 1→9→8 transfers and then follows the same remainder. Each browser starts one move before victory with the full legal history, performs the final move, and lets the application calculate and persist the reward. The screenshot data is not a fabricated reward balance.

Both 390×844 settlements have the same measured parchment size: approximately 274×456.84 CSS px. One crystal is centered, two sit symmetrically near the middle. Paper, circle, images and text are independent layers. The footer is inside the paper with room above the bottom ornament. The close control remains at least 44×44 CSS px; smaller available heights can scroll inside the dialog. Reduced motion was enabled for the static settlement captures; the original 920ms flow is separately covered by full animated browser regression tests.

Button screenshots distinguish a normally enabled button after focus moves away from it and actual keyboard focus reached with Tab. Details are direct browser clips at 3× device scale using the same 390×844 CSS viewport. No screenshot compositing or image-editor adjustments were used.

The final focus contour follows the painted brass edge; it does not underline or animate the text. Paper grain, crystal facets and the simpler SVG scroll are adaptations of the reference rather than pixel-identical reproduction. Physical iOS/Safari remains untested. See [asset provenance](../../assets/README.md) and [progress/migration policy](../../PROGRESS.md).
