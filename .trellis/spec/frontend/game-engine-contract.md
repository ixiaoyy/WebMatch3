# Ambient Fish Engine Contract

## 1. Scope / Trigger

Apply this contract when changing finite level generation, field-geometry
overlap relationships, small-fish tray selection, same-species combination,
progressive difficulty, full-tray loss restart, or any consumer of those
transitions. The engine lives in `apps/web/src/features/game/engine` and stays
independent from Vue, DOM APIs, timers, storage, sound, cat state, and
Picture-in-Picture.

## 2. Signatures

Consumers import only from `@/features/game/engine`:

```ts
createInitialState(random?: RandomSource): AmbientGameState
createLevelState(level: number, clearCount: number, nextPieceId: number, random?: RandomSource): AmbientGameState
getLevelConfig(level: number): LevelConfig
MAX_PIECE_COUNT: number
getBlockerIds(pieces: readonly PilePiece[], pieceId: string): readonly string[]
getSelectablePieces(pieces: readonly PilePiece[]): readonly PilePiece[]
hasQuickMatch(pieces: readonly PilePiece[]): boolean
hasDiscoverableMatch(pieces: readonly PilePiece[]): boolean
isSafeFieldPoint(point: Point): boolean
INITIAL_DISCOVERY_POINT: Point
DISCOVERY_RADIUS_X: number
DISCOVERY_RADIUS_Y: number
selectPiece(state: AmbientGameState, pieceId: string, random?: RandomSource): SelectionResult
restartAfterLoss(state: AmbientGameState, random?: RandomSource): AmbientGameState
createSeededRandom(seed: number): RandomSource
```

```ts
interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly clearCount: number;
  readonly level: number;
  readonly nextPieceId: number;
}

interface CombinedSelection {
  readonly kind: "combined";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly fishKind: FishKind;
  readonly levelAdvanced: boolean;
}

type SelectionResult =
  | MissingSelection
  | MovedSelection
  | CombinedSelection
  | LostSelection;
```

## 3. Contracts

- `FISH_KINDS` is the single ordered species registry: whale, koi, sardine,
  pufferfish, goldfish, clownfish, angelfish, and betta. Legacy color keys are
  accepted only by versioned storage migration and never enter the engine.
- Engine pieces are complete small fish. Cutting, fish-part identity, direct
  cat feeding, feed credits, cat fullness, and the visual large fish do not
  exist in canonical engine state.
- Level one contains 36 unique pieces, three active kinds, constrained
  randomized coordinates, and two shallow layers. Each subsequent level adds
  six pieces through the shared 60-piece cap; levels two through six expose one
  additional kind per level, level three introduces the third layer, and level
  six exposes all eight kinds.
- `MAX_PIECE_COUNT` is the generation cap and is reused by snapshot parsing.
  Never maintain a separate storage-only inventory cap.
- Every level consists of complete same-kind triples dealt across three-kind
  spatial groups. Groups receive balanced layer quotas and shuffled layer
  order. Each generated level preserves a complete removal path and exposes
  one same-kind triple inside the initial discovery spotlight across at least
  two layers.
- Generation samples shuffled safe regions with a finite rejection limit. It
  keeps group centers apart using the canonical fish footprint, reserves the
  cat/plant/tray corner, covers all four field quadrants, and uses a finite
  deterministic eight-region lattice fallback when random candidates
  degenerate. The same seed reproduces positions, layers, species, scale, and
  rotation.
- New levels use one stable normalized field position (`pile === spread`) and
  persist explicit higher-layer `blockerIds`. Those IDs describe visual overlap
  for UI settling motion but never gate selection. Old snapshots without them
  retain legacy overlap calculation until migration or level replacement.
- The normalized overlap rectangle tracks the rendered small-fish footprint
  (`0.20 × 0.29` of the field at scale `1`). Only meaningful overlap from a
  strictly higher layer is recorded. Rotation does not change this conservative
  footprint.
- New pieces sample rotation across `[0, 360)`. Migrated snapshots may retain
  legacy negative rotations accepted by the storage boundary.
- Every remaining pile piece is selectable regardless of layer. Public
  transitions never mutate their input, and a missing selection returns the
  original state object.
- A selection removes one pile fish and appends its `{ id, kind }` entry to the
  ordered tray. When the selected species reaches three, `selectPiece` removes
  the earliest three entries of that species, increments `clearCount` once,
  and returns `kind: "combined"` with that exact ordered triple.
- Same-species combination has priority over the seven-slot loss rule. Other
  species remain in tray order. Mixed species and one/two matching fish never
  combine.
- Canonical active inventory is `pieces + tray`; its total and each species
  count remain divisible by three. The large fish is a transient UI projection
  of `CombinedSelection`, not a fourth inventory object.
- Combining the final three active fish creates the next level atomically and
  sets `levelAdvanced: true`. Incomplete levels never advance.
- A seventh unmatched tray entry loses immediately. The result contains a
  readonly seven-piece preview plus a newly generated stable level-one state.
- Loss restart clears the tray and current field while preserving `clearCount`
  and using the previous `nextPieceId` as the first ID of the replacement
  level. IDs remain monotonic and plant progress never decreases.
- Tests inject seeded randomness. Production may use `Math.random` only at the
  public default boundary.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Missing piece ID | `SelectionResult { kind: "missing", state }` with original state identity |
| Existing piece has higher-layer overlap metadata | remove it normally; UI may animate related neighbors |
| Existing piece, tray below seven, fewer than three of its kind | append it and return `kind: "moved"` |
| Selected kind reaches three before level end | remove its earliest three entries, increment once, return `kind: "combined"` |
| Mixed kinds occupy the tray | preserve them in order; never combine across species |
| Matching third fish makes tray length seven | combine first; do not lose |
| Selected kind combines the last active triple | create the harder next level and set `levelAdvanced: true` |
| Tray reaches seven without a combination | return `kind: "lost"`, seven-piece preview, and stable level-one restart |
| Random value is non-finite or outside `[0, 1)` | throw `AmbientEngineError` |

## 5. Good / Base / Bad Cases

- Good: the UI consumes `CombinedSelection.combined` to render three small fish
  becoming one large fish, while the engine stores no visual large-fish record.
- Base: a fresh state exposes a discoverable same-species triple and a complete
  removal path without a timer, score, level label, or failure page.
- Good: the UI asks `getBlockerIds` only to animate related neighbors after a
  fish leaves; all native fish buttons stay actionable.
- Good: the UI renders canonical `pile` coordinates without regenerating or
  mutating state; legacy `spread` remains snapshot-compatible only.
- Bad: a component groups fish by DOM position or constructs its own triple.
- Bad: a component removes one fish directly for the cat or stores a large fish
  in engine state.
- Bad: a combination appends replacements and makes the current level endless.
- Bad: loss restart persists a seven-piece tray, resets `clearCount`, reuses
  generated IDs, or waits for confirmation.

## 6. Tests Required

1. unique IDs, level-one 36-piece mixed layout, explicit blockers, and layers
   limited to `0..2`;
2. meaningful higher-layer overlap metadata, lower-layer selection, and the
   vertically offset case governed by the canonical rendered footprint;
3. missing-result identity and complete input immutability;
4. ordered tray movement, same-species combination, exact earliest-three IDs,
   mixed-species non-combination, and `clearCount` increment;
5. combination priority over seventh-entry loss, unmatched loss preview,
   level-one restart, preserved progress, and monotonic IDs;
6. complete solver traversal across progressive levels and atomic advancement;
7. piece-count progression `36, 42, 48, 54, 60`, unique safe positions at the
   cap, and active kind counts `3, 4, 5, 6, 7, 8` capped at eight;
8. invalid random values, deterministic seeded repetition, and a finite unique
   fallback under a degenerate constant random source;
9. multi-seed safe bounds, broad coverage, bounded overlap, balanced shuffled
   layers, all rotation quadrants, initial discoverable triples, and complete
   clearing paths;
10. per-species divisibility after every move, combination, loss, and level
    advance.

Run focused `ambient-game` tests before the final `pnpm ci:web` gate.

## 7. Wrong vs Correct

### Wrong

```ts
const matching = tray.filter((item) => item.kind === selected.kind);
if (matching.length === 3) componentState.largeFish = selected.kind;
```

This duplicates the combination rule in a component and creates a second
canonical state owner.

### Correct

```ts
const result = selectPiece(game, pieceId, random);
if (result.kind === "combined") {
  renderDelivery(result.combined, result.fishKind);
}
```

The engine owns the exact ordered triple; the UI owns only its temporary
small-to-large delivery projection.
