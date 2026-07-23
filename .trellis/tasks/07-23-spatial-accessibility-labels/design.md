# Design

## Data flow

`AmbientGameState.pieces`
→ `FishField` derives current higher-overlap counts with the engine helper
→ a UI label projection formats species, layer, overlap count, and actions
→ `FishPiece` applies the final string to its native button.

## Ownership

- `getBlockerIds` remains the canonical current-piece overlap query.
- `FishField` owns collection-level derivation because it has the complete
  piece list.
- A pure function in the existing `game-ui` module owns Chinese label
  composition and plural/count branches so they can be tested without mounting
  Vue.
- `FishPiece` remains a renderer and interaction emitter. It receives the
  derived spatial input rather than importing collection state or recomputing
  geometry.

## Wording model

Use factual language such as:

`锦鲤，第2层，上方有2条小鱼重叠；Enter或空格放入托盘，按F喂给小猫`

and:

`锦鲤，第3层，上方没有小鱼重叠；…`

Do not use "blocked", "covered and unavailable", or "unobstructed", because
overlap never removes the action path.

## Performance

Derive overlap counts once per piece-list change and reuse them across fish
renders. Do not add geometry scans to each `FishPiece` or each label getter.
This task does not introduce a spatial index.

## Compatibility

No snapshot, engine-state, DOM role, shortcut, or localization infrastructure
change is required. Existing callers that construct fish-label projections in
tests must be updated explicitly by TypeScript.

## Test strategy

- Pure label tests for layer 0/1/2, zero/one/multiple overlaps, feedable, and
  resting-cat actions.
- A current-piece regression proving the count decreases after an overlapping
  piece is removed.
- Existing keyboard and controller tests remain unchanged.

## Rollback

Removing the derived prop and label projection restores the prior accessible
names without state migration.
