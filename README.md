# 月夜魔法药剂室 · Moonlit Alchemy

A quiet, mobile-first potion sorting game. Milestone 2B: a playable tall wooden cabinet scene built with React, TypeScript, Vite and independent SVG bottles. All gameplay runs locally in the browser.

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

Tap a bottle, then an empty bottle or one with the same top color and available space. The maximum contiguous top group transfers at once. Sort seven colors into seven full bottles, leaving two empty. Tap the selected bottle again to deselect. Undo, restart and new puzzle controls are available; restart/new puzzle ask before discarding ongoing progress.

Progress, undo history and optional color symbols are saved in this browser's localStorage. Blocked storage does not prevent play, but displays a warning. Clearing browser data removes progress. Corrupt or incompatible saves start a fresh verified puzzle. This version keeps one active puzzle, not a cloud account or multi-device sync.

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

Read [PROJECT_SPEC.md](PROJECT_SPEC.md) and [PROGRESS.md](PROGRESS.md) before resuming. Milestone 2B replacement and layout calibration are complete; stop for feedback before further work. Final bottle art, animation timing/physics refinements and installable/offline PWA behavior remain deferred. No service worker or installability is claimed in this version.

## Small floating-pour prototype

The current `work` branch includes the separately authorized ~0.92-second animation experiment: source lift/travel, inward tilt, matching-color stream, synchronized liquid transfer and return. It reuses the existing game rules and SVGs; controls lock briefly during the flight. Reduced motion performs the transfer immediately. Its timing and implementation are retained in the cabinet scene. No PWA work or public deployment is included.

Run the existing development command and try bottle 1 → empty bottle 8 from a fresh first puzzle, followed by bottle 7 → bottle 1. See [the short animation capture](docs/screenshots/floating-pour-prototype.gif), [downward pour](docs/screenshots/floating-pour-down.png) and [upward pour](docs/screenshots/floating-pour-up.png). The GIF is a 20 fps visual reference; the live renderer uses requestAnimationFrame. Full checks now comprise 33 unit tests and 48 browser tests. Detailed behavior and limitations are recorded in `PROGRESS.md`.

## Milestone 2B tall cabinet scene

The redrawn 841×1870 cabinet is now active, using the previously prepared 296 KiB WebP unchanged. Nine independent SVG bottles and the two bottom-panel buttons share its image coordinates. Their placements were remeasured from the new artwork; see [layout measurements](assets/cabinet-tall-layout.md). Undo stays on the left, restart on the right, and the center inset stays decorative. Existing top HUD, new-puzzle entry and footer controls remain in place.

[390×844 full page](docs/screenshots/milestone2b-tall-390x844.png) · [360×640 full page](docs/screenshots/milestone2b-tall-360x640.png) · [390×844 floating pour](docs/screenshots/milestone2b-tall-pour-390x844.png) · [320×568 viewport, full scrollable page](docs/screenshots/milestone2b-tall-320x568-full-page.png)

The scene preserves the full artwork without stretching or cropping. It fits completely at 390×844 and 360×640 and centers on desktop. At 320×568, the existing 280px minimum scene width gives about 623px of page height, so the footer is reached by a short vertical scroll. Tests cover artwork contact bands, non-overlapping bottle targets, panel bounds/centering, ≥44px targets, top information visibility and the unchanged gameplay/animation.

Both cabinet source PNGs and WebP exports remain in the repository. The [Milestone 2A screenshot](docs/screenshots/milestone2a-cabinet-mobile.png) is historical. Current bottle art and tilted liquid remain the prototype; physical iOS/Safari and safe-area behavior on actual devices still need verification. HUD changes, animation refinements, final bottle art, rewards, PWA and public deployment remain future work.


The subsequent contact-shadow correction keeps those coordinates and replaces the detached SVG ellipse with a small stationary shadow at the glass base. It dims on selection, hides for the flying source and returns on landing; moving bottle art carries no shelf shadow. See [same-state before/after browser comparisons](docs/screenshots/milestone2b-contact-comparison.md).
