# Implementation plan

1. Add focused failing tests for truthful layer/overlap wording and action
   variants.
2. Add a pure UI label projection in the existing `game-ui` module.
3. Derive a current overlap-count map in `FishField` from canonical pieces and
   `getBlockerIds`.
4. Pass the derived value to `FishPiece` and compose the final `aria-label`.
5. Add a regression for count updates after an upper piece leaves.
6. Run focused engine/UI tests that cover overlap metadata and label output.
7. Perform a keyboard/screen-reader-name smoke check on overlapping fish.
8. Run `pnpm ci:web` once on the final code state.

## Risk and rollback points

- Do not confuse legacy `blockerIds` terminology with present actionability.
- Avoid repeated per-button scans when a single collection projection can be
  reused.
- Keep announcements concise; game outcomes remain in the existing live region.
- Do not change engine types or snapshot schema merely to carry prose.
