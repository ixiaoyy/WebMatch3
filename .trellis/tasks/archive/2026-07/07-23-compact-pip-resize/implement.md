# Implementation plan

1. Add a testable latest-size animation-frame scheduler near the UI projection
   owner; avoid a generic shared utility with only one consumer.
2. Route ResizeObserver deliveries through that scheduler, retain immediate
   initial projection, and cancel pending work during unmount.
3. Add focused unit coverage for delivery bursts, latest-size selection, and
   cancellation.
4. Remove PiP minimum-height constraints, add shared compact-surface CSS
   variables, and override the conflicting 620 px narrow-landscape behavior.
5. Tune FishField, FishTray, CatCompanion, GrowingPlant, and quiet controls only
   where the owning component's existing responsive hook requires it.
6. Run focused UI/PiP tests.
7. Run browser QA at 430×560 and 320×240, then regression sizes 320×568 and
   1440×900; include keyboard and reduced-motion paths.
8. Run `pnpm ci:web` once on the final code state.

## Risk and rollback points

- Projection scheduling affects pointer inverse mapping and cat guard position;
  verify all three consumers use the same committed projection.
- CSS ordering can let the general short-landscape rule override PiP; keep the
  compact override explicit and test computed height.
- Do not reduce native hit areas while shrinking bitmaps.
- If 320×240 cannot retain all decoration, reduce only decorative visual
  footprint and preserve semantic progress/action paths.

## Completion evidence

- `pnpm --dir apps/web test -- spotlight document-pip`: 2 files / 9 tests
  passed.
- `pnpm ci:web`: lint, type-check, 7 files / 67 tests, production build, and
  PWA generation passed.
- Browser QA passed at `430×560`, `320×240`, `320×568`, and `1440×900`.
- At `320×240`, viewport, scroll area, and surface were all exactly
  `320×240`; both quiet controls were `64×44` with `14px` labels.
- Keyboard arrows retained focus on the fish search surface; browser console
  contained no warnings or errors.
