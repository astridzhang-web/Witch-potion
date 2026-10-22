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

1. **Stable playable foundation — complete.** App structure, complete rules, responsive 3 × 3 board, attractive placeholder glass, controls, saves, verified puzzles, useful automated tests, build, checkpoint commits and push when permitted.
2. **Workshop artwork — requires a new instruction.** Atmospheric background, refined bottle variations, luminous liquids, dense tiny sparkles; small-screen legibility/performance checks; commit.
3. **Pouring animation.** Lift, tilt, stream, flowing sparkles, consistent liquid levels, ripples and return. Lock conflicting input, respect reduced motion, optimize and commit. Do not implement before stable core gameplay.
4. **Finished PWA.** Manifest, installable icons, offline cache, launch appearance, persistence/install/responsiveness verification, deployment configuration and documentation; commit. Ask before public deployment.

The eventual PWA must work without internet after caching, support portrait touch and mouse, safe-area insets, narrow screens, no horizontal overflow, reduced motion, local settings and progress. PWA/offline completion is explicitly milestone 4, not a milestone 1 claim.

## Quota-safe continuation

Complete one stable milestone at a time. Keep working builds and frequent meaningful Git checkpoints, push committed work when allowed. Maintain this spec and `PROGRESS.md` with actual checks, limitations, architecture and the exact next task. Inspect and preserve existing changes on resume. Never claim unimplemented or untested behavior works. Follow only the currently authorized scope; after Milestone 2A, stop for feedback before 2B.

## Authorized narrow experiment: floating pour prototype (2026-10-22)

After milestone 1, the user explicitly authorized a **small animation prototype**, independent of the full milestone sequence. Keep the rules, nine-bottle layout, controls, count and save schema intact. Reuse the current SVG art; no workshop redesign, rewards, audio, new levels, PWA or deployment work.

One legal transaction may lift into a foreground body portal, travel near the destination, tilt, show a short top-color stream with synchronized fractional liquid levels, then return. Target duration is about 0.9 seconds. Lock conflicting input until return, respect reduced motion, and settle safely if viewport geometry changes. The existing pure pour transaction remains authoritative; save only a complete board, never fractional visual state. Validate same-row, cross-row, upward/downward, undo and rapid input. Commit/push the prototype with viewable visual evidence, then stop for user feedback. This does not complete milestone 2 or the full milestone 3.

## Authorized Milestone 2A: cabinet scene integration (2026-10-22)

Use the supplied empty wooden cabinet as a static, aspect-preserving background; retain its illustration rather than redrawing it. Keep nine independent existing SVG bottles in three rows, bottoms aligned to the wooden shelves. The artwork, bottle positions and wooden-panel hit regions must share one coordinate system. Left panel is undo, right is restart, center is decorative. Keep a compact top puzzle/move display and a subtle new-puzzle entry.

Preserve the current ~920 ms floating-pour system, gameplay, saves, victory feedback and reduced motion. Verify same-row and cross-row pouring, accurate return, input locks, panel clicks and complete framing at 390×844, 360×640, 320×568 and desktop. Keep the original source image and optimize the browser asset. Deliver a full 390×844 screenshot in `docs/screenshots/`, update progress, run tests/build, commit and push `work`.

This stage does not authorize final bottle variations, new animation timing/physics/particles, audio, home transitions, rewards/shop, new level systems, PWA work or public deployment. Stop after 2A; do not begin 2B automatically.
