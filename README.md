# 月夜魔法药剂室 · Moonlit Alchemy

A quiet, mobile-first potion sorting game. Milestone 2E: a playable tall wooden cabinet scene with a solid wooden flip, champagne stardust, local Chinese typography, parchment completion record and basic crystal rewards built with React, TypeScript, Vite and independent SVG bottles. All gameplay runs locally in the browser.

## Cloud development

Use the existing repository checkout. Node.js **22.12+** is required (validated with Node 24.19.0).

```sh
cd /workspace/Witch-potion
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
```

The development server listens on port 5173. No backend, credentials, environment variables or external asset downloads are needed. No local software installation on your own device is required for this cloud workflow.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use `/usr/bin/chromium` when available in the cloud. Set `CHROMIUM_PATH` to another installed Chromium executable if needed; otherwise Playwright uses its own installed browser. Tests start and stop an isolated Vite server on port 4173. Test artifacts are in ignored `test-results/`.

`npm run preview -- --port 4174 --strictPort` serves the production build for local verification. Public deployment is not configured or authorized.

## How to play

Tap a bottle, then an empty bottle or one with the same top color and available space. The maximum contiguous top group transfers at once. Sort seven colors into seven full bottles, leaving two empty. Tap the selected bottle again to deselect. Undo and restart remain available; restarting an unfinished puzzle asks for confirmation. After winning, dismiss the crystal settlement to reveal the center panel’s “新谜题” button. The completed board stays until you choose to start another puzzle.

Progress, undo history, lifetime completion count, settlement dismissal and optional color symbols are saved together in this browser's localStorage. Color symbols are configured in the help dialog; successful saves are silent. Blocked storage does not prevent play, but displays a warning. Clearing browser data removes progress. Corrupt or incompatible saves start a fresh verified puzzle. This version keeps one active puzzle, not a cloud account or multi-device sync.

## Puzzle reliability

Four fixed presets in `src/game/presets.json` each include a complete legal solution witness. Tests replay every step using the actual game rules and verify color conservation and victory. New puzzles cycle the presets and bijectively relabel the colors, preserving their solutions. They are not unrestricted random shuffles. The solutions prove reachability, not shortest possible play; a player's later choices may require undo or restart.

## Architecture and continuation

- `src/game/rules.ts`: pure board validation, legal pour planning, transfer metadata and victory.
- `src/game/puzzles.ts`, `presets.json`: verified puzzle templates and safe variation.
- `src/game/session.ts`: immutable transactions, history, undo and restart.
- `src/game/storage.ts`: versioned persistence and legal-history validation.
- `src/components/Bottle.tsx`: local SVG placeholder glass and color palette.
- `src/App.tsx`, `src/styles.css`: Chinese UI, shared portrait scene and controls.
- `src/scene/cabinetLayout.ts`: source-image coordinates for shelves, bottles and panel hitboxes.
- `assets/source/shelf-tall.png`, `public/assets/shelf-tall.webp`: active tall cabinet original and optimized local scene (the earlier pair is preserved); see [asset notes](assets/README.md).
- `src/game/game.test.ts`, `tests/game.spec.ts`: unit and real browser checks.

Read [PROJECT_SPEC.md](PROJECT_SPEC.md) and [PROGRESS.md](PROGRESS.md) before resuming. Milestone 2E mechanism, stardust and typography are complete; stop for visual acceptance before further work. Final bottle art, animation timing/physics refinements and installable/offline PWA behavior remain deferred. No service worker or installability is claimed in this version.

## Small floating-pour prototype

The current `work` branch includes the separately authorized ~0.92-second animation experiment: source lift/travel, inward tilt, matching-color stream, synchronized liquid transfer and return. It reuses the existing game rules and SVGs; controls lock briefly during the flight. Reduced motion performs the transfer immediately. Its timing and implementation are retained in the cabinet scene. No PWA work or public deployment is included.

Run the existing development command and try bottle 1 → empty bottle 8 from a fresh first puzzle, followed by bottle 7 → bottle 1. See [the short animation capture](docs/screenshots/floating-pour-prototype.gif), [downward pour](docs/screenshots/floating-pour-down.png) and [upward pour](docs/screenshots/floating-pour-up.png). The GIF is a 20 fps visual reference; the live renderer uses requestAnimationFrame. Full checks now comprise 68 unit tests and 72 browser tests. Detailed behavior and limitations are recorded in `PROGRESS.md`.

## Milestone 2B tall cabinet scene

The redrawn 841×1870 cabinet is now active, using the previously prepared 296 KiB WebP unchanged. Nine independent SVG bottles and the two bottom-panel buttons share its image coordinates. Their placements were remeasured from the new artwork; see [layout measurements](assets/cabinet-tall-layout.md). Undo stays on the left and restart on the right. Milestone 2C adds the central star/new-puzzle flip and compact HUD; see below.

[390×844 full page](docs/screenshots/milestone2b-tall-390x844.png) · [360×640 full page](docs/screenshots/milestone2b-tall-360x640.png) · [390×844 floating pour](docs/screenshots/milestone2b-tall-pour-390x844.png) · [320×568 viewport, full scrollable page](docs/screenshots/milestone2b-tall-320x568-full-page.png)

The scene preserves the full artwork without stretching or cropping. It fits completely at 390×844 and 360×640 and centers on desktop. At 320×568, the existing 280px minimum scene width gives about 623px of page height, so the remaining artwork and bottom notice are reached by a short vertical scroll. Tests cover artwork contact bands, non-overlapping bottle targets, panel bounds/centering, ≥44px targets, top information visibility and the unchanged gameplay/animation.

Both cabinet source PNGs and WebP exports remain in the repository. The [Milestone 2A screenshot](docs/screenshots/milestone2a-cabinet-mobile.png) is historical. Current bottle art and tilted liquid remain the prototype; physical iOS/Safari and safe-area behavior on actual devices still need verification. Animation refinements, final bottle art, crystal spending/shop, PWA and public deployment remain future work.


The subsequent contact-shadow correction keeps those coordinates and replaces the detached SVG ellipse with a small stationary shadow at the glass base. It dims on selection, hides for the flying source and returns on landing; moving bottle art carries no shelf shadow. See [same-state before/after browser comparisons](docs/screenshots/milestone2b-contact-comparison.md).


## Milestone 2C HUD and completion (historical)

The HUD shows cumulative completed puzzles and horizontal moves. Each puzzle instance earns one completion credit; undo, restart, rewinning or refresh never add another. New instances remain eligible even when a template recurs. A small crystal settlement appears after the final pour returns; dismiss it by tapping, using its close control, or pressing Escape. The central wooden panel then flips for 550ms to “新谜题”, with keyboard focus handed to the enabled button. Reduced motion skips the flip.

Version-2 saves retain the existing storage key and validate the full move history. Valid version-1 saves preserve the board, undo history and symbol preference: unfinished saves start at count 0, currently solved saves migrate with count 1 and a pending settlement. Earlier wins cannot be reconstructed from v1. A dismissed settlement stays dismissed across reloads.

[390×844 normal](docs/screenshots/milestone2c-normal-390x844.png) · [360×640 normal](docs/screenshots/milestone2c-normal-360x640.png) · [Crystal settlement](docs/screenshots/milestone2c-settlement-390x844.png) · [Completed cabinet](docs/screenshots/milestone2c-complete-390x844.png) · [Panel flip demo](docs/screenshots/milestone2c-panel-flip.gif)

The small panel textures reuse the existing artwork without modifying the cabinet. The back reuses the left brass-edged panel; the flip is a CSS plane, not a volumetric hinge model. At that checkpoint the crystal was a lightweight SVG illustration without rewards; 2D supersedes its art and adds basic bookkeeping. Physical Safari/iOS checks remain outstanding.


## Milestone 2D parchment and basic crystals

The completed cabinet now sits behind a compact, independent parchment record. Actual moves, one/two transparent amethysts and a small scroll record remain separate from the artwork. The middle wooden button uses a warm brass-contour glow for active/hover/keyboard feedback, without underlining; at the 2D checkpoint its 550ms flip was unchanged; 2E supersedes the panel presentation.

Each new puzzle instance earns a base **+1 crystal**, and a one-time additional **+1** when its actual moves are no greater than that preset's verified solution length. A later successful replay can earn only the missing bonus. Completion count stays independent. No-new-reward replays do not repeat settlement; bonus receipts show only the new +1 and mark the completion as already recorded. No shop, spending or balance HUD is included.

Schema **v3** stores the complete state atomically under the existing key. v1/v2 migration preserves board, undo history and settings and grants **no historical crystals**. The base for a previously counted legacy puzzle is retired; a future qualifying replay can still earn its bonus once. Unfinished, uncounted legacy puzzles can earn both normally. Existing v2 completion/dismissal flags are preserved; v1's currently won puzzle retains the earlier one-completion migration policy. Pending legacy settlement shows +0 / “已记录”, never a fictitious reward.

[Single crystal, 390×844](docs/screenshots/milestone2d-single-390x844.png) · [Two crystals, 390×844](docs/screenshots/milestone2d-double-390x844.png) · [360×640](docs/screenshots/milestone2d-double-360x640.png) · [320×568](docs/screenshots/milestone2d-double-320x568.png) · [Brass focus detail](docs/screenshots/milestone2d-panel-focus-detail.png) · [All browser evidence](docs/screenshots/milestone2d-preview.md)

The single-crystal example uses a legal 35-move solve; the two-crystal example uses its 34-move witness. The reference artwork is not a runtime game background. Paper and amethyst are newly generated reusable art based on that reference, so ornament, crystal facets and the small SVG scroll differ from the concept illustration. Actual iOS/Safari remains unverified. Stop for visual feedback before further development.

## Milestone 2E wooden mechanism and typography

The middle panel now has shallow wooden thickness and changing light across a 650ms flip.
A contour-aligned pale brass halo appears near landing, followed by independent drifting,
twinkling dust. New-puzzle activation, manual progression and all rewards/saves remain unchanged.
Reduced motion shows the correct face with static glow/glints. Side labels are centered separately
from their arrows; the center label has symmetric stars, with no panel coordinate changes.

Local OFL WOFF2 subsets use **LXGW ZhenKai** for labels/title and **Source Han Serif Medium**
for prose/HUD, adding **122.4 KiB** total. [Font licenses and rebuild](public/fonts/README.md) ·
[Presentation notes](assets/panel-magic.md) · [Browser gallery and video](docs/screenshots/milestone2e-preview.md)

Verified: **68 unit tests, 82 browser tests**, production build. Physical Safari/iOS and low-end
GPU checks remain outstanding. No gameplay, reward, save, bottle/pour or scene-art changes.
