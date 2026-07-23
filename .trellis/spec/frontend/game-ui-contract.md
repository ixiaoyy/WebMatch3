# Ambient Fish UI and Local Session Contract

## 1. Scope / Trigger

Apply this contract when changing the ambient controller, pile/tray/plant Vue
components, attention lifecycle, persistence, audio, keyboard navigation, or
Document Picture-in-Picture. Rules belong to `engine`, versioned browser state
to `session`, and browser/Vue orchestration to `ui`.

## 2. Signatures

```ts
interface AmbientControllerOptions {
  random?: RandomSource;
  storage?: StorageLike | null;
  timers?: TimerApi;
  onClear?: () => void;
}

type GameFeedback =
  | "idle" | "intro" | "select" | "feed" | "feed-rejected"
  | "clear" | "settle" | "level" | "loss";

type IntroPhase = "idle" | "scan" | "targets" | "tray";

createAmbientController(options?: AmbientControllerOptions): AmbientController

interface AmbientController {
  petCat(): void;
  requestCatSearch(): void;
}

createFieldProjectionScheduler(
  commit: (projection: FieldProjection) => void,
  scheduleFrame: (callback: () => void) => () => void,
): FieldProjectionScheduler

interface FishAccessibleLabelOptions {
  readonly kind: FishKind;
  readonly layer: number;
  readonly higherOverlapCount: number;
  readonly feedable: boolean;
}

getHigherOverlapCounts(
  pieces: readonly PilePiece[],
): ReadonlyMap<string, number>

getFishAccessibleLabel(options: FishAccessibleLabelOptions): string

interface AmbientSnapshotV3 {
  readonly version: 3;
  readonly game: AmbientGameState;
  readonly preferences: { readonly soundEnabled: boolean };
  readonly plant: { readonly plantedAt: number };
  readonly pet: { readonly guardedPieceId: string | null };
}

loadAmbientSnapshot(storage: StorageLike | null, random?: RandomSource): AmbientSnapshotV3
saveAmbientSnapshot(storage: StorageLike | null, snapshot: AmbientSnapshotV3): boolean
createDocumentPipController(onSurfaceChange: (surfaceWindow: Window | null) => void): DocumentPipController
```

## 3. Contracts

- Root page is immediately playable: no player name, lobby, start gate, HUD,
  score, leaderboard, round result, or restart modal.
- Fish keep one canonical full-surface layout across pointer, touch, keyboard,
  responsive, and Picture-in-Picture paths. Search never rewrites or switches
  their persisted coordinates.
- Narrow or short surfaces apply one UI-only affine field projection that
  reserves the lower companion/tray area. Pointer coordinates use the inverse
  projection, and cat guard travel uses the same forward projection, so resize
  and Picture-in-Picture never regenerate or persist alternate fish positions.
- ResizeObserver deliveries are coalesced into at most one field-projection
  commit per animation frame, using the latest finite non-zero dimensions.
  Frame scheduling uses the movable surface's current
  `ownerDocument.defaultView`, not always the opener window, because an active
  PiP surface must not depend on a hidden opener's throttled frame queue.
  Unmount cancels pending frame work.
- A UI-local spotlight owns only `inactive`, `searching`, `afterglow`, and
  `dragging` state. Pointer movement, touch scanning, and keyboard arrows move
  one normalized light; touch release keeps a brief afterglow.
- Fish outside the light are visually hidden and cannot intercept pointer
  input. The actually focused fish and an active dragged fish stay visible;
  every revealed fish remains actionable unless the whole field is disabled.
- Native piece buttons provide 44px-or-larger targets. Tab and assistive
  technology retain a direct semantic action path that does not require
  discovering visual coordinates. Layer overlap never removes a fish from the
  pointer or keyboard action path. Revealed overlap groups fan apart just
  enough to expose distinct pointer targets, then return to canonical render
  positions when the light leaves.
- Each native fish button exposes its descriptive species, one-based visual
  layer, current number of higher-layer overlaps, and current Enter/Space/F
  guidance in one accessible name. Zero overlaps use explicit "none" wording;
  positive counts describe overlap without saying blocked or unavailable.
  `FishField` derives one count map from the current canonical pieces and
  `FishPiece` only formats the supplied value, so removing an upper fish updates
  lower names without adding geometry scans to each button. Chinese prose
  remains UI-only and never enters engine pieces or snapshots.
- A pristine level-one state (`clearCount === 0`, empty tray/feed history, no
  guard, and untouched monotonic IDs) begins one non-blocking controller-owned
  intro. One serial `TimerApi` handle advances `scan -> targets -> tray -> idle`:
  the light visits `INITIAL_DISCOVERY_POINT`, the cross-layer discoverable
  triple lifts briefly, and tray slot one responds. Pointer/touch/keyboard
  input, selection, feeding, cat search, PiP activation, away, or disposal
  cancels it immediately. Refresh may replay only while canonical state remains
  untouched; snapshots never gain intro fields.
- Controller feedback is one mutually exclusive projection. Direct `select`,
  `feed`, and `feed-rejected` feedback lasts about 220ms; `clear`, `settle`, and
  `level` use the existing 620ms reward window; `loss` remains 1.2s. Components
  consume this projection and do not start competing cross-component timers.
  FishField may still own pointer afterglow, drag return, and nearby slip timers
  because those projections never cross its boundary.
- When the search surface itself is focused, arrows move the light and
  Enter/Space selects the nearest revealed selectable fish. Focused piece
  buttons retain directional navigation and `F` feeding.
- The home cat is a native button whose pointer, touch, Enter, and Space
  activation opens one component-local menu with `摸一下` and `帮我抓鱼`.
  Activation alone never selects a target. `摸一下` calls `petCat`, replaces the
  current transient reaction/status, keeps the cat home, and never changes or
  persists canonical game state. Only `帮我抓鱼` calls `requestCatSearch`.
  Awake search travels to one eligible target; on arrival, an independent guide
  light immediately reveals that fish while the cat guards it until the exact
  fish is selected, fed, or invalidated. Pointer spotlight movement does not
  dismiss or relocate the guide light.
- The interaction menu focuses its first action, supports arrow/Home/End
  navigation, closes on Escape or outside pointer activation, and restores
  focus to the cat. Its document listeners resolve from the component root's
  current `ownerDocument`, so moving the existing surface into Picture-in-
  Picture cannot leave listeners attached to the opener. Menu state, focus,
  DOM nodes, and scheduled focus restoration never enter the snapshot.
- Pointer and touch feeding use one Pointer Events drag path from a selectable
  fish to the cat's current bounds. Canonical state changes only on a valid
  drop; failed/rejected drops restore the fish. Keyboard users focus a fish and
  press `F` for the same controller transition, while Enter/Space still selects
  it into the tray. The component never suppresses `F` when the cat is full or
  resting; the controller rejects it with the same accessible status feedback
  as a rejected pointer drop.
- The current pile records at most three fed fish. Counts one and two show the
  eating pose; count three plays full, lying, then sleeping. Away state pauses
  that pose timer without resetting capacity, and the next generated pile
  resets both capacity and stable pose.
- A feed-credit settlement may animate the one or two removed tray fish but
  uses `settle` feedback, never invokes the clear callback, never celebrates
  the plant, and never changes `clearCount`.
- Revealed fish use their visual layer to vary lift and shadow without changing
  hit targets. Normal selection leaves a short origin-tuck transition and the
  entering tray image lands with restrained compression. Five tray entries use
  a static caution treatment; six add a low-frequency stronger pressure cue;
  seven remains the existing loss sequence. Settle uses a cooler tray response
  and never triggers the plant celebration reserved for a true clear.
- Cat reaction bubbles are short, pointer-transparent, single-instance status
  text. The separate interaction menu is actionable but remains transient and
  is never a persistent HUD. Explicit reactions replace the current bubble;
  low-frequency automatic idle reactions never select, reveal, or approach
  fish. Reaction and travel timers pause while away without replaying missed
  automatic reactions.
- Stable state persists after selection, clear, loss restart, preference change,
  and attention loss using `web-match3:ambient-state`. The obsolete
  `web-match3:progress` key is not read or deleted.
- Light coordinates, afterglow handles, focus, pointer capture, and drag motion
  are component-local state and never enter an ambient snapshot. Removing a
  stacked fish may briefly settle its directly related neighbors, but that
  motion never changes canonical coordinates. Away and unmount clear all of
  these projections without changing canonical game state.
- Version-three parsing accepts an omitted legacy `pet` projection and
  normalizes it to home. Only an existing guard target is restored; malformed,
  stale, or full-cat targets default home without rejecting
  the otherwise valid game snapshot.
- A valid legacy version-three snapshot with a seven-piece tray normalizes to
  a fresh stable level-one field, clears feed and guard state, and preserves
  `clearCount`, the plant timestamp, preferences, and monotonic piece IDs.
- A clear persists canonical state immediately but may expose the pre-clear
  tray as an ephemeral 620ms preview. The exact three pieces first travel into
  one shared tray position, then bubble and dissolve together before the tray
  compacts. That preview never enters storage.
- Version-one endless-pile snapshots migrate to version three by preserving
  `clearCount`, plant age, and preferences while replacing the old pile/tray
  with a fresh solvable level-one field. Version-two snapshots map their four
  legacy color keys to whale, koi, sardine, and pufferfish while preserving
  IDs, level, tray, geometry, counters, preferences, and plant state.
- Snapshot validation begins from `unknown`: version three, positive level,
  dynamic active inventory (`pieces + tray + unsettled fed`) bounded by that
  level's config and divisible by three per kind, tray length `0..7`, feed
  length `0..3`, explicit settled booleans, globally unique IDs, legal kinds,
  bounded geometry/layers, safe counters, and boolean sound preference.
- Canonical kinds come from the engine's ordered eight-species registry. Only
  the version-two migration boundary may contain legacy kind literals; saved
  output is always version three with canonical species keys.
- A final clear persists the atomically created next level and locks input for
  the short level-arrival feedback. No numeric level label is rendered.
- Storage absence, malformed data, security errors, or quota failures fall
  back to in-memory play and never block rendering.
- A full-tray loss persists the already-reset stable level-one state before a
  1-1.5 second seven-piece tray preview. Away/unmount cancels and clears the
  preview; returning resumes the stable field instead of replaying the loss.
- Audio is muted by default. Explicit opt-in enables only one short clear
  sound; away/dispose stops active nodes immediately.
- Document Picture-in-Picture is feature-detected and hidden when unsupported.
  It moves the existing mounted surface, never mounts a second game/controller,
  and restores that surface on `pagehide`.
- Away styling is owned by the movable surface rather than its opener-page
  ancestor, so animation pause and reduced-attention contrast remain effective
  after the same DOM subtree enters Picture-in-Picture.
- PiP documents and surfaces must not impose a fixed minimum height. Narrow
  surfaces at `<=620px × <=430px` share one compact composition for controls,
  cat, plant, and tray so an ordinary narrow window and the same-sized PiP
  window cannot drift.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Pointer leaves and no focus remains | clear the transient light; canonical state remains unchanged |
| Pristine initial state loads | run the interruptible scan/targets/tray intro without locking input or persisting tutorial state |
| Any input or attention/PiP handoff during intro | cancel the intro timer and continue that action immediately; do not replay in the same controller |
| Touch search ends | keep a brief local afterglow, then hide fish outside retained focus/drag targets |
| Keyboard focus enters the field | expose the semantic path; focused fish stays visible and every remaining fish is reachable |
| Current fish has zero/one/multiple higher overlaps | accessible name reports its one-based layer and the exact current overlap count without changing actionability |
| An overlapping upper fish leaves the canonical pieces | recompute the shared count map and update every affected lower fish name on the next render |
| Fish is dropped on the cat or focused fish receives `F` below capacity | remove it from the pile, persist feed count, update cat pose |
| Fish drag ends outside the cat or feed is rejected | restore visual position; canonical pile/tray unchanged |
| Home cat is activated | open the pet/search menu, focus `摸一下`, keep travel phase home, and do not choose a guard target |
| `摸一下` is chosen | close the menu, restore cat focus, show one affectionate reaction/status, and perform no storage write |
| `帮我抓鱼` is chosen with an eligible target | close the menu, look, travel, immediately light and guard that target on arrival |
| Escape or outside pointer activation closes the cat menu | remove the menu and its current-document listeners, then restore focus to the cat |
| Guarded target is selected or fed | return cat home and clear the guard |
| Feed credit completes one/two tray fish | animate only that short group, consume credits once, no plant clear |
| Cat already has three feeds | keep feed mode off and announce that the cat is full |
| Coarse pointer or width `<=620px` | touch scanning and semantic controls work without hover dependency |
| Seven unmatched tray entries | persist stable level-one restart, lock for the loss preview, then resume automatically |
| Window/document becomes away | persist, cancel timers, stop sound, pause motion |
| Stored JSON/schema is invalid | fresh solvable level-one snapshot, sound off |
| Valid version-two snapshot uses four or eight legacy keys | map kinds, preserve opaque IDs and progress, return version three |
| Valid version-one endless snapshot | preserve long-term progress and start a solvable version-three level-one field |
| Final triple clears | persist next harder level, show disappear/arrival preview, then unlock input |
| Legacy version-one snapshot lacks `plant` | preserve game/preferences and seed `plantedAt` at load |
| Storage access/write throws | continue in memory; write returns `false` |
| PiP API unavailable | render no small-window button or warning |
| PiP request rejects/closes | keep or restore the same surface and state |
| Multiple resize deliveries before one frame | commit one projection from the latest valid dimensions |
| Surface moves into PiP before resize scheduling | request the frame from the surface's current window |
| `320x240` narrow surface | use the compact composition, preserve 44px controls, and create no horizontal or vertical overflow |
| Reduced motion | remove travel/pulse animation while retaining spotlight, layer shadow, tray pressure, feed response, and transition state semantics |

## 5. Good / Base / Bad Cases

- Good: selection persists before decorative clear feedback finishes.
- Base: unsupported PiP and blocked storage still provide complete play.
- Good: hiding the opener does not pause an active PiP surface.
- Good: reveal state derives from canonical coordinates but remains entirely
  local to `FishField.vue`.
- Good: activating the home cat reveals intent first; only the explicit search
  action starts looking or creates a guard target.
- Bad: a hidden fish keeps a pointer hit box or light coordinates are saved.
- Bad: the cat trigger calls `requestCatSearch` directly or pet/menu state is
  added to the persisted snapshot.
- Bad: a component calls `localStorage` or computes blockers itself.
- Bad: hover state, timers, focus, DOM nodes, or audio objects enter snapshots.
- Bad: a second Vue mount is created for the small window.

## 6. Tests Required

1. controller selection, clear callback, finite inventory, level advancement,
   persistence, and default-muted sound;
   assert the clear preview contains the exact cleared IDs and settles to the
   canonical tray;
2. immediate stable persistence plus automatic completion, away cancellation,
   and dispose cancellation of the 1-1.5 second loss preview;
3. version-three snapshot round-trip and full-tray normalization, four-kind and eight-kind version-two
   migration, opaque legacy IDs, version-one migration, malformed JSON/schema,
   duplicate IDs, invalid
   geometry/inventory, tray/level/counter/plant bounds, inaccessible storage,
   and quota failure;
4. browser checks at `320x568`, `390x844`, `768x1024`, and `1440x900` for no
   horizontal overflow, pointer/touch reveal, afterglow, retained focus and
   drag visibility, keyboard and semantic selection, lower-overlap selection,
   nearby settling motion, tray
   clear, plant growth, persistence, and no console errors;
5. reduced-motion and supported/unsupported/rejected PiP paths.
   Include resize-delivery coalescing, latest-size wins, pending-frame
   cancellation, and a `320x240` compact-surface browser check.
6. mixed-species feeding, short-group settlement without a clear callback,
   persisted feed credits, and full-to-lying-to-sleeping pose timing.
7. pristine intro eligibility and serial timing, every takeover path, away and
   disposal cancellation, untouched-refresh replay, operated-state suppression,
   and mutual replacement of direct feedback.
8. pure projections for cross-layer intro targets, tray pressure boundaries,
   clear-versus-settle plant response, direct feed acceptance/rejection, and
   loss/level input locking.
9. pure fish accessible-name projections for zero/one/multiple overlaps,
   one-based layers, feedable/resting action wording, and current-piece
   reprojection after an upper fish leaves; browser-check the resulting names
   and unchanged arrow/F action paths.
10. cat interaction regressions: direct activation stays home, petting replaces
    transient feedback without persistence, and explicit search retains all
    rejection/travel/guard rules; browser-check first-action focus, arrow
    navigation, Escape/outside dismissal, focus restoration, and PiP document
    movement.

Run focused tests first, then one `pnpm ci:web`.

## 7. Wrong vs Correct

### Wrong

```ts
const saved = JSON.parse(localStorage.getItem("state") ?? "{}");
createApp(GameView).mount(pipDocument.body);
```

This trusts corrupt data and forks canonical state across two Vue mounts.

### Correct

```ts
const snapshot = loadAmbientSnapshot(resolveBrowserStorage(), random);
pipDocument.body.append(existingSurface);

const scheduler = createFieldProjectionScheduler(
  commitLatestProjection,
  (callback) => {
    const surfaceWindow = surface.ownerDocument.defaultView ?? window;
    const frameId = surfaceWindow.requestAnimationFrame(callback);
    return () => surfaceWindow.cancelAnimationFrame(frameId);
  },
);
```

Validation stays at the session boundary and PiP moves one mounted subtree.
Projection work follows that subtree's current window and remains cancellable.

Spatial labels follow the same UI boundary:

```ts
// Wrong: visual overlap silently changes the game action path.
const disabled = getBlockerIds(pieces, piece.id).length > 0;

// Correct: derive current facts once, then describe them without disabling.
const overlapCounts = getHigherOverlapCounts(pieces);
const label = getFishAccessibleLabel({
  kind: piece.kind,
  layer: piece.layer,
  higherOverlapCount: overlapCounts.get(piece.id) ?? 0,
  feedable,
});
```

Cat intent follows the same explicit boundary:

```vue
<!-- Wrong: a casual touch starts search immediately. -->
<CatCompanion @activate="game.requestCatSearch" />

<!-- Correct: the component collects intent; the controller owns each action. -->
<CatCompanion
  @pet="game.petCat"
  @search="game.requestCatSearch"
/>
```
