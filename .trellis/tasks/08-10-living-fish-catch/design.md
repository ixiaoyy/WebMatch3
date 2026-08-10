# 活鱼捕捉交互改造 — Technical Design

## Architecture and boundaries

The pure engine remains authoritative and unchanged. Vue owns a presentation transaction layered over the immediate engine result:

1. `FishField` resolves one pointer target from currently revealed rendered fish and emits the canonical ID.
2. `GameView` measures the source fish and pre-selection destination slot before calling the controller.
3. `ambient-controller.activate` returns the existing engine `SelectionResult` after applying it, allowing the view to create a catch flight only for a real selection.
4. `GameView` holds a small array of UI-only catch flights. While a piece ID is incoming, the tray projection omits that canonical/preview piece.
5. Flight completion removes the incoming ID, allowing the real tray piece to enter and land in its slot.
6. A combined result enters explicit controller presentation phases. The match waits until the catch interval has elapsed, then merges and delivers; cat/plant feedback begins only near delivery contact.

No transient geometry, phase or animation ID enters engine state or persistence.

## Pointer target projection

`FishField` derives magnetic candidates from visible enabled `[data-piece-id]` elements. Each candidate contributes its rendered center; the closest candidate inside the acquisition radius wins. Direct button events continue to own clicks inside the semantic `44×44px` core. Surface events only resolve when the original event target is not already a fish, preventing duplicate activation.

The active magnetic ID is passed to `FishPiece` for exact preselection styling. Pointer down captures that ID until release so target fan/separation or idle motion cannot change the selected identity mid-gesture. Touch tap continues using the field light and nearest revealed canonical fish; keyboard uses existing semantic buttons and light navigation.

The distance chooser is a pure helper with deterministic tie-breaking tests. DOM discovery and geometry measurement stay inside `FishField`.

## Fish motion composition

Add an inner body wrapper below the existing position/rotation/scale wrapper:

- outer `.fish-piece` — canonical/UI target position and drag offset;
- `.fish-piece__visual` — existing species rotation, scale, hover, guide and press states;
- `.fish-piece__body` — deterministic low-amplitude living motion only.

Revealed fish drift a few pixels over a multi-second loop; hinted fish use a slower, lower-amplitude variant. Magnetic, focused, guided, pressed and dragged fish pause the inner loop and settle at the origin. The loop is absent under away/reduced-motion because those states are not revealed/hinted or CSS disables it.

## Catch flight transaction

Introduce `FishCatchFlight.vue`, an `aria-hidden`, pointer-transparent surface overlay. Each event contains:

- UI event ID and canonical piece ID;
- species kind;
- surface-local source and destination centers;
- whether the selection completed a match or loss.

The overlay uses a dynamic transform path with a short source ripple and an arc expressed with transform/opacity. A component timer emits completion after the declared duration; reduced-motion uses a short staged crossfade and the same completion contract.

`GameView` computes `displayedTrayPieces` by removing all pending flight IDs from `trayPreview ?? game.tray`. Exact target slot geometry is measured before controller activation from the current tray count. Multiple ordinary flights can coexist. A matching triple does not start its merge while any clearing ID remains incoming.

## Completed-fish presentation phases

Extend the UI-only `CompletedFishEvent` with a presentation phase:

1. `catching` — third fish and any preceding rapid catches finish; field source leaves, tray merge is idle.
2. `merging` — all three real tray pieces are visible and run the gather animation; `FishDelivery` forms the large fish and travels toward the cat.
3. `feeding` — near delivery contact, cat pose/motion, optional reaction bubble, clear sound callback and plant celebration begin.

Controller timers own these phases so tests can prove ordering and cleanup. Input stays locked only for the complete-fish transaction, as it already is via `completedFish !== null`; normal moved selections remain non-blocking. Away/dispose/interruption cancel the current phase timer and clear transient presentation state.

Level feedback begins at `feeding`, so the next fish field does not celebrate before the prior large fish reaches the cat. Loss keeps its existing rule but the final incoming fish lands before the tray loss response becomes visually dominant.

## Compatibility and accessibility

- Engine types and transitions stay unchanged except that the controller method returns their already-produced result.
- Snapshot version and stored payload are unchanged.
- Visual ghosts and ripples are `aria-hidden`, non-focusable and pointer-transparent.
- Semantic fish buttons retain accessible names, focus ring, arrow navigation, Enter/Space and `F`.
- Reduced motion removes idle loops and long translation while keeping sequential state changes and minimum readable holds.
- Geometry is recalculated per activation from the mounted surface, so Document PiP and responsive layouts share the same implementation.

## Validation and rollback

- Unit-test magnetic nearest-target selection, deterministic ties and boundary rejection.
- Controller tests assert `catching → merging → feeding → cleared`, cat/plant ordering, level timing, interruption and cleanup.
- Existing engine/storage tests must remain unchanged and green.
- Browser QA covers target edges, rapid double selection, first triple, loss and level advance on desktop and compact layouts.
- `FishCatchFlight.vue`, magnetic surface handling and controller phases are separable UI changes; none requires data migration, so each can be reverted without snapshot recovery.
