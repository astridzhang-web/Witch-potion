# Progress / 接续记录

## Current milestone

**Milestone 1 — COMPLETE. Stop here until a new instruction.**

A playable, verified foundation is implemented. Milestones 2–4 have not started. No public deployment has been performed or authorized.

## Implemented and working

- React + TypeScript + Vite; Chinese mobile-first interface with exactly nine bottles in a 3 × 3 grid.
- Seven colors, four units each, capacity four; seven initially mixed full bottles and two empty bottles.
- Select/deselect and maximal contiguous top-color pours. Invalid moves preserve the board and move count.
- Undo, exact-puzzle restart, new puzzle, move counter, completion counter and victory feedback. Undo remains available after winning.
- Four fixed puzzle templates with complete solution witnesses (34, 25, 27, 31 moves; not shortest-path claims). New puzzles cycle templates with bijective color relabeling.
- Open SVG glass bottles with basic luminous gradients, midnight/champagne UI and moon motif. Intentionally milestone 1 placeholder art.
- Automatic versioned localStorage saves: current puzzle, board, full undo history and optional color-symbol setting. The loader validates the verified initial arrangement and every history transition.
- Confirmation dialogs protect in-progress games; mouse, touch and native keyboard controls; reduced-motion support. Clear feedback when browser storage is unavailable.

## Verification results

All final checks passed; **no known blocking gameplay bugs**.

| Check | Result |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache` | Passed; frozen lockfile install reproduced |
| `npm test` | **33 passed**, no skips/failures |
| Preset solvability | All 4 full witnesses replayed; color conservation checked after every move |
| Puzzle variation | 200 seeded color permutations replayed to victory |
| `npm run build` | TypeScript and production bundle passed |
| `npm run test:e2e` | **16 passed**, no skips/failures; desktop Chromium and emulated mobile touch |
| Browser gameplay | Actual taps/clicks to full victory; invalid move, undo, restart/new confirmation, saved win/undo, reload and settings checked |
| Storage resilience | Corrupt save recovery and blocked localStorage checked in browser; quota errors checked in unit tests |
| Layout/accessibility basics | 320×568, 360×640, 390×844, 844×390 and 1280×900; 3 columns, 9 targets ≥44 px, no horizontal overflow; keyboard and reduced motion checked |
| Typical mobile viewport | All main controls fit within 390×844 (bottom ≈796 px); screenshot visually inspected |
| Production server smoke | Built app served on 4174; actual touch pour, reload, undo, 9 bottles, no page errors or external network requests |
| Development server | Started on 5173; HTTP response and app entry verified; functional tests use the same Vite workflow on isolated 4173 |
| `git diff --check` | Passed |

Validated on Node 24.19.0 / npm 11.9.0 / Linux Chromium 154. Production JS ≈235 kB (≈75 kB gzip), CSS ≈7.6 kB (≈2.7 kB gzip). No external fonts, assets, backend or API keys.

### Resolved setup issues

- Default home npm cache was unwritable. Use `--cache /workspace/.npm-cache` in this environment.
- Playwright's Node ESM loader required `with { type: 'json' }` for the test fixture import. Fixed; all browser cases now execute.
- GitHub rejected the initial push with GH007 private-email protection. Configured this repository's Git email to `astridzhang-web@users.noreply.github.com`, amended the still-unpublished initial commit and successfully pushed `work`. No private email was published by that failed push.

## Git and cloud handoff

- Connected repository: `astridzhang-web/Witch-potion`; branch **`work`**, tracking `origin/work`.
- Foundation checkpoint `36bcb18` was pushed successfully. This document is part of the final browser-validation/handoff checkpoint. Use `git log -1` and `git ls-remote origin refs/heads/work` to compare the latest tips.
- Reusable `install_script` and `start_skill` have been saved to the cloud environment configuration draft. They cover frozen dependency install, tests/build, restarting Vite and functional readiness checks. Draft saving does not publish or validate restoration in a fresh task.
- The cloud configuration's original `main` reference was for an empty repository. The final environment save records the inspected checkout's exact committed HEAD at mount path `Witch-potion` so future restoration uses the implemented project.
- Review/save the environment settings and publish the cloud environment snapshot when desired. This is separate from publicly deploying the game.
- Live servers do not survive restoration. Start them from the instructions below. Browser test screenshots and traces live in ignored `test-results/`. The verified milestone 1 mobile screenshot is committed at `docs/screenshots/milestone1-mobile.png` and can be viewed on GitHub from the `work` branch. The original local PNG was validated and copied byte-for-byte; this screenshot-access fix does not change gameplay.

## Important code and architecture

- `src/game/rules.ts`: pure board invariants, `planPour`, `isVictory`. Liquid arrays are **bottom to top**. A pour transaction includes source, destination, color, amount, before and after; later animation can consume it without rewriting rules.
- `src/game/session.ts`: immutable snapshots; move count = history length. Restart preserves the original puzzle; undo restores exactly one prior board.
- `src/game/presets.json`, `puzzles.ts`: verified templates and safe color permutations. Do not replace these with unverified random mixing.
- `src/game/storage.ts`: schema/key v1; validates the initial template and legal move history. Limits: 5,000 moves / 2 MB. Failed writes display a warning instead of claiming a save.
- `src/App.tsx`: selection, dialogs, status, settings and persistence; no animation state machine yet.
- `src/components/Bottle.tsx`: local SVG glass, palette and optional symbols. `src/styles.css`: responsive layout and reduced-motion CSS.
- `src/game/game.test.ts`: rules, state, puzzle and save tests. `tests/game.spec.ts`, `playwright.config.ts`: real-browser regression tests.
- `PROJECT_SPEC.md`: fixed requirements and milestone boundaries. `README.md`: commands, rules and limitations.

## Known limitations / deliberately deferred

- No detailed workshop scene, bottle variations or dense internal sparkle particles: milestone 2.
- Transfers update immediately. Full lift/tilt/stream/ripple animations and an interaction lock are milestone 3.
- No service worker, PWA manifest, install flow, offline cache or deployment configuration: milestone 4. Do not claim installability/offline readiness.
- Tested with Chromium and mobile emulation, not physical iOS/Safari devices or low-end-device performance benchmarks.
- Four puzzle structures with color variations; user choices can lead to dead ends, so undo/restart may be needed. No hint system or uniqueness guarantee across repeated sessions.
- One local active game; clearing site data removes it. No synchronization across devices.
- Very short screens can scroll vertically to preserve usable targets; horizontal overflow checks passed.
- Startup and configuration were validated in this instance; a new-task snapshot restoration has not been independently tested.

## Exact next task (only after the user asks)

**Milestone 2 — Alchemy workshop artwork.** Read the spec and existing code, preserve tested rules/saves, then improve the atmospheric workshop background (workbench, shelves, books, candle/moonlight), subtly vary open bottle silhouettes, refine the seven luminous liquids and add dense tiny white sparkles with bounded particle counts. Keep the board readable, test narrow-screen layout and rendering performance, update this file, test/build and commit/push. Do not implement full pouring animation or PWA functionality in that milestone.

Suggested next request: “继续里程碑 2：先阅读 PROJECT_SPEC.md 和 PROGRESS.md，在保留现有玩法和存档的基础上完成炼金工坊美术；测试并提交后停止。”

## Resume in a fresh Codex session

1. Use `/workspace/Witch-potion`; cloud tasks are already isolated. **Do not create a worktree** unless the user explicitly requests it.
2. Read `PROJECT_SPEC.md`, this file and `git status --short --branch`; preserve changes and existing history. Use `git log -3 --oneline` to identify the checkpoint.
3. Run `npm ci --cache /workspace/.npm-cache` if dependencies need refreshing. Keep `package-lock.json` and TLS/integrity verification intact.
4. Run `npm test`, `npm run build`, `npm run test:e2e`. Browser tests use `/usr/bin/chromium` when available or `CHROMIUM_PATH` / Playwright's installed browser; they manage a separate server on 4173.
5. Start `npm run dev -- --port 5173 --strictPort` in a long-running tool session. Inspect output and make an internal request. Do not kill unrelated processes if the port is occupied. Optional production preview: `npm run preview -- --host 127.0.0.1 --port 4174 --strictPort` after building.
6. Follow only the newly authorized milestone. Keep `PROGRESS.md` accurate, commit useful checkpoints, and push `work` when permitted. Ask before public deployment.
