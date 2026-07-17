# Game Engine Contract

## 1. Scope / Trigger

Apply this contract when changing:

- Match-3 board generation, matching, swapping, settlement, or shuffling;
- game-session logic that consumes valid/invalid swap outcomes;
- UI animation code that consumes cascade movement records;
- scoring code that consumes match groups or cascade rounds.

The engine lives in `apps/web/src/features/game/engine` and must remain
independent from Vue, the DOM, timers, storage, and implicit randomness.

## 2. Signatures

Consumers import only from `@/features/game/engine`:

```ts
generateBoard(config: Partial<EngineConfig>, random: RandomSource): GeneratedBoard
findMatches(board: Board): MatchResult
listLegalMoves(board: Board): readonly LegalMove[]
settleBoard(board: Board, random: RandomSource, config?: Partial<EngineConfig>): SettlementResult
ensurePlayableBoard(board: Board, config: Partial<EngineConfig>, random: RandomSource): PlayabilityResult
executeSwap(board: Board, from: Coordinate, to: Coordinate, random: RandomSource, config?: Partial<EngineConfig>): SwapResult
```

Do not import internal files such as `settle.ts` or `matches.ts` from feature
components or session code.

## 3. Contracts

### Stable board

- `Board.cells` is rectangular and fully populated.
- Tile IDs are non-empty and unique within a board.
- Public operations do not mutate input boards, row arrays, or tile objects.
- Matches keep directional `groups` and a row-major deduplicated
  `coordinates` list.

### Randomness and limits

- Generation, settlement, and shuffling require an explicit `RandomSource`.
- A random value must be finite and inside `[0, 1)`.
- Tests use `createSeededRandom` or a fixed sequence, never `Math.random()`.
- Generation and shuffle attempt limits may be `0` to force their fallback
  path; maximum cascade depth must be positive.

### Results

```ts
type SwapResult =
  | { kind: "invalid"; reason: "out-of-bounds" | "same-cell" | "not-adjacent"; board: Board }
  | { kind: "no-match"; board: Board; swap: Swap }
  | { kind: "resolved"; board: Board; swap: Swap; cascades: readonly CascadeRound[]; playability: PlayabilityResult };
```

- `invalid` and `no-match` return the original board. Session code must not
  decrement a move for either result.
- `resolved.cascades` is ordered and contains removal, movement, spawn, and
  after-board snapshots for each round.
- Spawn origins use negative rows so UI animation can start above the board.
- `shuffled` preserves all IDs and the type multiset.
- `rebuilt` uses IDs that do not overlap the previous board.

## 4. Validation & Error Matrix

| Condition | Outcome |
|---|---|
| Coordinate is outside the board | `SwapResult { kind: "invalid", reason: "out-of-bounds" }` |
| Coordinates are identical | `reason: "same-cell"` |
| Coordinates are diagonal or separated | `reason: "not-adjacent"` |
| Adjacent swap creates no match | `SwapResult { kind: "no-match" }` |
| Adjacent swap creates a match | resolve cascades, ensure playability, return `kind: "resolved"` |
| Config dimensions/types/limits are invalid | `Match3EngineError("invalid-config")` |
| Board matrix or tile identities are invalid | `Match3EngineError("invalid-board")` |
| Random source returns outside `[0, 1)` | `Match3EngineError("invalid-random-value")` |
| Deterministic generation fallback violates invariants | `Match3EngineError("generation-failed")` |
| Matches remain after the cascade limit | `Match3EngineError("cascade-limit-exceeded")` |
| Stable board has no legal move | bounded shuffle, then explicit rebuild fallback |

## 5. Good / Base / Bad Cases

- Good: session code switches exhaustively on `result.kind`, decrements a move
  only for `resolved`, and animates each cascade in order.
- Base: generated boards have no initial matches and at least one legal move.
- Good: scoring uses `groups` for shapes and `coordinates` for unique removed
  tiles, preventing intersection double-counting.
- Bad: a component swaps `board.cells` directly or infers validity after
  animation.
- Bad: UI code treats `shuffled` and `rebuilt` as equivalent; rebuild changes
  tile identities and may change the type multiset.

## 6. Tests Required

Rule changes require Node-environment Vitest coverage for:

1. seeded generation: no matches, unique IDs, and at least one legal move;
2. invalid, no-match, and resolved swaps with input immutability assertions;
3. horizontal, vertical, 4+, L/T/cross, and simultaneous group deduplication;
4. stable fall order, spawn origins, multi-round cascades, and the cascade cap;
5. dead-board detection, successful ID/type-preserving shuffle, and explicit
   rebuild with non-overlapping IDs;
6. invalid configuration and invalid random-source values.

Run `pnpm ci:web` after the focused tests pass.

## 7. Wrong vs Correct

### Wrong

```ts
const next = [...board.cells];
next[from.row][from.column] = next[to.row][to.column];
state.moves -= 1;
```

This mutates nested rows, loses one tile, and decrements a move before the
engine determines whether a match exists.

### Correct

```ts
const result = executeSwap(board, from, to, random, config);

switch (result.kind) {
  case "invalid":
  case "no-match":
    return;
  case "resolved":
    state.moves -= 1;
    await animateCascades(result.cascades);
    board = result.board;
}
```

The engine owns rule transitions; the consumer owns presentation and
session-level scoring.
