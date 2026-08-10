# 活鱼捕捉交互改造 — Implementation Plan

## Phase 1 — target identity and living feedback

- [x] Add a pure nearest rendered-target helper and focused unit tests for radius, closest winner and stable ties.
- [x] Add FishField magnetic hover/press capture without duplicating direct fish-button activation.
- [x] Add FishPiece magnetic/pressed states, inner living-motion wrapper and reduced-motion/away-safe styling.
- [x] Verify mouse body-edge clicks, touch tap/scan and keyboard paths retain one canonical activation.

## Phase 2 — source-to-tray continuity

- [x] Make `ambient-controller.activate` return its existing selection result and add method contract documentation.
- [x] Add the pointer-transparent `FishCatchFlight.vue` overlay with normal and reduced-motion completion timing.
- [x] Measure source and exact pre-selection destination slot in `GameView`; support multiple concurrent UI flight events.
- [x] Project incoming IDs out of `FishTray` until each flight completes, then run slot landing feedback.
- [x] Delay loss emphasis until its final incoming fish has reached slot seven.

## Phase 3 — readable match and cat delivery

- [x] Add completed-fish presentation phases and deterministic controller timers.
- [x] Start tray gather only after all clearing flights complete; render large-fish delivery from the merge phase.
- [x] Start cat eating/full motion, optional bubble, clear sound and plant celebration at delivery contact rather than selection time.
- [x] Preserve level advance, bond progression, persistence and input cleanup under away/dispose/interruption.
- [x] Update controller tests for phase ordering, duration and repeated combinations.

## Phase 4 — validation and polish

- [x] Run focused game UI tests after implementation.
- [x] Run lint and type-check once the focused suite is green.
- [x] Run the Impeccable mechanical detector once over changed UI targets.
- [x] Start the local app and visually test desktop plus compact viewports, including reduced motion where the browser supports it.
- [x] Run final `pnpm ci:web` once on the final code state.
- [x] Inspect the full task diff, preserve unrelated `.trellis/qa/` and `design-qa.md`, and stage only production code immediately; leave tests/docs/QA unstaged unless requested.

## Risk and rollback points

- Magnetic surface events can double-fire with child buttons; guard by original event target and cover with single-activation tests.
- Multiple flights can reorder the projected tray; key every flight and incoming piece by canonical ID and compute each destination before state mutation.
- Controller phase timers can leak or leave input locked; route cancellation through existing feedback cleanup and test dispose/away paths.
- CSS transforms can compete; keep idle motion on a new inner wrapper and presentation positioning on existing outer wrappers.
- Reduced motion may not emit CSS animation events; use an explicit component completion timer with cleanup rather than relying only on `animationend`.

## Validation commands

```powershell
pnpm --dir apps/web test -- spotlight.test.ts ambient-controller.test.ts game-ui.test.ts
pnpm lint:web
pnpm typecheck:web
node C:\Users\phpxi\.codex\skills\impeccable\scripts\detect.mjs --json <changed-ui-targets>
pnpm ci:web
```
