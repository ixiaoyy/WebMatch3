# Game UI and Local Session Contract

## 1. Scope / Trigger

Apply this contract when changing playable board components, session scoring,
player-name entry, local progress storage, leaderboard periods, animation
phases, restart behavior, HUD/result presentation, or any UI consumer of
`SwapResult` and `CascadeRound`.

The engine remains the source of truth for swaps, matches, cascades, and board
playability. Session rules live under `apps/web/src/features/game/session`;
presentation and orchestration live under `apps/web/src/features/game/ui`.
Components must not duplicate match detection, scoring, ranking, or storage
validation.

## 2. Signatures

```ts
type SessionPhase =
  | "awaiting-player"
  | "playing"
  | "resolving"
  | "won"
  | "lost";

type LeaderboardPeriod = "week" | "month" | "all";

interface GameControllerOptions {
  random?: RandomSource;
  wait?: (duration: number) => Promise<void>;
  reducedMotion?: boolean;
  storage?: ProgressStorage | null;
  now?: () => Date;
  sessionConfig?: Partial<SessionConfig>;
}

createGameController(options?: GameControllerOptions): GameController

interface SessionConfig {
  initialMoves: number;
  targetScore: number;
  pointsPerTile: number;
  longMatchBonusPerTile: number;
  multiGroupBonus: number;
  leaderboardLimit: number;
  historyLimit: number;
}

interface GameHudState {
  score: number | null;
  targetScore: number | null;
  remainingMoves: number | null;
  combo: number | null;
}

interface GameResultState {
  outcome: "won" | "lost";
  playerName: string;
  score: number;
  targetScore: number;
  remainingMoves: number;
  bestCombo: number;
  bestScore: number;
  isNewBest: boolean;
  rank: number | null;
}

interface LeaderboardEntry {
  playerName: string;
  score: number;
  bestCombo: number;
  completedAt: string;
  outcome: "won" | "lost";
}

interface LocalProgress {
  version: 1;
  bestScore: number;
  bestCombo: number;
  lastCompletedAt: string | null;
  leaderboard: readonly LeaderboardEntry[];
  history: readonly LeaderboardEntry[];
}

interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
```

Components and the session layer import engine types and functions only from
`@/features/game/engine`. UI code imports session behavior only from
`@/features/game/session`. `GameBoard` and `GameTile` receive display state and
emit user intent; they do not call engine or storage operations.

## 3. Contracts

### Board and session lifecycle

- The initial session phase is `awaiting-player`; the board cannot accept input
  until a normalized player name starts a new game.
- Player names use `trim()`, collapse internal whitespace, and contain 1–12
  Unicode code points. They are rendered as Vue text and never used as HTML,
  CSS, or a storage key.
- Only an engine result with `kind === "resolved"` consumes one move. Invalid,
  non-adjacent, same-cell, no-match, cascade, shuffle, and rebuild operations
  consume no additional moves.
- Every cascade is scored exactly once through `scoreCascadeRound`. The
  multiplier comes from `CascadeRound.index`; a new user swap resets the
  displayed combo before its first cascade.
- A terminal game is recorded exactly once. Reaching the target wins before
  the zero-moves loss check. A won or lost board cannot receive more input.
- Starting the next game keeps the normalized player and persisted progress.
  Changing player clears the current name and returns to `awaiting-player`.

### Animation and accessibility

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
  but it does not skip engine rounds, scoring, or status updates.
- The board uses roving `tabindex`: arrows move focus, Enter/Space activates,
  and Escape cancels selection. Dialogs take focus and constrain Tab
  navigation. Leaderboard tabs use tablist semantics and ArrowLeft/ArrowRight.

### Local progress and ranking

- Storage key is `web-match3:progress`. Components never access
  `localStorage` directly; all reads, validation, migration, and writes go
  through the session storage boundary.
- Reads start from `unknown`. Any malformed current snapshot falls back to an
  empty progress object. A valid version-1 snapshot without `history` migrates
  its total-ranking entries into bounded history.
- Storage unavailable, blocked, malformed, or over quota must not block play.
  Reads return empty progress and writes return `false`.
- `history` retains at most `historyLimit` recent completed games.
  `leaderboard` retains at most `leaderboardLimit` all-time personal bests.
- Ranking first filters by period, then keeps one best entry for each exact
  normalized player name, then sorts by score descending, combo descending,
  completion time ascending, and finally truncates to `leaderboardLimit`.
- `week` starts at local Monday 00:00, `month` starts at local calendar-month
  day 1 at 00:00, and `all` uses all completed local records.
- The only ranking scopes are `week`, `month`, and `all`; the compact tab labels
  are `本周`, `本月`, and `总排行`. Friends, seasons, countdowns, remote
  identities, and online rankings are out of scope.
- Every ranking entry uses the same bundled default avatar. The current
  player's exact normalized name is highlighted.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Empty or whitespace-only name | Stay in `awaiting-player`; show inline error |
| Name longer than 12 code points | Stay in `awaiting-player`; show inline error |
| Valid name with extra whitespace | Normalize once, start a fresh board, enable input |
| Same or non-adjacent coordinate activated | Cancel or move selection; do not ask the engine to resolve |
| Adjacent swap returns `no-match` | Keep canonical board; show invalid feedback; consume no move or score |
| Adjacent swap returns `resolved` | Consume one move, lock input, score and project every cascade in order |
| Target reached on final move | Finish once as `won`, not `lost` |
| Engine or random source throws | Restore `visualBoard`, unlock, offer restart, and do not persist a result |
| Reset/unmount during a wait | Generation mismatch stops stale presentation updates |
| Reduced motion requested | Every controller wait is at most 16 ms; gameplay and scoring remain complete |
| Missing or inaccessible storage | Start with empty progress and continue gameplay |
| Invalid JSON, schema, name, date, order, or array bound | Reject the whole snapshot and return empty progress |
| Valid legacy v1 snapshot without `history` | Migrate total entries into sorted, bounded history |
| Storage quota/write failure | Return `false`; keep the completed in-memory result usable |
| Invalid completed record passed to recorder | Throw `TypeError` before mutating progress |
| Invalid `now` passed to period selection | Throw `RangeError` |
| No entries for selected period | Render an explanatory local empty state |

## 5. Good / Base / Bad Cases

- Good: `小 紫` and `小   紫` normalize to the same stored player name; the
  best score is selected once per period.
- Base: a first-time player sees an empty local leaderboard, completes a game,
  and appears under the appropriate week, month, and total scopes.
- Good: the controller switches exhaustively on `SwapResult.kind`, iterates
  `result.cascades`, and calls session scoring instead of inspecting the DOM.
- Good: all displayed ranking rows reuse the same imported default avatar.
- Bad: a tile component scans neighboring DOM cells to infer a match.
- Bad: a component calls `window.localStorage`, filters dates, or sorts ranking
  entries itself.
- Bad: a friend or season tab is added without changing this product contract.
- Bad: an animation callback assigns an older `after` board after restart.
- Bad: reduced motion jumps directly to `result.board` without scoring or
  announcing cascade state.

## 6. Tests Required

1. Player validation: empty, whitespace, over-length, normalization, start,
   same-player replay, and change-player reset.
2. Selection: first, same-cell cancel, non-adjacent replacement, and input
   disabled before name entry or after terminal state.
3. No-match and resolved moves: canonical board identity, one-move decrement,
   deterministic cascade scores, combo reset, and final visual board.
4. Terminal state: win precedence, zero-move loss, one-time persistence, result
   fields, and replay paths.
5. Storage: empty, inaccessible, invalid JSON/schema, legacy migration,
   history bound, write failure, and completed-record validation.
6. Ranking: local week/month boundaries, total scope, per-name personal best,
   score/combo/time tie-breaks, top limit, current-player rank, and empty state.
7. Browser: 320x568, 390x844, 768x1024, and 1440x900 have no horizontal
   overflow; name dialog focus trap, keyboard board, leaderboard pointer/arrow
   tabs, shared avatar, and current-player highlight work; console has no Vue
   warnings or uncaught errors.

Run focused session/UI tests first, then `pnpm ci:web` once after browser checks
pass.

## 7. Wrong vs Correct

### Wrong

```ts
const entries = JSON.parse(localStorage.getItem("scores") ?? "[]");
const weekly = entries.filter(isThisWeek).sort((a, b) => b.score - a.score);
```

This bypasses runtime validation, duplicates period rules in presentation code,
and allows malformed storage to break startup.

### Correct

```ts
const progress = loadLocalProgress(storage, sessionConfig);
const weekly = selectLeaderboard(progress, "week", now(), sessionConfig);
```

The session boundary owns validation, migration, time boundaries, personal-best
deduplication, stable tie-breaks, and ranking limits.

For cascade presentation, continue to project engine chronology rather than
jumping directly to the final board:

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
