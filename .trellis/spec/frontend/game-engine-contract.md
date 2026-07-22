# Ambient Fish Engine Contract

## 1. Scope / Trigger

Apply this contract when changing finite level generation, field-geometry
overlap relationships, tray selection, automatic triples, progressive difficulty,
full-tray recovery, or any consumer of those transitions. The engine lives in
`apps/web/src/features/game/engine` and stays independent from Vue, DOM APIs,
timers, storage, sound, and Picture-in-Picture.

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
selectPiece(state: AmbientGameState, pieceId: string, random?: RandomSource): SelectionResult
feedPiece(state: AmbientGameState, pieceId: string, random?: RandomSource): FeedResult
recoverFullTray(state: AmbientGameState, random?: RandomSource): RecoveryResult
createSeededRandom(seed: number): RandomSource
```

## 3. Contracts

```ts
type FishKind =
  | "whale"
  | "koi"
  | "sardine"
  | "pufferfish"
  | "goldfish"
  | "clownfish"
  | "angelfish"
  | "betta";

interface PilePiece {
  readonly id: string;
  readonly kind: FishKind;
  readonly pile: { readonly x: number; readonly y: number };
  readonly spread: { readonly x: number; readonly y: number };
  readonly rotation: number;
  readonly scale: number;
  readonly layer: 0 | 1 | 2;
  readonly blockerIds?: readonly string[];
}

interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly fed: readonly FedFish[];
  readonly clearCount: number;
  readonly level: number;
  readonly nextPieceId: number;
}

interface FedFish extends TrayPiece {
  readonly settled: boolean;
}
```

- `FISH_KINDS` is the single ordered species registry: whale, koi, sardine,
  pufferfish, goldfish, clownfish, angelfish, and betta. Legacy color keys are
  accepted only by the version-two storage adapter and never enter the engine.
- Level one contains 36 unique pieces, three active shape-capable kinds,
  irregular authored coordinates, and two shallow layers. Each subsequent
  level adds six pieces through the 60-piece authored-geometry cap; levels two
  through six expose one additional kind per level, level three introduces the
  third layer, and level six exposes all eight kinds.
- `MAX_PIECE_COUNT` is derived from the authored template count and is reused
  by snapshot parsing. Never maintain a separate storage-only inventory cap;
  otherwise the engine can generate states that persistence rejects.
- Every level consists of same-kind triples assigned as complete groups to one
  layer and authored scatter/cluster slots. Clearing groups from the highest
  remaining layer down is therefore a deterministic complete solution, and a
  new level exposes a quick triple.
- New levels use one stable normalized field position (`pile === spread`) and
  persist explicit higher-layer `blockerIds`. They describe visual overlap for
  nearby settling motion, but never gate selection. Old snapshots without
  `blockerIds` retain the legacy overlap calculation until that level is
  finished.
- The normalized overlap rectangle tracks the rendered fish footprint
  (currently `0.20 × 0.29` of the field surface at scale `1`). Relationships
  include only meaningful overlap from a strictly higher layer; same-layer
  overlap does not trigger settling motion.
- Every remaining pile piece is selectable and feedable regardless of layer.
  Public transitions never mutate their input, and a missing selection returns
  the original state object.
- Three tray entries of the selected kind clear immediately, increment
  `clearCount` once, and leave the current level permanently smaller. No clear
  replenishes the active level.
- Up to three pile pieces may be fed regardless of species or overlap. Feeding
  never enters the tray and never increments `clearCount`. Each feed creates
  one unsettled same-species credit.
- A normal three-entry tray match has priority over feed credits. Otherwise,
  one or two tray entries may combine with enough unsettled credits of the same
  species to form a complete group; the short tray group is removed and those
  credits become settled. This is not a plant-growth clear, and each credit is
  consumed at most once.
- Active inventory is `pieces + tray + unsettled fed`; it remains divisible by
  three per species. Settled feed records stay only as the current pile's cat
  fullness history and reset when the next level is created.
- Clearing the final triple creates the next level atomically and marks the
  clear result with `levelAdvanced: true`; incomplete levels never advance.
- A seven-item unmatched tray requests controller recovery. Recovery returns
  exactly two original entries to the pile without changing their IDs or
  kinds, preserves progress, and keeps an existing piece that can complete a
  preserved pair. Recovery never invents replacement inventory or repositions
  an already selectable pile piece.
- Tests inject seeded randomness. Production may use `Math.random` only at the
  public default boundary.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Missing piece ID | `SelectionResult { kind: "missing", state }` with original identity |
| Existing piece has higher-layer overlap metadata | selection still removes it; UI may settle related neighbors |
| Existing piece, tray below seven, no triple | remove from pile, append to tray, `kind: "moved"` |
| Selected kind reaches three before level end | clear exactly three, increment once, do not replenish, `kind: "cleared"` |
| Existing piece is fed below capacity | remove from pile, append an unsettled feed record, never increment `clearCount` |
| One/two tray fish plus same-species credits reach three | remove the short tray group, settle only the credits used, `kind: "settled"` |
| Fourth feed is attempted | return `kind: "full"` with unchanged state |
| Selected kind clears the last three objects | create the harder next level and set `levelAdvanced: true` |
| Tray reaches seven without triple | stable state plus `kind: "recovery-needed"` |
| Recovery called below seven | no-op state and empty `returned` |
| Random value is non-finite or outside `[0, 1)` | throw `AmbientEngineError` |

## 5. Good / Base / Bad Cases

- Good: the UI asks `getBlockerIds` only to animate related neighbors after a
  stacked fish is removed; all revealed native buttons stay actionable.
- Base: a fresh state exposes a quick triple and a complete removal path
  without any timer, score, numeric level label, or fail state.
- Good: the UI reveals canonical `pile` coordinates without regenerating or
  mutating state; legacy `spread` remains snapshot-compatible only.
- Bad: a component compares DOM rectangles to infer blockers.
- Bad: a clear appends replacements and makes the current level endless.
- Bad: recovery clears the tray, recolors a piece, changes `clearCount`, or
  ends the game.

## 6. Tests Required

1. unique IDs, level-one 36-piece stable mixed layout, explicit blockers, and
   layers limited to `0..2`;
2. meaningful higher-layer overlap metadata and lower-layer selection;
   include a vertically offset overlap that only passes when canonical height
   matches the rendered target;
3. missing result identity and complete input immutability;
4. ordered tray movement and automatic triples that reduce inventory by three;
5. complete solver traversal across progressive levels and atomic advancement;
6. piece-count progression `36, 42, 48, 54, 60`, unique authored positions at
   the 60-piece cap, and active species counts `3, 4, 5, 6, 7, 8` capped at eight;
7. seven-slot recovery returning exact pieces, preserving progress, and
   exposing the completing piece;
8. invalid random values and deterministic seeded repetition.
9. arbitrary mixed-species feeds, one- and two-fish short-group settlement,
   one-time credit consumption, and normal-triple priority.

Run focused `ambient-game` tests before `pnpm ci:web`.

## 7. Wrong vs Correct

### Wrong

```ts
const blocked = element.getBoundingClientRect().top > coveringRect.top;
piece.x = hover ? pileX : spreadX;
```

This duplicates rules in the DOM and mutates canonical state during hover.

### Correct

```ts
const blockerIds = getBlockerIds(state.pieces, piece.id);
const projection = piece.pile;
const revealed = revealedIds.has(piece.id);
```

The engine owns rule geometry; the UI only derives transient reveal state.
