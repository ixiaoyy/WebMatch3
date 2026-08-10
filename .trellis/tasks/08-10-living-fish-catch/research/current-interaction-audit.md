# Current interaction audit

## Evidence

- `apps/web/src/features/game/ui/components/FishPiece.vue:187-191` renders a `52–70px` desktop visual (`62–78px` compact) inside a `44×44px` semantic button. Visible pixels can therefore extend beyond the pointer target.
- `FishPiece.vue:74-87` emits activation on pointer release. `ambient-controller.ts:575-643` immediately calls pure `selectPiece`, replaces canonical state, and starts a `220ms` direct feedback window.
- `FishField.vue:649-654` only tucks the source DOM node for `220ms` during leave. There is no spatial bridge from the selected source to a tray slot.
- `GameView.vue:150-173` measures only tray-center-to-cat delivery geometry after a completed match. It does not preserve the third fish's source geometry or the exact destination slot.
- `FishTray.vue:57-66` renders canonical/preview tray pieces immediately. Its existing `220ms` landing animation therefore starts before any proposed source-to-tray flight unless incoming pieces are projected out temporarily.
- `ambient-controller.ts:583-615` sets completed fish, cat pose/reaction, progress callback, plant feedback and delivery at the same logical instant. The existing `700ms` feedback window cannot explain catch, merge, delivery and reaction as ordered events.
- `game-ui.ts:137-145` already keeps normal `select` feedback non-blocking while completed fish locks input through `completedFish !== null`; a longer match presentation can remain isolated without slowing ordinary catches.
- Canonical transitions already return `selected` for moved, combined and lost results and return the exact combined triple. No engine or snapshot change is necessary to construct UI-only catch and merge events.

## Design consequences

1. Pointer acquisition must use rendered centers and a magnetic margin, while semantic buttons remain available for keyboard use.
2. Game state and presentation state must be separated: canonical selection may commit immediately, while an `aria-hidden` catch ghost preserves spatial continuity.
3. Incoming tray pieces must be hidden from the tray projection until their own flight completes.
4. Completed matches need explicit presentation phases so tray merge, large-fish delivery, cat reaction and plant response do not start together.
5. Idle life should be an inner visual transform so it does not conflict with target positioning, hover, drag, guide or FLIP transforms.
6. All transient geometry remains surface-local and is discarded on unmount, resize invalidation or session reset.

## Motion thesis

- **Focal moment:** the third fish lands, the exact three tray fish gather into one large felt fish, and the cat visibly receives it.
- **Continuity:** source fish center → exact tray slot → matched tray center → cat center.
- **Feedback:** magnetic target preview, pressed compression/ripple, slot contact and cat reaction.
- **Budget:** CSS transforms/opacity, small bounded filters, no new dependency; idle motion only on currently hinted/revealed fish and disabled for away/reduced-motion.
