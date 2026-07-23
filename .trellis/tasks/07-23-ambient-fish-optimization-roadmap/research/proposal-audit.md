# Submitted optimization proposal audit

Audited against the working tree and a fresh `pnpm ci:web` run on 2026-07-23.

## Verified build baseline

- ESLint completed with `--max-warnings 0`.
- `vue-tsc` completed successfully.
- Vitest passed 7 files and 66 tests.
- Vite emitted `manifest.webmanifest`, `sw.js`, and the Workbox runtime.
- The PWA plugin reported 33 precache entries totaling about 2.7 MiB.

## Proposal findings

| Proposal | Finding | Priority decision | Evidence |
|---|---|---|---|
| Spatial hash for overlap | The geometric `O(N²)` pass exists only when a level is generated or a legacy piece lacks `blockerIds`. Current levels precompute IDs. `FishField` can still do small repeated scans over at most 60 pieces, but a spatial hash would not optimize the cached-ID path. | Do not implement without profiling. If measured later, first optimize derived adjacency/ID lookup rather than geometry. | `pile.ts:27,358,376,440`; `FishField.vue:83` |
| ResizeObserver debounce | Continuous resize writes `fieldProjection` for every observer delivery and reprojects all pieces. Coalescing the latest dimensions to one animation-frame update is a bounded improvement, especially in PiP. | Accept inside the compact PiP task. | `GameView.vue:168-177` |
| Debounced local storage | Saves occur after meaningful actions and attention/disposal, not pointer movement. Immediate persistence is an explicit product contract. Delaying it adds close/crash loss risk without measured evidence. | Reject for this roadmap. | `ambient-controller.ts:141,409,489,513,534,555,561,578,601,622`; `PRODUCT.md` design principle 4 |
| Dynamic Web Audio | Already implemented with an opt-in `AudioContext`, oscillator, and gain envelope. Continuous ambient audio is explicitly prohibited. | No task. Keep the existing one-shot contract. | `sound.ts:7-48`; `PRODUCT.md:65`; `game-ui-contract.md:150` |
| Clear particles / tactile polish | Existing clear, settle, tray compression, plant celebration, cat drop-hover, and nearby slip feedback already exceed a simple fade/scale. Small bubbles may be viable, but are product-design work and must preserve reduced motion. | Defer to a separate visual-design task. | `game-ui-contract.md` feedback and motion contracts; current FishField/FishTray/CatCompanion styles |
| Scene themes | Runtime imports one wallpaper. Multiple themes are not implemented. They require asset, persistence, contrast, and product-behavior decisions. Tying a theme to mute state has no product rationale. | Defer; P2/P3 product-design candidate. | `GameView.vue:5,198,209`; `visual-design-contract.md` |
| Compact PiP | PiP moves the main structure unchanged. The PiP surface forces `min-height: 430px`, and the short landscape media query forces `620px`, so very small windows can clip rather than adapt. | Accept as P0. | `GameView.vue:318-322,394-397`; `document-pip.ts` requests 430×560 |
| Spatial screen-reader labels | Fish names identify species and actions but expose layer only as a data attribute. A global polite live region exists. Because overlap does not disable selection, labels must describe overlap rather than claim a fish is blocked. | Accept as P1. | `FishPiece.vue:38-43,118,125`; `GameView.vue:277`; `game-ui-contract.md` actionability contract |
| PWA/offline | Already installed and registered; the production build generates and populates the service worker. | Complete; no task. | `vite.config.ts:5-41`; `app/pwa.ts:1-3`; fresh build output |
| 100-level solver | Existing tests construct a complete removal path across progressive levels and completely clear 64 seeded layouts. The generation schedule guarantees triples; `hasDiscoverableMatch` concerns the opening reveal, not every intermediate click. | Complete for the stated risk. Extend only when rules change. | `ambient-game.test.ts:428-482`; `gameplay-loop-polish/implement.md:50` |
| Extract `@ambient-fish/core` | The engine is already pure TypeScript and isolated from Vue/browser APIs. Project conventions forbid speculative layers until a real consumer exists. | Defer until a second runtime consumer is implemented. | `directory-structure.md:33,49,83-84`; engine import inspection |

## Recommended roadmap

1. P0 — compact PiP layout and frame-coalesced resize projection.
2. P1 — truthful spatial accessible names.
3. P2/P3 discovery only — visual micro-feedback or themes after a dedicated
   design review.

No performance-architecture, persistence, PWA, solver, audio-background, or
package-extraction task is justified by the current evidence.
