# Moonlit Alchemy · 月夜魔法药剂室

A personal, non-commercial, mobile-first potion sorting game. Primary UI language: Chinese. Free, open-source tooling; no backend, accounts, analytics, ads, purchases, paid services, or paid assets. Do not deploy publicly without explicit user approval.

## Fixed game rules

- Exactly 9 open potion bottles in a 3 × 3 grid.
- Exactly 7 colors, 4 units per color, capacity 4 per bottle.
- Initially 7 full mixed bottles and 2 empty bottles.
- Tap a source, then a destination. Empty destinations or matching top colors only.
- Transfer the maximum contiguous top-color group that fits; never split a group by user choice.
- Invalid moves preserve the board and move count.
- Win only with 7 full monochrome bottles and 2 empty bottles.
- Undo, restart the same puzzle, new puzzle, move count, victory feedback, automatic local progress saving.
- Solvability is mandatory: use presets with executable solution witnesses, never unchecked random shuffling. Color/bottle permutations may preserve proven solvability.

## Technical decisions

- React + TypeScript + Vite; SVG bottle rendering and CSS layout. No 3D engine.
- Pure game rules independent of UI and rendering. A legal pour produces a transfer description so later animations can consume the same transaction.
- Immutable board snapshots for undo; versioned, validated localStorage saves.
- Vitest for rules, state transitions, saves, and replaying every puzzle solution; Playwright with local Chromium for actual browser interactions and mobile layout.
- No runtime external fonts, assets, or APIs. Rendering assets are local SVG/CSS plus the user-supplied cabinet image (original PNG retained, optimized WebP served).
- Use existing checkout in `/workspace/Witch-potion`; cloud tasks are already isolated. Do not create Git worktrees unless explicitly requested.
- Keep dependency lockfile committed and use `npm ci` in fresh environments.

## Visual direction

Midnight navy and blue-purple, champagne gold, elegant celestial details and a moon header. Cozy fantasy alchemy workshop, not a utility dashboard. Chinese typography, generous touch targets, restrained ornament.

Open glass bottles with rounded bodies and long slim necks; no corks. Translucent silver-gray contours, curved reflections, slight silhouette variations, consistent capacities. Luminous rose-red, amethyst, mint, sky blue, honey gold, coral orange, and vivid orchid pink must be distinguishable. Future refinement adds many tiny white suspended sparkles, gentle gradients, and subtle motion.

Future workshop artwork: wooden workbench, ingredient shelves, books, parchment, brass tools, candles and moonlight. Background depth must not compromise the puzzle's clarity.

## Milestones and scope

The original roadmap below is historical. Subsequent explicitly authorized 2A/2B/2C/2D/2E scopes supersede its sequence and UI details; see the current 2E requirements at the end.

1. **Stable playable foundation — complete.** App structure, complete rules, responsive 3 × 3 board, attractive placeholder glass, controls, saves, verified puzzles, useful automated tests, build, checkpoint commits and push when permitted.
2. **Workshop artwork — requires a new instruction.** Atmospheric background, refined bottle variations, luminous liquids, dense tiny sparkles; small-screen legibility/performance checks; commit.
3. **Pouring animation.** Lift, tilt, stream, flowing sparkles, consistent liquid levels, ripples and return. Lock conflicting input, respect reduced motion, optimize and commit. Do not implement before stable core gameplay.
4. **Finished PWA.** Manifest, installable icons, offline cache, launch appearance, persistence/install/responsiveness verification, deployment configuration and documentation; commit. Ask before public deployment.

The eventual PWA must work without internet after caching, support portrait touch and mouse, safe-area insets, narrow screens, no horizontal overflow, reduced motion, local settings and progress. PWA/offline completion is explicitly milestone 4, not a milestone 1 claim.

## Quota-safe continuation

Complete one stable milestone at a time. Keep working builds and frequent meaningful Git checkpoints, push committed work when allowed. Maintain this spec and `PROGRESS.md` with actual checks, limitations, architecture and the exact next task. Inspect and preserve existing changes on resume. Never claim unimplemented or untested behavior works. Follow only the currently authorized scope; after the authorized Milestone 2E visual refinement, stop for feedback.

## Authorized narrow experiment: floating pour prototype (2026-10-22)

After milestone 1, the user explicitly authorized a **small animation prototype**, independent of the full milestone sequence. Keep the rules, nine-bottle layout, controls, count and save schema intact. Reuse the current SVG art; no workshop redesign, rewards, audio, new levels, PWA or deployment work.

One legal transaction may lift into a foreground body portal, travel near the destination, tilt, show a short top-color stream with synchronized fractional liquid levels, then return. Target duration is about 0.9 seconds. Lock conflicting input until return, respect reduced motion, and settle safely if viewport geometry changes. The existing pure pour transaction remains authoritative; save only a complete board, never fractional visual state. Validate same-row, cross-row, upward/downward, undo and rapid input. Commit/push the prototype with viewable visual evidence, then stop for user feedback. This does not complete milestone 2 or the full milestone 3.

## Historical Milestone 2A: cabinet scene integration (2026-10-22)

Use the supplied empty wooden cabinet as a static, aspect-preserving background; retain its illustration rather than redrawing it. Keep nine independent existing SVG bottles in three rows, bottoms aligned to the wooden shelves. The artwork, bottle positions and wooden-panel hit regions must share one coordinate system. Left panel is undo, right is restart, center is decorative. Keep a compact top puzzle/move display and a subtle new-puzzle entry.

Preserve the current ~920 ms floating-pour system, gameplay, saves, victory feedback and reduced motion. Verify same-row and cross-row pouring, accurate return, input locks, panel clicks and complete framing at 390×844, 360×640, 320×568 and desktop. Keep the original source image and optimize the browser asset. Deliver a full 390×844 screenshot in `docs/screenshots/`, update progress, run tests/build, commit and push `work`.

This stage does not authorize final bottle variations, new animation timing/physics/particles, audio, home transitions, rewards/shop, new level systems, PWA work or public deployment. Stop after 2A; do not begin 2B automatically.

## Historical Milestone 2B: tall cabinet replacement and calibration (2026-10-22)

Replace only the active background reference with the existing 841×1870 `shelf-tall.webp`. Preserve both original assets and both WebP files without modification. Remeasure the new artwork's three shelf contact planes, nine bottle centers/sizes and left/right panel bounds; update the shared aspect-preserving coordinate system. The central panel remains decorative.

Keep the current SVG bottle/liquid rendering, ~920ms animation mechanism and timings, game rules, save format, top HUD/new-puzzle entry and footer settings/status intact. Validate the four specified viewports (390×844, 360×640, 320×568, 1280×900), safe-area handling, touch regions, foreground pouring/return, undo and save compatibility. Short screens may scroll vertically. Test expectations must use independently inspected artwork landmarks.

Run unit tests, production build and browser regressions. Commit real browser screenshots for 390×844, 360×640 and an in-flight 390×844 frame; update progress and push `work`. Do not include unrelated existing uncommitted files. Stop after replacement/calibration: no HUD redesign, center-panel flip, rewards, final bottles, fluid/animation polish, audio, home, shop, PWA or public deployment.

## Authorized Milestone 2B visual correction: placement review and contact shadows

Review the top row against the actual cabinet before deciding whether a small coordinate correction is necessary; retain correctly placed rows and existing bottle size/shape. Replace the detached under-bottle ellipse with a thin, soft, dark contact shadow at the true glass base. Keep stationary contact rendering separate from flying sprite art, hide the departing source's contact shadow and restore it on return. Preserve rules/saves, the 920ms animation and its motion/stream, HUD/footer and all background assets. Deliver same-state browser comparisons, run all checks, update progress, commit/push `work`, then stop.


## Historical Milestone 2C: HUD and completion flow

This scope supersedes the historical top new-puzzle entry, preset numbering, decorative-only center panel, footer settings/save-success text and v1-only save schema described above. The game has no linear levels.

- Top HUD: lifetime completed puzzle count, horizontal move count, and a ≥44px help button. No permanent top new-puzzle button.
- Color symbols remain available and persistent inside the help dialog. Successful auto-save is silent; failure remains a visible warning.
- First victory per puzzle instance increments the lifetime count exactly once. Undo/restart/rewin preserve the credit; only manually starting a new instance resets eligibility. Refresh and repeated animation callbacks cannot recount.
- Save board, verified puzzle, undo history, symbols, lifetime count, current-instance credit and settlement dismissal in one version-2 localStorage record under the existing key. Migrate valid v1 unfinished games unchanged with count 0; a currently solved v1 game receives one credit and pending settlement. Older lifetime history did not exist and cannot be recovered.
- After the final 920ms pour returns, show a lightweight violet-crystal settlement with actual moves and “调配完成”. Any tap or the accessible close/Escape action dismisses it. Pending/dismissed state survives refresh. No reward amount, currency balance or economy.
- After dismissal, retain the winning board and flip the central star panel around its horizontal axis in 550ms. Independent opaque front/back textures and a wood recess cover the star baked into the unmodified background. New-puzzle input becomes available only after the flip; reduced motion swaps immediately.
- The central ≥44px native button manually starts the next verified puzzle, resets moves/history and flips back to the star. Undo/restart on a solved board also restore the decorative face. Never auto-advance.
- Preserve rules, presets, cabinet illustration, all nine bottle placements, SVG/liquid art, contact shadows and the existing pour mechanism/timing. Validate migration/counting, modal/flip state, input locks, keyboard/reduced motion and responsive layout with units and real browsers.

Deliver real normal 390×844 and 360×640 screenshots, settlement, completed-board and panel-flip evidence; update documents, run all checks, commit and push `work`, then stop. Final bottles, perspective compensation, liquid/animation polish, home, rewards/shop, audio, PWA and public deployment remain outside this scope.


## Authorized Milestone 2D: parchment settlement and brass feedback (2026-10-23, current)

This supersedes 2C's geometric crystal, text underline, v2-only schema and prohibition on basic reward bookkeeping. Retain the 550ms panel flip, manual new-puzzle flow, 920ms pour, nine bottle positions/art, rules and original 841×1870 cabinet.

- Use a compact golden parchment record over a softly dimmed/blurred **live completed game**. Never use the cabinet drawn in the supplied settlement reference as the scene background. Paper, Chinese text, astrolabe, reusable transparent amethyst and small scroll icon are independent layers.
- Display actual moves, actual newly granted crystals, and an independent completion increment. One crystal is centered; two are close and symmetric in the same fixed-size circle/panel. Reserve art-only capacity for three without defining a third reward condition. No pedestal.
- First success per puzzle instance grants a base +1. The first success at or below the matching preset's `solution.length` grants a further +1, either together or on a later replay. Reference witnesses are not shortest-path claims. Each instance has at most two crystals; repeated callbacks, undo/restart/reload/closing cannot grant the same credit again.
- Lifetime crystal balance is independent of completed-puzzle count. Persist the board, history, symbols, completion flags, balance, per-instance base/bonus flags and latest receipt atomically as schema v3 under the existing key. Only explicit new puzzle resets instance eligibility, including when preset IDs recur.
- No retrospective crystals on v1/v2 migration. Preserve all valid board/history/settings; retain v2 completion/dismissal exactly, and retain 2C's v1 completion migration. Retire the base for an already-counted legacy instance with balance 0; its benchmark bonus remains available on a future successful replay. Uncompleted legacy instances remain fully eligible. A pending migrated settlement shows +0 crystals and “已记录”; a dismissed one stays dismissed. v1 cannot recover completion history that was never stored.
- Newly earned replay bonuses reopen settlement after the pour returns, showing +1 crystal and “已记录” for completion count. Replays without a new credit keep the existing no-repeat-settlement behavior. No fabricated +1/+2 receipt.
- Replace all central-button underlining with a subtle warm brass-contour glow. Hover may brighten it; keyboard focus is clearer and pressing changes brightness. Keep text still and focus accessible. No breathing animation is needed; reduced motion disables opacity transitions.
- Keep the 44px close control, tap/Escape dismissal, safe-area margins and internal scrolling on short screens. Verify 390×844, 360×640, 320×568 and centered desktop with actual browser screenshots.

Deliver tests/build, screenshots and updated documents, commit/push `work`, then stop for visual acceptance. No final bottles, perspective changes, animation refinement, home, shop/spending, special third reward, audio, PWA or public deployment.

## Authorized Milestone 2E: wooden mechanism, stardust and typography

Presentation only: shallow wood thickness and changing turn lighting, a 550–700ms horizontal
flip (implemented at 650ms), contour-aligned champagne brass glow and independent small
outward-drifting stars. Fixed lightweight CSS/SVG emitters must not regenerate on ordinary
renders, intercept input or animate continuously under reduced motion. Restore a ready back
without a fresh flip or reward, and preserve manual new-puzzle activation/readiness.

Use officially sourced local WOFF2 subsets of LXGW ZhenKai for cabinet labels and the
settlement title, and Source Han Serif Medium for ordinary interface text; retain licenses,
source/version details, accessible text and system fallbacks. Center labels independently of
arrows, keep equal center ornaments, and preserve the existing three panel centers.

Deliver true mobile browser captures, alignment guides and an actual GIF/video. Validate
390×844, 360×640 and 320×568, keyboard/motion/restoration/font loading plus existing regressions.
No game rules, rewards/save algorithms, bottle coordinates, 920ms pouring, cabinet/parchment
artwork, home/shop/audio/PWA/deployment changes. Stop for visual acceptance after commit/push.

## Authorized Milestone 2E visual patch

Incrementally refine the existing 2E result: sustain the warm brass/gold inner contour
and champagne outer halo without hover/focus; retain the flip, dust and font families.
Mirror the side content groups (arrow + 撤销 biased left, 重来 + arrow biased right),
keep the middle label centered and all scene coordinates unchanged. Center the complete
HUD groups symmetrically about the cabinet axis, with an independent safe-area help control.

Help becomes four simple text steps over a dimmed/blurred live board, closable by the
close control, outside click or Escape. Remove color-symbol UI, rendering and state entirely.
Ignore the obsolete field in v1/v2/v3 saves without altering valid session/history,
completion, rewards or dismissal. New v3 writes omit the preference; no reward/schema logic
redesign. Retain keyboard/reduced-motion support and all underlying game behavior.

Deliver 390×844 and 360×640 screenshots plus near-end/1s/5s/10s glow evidence, full tests,
build, documentation and commit/push. No scene/bottle positions, pour mechanics, parchment
design, reward algorithms, puzzle generation, home/shop/audio/PWA/deployment changes.

## Authorized Milestone 2E small visual patch

Supersede the symmetric HUD grid with artwork-relative placement in the two empty
shoulders above the raised cabinet crest, keeping the moon clear and preserving the
single-line labels, fonts and independent help control. Keep 36 stable dust emitters,
but remove excessive visible-phase shrinking, introduce mostly fine dots with a few
brighter dots/tiny stars, and allow some to drift farther into the dark wood. Preserve
lifecycles, reduced motion, the current brass glow, side-button layout, flip and all
gameplay. Deliver matched real mobile captures and a full-view particle GIF/video,
run all checks, commit/push `work`, then stop for visual acceptance.
