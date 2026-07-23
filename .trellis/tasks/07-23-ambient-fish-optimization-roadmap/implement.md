# Implementation plan

## Sequence

1. [x] Review this parent audit and both child plans.
2. [x] Start `07-23-compact-pip-resize`, not the parent.
3. [x] Implement and verify compact PiP composition plus resize coalescing.
4. [x] Complete and archive the first child.
5. [x] Start `07-23-spatial-accessibility-labels`.
6. [x] Implement and verify truthful spatial accessible names.
7. [x] Run the parent integration acceptance pass after both children complete.

## Integration validation

- Run `pnpm ci:web` once after each child reaches its final code state.
- For the PiP child, visually check the normal requested PiP size and the
  compact fallback size defined in its PRD.
- For the accessibility child, inspect computed names for lower, middle, and
  top pieces before and after an overlapping piece is removed.
- Confirm no changes to snapshot version, PWA manifest/service worker,
  solvability rules, or the one-shot sound preference.

## Review gates

- Do not run `task.py start` until the user approves the planning artifacts.
- Do not add deferred features while touching the same files.
- If compact layout cannot retain essential interaction at the minimum test
  height, return to planning and explicitly choose which decorative element is
  reduced or hidden.

## Completion evidence

- `07-23-compact-pip-resize` is archived as completed. Browser checks covered
  `320x240`, `320x568`, `430x560`, and `1440x900`; its final CI passed 67 tests.
- `07-23-spatial-accessibility-labels` is archived as completed. Browser checks
  proved arrow/F interaction and live lower-fish name updates; its final CI
  passed 69 tests.
- The integration file review found changes only in UI code, UI tests, styles,
  and frontend specifications. Engine solvability, session snapshots, PWA
  configuration, and sound code were untouched.
- The final P1 `pnpm ci:web` exercised the cumulative P0 + P1 state and passed
  lint, TypeScript, all 7 suites / 69 tests, production build, and PWA
  generation.
