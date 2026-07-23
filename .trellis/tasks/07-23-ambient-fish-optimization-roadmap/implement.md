# Implementation plan

## Sequence

1. Review this parent audit and both child plans.
2. Start `07-23-compact-pip-resize`, not the parent.
3. Implement and verify compact PiP composition plus resize coalescing.
4. Complete and archive the first child.
5. Start `07-23-spatial-accessibility-labels`.
6. Implement and verify truthful spatial accessible names.
7. Run the parent integration acceptance pass after both children complete.

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
