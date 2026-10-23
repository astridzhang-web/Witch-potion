# Milestone 2E panel presentation

This is a presentation-only update over the 2D game. `src/game/`, `App.tsx`,
`cabinetLayout.ts`, bottle/pour rendering and existing cabinet/panel/parchment textures
are unchanged. Panel centers remain **177 / 420.5 / 664** in the 841×1870 scene.

## Wooden mechanism

`CenterPanel` retains the existing `revealed`/`blocked` input and manual new-puzzle action.
The presentation timer is **650 ms**, shared with CSS through `--flip-duration`.
Readiness still gates the button; ordinary re-renders do not restart the turn.
Four dark wood-grain CSS edge planes join the front and back at a shallow scene-scaled
3–6 CSS px depth. Faces have hidden backfaces; a fixed opaque wood recess masks the
cabinet's original star even when the rotor is edge-on. A temporary face shading layer
changes light across the turn. No perspective/cabinet coordinate or texture changes.

The brass outline is calibrated to the **208×138** `panel-back.webp` image: top y≈23,
bottom y≈110, sides x≈19/185, inset corner shoulders around x≈39/165. It is stretched
with the same face texture, rather than overlaid in a separate viewport coordinate system.
Three coincident passes form a thin pale highlight, soft body and low-opacity wide halo.
The glow fades in over the last 250 ms of the turn; hover/focus/press adjust it without
changing text. Keyboard focus strengthens the actual contour, never an underline.

## Stardust

`PanelMagic.tsx` defines **36 stable emitters**, derived once from that brass perimeter.
Their different 1.8–3.0 s lifetimes and negative phase offsets give roughly 20–30 visible
motes at a time. Most are subpixel-sized dots at phone scale; four are miniature stars.
Each fades in, twinkles independently, drifts approximately 8–24 source-image units
outward (a slight upward bias), and fades away. There is no random regeneration during
React rendering, no RAF or interval, no particle library, and no per-frame state updates.
Particles start only after readiness and pause/fade when the panel is deactivated.
Restoring a dismissed completed save initializes directly to the back, with running dust.

Both SVG layers have `pointer-events: none` and visible overflow. The four wood edge
planes and shading layers also ignore pointer input. Reduced motion skips the turn,
halo transitions and all dust animation, leaving the steady contour and four static glints.
The only JS timer and media-query listener are cleaned up when the component unmounts
or the target face changes.

## Type and alignment

The two local, OFL-licensed font subsets and reproducible build instructions are documented
in [public/fonts/README.md](../public/fonts/README.md). Labels/title use the requested
LXGW ZhenKai; ordinary UI uses Source Han Serif Medium, with existing Georgia numerals.

Side buttons use equal flexible columns around an intrinsic central text column. Arrows
live in the left column with a small positive gap, rather than shifting the text. Their
SVG arrow bounds were lightly normalized; stroke width remains 1.5. The center label
uses the same font sizing and line height, with identical stars in equal side columns.
No scene coordinates changed. Font preloads, explicit line heights and symmetric grids
keep panel/label centers stable even when fonts are delayed; fallbacks stay accessible.

## Evidence and limits

See [the browser gallery](../docs/screenshots/milestone2e-preview.md). Debug lines exist
only in the capture browser, never in the app. The cyan cross marks panel center; pink
lines bound the centered text line box. The MP4 is a real Chromium screencast; the GIF is
a cropped enlargement of that recording. No generated reference artwork is used in it.

The wood thickness is a lightweight CSS box rather than a physical hinge simulation.
Phone-scale dust is intentionally small; inspect the enlarged detail/movie to judge its
independent motion. Physical Safari/iOS and low-end GPU performance remain unverified.
No changes to bottle shapes, liquid physics, rewards, saves, home, shop, audio or PWA.

## 2E visual patch overrides

The same contour now combines a `#f8cd91` fine inner edge, `#eab377` warm brass body
and a diffuse `#fff0d0` champagne halo. The active SVG opacity stays at **0.94**;
hover is 0.98, keyboard focus 1 with a clearer fine edge, and pressed 0.88. The same late-turn
fade-in remains, but the resting appearance no longer depends on focus/hover. Dust fill is
paler warm white; emitter geometry and animation are unchanged.

Side content now uses mirrored inline-flex groups biased outward (undo icon then text;
restart text then icon), per the new user direction. The previous text-centered side grid
is superseded. CenterPanel structure/650ms timer, coordinates and all textures remain unchanged.
See [patch evidence](../docs/screenshots/milestone2e-patch-preview.md).
