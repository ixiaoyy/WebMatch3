# Feed fish to the cat — design

## Boundary

The engine owns whether a fish can be fed and the resulting canonical state.
The controller owns feed-mode intent, status copy, and timed cat poses. Vue
components only emit actions and render controller state.

## Solvability contract

The player may feed any three selectable fish, including three different
species. Each fed fish keeps one unsettled species credit. When the tray later
contains one or two fish of that species, unsettled credits may complete the
group of three and remove the short tray group.

Settling a short group does not increment `clearCount` or plant growth because
fewer than three fish were matched in the tray. A normal three-fish tray match
still has priority and remains the only growth event. Credits are consumed once
by marking their feed records settled; cat fullness continues to count all fed
fish. This avoids recoloring, replacement inventory, or hidden extra removals.

## Canonical state and transitions

`AmbientGameState.fed` stores zero to three removed `{ id, kind, settled }`
records. `feedPiece(state, pieceId, random?)` validates missing, blocked, and
full requests before removing one fish, then settles any newly completed short
group. A final feed may advance the level using the same atomic level creation
boundary as tray selection. New levels reset `fed`.

Snapshot version three persists `fed`. Version-one/version-two migration seeds
an empty feed list. Validation includes every fed ID in uniqueness checks and
requires settled feed records to be explicit booleans. Only unsettled credits
remain part of active inventory, so `(pieces + tray + unsettled fed)` must stay
divisible by three per species; settled feed records remain only as fullness
history.

## UI flow

Pointer and touch users drag a selectable fish onto the cat's current bounds;
only a valid drop calls `feedPiece`, so failed drops leave canonical state
unchanged. Keyboard users focus a selectable fish and press `F` for the same
feed transition, while Enter/Space continues to call `selectPiece`. Cat
activation is reserved for search assistance by the reactions task.

Cat pose is derived from persisted feed count after reload: zero is idle, one or
two is eating, and three is sleeping. The third feed plays `full -> lying ->
sleeping`. Away state pauses the pose timer and resumes from the current pose;
it never changes `fed`.

## Rollback

Remove only the `fed` state, feed transition/result types, controller feed
action, drag/keyboard feed wiring, and cat integration. Keep canonical Fish
naming, assets, and snapshot v3.
