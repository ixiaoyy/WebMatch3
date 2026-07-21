# Expand felt fish kind registry

## Goal

Expand the shared kind registry to eight values and extend active-kind progression without changing piece counts, geometry, snapshot version, or final fish presentation.

## Requirements

- Preserve the existing `aqua`, `amber`, `lime`, and `rose` values as the first
  four entries so current version-two snapshots remain valid without migration.
- Add `goldfish`, `clownfish`, `angelfish`, and `betta` as the remaining four
  shared kind values. This slice does not rename the four legacy keys.
- Increase the active prefix one kind per level, from three kinds at level one
  to all eight kinds at level six and above.
- Keep the current piece-count progression, layer progression, generated IDs,
  authored geometry, matching rules, recovery behavior, and snapshot version.
- Keep the engine registry as the single source used by generation and snapshot
  validation.
- Add only the minimal UI fallback needed to keep newly generated kinds safe
  until the dedicated fish-presentation slice imports all eight assets and
  supplies final accessible names.
- Add focused engine and storage regressions for registry order, progression,
  high-level generation, old four-kind snapshots, and new eight-kind snapshots.

## Acceptance Criteria

- [x] The shared registry contains exactly eight unique values and retains the
      original four-value prefix in its original order.
- [x] `getLevelConfig` reports kind counts `3, 4, 5, 6, 7, 8` for levels one
      through six and stays capped at eight afterward.
- [x] A deterministic level-six state contains all eight registered kinds while
      preserving complete triples and the current piece-count/geometry rules.
- [x] Snapshot version remains `2`; a valid existing four-kind snapshot and a
      valid generated eight-kind snapshot both parse successfully.
- [x] No fish asset import, final fish label, piece-count change, or geometry
      change is included in this slice.
- [x] Focused engine and storage tests pass.

## Notes

- Verification: `pnpm lint:web`, `pnpm --dir apps/web typecheck`,
  `pnpm test:web`, and `pnpm build:web` passed on 2026-07-21.
- The presentation fallback is intentionally temporary and must be replaced by
  the next dedicated fish-presentation slice.
