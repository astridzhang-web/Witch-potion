# Progress / 接续记录

## Current milestone

**Milestone 2A cabinet scene — COMPLETE. Foundation and floating-pour prototype retained. Stop before 2B.**

The playable foundation, floating-pour experiment and explicitly requested cabinet scene integration are implemented. Final bottle art and full animation refinement remain deferred. No public deployment has been performed or authorized.

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
| `npm run test:e2e` | **46 passed**, no skips/failures; 16 gameplay, 20 animation and 10 cabinet cases, desktop Chromium and emulated mobile touch |
| Browser gameplay | Actual taps/clicks to full victory; invalid move, undo, restart/new confirmation, saved win/undo, reload and settings checked |
| Storage resilience | Corrupt save recovery and blocked localStorage checked in browser; quota errors checked in unit tests |
| Layout/accessibility basics | 320×568, 360×640, 390×844, 844×390 and 1280×900; 3 columns, 9 targets ≥44 px, no horizontal overflow; keyboard and reduced motion checked |
| Typical mobile viewport | Full 390×844 page saved and visually inspected; whole cabinet, nine bottles and both panels visible |
| Production server smoke | Milestone 2A build served on 4175; actual touch pour, reload, undo, 9 bottles, no page errors or external network requests |
| Development server | Started on 5173; HTTP response and app entry verified; functional tests use the same Vite workflow on isolated 4173 |
| `git diff --check` | Passed |

Validated on Node 24.19.0 / npm 11.9.0 / Linux Chromium 154. Milestone 2A production JS ≈239 kB (≈76 kB gzip), CSS ≈7.1 kB (≈2.5 kB gzip), local cabinet WebP ≈296 kB. No runtime external fonts/assets, backend or API keys.

### Resolved setup issues

- Default home npm cache was unwritable. Use `--cache /workspace/.npm-cache` in this environment.
- Playwright's Node ESM loader required `with { type: 'json' }` for the test fixture import. Fixed; all browser cases now execute.
- GitHub rejected the initial push with GH007 private-email protection. Configured this repository's Git email to `astridzhang-web@users.noreply.github.com`, amended the still-unpublished initial commit and successfully pushed `work`. No private email was published by that failed push.

## Floating-pour prototype / 悬浮倒药原型

### Scope and implementation

- Reuses the existing SVG art; no new runtime dependencies and no changes to `src/game/` rules, sessions, presets or save format.
- `src/components/PourAnimation.tsx` is a small isolated presentation component. `createPortal(document.body)` plus a fixed foreground layer escapes the board's clipping and stacking contexts.
- Measures the real SVG viewBox with `getScreenCTM()`, including the selected lift, so sprites align on mobile/desktop. The source travels/tilts **260 ms**, pours **380 ms**, returns **280 ms**: **920 ms total**. At screen edges it tilts inward.
- Two temporary SVG sprites show the source losing and the target gaining exactly the planned amount. Only these sprites update per animation frame; the nine-bottle board is not rendered every frame.
- The full immutable transaction commits once when pouring finishes (640 ms), updating count, undo history and auto-save together. The sprites then return/reveal the committed board. Partial liquid levels are presentation only and are never saved.
- All bottles, undo/restart/new puzzle, help and symbol settings are locked until the source returns. Rapid extra input is ignored, not queued. The original selected-bottle lift/highlight is retained.
- Reduced-motion users get the same legal pour immediately. Scroll, resize, page hiding, or enabling reduced motion settle the transaction once and release the lock. A bounded timer fallback prevents a suspended frame loop from trapping input. Refresh before commit restores the previous full board; refresh after commit restores the new board.

### Verification and visual evidence

- `npm test`: **33 passed**. `npm run build`: passed.
- `npm run test:e2e`: **36 passed**. Full animated solutions complete in both desktop and mobile projects.
- `tests/animation.spec.ts`: same-row adjacent bottles in both directions, top-to-bottom and bottom-to-top, source/target fractional volume conservation, correct stream color, viewport bounds, one commit/save, undo, four rapid consecutive moves with conflicting clicks, resize/scroll/hidden recovery, refresh before commit and reduced motion.
- Mobile pouring frames were visually inspected. The path visibly leaves the original slot, reaches the highlighted destination, pours and returns. Animation screenshots must be **viewport-only**: a full-page screenshot can resize the viewport and intentionally trigger safe settlement.
- Committed previews: `docs/screenshots/floating-pour-down.png`, `floating-pour-up.png`, and `floating-pour-prototype.gif`. GIF is a 20 fps browser-frame capture of two consecutive moves (upper→lower, lower→upper), not a claim about device rendering FPS. View these from GitHub's `work` branch.
- Development server: `npm run dev -- --port 5173 --strictPort`. To try it from a fresh first puzzle, select bottle 1 then empty bottle 8; after it returns, select bottle 7 then bottle 1. These exercise downward and upward movement. Existing saves may be mid-game; use a fresh browser context or the normal restart/new controls as appropriate.

### Prototype limitations

- Tilted liquid layers remain attached to the bottle rather than simulating gravity/free surfaces. The thin neck stream and surface ring are deliberately simple. The path can temporarily cross other bottles in the foreground.
- Milestone 2A now supplies the wooden cabinet; the unchanged foreground portal has been verified above its shelves.
- Geometry changes finish the current move instead of retargeting a flight mid-air. No animation preference switch was added; the OS reduced-motion preference is supported.
- Tested in desktop Chromium and emulated mobile touch. Physical iOS/Safari and low-end device frame-rate profiling remain untested.
- Browser preview is running in the cloud, but the connected tools do not provide a user-accessible hosted preview URL. The onboarding UI does not support localhost links; no public deployment was performed. The committed GIF/screenshots provide a viewable reference.

## Milestone 2A / 魔药展柜场景整合

- Preserved the supplied 941×1672 PNG byte-for-byte in `assets/source/shelf.png`; `public/assets/shelf.webp` is a quality-90 export at the same dimensions (2,168,603 → 296,034 bytes, about 86% smaller). No crop, repaint or new runtime dependency.
- Replaced the card grid framing with one aspect-preserving cabinet stage. `cabinetLayout.ts` maps source-image landmarks into percentages: bottle centers x=265/470.5/676 and shelf contact planes y=628/976/1324. The original SVG bottle base rests on each plane. Artwork, bottles and hitboxes scale together.
- Bottom left panel is undo, right is restart; middle decoration has no button. Compact top bar contains puzzle number, moves, new puzzle and help. Symbol setting, save status, notices and victory feedback remain available.
- Selected bottles use a small lift and soft glow. The existing 920 ms foreground animation component and all `src/game/` code remain unchanged. It measures the actual new bottle positions and returns to them; no new animation system or physics was introduced.
- All **33 unit tests and 46 browser tests pass**, plus TypeScript/production build. Cabinet tests verify aspect ratio, full framing, all nine glass contact points, ≥44px targets, panel centers and actual panel clicks at 390×844, 360×640, 320×568 and centered 1280×900. Existing same-row/cross-row tests now also assert exact source return. Full solutions, rapid input, save/reload, reduced motion and interruption recovery remain covered.
- Production build smoke on 4175 passed actual mobile taps for downward/upward pours, reload and undo, with no page errors or external requests. Full-page **390×844** screenshot: `docs/screenshots/milestone2a-cabinet-mobile.png`. Foreground pouring frame: `docs/screenshots/milestone2a-cabinet-pour.png`. Both show the actual browser render, not a mockup.
- Visual review: all three rows rest on wood, original moon carving and hanging crystals remain visible, controls sit inside the painted side insets, and the flying bottle/stream appear above the artwork without shelf clipping. Long screens intentionally retain dark surrounding space rather than cropping the image. Very short landscape screens may scroll to preserve usable controls.
- Remaining visual limits: existing simple SVG glass contrasts with the richer illustration; tilted liquid follows the bottle instead of gravity, and the deliberately unchanged 920 ms timing can feel brisk. Physical iOS/Safari and low-end device performance remain unverified. No 2B, new systems, audio, PWA or public deployment work was done.

## Git and cloud handoff

- Connected repository: `astridzhang-web/Witch-potion`; branch **`work`**, tracking `origin/work`.
- Foundation and animation checkpoints were pushed successfully. This document accompanies the Milestone 2A cabinet handoff. Use `git log -1` and `git ls-remote origin refs/heads/work` to compare the latest tips.
- Reusable `install_script` and `start_skill` have been saved to the cloud environment configuration draft. They cover frozen dependency install, tests/build, restarting Vite and functional readiness checks. Draft saving does not publish or validate restoration in a fresh task.
- The cloud configuration's original `main` reference was for an empty repository. The final environment save records the inspected checkout's exact committed HEAD at mount path `Witch-potion` so future restoration uses the implemented project.
- Review/save the environment settings and publish the cloud environment snapshot when desired. This is separate from publicly deploying the game.
- Live servers do not survive restoration. Start them from the instructions below. Browser test screenshots and traces live in ignored `test-results/`. The verified milestone 1 mobile screenshot is committed at `docs/screenshots/milestone1-mobile.png` and can be viewed on GitHub from the `work` branch. The original local PNG was validated and copied byte-for-byte; this screenshot-access fix does not change gameplay.

## Important code and architecture

- `src/game/rules.ts`: pure board invariants, `planPour`, `isVictory`. Liquid arrays are **bottom to top**. A pour transaction includes source, destination, color, amount, before and after; later animation can consume it without rewriting rules.
- `src/game/session.ts`: immutable snapshots; move count = history length. Restart preserves the original puzzle; undo restores exactly one prior board.
- `src/game/presets.json`, `puzzles.ts`: verified templates and safe color permutations. Do not replace these with unverified random mixing.
- `src/game/storage.ts`: schema/key v1; validates the initial template and legal move history. Limits: 5,000 moves / 2 MB. Failed writes display a warning instead of claiming a save.
- `src/App.tsx`: selection, dialogs, status, settings, persistence and a single pending animation transaction. A synchronous ref lock blocks conflicting input before disabled controls render.
- `src/components/Bottle.tsx`: local SVG glass, palette and optional symbols. `src/styles.css`: responsive cabinet stage and reduced-motion CSS.
- `src/scene/cabinetLayout.ts`: shared image-space coordinates for bottle contact planes and panel hitboxes. `assets/README.md`: source provenance and reproducible WebP export.
- `tests/cabinet.spec.ts`: independent artwork landmarks, full portrait framing and panel interaction checks.
- `src/game/game.test.ts`: rules, state, puzzle and save tests. `tests/game.spec.ts`, `playwright.config.ts`: real-browser regression tests.
- `PROJECT_SPEC.md`: fixed requirements and milestone boundaries. `README.md`: commands, rules and limitations.

## Known limitations / deliberately deferred

- The supplied cabinet scene is integrated. Final bottle variations and dense internal sparkle particles remain deferred.
- A small floating-pour prototype is implemented (see above). Final liquid physics, polished particles and final animation artwork remain deferred.
- No service worker, PWA manifest, install flow, offline cache or deployment configuration: milestone 4. Do not claim installability/offline readiness.
- Tested with Chromium and mobile emulation, not physical iOS/Safari devices or low-end-device performance benchmarks.
- Four puzzle structures with color variations; user choices can lead to dead ends, so undo/restart may be needed. No hint system or uniqueness guarantee across repeated sessions.
- One local active game; clearing site data removes it. No synchronization across devices.
- Very short screens can scroll vertically to preserve usable targets; horizontal overflow checks passed.
- Startup and configuration were validated in this instance; a new-task snapshot restoration has not been independently tested.

## Exact next task (only after the user asks)

Wait for user feedback on the Milestone 2A cabinet and committed mobile screenshots. Do not automatically begin Milestone 2B, final bottle art, animation timing/physics, rewards, sound, PWA or deployment.

## Resume in a fresh Codex session

1. Use `/workspace/Witch-potion`; cloud tasks are already isolated. **Do not create a worktree** unless the user explicitly requests it.
2. Read `PROJECT_SPEC.md`, this file and `git status --short --branch`; preserve changes and existing history. Use `git log -3 --oneline` to identify the checkpoint.
3. Run `npm ci --cache /workspace/.npm-cache` if dependencies need refreshing. Keep `package-lock.json` and TLS/integrity verification intact.
4. Run `npm test`, `npm run build`, `npm run test:e2e`. Browser tests use `/usr/bin/chromium` when available or `CHROMIUM_PATH` / Playwright's installed browser; they manage a separate server on 4173.
5. Start `npm run dev -- --port 5173 --strictPort` in a long-running tool session. Inspect output and make an internal request. Do not kill unrelated processes if the port is occupied. Optional production preview: `npm run preview -- --host 127.0.0.1 --port 4174 --strictPort` after building.
6. Follow only the newly authorized milestone. Keep `PROGRESS.md` accurate, commit useful checkpoints, and push `work` when permitted. Ask before public deployment.
