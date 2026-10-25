# Milestone 3A · three bottle prototypes

This is a small, playable SVG prototype, not a delivery of nine final illustrated bottles.
The supplied concept guides the long necks, clear bellies and thin pale brass details;
none of the concept image is cropped, baked into a bottle or used as scene artwork.

## Shared contract

- `src/scene/bottleGeometry.ts` owns three silhouettes: **round**, **pear**, **faceted**.
  Columns repeat these three types across the existing nine slots; types are presentation
  only and are not written to saves. Existing puzzles/history/colors retain their IDs.
- All drawings use **100×150**, mouth center **(50,10)** and shelf contact **(50,134)**.
  The existing cabinet positions, display boxes and contact shadows remain unchanged.
- Each has an inset liquid cavity, separate transparent outline/highlights, pale brass
  neck collar/pendant and a restrained foot accent. Curved cavity boundaries are sampled
  once; the exact same polygon is used for SVG clipping and the liquid calculation.
- Four units fill the round/pear bodies to y76, faceted to y72, leaving the long neck empty.
  Each unit occupies one quarter of that shape's designated **2D cavity area**. Layers
  therefore have different heights in tapered sections, but all four remain readable.
- The seven existing color names and numeric identities are retained. Palette saturation
  and contrast are softened; small gradients and translucent fills remain independent of
  the glass. There are no glitter, snow, star, pearlescent or special potion effects.

## Gravity and pour connection

Glass rotates normally. Liquid bands counter-rotate inside its cavity clip, so boundaries
stay horizontal in screen coordinates during lift, pour and return. Horizontal-plane
clipping plus a bounded area solve preserves each visible unit, including fractional
source loss/receiver gain. This is a **2D area approximation**, not a 3D volume simulation,
fluid solver, slosh model or physical refraction.

The old fixed 76° tilt cannot drain the new long necks naturally. During pouring, a bounded
angle solve puts the current top surface at the downhill lip; tilt increases as liquid
leaves. The flight placement follows that lip, keeping the stream attached. The short
wet-rim stroke bridges the glass lip to the stream. The receiver's internal stream/ripple
is clipped to its own cavity and ends at the computed rising surface.

The old flight/commit lifecycle is retained: approach **0–260ms**, transfer **260–640ms**,
return **640–920ms**, one commit at 640ms. The position easing remains smoothstep; only
mouth-relative placement/tilt are adapted to these new geometries. The input lock,
resize/scroll/visibility handling, reduced motion and atomic finalization are unchanged.
No new timer, animation dependency or persistent game state was introduced.

## HUD and verification

HUD label and number now share the inherited Source Han Serif Medium size, weight and
line height, with baseline alignment. The two shoulder anchors and help button are intact.

Unit checks cover known polygon area, four readable bands, fractional fill, left/right
rotational area conservation, draining angle monotonicity and lip contact. Browser checks
inspect actual SVG world transforms for horizontal boundaries and exact stream/lip contact,
all three moving shapes, rising receiver surfaces, same-row/cross-row pours and return.
Existing game, rewards, saves, dialogs, cabinet and panel regressions remain required.

See [real-browser evidence](../docs/screenshots/milestone3a-preview.md). Remaining visual
limitations are intentionally simple vector glass/brass, equilibrium surfaces without
inertia, no 3D refraction, and no physical Safari/iOS or low-end-device profiling.
