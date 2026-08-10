# Ambient Fish Engine Contract

## 1. Scope / Trigger

Apply this contract when changing fish-wave construction, level goals, tray
selection, same-species combination, wave refresh, level advancement, or loss
restart. The engine lives in `apps/web/src/features/game/engine` and must stay
independent from Vue, DOM APIs, timers, storage, audio, and pet presentation.

## 2. Signatures

Consumers import only from `@/features/game/engine`:

```ts
getLevelGoal(level: number): number
getLevelConfig(level: number): LevelConfig
createInitialState(random?: RandomSource): AmbientGameState
createLevelState(
  level: number,
  clearCount: number,
  nextPieceId: number,
  random?: RandomSource,
  levelProgress?: number,
): AmbientGameState
selectPiece(
  state: AmbientGameState,
  pieceId: string,
  random?: RandomSource,
): SelectionResult
restartAfterLoss(
  state: AmbientGameState,
  random?: RandomSource,
): AmbientGameState
```

```ts
interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly clearCount: number;
  readonly level: number;
  readonly levelProgress: number;
  readonly nextPieceId: number;
}

interface CombinedSelection {
  readonly kind: "combined";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly fishKind: FishKind;
  readonly levelAdvanced: boolean;
  readonly fieldRefreshed: boolean;
}
```

## 3. Contracts

- `FISH_KINDS` is the single ordered eight-species registry. Legacy color keys
  are accepted only inside versioned storage migration.
- `getLevelGoal` returns `3, 5, 8, 13, 21, 34…` for levels one through six and
  continues the same recurrence. Invalid non-positive or unsafe levels throw.
- Level one contains exactly 9 pieces: 3 species, each appearing 3 times. It
  advances only after all three groups combine. Its first two combinations
  keep the remaining field and set `fieldRefreshed: false`.
- Level two starts with 5 species and 11 pieces. Later levels use 6/13, 7/15,
  then 8/17 pieces and remain capped at eight species.
- Every level-two-or-later wave has exactly one species count of 3; every other
  active species has count 2. A completed triple always replaces that wave and
  sets `fieldRefreshed: true`.
- `levelProgress` counts completed groups in the current level only.
  `clearCount` is lifetime plant/feed progress. Advancing resets only
  `levelProgress`; loss preserves both counters and the current level.
- New pieces use authored S-curve points, `pile === spread`, `layer: 0`, empty
  `blockerIds`, scale `0.96..1.06`, and rotation `-8..8` degrees. Generation
  never creates gameplay stacking or occlusion.
- Species passes are interleaved so repeated fish do not occupy adjacent route
  slots. Geometry is deterministic for a seeded random source.
- A selection removes one field fish and appends `{ id, kind }` to the ordered
  tray. The earliest three entries of the selected species combine first.
- Combination takes priority over the seven-slot loss rule. On later waves,
  combination intentionally clears unrelated tray entries as part of the new
  wave transaction.
- A seventh unmatched fish returns a seven-piece loss preview and a fresh copy
  of the current wave. `level`, `levelProgress`, `clearCount`, and monotonic ID
  allocation remain intact.
- `MAX_PIECE_COUNT` remains the legacy snapshot ceiling, not the active wave
  size. New wave validation uses `getLevelConfig(level).pieceCount`.
- Public transitions are immutable. Missing IDs return the original state
  object, and production randomness enters only through public defaults.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Invalid level or out-of-range `levelProgress` | throw `RangeError` |
| Missing piece ID | `kind: "missing"` with original state identity |
| First/second level-one triple | increment counters, retain remaining pieces, no refresh |
| Third level-one triple | create level two with 11 pieces and reset progress |
| Later triple below the goal | rebuild same-level wave and increment progress |
| Later triple reaches the goal | create next-level wave and reset progress |
| Seventh unmatched tray entry | rebuild current wave and preserve level progress |
| Matching third fish is seventh entry | combine first; do not lose |
| Random value is non-finite or outside `[0, 1)` | throw `AmbientEngineError` |

## 5. Good / Base / Bad Cases

- Good: level two progress `4/5` combines once, returns a 13-piece level-three
  wave, and keeps lifetime `clearCount` monotonic.
- Base: level one starts with three easy, fully visible triples and no hidden
  dependency on UI reveal state.
- Good: a loss at level three progress `3/8` rebuilds a 13-piece wave at `3/8`.
- Bad: advancing level one after its first triple.
- Bad: creating a later wave with two triple species or retaining a species
  with only one copy.
- Bad: using `MAX_PIECE_COUNT` as the current generated piece count.
- Bad: a component computes its own goal, triple, refresh, or loss transition.

## 6. Tests Required

1. exact goals `3, 5, 8, 13, 21, 34` and configs `9, 11, 13, 15, 17`;
2. level-one three-by-three inventory and advancement only after group three;
3. exactly one triple and all remaining pairs for every later seeded wave;
4. unique authored points, single layer, empty blockers, safe bounds, restrained
   scale/rotation, and separated repeated species;
5. same-level refresh below the goal and next-level creation at the goal;
6. ordered tray movement, earliest-three combination, and combination before
   seventh-slot loss;
7. current-wave loss restart with preserved level, `levelProgress`,
   `clearCount`, empty tray, and monotonic IDs;
8. deterministic seeded results, immutable inputs, and invalid-random errors.

Run focused engine tests, then the repository frontend quality gate.

## 7. Wrong vs Correct

### Wrong

```ts
if (result.kind === "combined") {
  level.value += 1;
  pieces.value = generateRandomPile(60);
}
```

This duplicates progression in the UI and reintroduces random piling.

### Correct

```ts
const result = selectPiece(game, pieceId, random);
if (result.kind === "combined") {
  game = result.state;
  presentWaveChange(result.fieldRefreshed, result.levelAdvanced);
}
```

The engine owns counters and wave identity; the UI owns only presentation time.
