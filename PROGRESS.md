# Progress / 接续记录

## Current milestone

**Milestone 2D parchment settlement, basic crystal bookkeeping and brass feedback — COMPLETE. Stop for visual acceptance.**

The playable foundation, floating-pour experiment, Milestone 2A integration and authorized Milestone 2B tall-cabinet replacement/contact correction are implemented. Milestone 2C adds the compact cumulative HUD, persisted completion flow, crystal settlement and central wooden flip. Milestone 2D adds the parchment record, independent amethyst art, per-instance base/bonus rewards and brass-edge button feedback. Final bottle art and full animation refinement remain deferred. No public deployment has been performed or authorized.

## Implemented and working

- React + TypeScript + Vite; Chinese mobile-first interface with exactly nine bottles in a 3 × 3 grid.
- Seven colors, four units each, capacity four; seven initially mixed full bottles and two empty bottles.
- Select/deselect and maximal contiguous top-color pours. Invalid moves preserve the board and move count.
- Undo, exact-puzzle restart, manually started new puzzles after settlement, move counter, lifetime completed-puzzle counter and crystal victory feedback. Undo remains available after winning.
- Four fixed puzzle templates with complete solution witnesses (34, 25, 27, 31 moves; not shortest-path claims). New puzzles cycle templates with bijective color relabeling.
- Open SVG glass bottles with basic luminous gradients, midnight/champagne UI and moon motif. Intentionally milestone 1 placeholder art.
- Automatic versioned localStorage saves: current puzzle, board, full undo history, optional color-symbol setting, lifetime completion count, current-instance credit, settlement dismissal, crystal balance and base/bonus reward receipt. The loader validates the verified initial arrangement and every history transition.
- A restart confirmation protects in-progress games; mouse, touch and native keyboard controls; reduced-motion support. Clear feedback when browser storage is unavailable.

## Verification results (latest: Milestone 2D, 2026-10-23)

All final checks passed; **no known blocking gameplay bugs**.

| Check | Result |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache` | Passed; frozen lockfile install reproduced |
| `npm test` | **68 passed**, no skips/failures |
| Preset solvability | All 4 full witnesses replayed; color conservation checked after every move |
| Puzzle variation | 200 seeded color permutations replayed to victory |
| `npm run build` | TypeScript and production bundle passed |
| `npm run test:e2e` | **72 passed**, no skips/failures; 16 gameplay, 22 animation/shadow, 10 cabinet, 14 completion/HUD and 10 reward/parchment cases, desktop Chromium and emulated mobile touch |
| Browser gameplay | Actual taps/clicks to full animated victory; invalid move, undo, restart confirmation, settlement/flip/new puzzle, reload and help settings checked |
| Storage resilience | Corrupt save recovery and blocked localStorage checked in browser; quota errors checked in unit tests |
| Layout/accessibility basics | 320×568, 360×640, 390×844, 844×390 and 1280×900; 3 columns, 9 targets ≥44 px, no horizontal overflow; keyboard and reduced motion checked |
| Typical mobile viewport | Full 390×844 and 360×640 pages saved and visually inspected; whole cabinet, nine bottles and three base panels visible |
| Production browser capture | Latest build on 4177 confirmed against dist/index.html; single/double/narrow/desktop parchment and enabled/focused panel captures with no page errors. Actual touch play/reload/undo covered by the browser suite |
| Development server | Started on 5173; HTTP response and app entry verified; functional tests use the same Vite workflow on isolated 4173 |
| `git diff --check` | Passed |

Validated on Node 24.19.0 / npm 11.9.0 / Linux Chromium 154. Milestone 2D production JS ≈246 kB (≈78 kB gzip), CSS ≈11.7 kB (≈3.6 kB gzip), active tall cabinet WebP ≈303 kB. No runtime external fonts/assets, backend or API keys.

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
- The current Milestone 2B tall cabinet uses the same foreground portal, verified above its shelves.
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

## Tall-phone cabinet asset preparation / 长屏木柜素材准备 (2026-10-22)

Historical preparation checkpoint `9ab4eb9`; the later authorized replacement is recorded in the next section.

- Completed only the requested asset preparation; the active Milestone 2A scene, interaction, animation and game logic are unchanged. No cabinet replacement or Milestone 2B work was started.
- New upload `shelf.zip` → `shelf.png` preserved byte-for-byte as `assets/source/shelf-tall.png`: **841×1870**, ratio **841:1870 ≈ 9:20**, 2,204,564 bytes. Original SHA-256: `27dc4bbf95937a27f19f5873c8a72ddc6f488cb00098112a930d64fc1709598f`.
- Generated independent `public/assets/shelf-tall.webp`: same dimensions, quality 90, no resize/crop, **302,590 bytes** (about 86.3% smaller). The original and optimized old cabinet remain untouched. The game continues to reference `/assets/shelf.webp`; the new asset is not wired into the UI.
- `assets/README.md` records provenance, exact dimensions/ratio, export command and future calibration scope: all nine bottle centers/sizes and three shelf contact planes; left/right panel bounds/anchors/hitboxes with the center kept decorative; shared aspect ratio, safe-area clearance and animation alignment. The redrawn layout requires fresh measurements rather than stretching the old coordinates; no coordinates were changed now.
- Validation for this asset-only task: source bytes matched the ZIP member; both new images decoded successfully at 841×1870; prior cabinet files and `src/` remained identical to the preceding commit; production build and `git diff --check` passed. Gameplay/browser suites were not rerun because no application code or active assets changed; the 33/46 results above describe the prior Milestone 2A validation.
- Stop here. Wait for explicit authorization before replacing the cabinet or beginning 2B.

## Milestone 2B / 正式长屏木柜替换与布局校准 (2026-10-22)

### Actual scope

- Started on existing `work` at `9ab4eb9bf131340d912fb7a14723c9b2666e7848`. The pre-existing untracked `docs/PROJECT_REPORT.md` is preserved byte-for-byte and excluded from this commit.
- Activated the existing `/assets/shelf-tall.webp` and changed the shared scene ratio/dimensions to **841×1870**. Both source PNGs and both WebP files are unchanged; no image processing or cropping occurred.
- Remeasured the new artwork. Bottle centers are **250 / 420.5 / 591**, shelf contact heights **668 / 1088 / 1500**, and SVG viewports **170×255** in source-image pixels. All nine bottles stand on the new shelves, with headroom retained and adjacent hit regions separated.
- Left undo panel is **(77,1542,200,132)**; right restart panel is **(564,1542,200,132)**. Text/icons remain centered, targets are at least 44×44 CSS px, and the middle star panel remains inert. Measurements and independent artwork bands are recorded in `assets/cabinet-tall-layout.md`.
- Only three application files changed: `src/App.tsx` (background URL/dimensions), `src/scene/cabinetLayout.ts` (image coordinates), and one stage-sizing rule in `src/styles.css`. `src/game/`, `Bottle.tsx` and `PourAnimation.tsx` are unchanged. Existing saves/history use the same schema and code.
- Existing HUD/new-puzzle entry, vertical move display, footer color symbols and save status remain intact. The 920ms animation's mechanism, easing, angles, liquid/stream and rendering remain unchanged; no animation correction was needed.

### Verification and browser evidence

- `npm test`: **33 passed**. `npm run build`: **passed**. `npm run test:e2e`: **46 passed**, no skips/retries/failures (16 gameplay, 20 animation, 10 cabinet cases across desktop/mobile projects).
- Cabinet tests now check the actual 841×1870 image, independently inspected shelf/center lanes and panel face regions instead of copying the chosen implementation anchors. They also check whole artwork availability, no horizontal overflow, non-overlapping bottle targets, ≥44px controls, centered panel content, top HUD bounds and footer reachability by scrolling.
- Full original animation/gameplay regression passed: same-row in both directions, top→bottom, bottom→top, exact return position, foreground portal, volume/state/save synchronization, rapid input lock, undo, interrupted flights, reduced motion, refresh/history restoration and full victory/undo.
- Production build served internally on **4176**; actual mobile taps for downward/upward pours, refresh and undo passed with no page errors or external requests. No public deployment.
- Real production-browser screenshots committed under `docs/screenshots/`:
  - `milestone2b-tall-390x844.png`: full page, **390×844**.
  - `milestone2b-tall-360x640.png`: full page, **360×640**.
  - `milestone2b-tall-pour-390x844.png`: fixed viewport, **390×844**, captured during the pouring phase without full-page resizing.
  - `milestone2b-tall-320x568-full-page.png`: 320×568 viewport, **320×623** complete scrollable page.
- Screenshots were visually inspected: wood contact points, flower clearance, side-panel alignment and foreground pouring are readable. 390×844 and 360×640 fit fully; desktop 1280×900 centers the portrait scene. At 320×568 the retained 280px minimum scene width intentionally yields about 623px of page height, so the remaining floor/footer can be reached by vertical scrolling.

### Remaining limits and stop point

- Original `viewport-fit=cover` and safe-area padding/height calculation are retained. The supplied Chromium does not expose the CDP safe-area inset emulation method; physical iOS/Safari/notch behavior has not been verified. Normal viewport tests above did run successfully.
- The small-screen scene and existing HUD/footer text are compact; this task does not redesign them. SVG bottles remain prototypes, tilted layers still follow the bottle, and the original brisk animation timing remains.
- No center-panel flip, completion-count/crystal reward system, settlement screen, final bottle artwork, HUD revision, liquid/animation polish, audio, home/shop, PWA or public deployment was added. Stop after this layout replacement; await the next explicit task.

## Milestone 2B visual correction / 药瓶落位复核与接触阴影 (2026-10-22)

### Findings and minimal change

- Started from `22a445481f92faaf4d4bc5f252a9a0266633f91b` on the existing `work` branch. Preserved the unrelated untracked `docs/PROJECT_REPORT.md` without edits or staging.
- Inspected the running baseline in the same 390×844 viewport/first-preset state as the prior screenshot, plus direct browser detail captures at device scale 3. The top row's glass bases already sit in the measured y=660–674 shelf band, and its side bottles clear the posts and sit beside the flowers. After correcting the detached shadows, no separate placement defect justified changing coordinates. **All centers, heights (668/1088/1500), sizes and hit regions remain unchanged**, including middle and bottom rows.
- Root cause: the shared SVG's hard 64×8 ellipse was centered at y=140, below the actual glass base at y=134. The gap and hard oval boundary against the background's warm highlights produced a floating-pad impression. The same ellipse was also part of the temporary flying bottle art.
- Removed only that ellipse from `BottleArt` and added one stationary `.bottle-contact-shadow` per board button. It is a small soft dark radial gradient centered at the true glass base, with a 48×3.6 proportional footprint. It adds no colored illumination or extra image assets.
- On selection the shadow stays on the wood and dims to 20% opacity while the existing glass lift runs. The source's shadow is hidden immediately during flight and restored on landing. The target keeps its one stationary shadow; both portal sprites contain no shelf-contact shadow.
- Runtime changes are confined to `src/components/Bottle.tsx` and five added CSS lines. Game/session/save code, `cabinetLayout.ts`, `App.tsx`, `PourAnimation.tsx`, bottle silhouette/size/colors/liquid rendering, HUD/footer and cabinet images are unchanged. Timing, path, angle, easing and stream remain the existing 920ms mechanism.

### Verification and visual evidence

- `npm test`: **33 passed**. `npm run build`: **passed**. `npm run test:e2e`: **48 passed**, no skips/retries/failures.
- Existing cabinet checks now compare each rendered shadow center against the actual glass contact point, including the two empty bottles, at all four supported viewports. A new desktop/mobile lifecycle case checks selection lift/dimming, stationary placement, source hiding, target persistence, no below-glass shadow ellipse in the flying art, landing restoration and undo back to an empty receiver.
- All existing same-row/cross-row animation, exact return, input-locking, interruption, save/undo, reduced-motion and full-victory tests continue to pass. No layout-coordinate expectation was changed because no coordinates changed.
- Production build confirmed on internal port 4176. The corrected full page and flight captures are real 390×844 browser screenshots. The top/lower detail images are direct 3× device-scale browser clips (864×405), from the same 390×844 CSS viewport; no image-editor composition or repainting. In-flight screenshot is viewport-only at 430ms into bottle 1→8.
- Before/after index: `docs/screenshots/milestone2b-contact-comparison.md`. Corrected deliverables: `milestone2b-contact-after-390x844.png`, `milestone2b-contact-after-top-detail.png`, `milestone2b-contact-after-lower-detail.png`, `milestone2b-contact-pour-390x844.png`. Added the two matching baseline detail captures and a selected-source frame; retained all previous screenshots.
- Visual review confirms removal of the separate dark ovals on both full and empty bottles, preserved warm artwork lighting, and no flat contact ellipse flying with the source. The small contact shadow remains subtle at phone size.

### Limits and stop point

This is a static contact treatment, not a dynamic projection or liquid-physics system. The original warm wood highlights, simple SVG glass and brisk animation remain. Physical iOS/Safari verification is still outstanding. No HUD, middle-board, rewards, settlement, home, audio, PWA or deployment work was undertaken. Stop after this visual correction.

## Milestone 2C / HUD 与通关交互 (2026-10-22)

### Continuation and scope

Resumed the existing uncommitted implementation on `work` at baseline `3be09b2925f8d78a2fb034933a66878a1494d49a`. The earlier completion/storage work, 48 passing units and extracted panel art were intact; none was lost or reimplemented. The unrelated untracked `docs/PROJECT_REPORT.md` was preserved byte-for-byte and excluded from this commit.

- Top HUD now shows “☾ 已完成 N”, horizontal moves and a 44px help control. Removed the permanent top new-puzzle entry. The symbol checkbox moved into help and retains persistence; successful saves are silent, failed saves still warn.
- The first win per puzzle instance commits its one lifetime credit together with board/history. Undo, restart, repeated callbacks and rewinning preserve that credit; only manually starting a new instance resets eligibility. No linear levels, reward balance or economy was introduced.
- Version-2 payloads keep the original `moonlit-alchemy.save.v1` storage key and full verified-history validation. Valid unfinished v1 saves retain the exact board/history/settings and start at count 0. Currently won v1 saves migrate with one credit and a pending settlement. Prior wins were not recorded by v1 and cannot be recovered. Successful migration rewrites the same single record; no split statistics keys.
- Settlement appears only after the final existing pour returns (or safely settles after interruption), showing actual moves and a restrained violet SVG crystal. Any tap, clear close control or Escape dismisses it. The native dialog traps focus; its closed state persists. Rewinning the same dismissed puzzle does not reopen it.
- After dismissal, the won board remains and the center panel turns for 550ms around its horizontal axis. Separate star/wooden-brass faces and an opaque wood recess cover the baked-in star throughout the turn. Input enables after completion, with keyboard focus transferred after the button becomes enabled. New-puzzle input is guarded against queued duplicate clicks. Reduced motion swaps immediately; new puzzle/undo/restart restore the decorative face.
- Both original cabinet pairs, bottle positions/shape/liquid/palette/contact shadow, rules, presets, session implementation and the existing 920ms pouring system are unchanged. New textures are lossless crops of the existing tall WebP, with provenance in `assets/README.md`.

### Checks and visual evidence

- `npm test`: **48 passed**. `npm run build`: **passed**. `npm run test:e2e`: **62 passed** in desktop Chromium and emulated mobile touch, with no skips/retries/failures.
- After softening the center button’s keyboard focus from a box outline to text emphasis, the production build and all **14 completion/HUD browser cases** were rerun successfully; final screenshots use that build.
- New completion browser cases cover horizontal HUD/non-overlap, help target, inert unfinished panel, final-pour/settlement ordering, focus/readiness, pending/dismissed reload, duplicate new-puzzle clicks, v1 migration, undo/restart/full replay without recounting, second-puzzle credit, reduced motion, keyboard control, before/after-commit refresh, repeated resize, separate opaque faces and ≥44px center target at all four required viewports.
- Existing full animated solutions, foreground pouring in both directions/same row, precise return, rapid input, contact shadows, layout, blocked storage and help settings remain passing. Unit coverage includes quota failures, atomic records, invalid metadata and repeat migration/commit protection.
- Production build served internally on 4177 and matched `dist/index.html`. Real browser captures use a fixed 390×844 or 360×640 viewport and preset `moon-1` with its original colors; the solved state uses its valid 34-move witness. No artwork composites or fake game screens.
- Screenshot index: [Milestone 2C browser evidence](docs/screenshots/milestone2c-preview.md). Normal 390×844/360×640, crystal settlement, completed cabinet and panel details are committed. The flip GIF consists of real Chromium frames sampled at 50ms of the actual CSS transition via the Web Animations API; endpoint holds aid inspection, so it is a visual reference rather than a device-FPS benchmark.
- Visual review: compact HUD stays above the carved moon, star front blends with the source art, the back uses warm wood and brass, its text remains upright, and the opaque recess hides the baked-in star during rotation. Whole cabinet and controls remain visible at 390×844/360×640; the existing short-screen scroll policy remains intact.

### Limits and stop point

The reverse panel reuses the neighboring panel texture, fitted to the central face; it is not bespoke final carved artwork. The flip is a thin CSS plane over a shallow wood recess rather than a volumetric hinge. The crystal is a lightweight illustration without rewards. Actual iOS/Safari and physical-device performance remain unverified. No bottle/animation polish, rewards/shop, home, sound, PWA or public deployment work was performed. Stop after this handoff.

## Milestone 2D / 羊皮纸结算与基础晶石 (2026-10-23)

### Resumed scope and visual review

- Resumed the intact uncommitted 2D work on `work` at `90f913bd29d8f4ff047fba9bfe2bf69648436ba1`; source, generated assets, reward/migration tests and nine screenshots were all present. No implementation was discarded or restarted. The unrelated untracked `docs/PROJECT_REPORT.md` remains unchanged and excluded.
- Retained the corrected parchment layout. The earlier overflow came from large circle dimensions and implicit numeric line heights exceeding the text area's height; explicit number line heights and a smaller circle now keep the copy inside the paper. Actual latest-build screenshots at 390×844, 360×640, 320×568 and 1280×900 were rechecked. One/two crystals share the same approximately 274×456.84px parchment at 390×844, centered and without pedestals; the footer has clear paper around it.
- The independent parchment and transparent amethyst images adapt the supplied double-crystal reference. Live DOM text, an SVG astrolabe and a small rolled-paper icon render actual values. The original tall cabinet and won bottles remain behind a translucent blurred backdrop. Reference cabinet images are never loaded into the app.
- Removed text underlining. A faint warm gold SVG contour follows the existing central panel's brass border; hover brightens it, keyboard focus is clearer, and pressing changes brightness. On resume only the contour's mismatched corner path/stroke needed a small correction. No breathing/text animation; reduced motion removes the opacity transition. The existing 550ms turn, focus handoff and manual new-puzzle behavior are retained.

### Reward accounting and migration policy

- A new puzzle instance grants base +1 on its first success, plus a one-time benchmark +1 if actual moves are no more than the matching preset's `solution.length`. Reference solutions remain 34/25/27/31, read from data rather than UI constants; no shortest-path claim.
- If the first win exceeds the benchmark, a later qualifying win grants **only the missing +1**. Its settlement reopens after the pour returns and shows +1 crystal with “已完成谜题 已记录”. It does not increase lifetime completed-puzzle count. A replay with no new reward does not reopen settlement and clears its current receipt to zero. Repeated callbacks, dismissals, refresh, undo and restart cannot repay existing credits.
- Only explicitly starting a new puzzle resets base/bonus eligibility, even if the preset ID recurs. Balance and lifetime completion count are preserved independently; no shop, spending, balance HUD or third-crystal reward condition.
- Schema **v3** saves the full board/history/settings, completion flags, balance, base/bonus flags and latest receipt in one record under `moonlit-alchemy.save.v1`. Legal-history validation and storage-failure warnings remain.
- **No retrospective crystals during v1/v2 migration.** Preserve exact valid board/history/symbols and existing v2 cumulative/dismissal state. A legacy instance already counted has its base retired with balance 0; its benchmark bonus remains eligible for a future qualifying replay. Unfinished uncounted instances can earn both normally. A pending migrated settlement shows +0 and “已记录”; a dismissed one does not reopen. v1 retains the prior policy of initializing its current solved puzzle to one completed puzzle; unknown earlier lifetime history cannot be reconstructed. Repeated reloads cannot mint historical rewards.

### Final verification and evidence

- Fresh requested run after resume: `npm test` **68 passed** (4 files), `npm run build` **passed**, `npm run test:e2e` **72 passed** (desktop Chromium and mobile touch; no skips/retries/failures).
- Units cover below/equal/above reference-step boundaries with legal replayed solutions, all four presets and color remapping, delayed bonus, repeated commits/close/undo/restart, same-preset new instances, one-write persistence and quota failure, v1/v2 migration including credited/restarted state, and invalid reward metadata. One rendering unit verifies the reserved three-crystal art capacity without enabling a third reward.
- Browser regressions cover real +1/+2 receipts, independent completed count, delayed bonus and reload, no-repeat payout, legacy pending +0 display, center button enable/focus/new puzzle, opacity feedback/no underline/reduced motion, crystal symmetry and center placement, paper-contained text, image loading, close targets and the four specified viewports. Existing full animated solves, 920ms ordering/interruption, shelves/contact shadows, rapid input, undo, settings and blocked storage all pass.
- Regenerated the nine deliverable screenshots from the latest production build on internal port 4177, verified against `dist/index.html`, with no browser page errors. Screenshot fixtures replay legal history and perform the last move through the actual app: 35 moves gives +1 and 34 gives +2. Detail captures are real 3× device-scale browser clips, not composites. [View all 2D screenshots](docs/screenshots/milestone2d-preview.md).
- Reviewed the final diff: `Bottle.tsx`, `PourAnimation.tsx`, rules/session/puzzle implementations, presets, cabinet coordinates and all original cabinet files remain unchanged. No temporary capture scripts are committed. Asset provenance/exports are in `assets/README.md`; the original references/generated PNGs and optimized local WebPs are retained.

### Remaining limits and stop point

Paper grain/ornament and amethyst facets are generated adaptations, not a pixel-identical extraction; the scroll and astrolabe are simpler independent SVG drawings. The brass highlight traces the painted edge rather than lighting a 3D mesh. Fonts depend on local serif availability. Physical iOS/Safari and low-end-device performance remain unverified. No cabinet replacement, final bottle art, perspective changes, pour refinement, home, shop, special third reward, audio, PWA or public deployment. Stop and await visual acceptance.

## Git and cloud handoff

- Connected repository: `astridzhang-web/Witch-potion`; branch **`work`**, tracking `origin/work`.
- Foundation and animation checkpoints were pushed successfully. This document accompanies the Milestone 2D handoff. Use `git log -1` and `git ls-remote origin refs/heads/work` to compare the latest tips.
- Reusable `install_script` and `start_skill` have been saved to the cloud environment configuration draft. They cover frozen dependency install, tests/build, restarting Vite and functional readiness checks. Draft saving does not publish or validate restoration in a fresh task.
- The cloud configuration's original `main` reference was for an empty repository. The final environment save records the inspected checkout's exact committed HEAD at mount path `Witch-potion` so future restoration uses the implemented project.
- Review/save the environment settings and publish the cloud environment snapshot when desired. This is separate from publicly deploying the game.
- Live servers do not survive restoration. Start them from the instructions below. Browser test screenshots and traces live in ignored `test-results/`. The verified milestone 1 mobile screenshot is committed at `docs/screenshots/milestone1-mobile.png` and can be viewed on GitHub from the `work` branch. The original local PNG was validated and copied byte-for-byte; this screenshot-access fix does not change gameplay.

## Important code and architecture

- `src/game/rules.ts`: pure board invariants, `planPour`, `isVictory`. Liquid arrays are **bottom to top**. A pour transaction includes source, destination, color, amount, before and after; later animation can consume it without rewriting rules.
- `src/game/session.ts`: immutable snapshots; move count = history length. Restart preserves the original puzzle; undo restores exactly one prior board.
- `src/game/presets.json`, `puzzles.ts`: verified templates and safe color permutations. Do not replace these with unverified random mixing.
- `src/game/storage.ts`: schema v3 under the unchanged v1 key, with validated v1/v2 migration; validates the initial template and legal move history. Limits: 5,000 moves / 2 MB. Failed writes display a warning instead of claiming a save.
- `src/game/progress.ts`: atomic session/completion/reward transitions, per-instance base/bonus flags, truthful receipt and settlement dismissal.
- `src/components/CenterPanel.tsx`, `Settlement.tsx`: independent panel flip/input readiness and accessible crystal dialog.
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

Milestone 2D is complete. Wait for visual acceptance of the parchment, crystal layout and brass-edge feedback. Do not automatically begin final bottle art, perspective compensation, animation timing/physics, crystal spending/shop, home, sound, PWA or deployment.

## Resume in a fresh Codex session

1. Use `/workspace/Witch-potion`; cloud tasks are already isolated. **Do not create a worktree** unless the user explicitly requests it.
2. Read `PROJECT_SPEC.md`, this file and `git status --short --branch`; preserve changes and existing history. Use `git log -3 --oneline` to identify the checkpoint.
3. Run `npm ci --cache /workspace/.npm-cache` if dependencies need refreshing. Keep `package-lock.json` and TLS/integrity verification intact.
4. Run `npm test`, `npm run build`, `npm run test:e2e`. Browser tests use `/usr/bin/chromium` when available or `CHROMIUM_PATH` / Playwright's installed browser; they manage a separate server on 4173.
5. Start `npm run dev -- --port 5173 --strictPort` in a long-running tool session. Inspect output and make an internal request. Do not kill unrelated processes if the port is occupied. Optional production preview: `npm run preview -- --host 127.0.0.1 --port 4174 --strictPort` after building.
6. Follow only the newly authorized milestone. Keep `PROGRESS.md` accurate, commit useful checkpoints, and push `work` when permitted. Ask before public deployment.
