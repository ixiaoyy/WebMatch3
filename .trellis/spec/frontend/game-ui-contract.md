# Ambient Fish UI and Local Session Contract

## 1. Scope / Trigger

Apply this contract when changing the controller, field/tray/cat/plant Vue
components, interaction timing, local persistence, attention lifecycle, audio,
keyboard navigation, or Document Picture-in-Picture. Rules belong to `engine`,
unknown-data validation to `session`, and timed browser projection to `ui`.

## 2. Signatures

```ts
type GameFeedback =
  | "idle" | "intro" | "select" | "clear"
  | "refresh" | "level" | "loss";

interface CompletedFishEvent {
  readonly id: number;
  readonly kind: FishKind;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly feedCount: number;
  readonly phase: "catching" | "merging" | "feeding";
}

interface AmbientController {
  readonly game: Ref<AmbientGameState>;
  readonly fieldPreview: Ref<readonly PilePiece[] | null>;
  readonly trayPreview: Ref<readonly TrayPiece[] | null>;
  readonly completedFish: Ref<CompletedFishEvent | null>;
  readonly canSelect: ComputedRef<boolean>;
  activate(pieceId: string): SelectionResult | null;
  petCat(): void;
  requestCatSearch(): void;
}

const FISH_CATCH_FLIGHT_DURATION = 500;
const FISH_MERGE_CONTACT_DURATION = 620;
const FISH_FEED_SETTLE_DURATION = 380;
```

```ts
interface AmbientSnapshotV4 {
  readonly version: 4;
  readonly game: AmbientGameState;
  readonly preferences: { readonly soundEnabled: boolean };
  readonly plant: { readonly plantedAt: number };
  readonly pet: {
    readonly guardedPieceId: string | null;
    readonly fishFedCount: number;
  };
}
```

## 3. Contracts

- The root page is immediately playable with no lobby, board, level picker,
  score, timer, modal, or persistent numeric progress HUD.
- Every current fish is visible and directly selectable. Spotlight and cat
  guide effects are decorative guidance; neither controls reveal eligibility.
- `FishPiece` uses native button click as the non-drag activation boundary.
  Pointer-up ends or commits drag state; it must not also remove a tapped node
  before its native click. A real drag suppresses the following click.
- Desktop hit targets grow with the artwork while remaining mutually separate.
  Mobile uses exact 44px minimum targets. Artwork size decreases by configured
  wave capacity (9, 11, 13, 15, 17) so later waves do not recreate overlap.
- Enter, Space, and `F` use the same selection path as pointer and touch.
  Accessible labels name species and actions without obsolete layer jargon.
- Canonical selection persists immediately, but a completed triple is presented
  in strict order: 500ms catch, 620ms merge, feeding contact, then 380ms settle
  (`level` may retain its 960ms cue). Cat, plant, sound, and field arrival begin
  at feeding contact, not when the engine state changes.
- When a result has `fieldRefreshed: true`, `fieldPreview` retains the outgoing
  unselected fish until feeding contact. It then becomes `null`, revealing the
  new wave. Level-one groups one and two never create a whole-field preview.
- `refresh`, `level`, and `clear` are distinct feedback projections. A refresh
  may animate new fish but does not imply level advancement.
- Cat search chooses a useful visible fish, prioritizing species with two tray
  matches, then one, then none. Search never selects or mutates a fish.
- Click/touch targets, cat art, plant art, controls, and tray must not intercept
  one another. Transparent cat and plant canvas remains pointer-transparent
  outside explicit native controls.
- Version four remains the storage version. New `game.levelProgress` defaults
  to zero only for legacy v4 snapshots that lack the field. Current states must
  validate exact first-level remainder or exact later-wave counts.
- Legacy v4 triple boards and v1-v3 snapshots are accepted only at the session
  boundary so durable `clearCount`, `fishFedCount`, `plantedAt`, and sound
  preference survive. New page controllers still start a fresh level-one field
  and clear session-only tray/guard state.
- Loss persists the already-rebuilt current wave and shows the seven-piece tray
  only as a transient preview. Re-entering play preserves current level progress.
- All timer handles, field/tray previews, catch geometry, pointer state, focus,
  cat motion, audio nodes, and PiP windows are UI-only and never enter snapshots.
- Picture-in-Picture moves the existing mounted surface; it never creates a
  second controller. Resize projection is UI-only and cancellable.
- Away state pauses decorative motion, stops active audio, clears transient
  pointer projections, and keeps canonical state intact.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Rapid taps on three distinct fish buttons | exactly three selections; no dropped or duplicate activation |
| Pointer gesture crosses drag threshold | drag end only; suppress the following click |
| First/second opening triple completes | animate feed, keep remaining field, continue same level |
| Later unique triple completes | retain old field through merge, then replace it at feeding contact |
| Final goal triple completes | same causal sequence, then show next-level arrival |
| Seven unmatched tray entries | preview loss, rebuild current wave, preserve level progress |
| Legacy v4 snapshot lacks `levelProgress` | parse as legacy progress zero if all legacy invariants pass |
| Current later snapshot has zero or two triple species | reject and fall back safely |
| Storage read/write throws | continue in memory; rendering must not block |
| Reduced motion | preserve phase order and state/copy without travel animation |
| `<=620px` viewport | 44px non-overlapping targets and no viewport overflow |
| PiP request fails | retain the same surface and state; show quiet failure copy |

## 5. Good / Base / Bad Cases

- Good: three fast clicks still trigger one completed-fish transaction.
- Base: the first page shows nine visible fish and a short non-blocking hint.
- Good: old fish remain visible while the combined fish reaches the cat; the
  next wave arrives only at contact.
- Good: storage validates unknown data once and the controller receives typed
  state without local casts.
- Bad: emitting activation from pointer-up and removing the button before the
  browser dispatches its native click.
- Bad: a visual fish extends far outside a 44px semantic target with no magnetic
  or enlarged hit area.
- Bad: rendering the engine's replacement wave immediately after the third tap.
- Bad: restoring stored level/tray state into a newly created page controller.
- Bad: component-local goal calculations or snapshot parsing.

## 6. Tests Required

1. controller timing for catch, merge, feed, refresh, level arrival, and loss;
2. `fieldPreview` retained before feed and cleared at contact for refresh/level;
3. first-level continuation after groups one/two and level change after three;
4. later-wave refresh below goal and advancement only at the exact goal;
5. loss restart preserving level, level progress, lifetime counts, and bond;
6. v4 round-trip with `levelProgress`, legacy-v4 defaulting, v1-v3 migration,
   malformed geometry/count/counter rejection, and storage exceptions;
7. species-only accessible labels, direct keyboard actions, cat-search priority,
   and feedback projections including `refresh`;
8. browser rapid-click regression, exact wave counts, no target overlap, no
   console warnings, and the full first-level plus five-group second-level path;
9. desktop/reference, compact, reduced-motion, and PiP responsive checks.

Run focused tests first, then `pnpm ci:web` or its complete constituent checks.

## 7. Wrong vs Correct

### Wrong

```ts
function finishTap(event: PointerEvent) {
  emit("activate", piece.id);
  // Vue removes the button before the browser can finish its native click.
}
```

### Correct

```ts
function finishDrag(event: PointerEvent) {
  if (!dragging.value) return;
  suppressClick = true;
  emit("dragEnd", piece.id, event.clientX, event.clientY);
}

function onClick(event: MouseEvent) {
  if (suppressClick && event.detail !== 0) return;
  emit("activate", piece.id);
}
```

Native click owns taps; pointer state owns only dragging. Canonical state and
presentation still meet at the controller boundary exactly once.
