# Game UI Contract

## 1. Scope / Trigger

Apply this contract when changing playable board components, selection input,
keyboard navigation, animation phases, restart behavior, HUD/result presentation,
or any UI consumer of `SwapResult` and `CascadeRound`.

The UI lives under `apps/web/src/features/game/ui`. It may schedule presentation
time, but it must not duplicate rule validity, matching, settlement, scoring, or
move-decrement behavior.

## 2. Signatures

```ts
createGameController(options?: {
  random?: RandomSource;
  wait?: (duration: number) => Promise<void>;
  reducedMotion?: boolean;
}): GameController

interface GameHudState {
  score: number | null;
  targetScore: number | null;
  remainingMoves: number | null;
  combo: number | null;
}

interface GameResultState {
  outcome: "won" | "lost";
  score: number;
  targetScore: number;
  remainingMoves: number;
  bestScore: number;
  isNewBest: boolean;
}
```

Components import engine types and functions only from
`@/features/game/engine`. `GameBoard` and `GameTile` receive display state and
emit user intent; they do not call engine operations.

## 3. Contracts

- `board` is the last canonical engine board. `visualBoard` is a presentation
  snapshot and may temporarily be a cascade `before` or `after` board.
- Board input is locked from `executeSwap` until the final canonical and visual
  boards both reference `result.board`.
- A resolved swap is displayed in this order: swapped `before` snapshot,
  matched coordinates, round `after` snapshot, then the next round. A shuffled
  or rebuilt board is shown only after all cascades.
- An animation generation token invalidates pending waits after reset or
  unmount. Stale async work must not unlock or overwrite a newer board.
- Reduced motion shortens controller waits and disables transform-heavy CSS,
  but it does not skip engine rounds or status updates.
- `null` HUD values mean progression is not connected. Presentation renders an
  explicit practice state instead of inventing score, target, or moves.
- A resolved-move count may decide whether restart needs confirmation. It is
  not score and must not be consumed by session progression.
- The board uses roving `tabindex`: arrows move focus, Enter/Space activates,
  and Escape cancels selection. Dialogs take focus, constrain Tab navigation,
  and return focus to the trigger when dismissed.

## 4. Validation & Error Matrix

| Condition | UI outcome |
|---|---|
| First activation | Select coordinate and announce its one-based position |
| Same coordinate activated | Cancel selection |
| Non-adjacent coordinate activated | Move selection without asking the engine to swap |
| Adjacent swap returns `no-match` | Keep canonical board, show invalid feedback, consume no UI progress |
| Adjacent swap returns `resolved` | Lock input and project every cascade in returned order |
| Playability is `shuffled` | Show shuffle status after cascades, preserving returned board identity |
| Playability is `rebuilt` | Show rebuild status after cascades; never assume prior tile IDs survive |
| Engine or random source throws | Restore `visualBoard` to canonical `board`, unlock, and offer restart |
| Reset/unmount during a wait | Generation mismatch stops stale presentation updates |
| Reduced motion requested | Every controller wait is at most 16 ms and gameplay remains complete |

## 5. Good / Base / Bad Cases

- Good: the controller switches exhaustively on `SwapResult.kind`, iterates
  `result.cascades`, and publishes display-only sets for matched/moved/spawned
  coordinates.
- Base: practice mode shows a playable board with nullable progression metrics.
- Good: tile accessibility names include a shape-based type name, row, column,
  and selection state.
- Bad: a tile component scans neighboring DOM cells to infer a match.
- Bad: an animation callback assigns an older `after` board after restart.
- Bad: reduced motion jumps directly to `result.board` without announcing
  cascade or shuffle state.

## 6. Tests Required

1. Selection: first, same-cell cancel, and non-adjacent replacement.
2. No-match: canonical/visual board identity remains unchanged and progress is
   not recorded.
3. Resolved swap: waits begin with swap, clear, settle; conflicting activation
   is ignored; final visual board is the canonical result.
4. Restart: no-progress restart is immediate; progress restart requires
   confirmation and reset clears UI markers.
5. Reduced motion: a legal move resolves with all waits at or below 16 ms.
6. Browser: 320x568, 390x844, 768x1024, and 1440x900 have equal board width and
   height with `scrollWidth === clientWidth`; keyboard selection and dialog
   focus restoration work; console has no Vue warnings or uncaught errors.

Run `pnpm ci:web` after focused UI tests and browser checks pass.

## 7. Wrong vs Correct

### Wrong

```ts
visualBoard.value = result.board;
await playDecorativeComboAnimation();
```

This hides engine chronology and makes scoring/animation consumers disagree
about which round is visible.

### Correct

```ts
for (const round of result.cascades) {
  visualBoard.value = round.before;
  matchedKeys.value = new Set(round.matches.coordinates.map(coordinateKey));
  await waitForClear();
  visualBoard.value = round.after;
  await waitForSettle();
}
visualBoard.value = result.board;
```

This preserves the engine's ordered contract while keeping timing in the UI.