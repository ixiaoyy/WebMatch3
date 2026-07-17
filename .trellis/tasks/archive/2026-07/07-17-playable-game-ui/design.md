# Playable Game UI Design

## Direction

The provisional visual language is an editorial tabletop game: warm paper,
ink-like typography, a graphite board, and six stamp-shaped pieces. It is a
replaceable theme rather than a product brand. The page does not introduce a
logo or copy ParallelLines assets, colors, or community language.

## Architecture and ownership

```text
engine/index.ts
  -> createGameController (selection, ordered animation projection, restart)
    -> GameView (page assembly and dialog visibility)
      -> GameBoard -> GameTile (display-only)
      -> GameHud (nullable progression presentation contract)
      -> GameInstructions
      -> RestartDialog
      -> GameResultDialog (nullable progression presentation contract)
```

- The engine remains the only owner of swap validity, matches, settlement, and
  playability.
- `createGameController` is the UI boundary. It invokes public engine exports,
  projects each `CascadeRound` into timed display phases, and exposes reactive
  state. Randomness and waiting are injectable for deterministic tests.
- Components receive display state and emit intent. They never mutate board
  cells, infer matches, score tiles, or decrement moves.
- `GameHudState` and `GameResultState` are UI contracts for the next task.
  Nullable values render as an honest practice mode until progression exists.

## State and data flow

```text
pointer / keyboard intent
  -> controller selection reducer
  -> executeSwap(board, from, to, random)
  -> invalid | no-match | resolved
  -> ordered display phases
  -> final engine board
```

Selection is exhaustive:

1. No selection: select the focused coordinate.
2. Same coordinate: cancel.
3. Non-adjacent coordinate: move selection.
4. Adjacent coordinate: clear selection and ask the engine to execute.

For a resolved swap the controller locks board input, displays the first
`before` snapshot as the swap result, then iterates cascades in their returned
order. Each round shows match removal before its `after` board. A shuffled or
rebuilt playability result adds a final shuffle phase. The canonical board is
replaced only with the engine's returned board.

An animation generation token invalidates stale async work when a new board is
created or the view unmounts. Restart is unavailable during settlement. Once a
resolved move has occurred, restart requires confirmation.

## Accessibility

- The board is a labelled `grid`; rows use `row`, and piece buttons use
  `gridcell` with one-based row and column labels.
- Roving `tabindex` leaves one grid cell in the tab sequence. Arrow keys move
  focus, Enter/Space activates, and Escape cancels selection.
- A polite live region announces selection, rejection, cascade, shuffle, and
  readiness. Visual status remains visible separately.
- Color is paired with a unique silhouette and texture for every tile type.
- Dialogs move focus to a safe action, close on Escape, and restore focus to
  their triggering control.
- `prefers-reduced-motion: reduce` removes large transforms and shortens the
  controller's phase waits while retaining labels and static state changes.

## Responsive contract

- The board uses a square container with eight equal tracks and a maximum
  inline size, so cell hit areas and visual positions cannot drift.
- Below 760px the document is one column; controls wrap and the board consumes
  the available width without horizontal overflow.
- Wider screens use an asymmetric information rail beside the board rather
  than scaling the phone card.
- Safe-area padding and `100dvh` protect controls and overlays. Short landscape
  viewports can scroll vertically.

## Compatibility and rollback

No dependencies or engine signatures change. Removing `GameView` from
`App.vue` restores the foundation shell without a data migration. The next
session task can provide HUD and result state without rewriting board
interaction.