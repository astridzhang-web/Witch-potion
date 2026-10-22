# Progress / 接续记录

## Current checkpoint

**Milestone 1 — implementation complete, browser validation pending.** Existing empty repository initialized on `work`. No public deployment authorized. Do not start milestone 2 in this session.

## Implemented

- React + TypeScript + Vite application with a Chinese, responsive 3 × 3 puzzle board.
- Nine open SVG glass bottles, seven colors, capacity four, top-group maximum pours.
- Invalid moves preserve the board; select/deselect, undo, restart, new puzzle, move count and victory feedback.
- Four solution-witness presets; new puzzles cycle templates and bijectively relabel colors.
- Versioned local saves including undo history and optional color symbols. Invalid saves are rejected; blocked storage is handled gracefully.
- Confirmation dialogs protect current progress. Native keyboard-operable controls and reduced-motion CSS.
- Requirements and cloud development instructions in `PROJECT_SPEC.md` and `README.md`.

## Validation so far

- `npm test`: **33 passed**, including complete preset solution replay, 200 seeded color permutations, legality, conservation, victory, undo/restart, save integrity and unavailable storage.
- `npm run build`: TypeScript and production bundle passed.
- Node 24.19.0 / npm 11.9.0 / system Chromium 154 available.
- First dependency install failed because the default home npm cache was unwritable. Resolved using `--cache /workspace/.npm-cache`; lockfile committed.
- Browser interaction/layout/full-win validation is the next step; not yet claimed passing.

## Important files and decisions

- `src/game/rules.ts`: pure `planPour` returns before/after plus source, target, color and amount. Future animation consumes this transaction; it must lock input and commit exactly once.
- `src/game/session.ts`: immutable snapshots; move count equals history length.
- `src/game/presets.json`, `puzzles.ts`: bottom-to-top units; fixed verified templates, no unverified shuffling or runtime solver.
- `src/game/storage.ts`: schema v1, validated initial puzzle and every history transition; save limits 5,000 moves / 2 MB.
- `src/components/Bottle.tsx`, `src/styles.css`: intentionally lightweight milestone 1 art. No workshop scene, particle effects or full pouring animation yet.

## Known limitations

- PWA manifest, install flow and offline caching are milestone 4, not implemented.
- Only four puzzle structures, with color variations; no difficulty or shortest-solution claims.
- Browser/device coverage and production-server smoke check still pending.
- Git push not yet attempted; next checkpoint will record the result.

## Exact next task

Add and run Playwright checks for touch/mouse input, full victory, undo, restart/new confirmation, persistence, corrupt/blocked storage, narrow layouts and reduced motion. Inspect a mobile screenshot. Fix any issues, update this file, commit and push `work`, then stop at milestone 1.

## Fresh-session resume

Read `PROJECT_SPEC.md`, `PROGRESS.md` and `git status` before changing anything. Preserve existing work. Use `/workspace/Witch-potion`; cloud tasks are isolated, so do not create worktrees. Run `npm ci --cache /workspace/.npm-cache`, `npm test`, `npm run build`; use `npm run dev -- --port 5173 --strictPort` for development. Browser tests will use the existing `/usr/bin/chromium`. Push meaningful commits to the connected branch when permitted. Do not publicly deploy without explicit approval.
