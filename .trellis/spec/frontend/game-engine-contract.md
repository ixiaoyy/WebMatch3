# Ambient Jelly Engine Contract

## 1. Scope / Trigger

Apply this contract when changing freeform pile generation, gathered-geometry
occlusion, tray selection, automatic triples, replenishment, full-tray
recovery, or any consumer of those transitions. The engine lives in
`apps/web/src/features/game/engine` and stays independent from Vue, DOM APIs,
timers, storage, sound, and Picture-in-Picture.

## 2. Signatures

Consumers import only from `@/features/game/engine`:

```ts
createInitialState(random?: RandomSource): AmbientGameState
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
  readonly nextPieceId: number;
}
```

- Initial state contains 18 unique pieces, four shape-capable kinds, irregular
  authored coordinates, and shallow layers. It exposes at least three
  selectable same-kind pieces.
- `spread` is a presentation projection. Occlusion always uses `pile`
  geometry, so pointer leave cannot change rules.
- A piece is blocked only by meaningful overlap from a strictly higher layer.
  Same-layer overlap never blocks.
- Public transitions never mutate their input. Missing and blocked selection
  return the original state object.
- Three tray entries of the selected kind clear immediately, increment
  `clearCount` once, and add three top-layer replacement pieces while
  preserving the 18-object total across pile and tray.
- A seven-item unmatched tray requests controller recovery. Recovery returns
  exactly two entries to the pile, preserves progress, and exposes a selectable
  piece that can complete a preserved pair.
- Tests inject seeded randomness. Production may use `Math.random` only at the
  public default boundary.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Missing piece ID | `SelectionResult { kind: "missing", state }` with original identity |
| Piece has higher-layer blockers | `kind: "blocked"` plus blocker IDs; no mutation |
| Selectable piece, tray below seven, no triple | remove from pile, append to tray, `kind: "moved"` |
| Selected kind reaches three | clear exactly three, increment once, replenish three, `kind: "cleared"` |
| Tray reaches seven without triple | stable state plus `kind: "recovery-needed"` |
| Recovery called below seven | no-op state and empty `returned` |
| Random value is non-finite or outside `[0, 1)` | throw `AmbientEngineError` |

## 5. Good / Base / Bad Cases

- Good: the UI asks `getBlockerIds` and disables blocked native buttons.
- Base: a fresh state exposes a quick triple and remains playable without any
  timer, score, level, or round lifecycle.
- Good: hover chooses `spread` or `pile` coordinates without regenerating state.
- Bad: a component compares DOM rectangles to infer blockers.
- Bad: replenishment appends arbitrary pieces without restoring a quick match.
- Bad: recovery clears the tray, changes `clearCount`, or ends the game.

## 6. Tests Required

1. unique IDs, 18 pieces, four legal kinds, irregular dual projections, and
   layers limited to `0..2`;
2. meaningful higher-layer blocking and immediate reveal;
3. missing/blocked result identity and complete input immutability;
4. ordered tray movement, automatic triples, replacement count, and one clear;
5. quick-match invariant after initial generation and clearing;
6. seven-slot recovery returning two while preserving progress;
7. invalid random values and deterministic seeded repetition.

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
