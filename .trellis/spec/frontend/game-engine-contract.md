# Ambient Jelly Engine Contract

## 1. Scope / Trigger

Apply this contract when changing finite level generation, gathered-geometry
occlusion, tray selection, automatic triples, progressive difficulty,
full-tray recovery, or any consumer of those transitions. The engine lives in
`apps/web/src/features/game/engine` and stays independent from Vue, DOM APIs,
timers, storage, sound, and Picture-in-Picture.

## 2. Signatures

Consumers import only from `@/features/game/engine`:

```ts
createInitialState(random?: RandomSource): AmbientGameState
createLevelState(level: number, clearCount: number, nextPieceId: number, random?: RandomSource): AmbientGameState
getLevelConfig(level: number): LevelConfig
getBlockerIds(pieces: readonly PilePiece[], pieceId: string): readonly string[]
getSelectablePieces(pieces: readonly PilePiece[]): readonly PilePiece[]
hasQuickMatch(pieces: readonly PilePiece[]): boolean
selectPiece(state: AmbientGameState, pieceId: string, random?: RandomSource): SelectionResult
recoverFullTray(state: AmbientGameState, random?: RandomSource): RecoveryResult
createSeededRandom(seed: number): RandomSource
```

## 3. Contracts

```ts
type JellyKind = "aqua" | "amber" | "lime" | "rose";

interface PilePiece {
  readonly id: string;
  readonly kind: JellyKind;
  readonly pile: { readonly x: number; readonly y: number };
  readonly spread: { readonly x: number; readonly y: number };
  readonly rotation: number;
  readonly scale: number;
  readonly layer: 0 | 1 | 2;
}

interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly clearCount: number;
  readonly level: number;
  readonly nextPieceId: number;
}
```

- Level one contains 18 unique pieces, three active shape-capable kinds,
  irregular authored coordinates, and two shallow layers. Each subsequent
  level adds three pieces; level two introduces the fourth kind, level three
  introduces the third layer, and the visual-density cap is 36 pieces.
- Every level consists of same-kind triples assigned as complete groups to one
  layer. Clearing groups from the highest remaining layer down is therefore a
  deterministic complete solution, and a new level exposes a quick triple.
- `spread` is a presentation projection. Occlusion always uses `pile`
  geometry, so pointer leave cannot change rules.
- The normalized blocker rectangle must track the rendered jelly footprint
  (currently `0.20 × 0.29` of the gathered surface at scale `1`). A visually
  covered lower half must not remain selectable because engine height is
  shorter than the native button.
- A piece is blocked only by meaningful overlap from a strictly higher layer.
  Same-layer overlap never blocks.
- Public transitions never mutate their input. Missing and blocked selection
  return the original state object.
- Three tray entries of the selected kind clear immediately, increment
  `clearCount` once, and leave the current level permanently smaller. No clear
  replenishes the active level.
- Clearing the final triple creates the next level atomically and marks the
  clear result with `levelAdvanced: true`; incomplete levels never advance.
- A seven-item unmatched tray requests controller recovery. Recovery returns
  exactly two original entries to the pile without changing their IDs or
  kinds, preserves progress, and exposes an existing piece that can complete a
  preserved pair. Recovery never invents replacement inventory.
- Tests inject seeded randomness. Production may use `Math.random` only at the
  public default boundary.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Missing piece ID | `SelectionResult { kind: "missing", state }` with original identity |
| Piece has higher-layer blockers | `kind: "blocked"` plus blocker IDs; no mutation |
| Selectable piece, tray below seven, no triple | remove from pile, append to tray, `kind: "moved"` |
| Selected kind reaches three before level end | clear exactly three, increment once, do not replenish, `kind: "cleared"` |
| Selected kind clears the last three objects | create the harder next level and set `levelAdvanced: true` |
| Tray reaches seven without triple | stable state plus `kind: "recovery-needed"` |
| Recovery called below seven | no-op state and empty `returned` |
| Random value is non-finite or outside `[0, 1)` | throw `AmbientEngineError` |

## 5. Good / Base / Bad Cases

- Good: the UI asks `getBlockerIds` and disables blocked native buttons.
- Base: a fresh state exposes a quick triple and a complete removal path
  without any timer, score, numeric level label, or fail state.
- Good: hover chooses `spread` or `pile` coordinates without regenerating state.
- Bad: a component compares DOM rectangles to infer blockers.
- Bad: a clear appends replacements and makes the current level endless.
- Bad: recovery clears the tray, recolors a piece, changes `clearCount`, or
  ends the game.

## 6. Tests Required

1. unique IDs, level-one 18-piece shape, irregular dual projections, and
   layers limited to `0..2`;
2. meaningful higher-layer blocking and immediate reveal;
   include a vertically offset overlap that only passes when canonical height
   matches the rendered target;
3. missing/blocked result identity and complete input immutability;
4. ordered tray movement and automatic triples that reduce inventory by three;
5. complete solver traversal across progressive levels and atomic advancement;
6. monotonic difficulty config through the 36-piece layout cap;
7. seven-slot recovery returning exact pieces, preserving progress, and
   exposing the completing piece;
8. invalid random values and deterministic seeded repetition.

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
const projection = engaged ? piece.pile : piece.spread;
```

The engine owns rule geometry; the UI only selects a visual projection.
