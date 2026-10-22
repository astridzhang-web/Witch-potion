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
- No runtime external fonts, assets, or APIs. Rendering assets are original local SVG/CSS.
- Use existing checkout in `/workspace/Witch-potion`; cloud tasks are already isolated. Do not create Git worktrees unless explicitly requested.
- Keep dependency lockfile committed and use `npm ci` in fresh environments.

## Visual direction

Midnight navy and blue-purple, champagne gold, elegant celestial details and a moon header. Cozy fantasy alchemy workshop, not a utility dashboard. Chinese typography, generous touch targets, restrained ornament.

Open glass bottles with rounded bodies and long slim necks; no corks. Translucent silver-gray contours, curved reflections, slight silhouette variations, consistent capacities. Luminous rose-red, amethyst, mint, sky blue, honey gold, coral orange, and vivid orchid pink must be distinguishable. Future refinement adds many tiny white suspended sparkles, gentle gradients, and subtle motion.

Future workshop artwork: wooden workbench, ingredient shelves, books, parchment, brass tools, candles and moonlight. Background depth must not compromise the puzzle's clarity.

## Milestones and scope

1. **Stable playable foundation — this session only.** App structure, complete rules, responsive 3 × 3 board, attractive placeholder glass, controls, saves, verified puzzles, useful automated tests, build, checkpoint commits and push when permitted.
2. **Workshop artwork — requires a new instruction.** Atmospheric background, refined bottle variations, luminous liquids, dense tiny sparkles; small-screen legibility/performance checks; commit.
3. **Pouring animation.** Lift, tilt, stream, flowing sparkles, consistent liquid levels, ripples and return. Lock conflicting input, respect reduced motion, optimize and commit. Do not implement before stable core gameplay.
4. **Finished PWA.** Manifest, installable icons, offline cache, launch appearance, persistence/install/responsiveness verification, deployment configuration and documentation; commit. Ask before public deployment.

The eventual PWA must work without internet after caching, support portrait touch and mouse, safe-area insets, narrow screens, no horizontal overflow, reduced motion, local settings and progress. PWA/offline completion is explicitly milestone 4, not a milestone 1 claim.

## Quota-safe continuation

Complete one stable milestone at a time. Keep working builds and frequent meaningful Git checkpoints, push committed work when allowed. Maintain this spec and `PROGRESS.md` with actual checks, limitations, architecture and the exact next task. Inspect and preserve existing changes on resume. Never claim unimplemented or untested behavior works. Stop after milestone 1 until the user requests milestone 2.
