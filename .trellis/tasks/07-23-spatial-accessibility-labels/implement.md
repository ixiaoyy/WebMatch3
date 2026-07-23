# Implementation plan

1. [x] Add focused failing tests for truthful layer/overlap wording and action
   variants.
2. [x] Add a pure UI label projection in the existing `game-ui` module.
3. [x] Derive a current overlap-count map in `FishField` from canonical pieces and
   `getBlockerIds`.
4. [x] Pass the derived value to `FishPiece` and compose the final `aria-label`.
5. [x] Add a regression for count updates after an upper piece leaves.
6. [x] Run focused engine/UI tests that cover overlap metadata and label output.
7. [x] Perform a keyboard/screen-reader-name smoke check on overlapping fish.
8. [x] Run `pnpm ci:web` once on the final code state.

## Evidence

- Focused tests: `game-ui`, `ambient-game`, and `ambient-controller` passed
  46 tests.
- Browser accessibility tree exposed species, one-based layer, zero/positive
  overlap wording, and Enter/Space/F guidance.
- Removing `fish-82` through the `F` keyboard path updated three affected
  lower-fish names before the leave transition completed; arrow navigation
  moved focus from `fish-82` to `fish-83`.
- Browser console contained only Vite connection debug entries and no warning
  or error.
- Final `pnpm ci:web` passed lint, TypeScript, 7 suites / 69 tests, production
  build, and PWA generation with 33 precache entries.

## Risk and rollback points

- Do not confuse legacy `blockerIds` terminology with present actionability.
- Avoid repeated per-button scans when a single collection projection can be
  reused.
- Keep announcements concise; game outcomes remain in the existing live region.
- Do not change engine types or snapshot schema merely to carry prose.
