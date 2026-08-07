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
  | "idle" | "intro" | "select" | "clear" | "level" | "loss";

type IntroPhase = "idle" | "scan" | "targets" | "tray";
type CatBondStage = "newcomer" | "familiar" | "bonded";

interface CompletedFishEvent {
  readonly id: number;
  readonly kind: FishKind;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly feedCount: number;
}

createAmbientController(options?: AmbientControllerOptions): AmbientController

interface AmbientController {
  readonly fishFedCount: Ref<number>;
  readonly bondStage: ComputedRef<CatBondStage>;
  readonly completedFish: ShallowRef<CompletedFishEvent | null>;
  activate(pieceId: string): void;
  rejectDirectFeed(): void;
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
}

getHigherOverlapCounts(
  pieces: readonly PilePiece[],
): ReadonlyMap<string, number>

getFishAccessibleLabel(options: FishAccessibleLabelOptions): string

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

interface AmbientSnapshotLoadResult {
  readonly snapshot: AmbientSnapshotV4;
  readonly loadedFromStorage: boolean;
}

loadAmbientSnapshot(
  storage: StorageLike | null,
  random?: RandomSource,
  now?: number,
): AmbientSnapshotV4
loadAmbientSnapshotResult(
  storage: StorageLike | null,
  random?: RandomSource,
  now?: number,
): AmbientSnapshotLoadResult
saveAmbientSnapshot(storage: StorageLike | null, snapshot: AmbientSnapshotV4): boolean
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
  one normalized light. A coarse-pointer gesture below the shared 7px drag
  threshold is a tap: release selects the nearest fish revealed by that
  pointer light, then keeps a brief afterglow. Crossing the threshold is a
  scan and release never selects; pointer cancellation also never selects.
- Fish outside the light are visually hidden and cannot intercept pointer
  input. Fish inside an outer UI-only hint ring may expose a faint silhouette,
  but remain unrevealed and pointer-transparent until they enter the canonical
  discovery radius. The hint ring reuses the spotlight's elliptical distance
  calculation and never changes coordinates, selection, guard, or snapshot
  state. The actually focused fish and an active dragged fish stay visible;
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
- A pristine level-one state (`clearCount === 0`, empty tray, no
  guard, and untouched monotonic IDs) begins one non-blocking controller-owned
  intro. One serial `TimerApi` handle advances `scan -> targets -> tray -> idle`:
  the light visits `INITIAL_DISCOVERY_POINT`, the cross-layer discoverable
  triple lifts briefly, and tray slot one responds. Pointer/touch/keyboard
  input, selection, cat search, PiP activation, away, or disposal
  cancels it immediately. Refresh may replay only while canonical state remains
  untouched. Eligibility is computed from the loaded pre-reset snapshot so an
  operated session does not become tutorial-eligible merely because the new
  controller resets its field; snapshots never gain intro fields. Independently,
  the first level of each mounted page session may show one short visible
  instruction until the first successful tray selection. Moving or cancelling
  the visual intro does not dismiss this instruction, which stays non-blocking
  and UI-local and never enters a snapshot.
- Controller feedback is one mutually exclusive projection. Direct `select`
  feedback lasts about 220ms; small-fish combination uses about 700ms; `level`
  uses about 960ms so its arrival cue is readable; `loss` remains 1.2s. The
  transient `CompletedFishEvent` also blocks a second selection until delivery
  completes. Components consume these projections and do not start competing
  cross-component state timers.
  FishField may still own pointer afterglow, drag return, and nearby slip timers
  because those projections never cross its boundary.
- When the search surface itself is focused, arrows move the light and
  Enter/Space selects the nearest revealed selectable fish. Focused piece
  buttons retain directional navigation; Enter, Space, and `F` all put the
  complete small fish into the tray.
- If Enter/Space finds no revealed fish under a moved keyboard spotlight,
  `FishField` emits one UI-only miss event and the controller replaces the
  polite live-region status with a short continue-searching hint. The miss
  never selects, persists, or announces merely because an arrow moved.
- The home cat is a native button whose pointer, touch, Enter, and Space
  activation opens one component-local menu with `摸一下` and `帮我抓鱼`.
  The component's outer layout and transparent artwork area are pointer-
  transparent; only a pose-aligned native trigger and the open menu accept
  pointer input. Every pose retains at least a 44px trigger. Separate outer cat
  bounds may detect a drag only to explain why one small fish cannot be fed
  directly; that path never mutates game state. Keyboard focus follows
  the visible cat with an alpha-aware shadow instead of outlining the artwork
  canvas.
  Activation alone never selects a target. `摸一下` calls `petCat`, replaces the
  current transient reaction/status, keeps the cat home, and never changes or
  persists canonical game state. Only `帮我抓鱼` calls `requestCatSearch`.
  Awake search travels to one eligible target; on arrival, an independent guide
  light immediately retains only that exact fish in the revealed set; nearby
  fish inside the guide beam's visual radius remain hidden and pointer-
  transparent. The cat guards until the exact fish is selected or
  invalidated. Pointer spotlight movement does not dismiss or relocate the
  guide light. The exact guarded fish may also show one visual-only warm outline
  and short `这里` marker; the polite live region owns its accessible wording,
  and resolving or invalidating the guard removes the marker immediately.
- Cat search ranks only the already eligible hidden candidates. Candidate
  species with two matching tray fish rank before species with one, which rank
  before species with none; ties retain the existing distance-to-cat order and
  use piece ID as the deterministic final order. The helper never selects,
  removes, combines, or feeds the guarded target.
- The interaction menu focuses its first action, supports arrow/Home/End
  navigation, closes on Escape or outside pointer activation, and restores
  focus to the cat. Its document listeners resolve from the component root's
  current `ownerDocument`, so moving the existing surface into Picture-in-
  Picture cannot leave listeners attached to the opener. Menu state, focus,
  DOM nodes, and scheduled focus restoration never enter the snapshot.
- Choosing either cat action closes the menu before emitting the action. A DOM
  node retained for the leave transition is immediately inert, `aria-hidden`,
  and pointer-transparent, then removed when the transition finishes; it never
  remains as a menu or menuitem in the accessibility tree.
- Pointer and touch may drag one small fish to the cat's current bounds, but
  that gesture is explanatory only: it restores the fish, announces that three
  same-species fish must combine first, and never changes canonical state or
  `fishFedCount`. `F` follows the same tray-selection path as Enter and Space.
- Selecting the third same-species small fish produces one engine-owned
  `combined` result. The controller increments the unlimited `fishFedCount`,
  persists both game and pet progress, emits one transient `CompletedFishEvent`,
  and starts the cat's eating pose. There is no cat-full rejection state.
- `FishDelivery` measures tray and cat centers in the current surface, gathers
  three small fish at the tray, forms one visibly larger fish of the same
  species, and sends it to the cat. Delivery geometry, event sequence IDs, and
  the large-fish projection never enter engine or snapshot state.
- Bond stage is derived only from the durable count: `newcomer` for `0..2`,
  `familiar` for `3..8`, and `bonded` for `9+`. Every third automatic feed runs
  `eating -> full -> lying -> sleeping -> idle`; any later combination can
  interrupt that rest and is still accepted. Away pauses and resumes the
  current pose sequence without advancing progress offline.
- Revealed fish use their visual layer to vary lift and shadow without changing
  hit targets. Normal selection leaves a short origin-tuck transition and the
  entering tray image lands with restrained compression. Five tray entries use
  a static caution treatment; six add a low-frequency stronger pressure cue;
  seven remains the existing loss sequence. A combination uses the lavender
  reward and plant response because it increments canonical `clearCount`.
- Cat reaction bubbles are short, pointer-transparent, single-instance status
  text. The separate interaction menu is actionable but remains transient and
  is never a persistent HUD. Explicit reactions replace the current bubble;
  low-frequency automatic idle reactions never select, reveal, or approach
  fish. Reaction and travel timers pause while away without replaying missed
  automatic reactions.
- Snapshot state persists after selection, combination, loss restart, preference
  change, and attention loss using `web-match3:ambient-state`. Its
  `game.clearCount` is the person's lifetime plant experience, while
  `plant.plantedAt` is the long-term planting timestamp. A newly created page
  controller never resumes the stored level, fish, tray, or pet guard:
  it generates one level-one field with IDs starting at `fish-1`, carrying
  forward `clearCount`, `plantedAt`, `soundEnabled`, and `fishFedCount`. The obsolete
  `web-match3:progress` key is not read or deleted.
- `loadAmbientSnapshotResult` distinguishes a valid restored snapshot from a
  fresh fallback. Missing, malformed, inaccessible, or incompatible storage
  returns `loadedFromStorage: false` with the single freshly generated field;
  the controller must reuse that field rather than generating a second one.
  A valid stored snapshot returns `loadedFromStorage: true`, which is the only
  path that derives a replacement field while preserving its long-term values.
- Light coordinates, afterglow handles, focus, pointer capture, and drag motion
  are component-local state and never enter an ambient snapshot. Removing a
  stacked fish may briefly settle its directly related neighbors, but that
  motion never changes canonical coordinates. Away and unmount clear all of
  these projections without changing canonical game state.
- Version-four parsing validates an existing guard target, but every newly
  created page controller clears the guard with other session-only state. A
  malformed or stale guard defaults home without discarding otherwise valid
  durable progress.
- Any valid stored version-four game, not only a seven-piece loss snapshot,
  starts the controller on a fresh level-one field with an empty tray and the
  cat home. `clearCount`, `fishFedCount`, plant timestamp, and preferences
  survive; stored level, coordinates, inventory, guard, and piece IDs do not.
- A combination persists canonical state immediately while exposing the exact
  three small fish as an ephemeral 700ms tray/delivery preview. The small-fish
  gather, large fish, and surface-local flight never enter storage.
- Version-three feed-credit snapshots migrate to version four by preserving
  `clearCount`, plant age, preferences, monotonic ID origin, and the recoverable
  legacy fed-entry count while rebuilding the board from whole small fish.
  Version two also maps its legacy color keys; version one keeps its durable
  progress and receives a fresh solvable board. Controller creation then
  applies the same clean-session reset.
- Snapshot validation begins from `unknown`: version four, positive level,
  active inventory (`pieces + tray`) bounded by that level's config and
  divisible by three in total and per species, tray length `0..7`, globally
  unique IDs, legal kinds, bounded geometry/layers, safe counters including
  `fishFedCount`, and a boolean sound preference.
- Canonical kinds come from the engine's ordered eight-species registry. Only
  the version-two migration boundary may contain legacy kind literals; saved
  output is always version four with canonical species keys.
- A final combination persists the atomically created next level and locks input for
  the short level-arrival feedback. A transient non-modal cue may report the
  current species count and deeper stacking, but no numeric level label or
  persistent progression HUD is rendered.
- Storage absence, malformed data, security errors, or quota failures fall
  back to in-memory play and never block rendering.
- A full-tray loss persists the already-reset stable level-one state before a
  1-1.5 second seven-piece tray preview. Away/unmount cancels and clears the
  preview; returning attention within the same controller resumes that stable
  field, while constructing a new controller generates another fresh
  level-one session without touching plant experience.
- Audio is muted by default. Explicit opt-in enables only one short combination
  sound; away/dispose stops active nodes immediately.
- Document Picture-in-Picture is supported only when `requestWindow` is
  callable and is hidden otherwise. A valid request immediately reports that
  opening is in progress; rejection or bounded non-settlement keeps the same
  surface in place and replaces that status with one quiet failure message. A
  successful request moves the existing mounted surface, never mounts a second
  game/controller, and restores that surface on `pagehide`.
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
| First page-session selection has not completed | keep one visible non-blocking instruction even if pointer movement cancels the visual intro; remove it after successful tray selection |
| Any input or attention/PiP handoff during intro | cancel the intro timer and continue that action immediately; do not replay in the same controller |
| Touch tap ends below 7px travel | select the nearest fish revealed by that pointer light once, keep a brief afterglow, then hide non-retained fish |
| Touch scan crosses 7px or receives `pointercancel` | keep a brief local afterglow without selecting, then hide fish outside retained focus/drag targets |
| Keyboard focus enters the field | expose the semantic path; focused fish stays visible and every remaining fish is reachable |
| Current fish has zero/one/multiple higher overlaps | accessible name reports its one-based layer and the exact current overlap count without changing actionability |
| An overlapping upper fish leaves the canonical pieces | recompute the shared count map and update every affected lower fish name on the next render |
| Focused fish receives Enter, Space, or `F` | run the same tray-selection transition |
| One small fish is dropped on or outside the cat | restore visual position; explain the three-fish rule when relevant; canonical state and feed count remain unchanged |
| Home cat is activated | open the pet/search menu, focus `摸一下`, keep travel phase home, and do not choose a guard target |
| `摸一下` is chosen | close the menu, restore cat focus, show one affectionate reaction/status, and perform no storage write |
| `帮我抓鱼` is chosen with an eligible target | close the menu, look, travel, immediately light and guard that target on arrival |
| Guide beam overlaps multiple canonical fish | reveal and enable only the guarded target; keep every neighbor hidden unless the independent pointer light reveals it |
| Spotlight outer hint ring overlaps a fish | show at most a faint pointer-transparent silhouette; do not add it to the revealed/actionable set |
| Pointer crosses transparent cat artwork outside the pose trigger | hit the fish or surface beneath it; retain the outer geometry only for drag-to-cat drop evaluation |
| Eligible hidden fish include tray-count priorities 2, 1, and 0 | choose from priority 2, then 1, then 0; use distance and stable ID only within a priority |
| Escape or outside pointer activation closes the cat menu | remove the menu and its current-document listeners, then restore focus to the cat |
| A cat action starts while a leave transition retains the menu node | make that node inert, a11y-hidden, and pointer-transparent immediately, then remove it at transition completion |
| Guarded target is selected | return cat home and clear the guard |
| Third same-species tray fish is selected | persist the exact combination and incremented `fishFedCount`, then render one transient large-fish delivery |
| Fourth, tenth, or later complete fish is produced | accept and auto-feed it; never reject because of a capacity limit |
| Durable count crosses 3 or 9 | derive the next bond stage without rewriting historical count |
| Durable count is divisible by three | run the temporary rest sequence; allow the next completed fish to interrupt it |
| Coarse pointer or width `<=620px` | touch scanning and semantic controls work without hover dependency |
| Seven unmatched tray entries | persist stable level-one restart, lock for the loss preview, then resume automatically |
| Window/document becomes away | persist, cancel timers, stop sound, pause motion |
| No stored snapshot or storage is unavailable | generate exactly one pristine level-one field with `fish-1` through `fish-36`, sound off, and a new planting timestamp |
| Valid stored mid-session snapshot opens in a new controller | generate a fresh level-one field, clear tray/guard, reset piece IDs, and preserve `clearCount`, `fishFedCount`, `plantedAt`, and `soundEnabled` |
| Stored JSON/schema is invalid | fresh solvable level-one snapshot, sound off |
| Valid version-three feed-credit snapshot | validate legacy inventory, preserve recoverable durable progress, rebuild whole-fish state as version four |
| Valid version-two snapshot uses four or eight legacy keys | map and validate kinds, preserve durable progress, then start the controller on a fresh version-four level-one field |
| Valid version-one endless snapshot | preserve durable progress and start a solvable version-four level-one field |
| Final triple combines | persist next harder level, show large-fish/arrival preview, then unlock input |
| Legacy version-one snapshot lacks `plant` | preserve game/preferences and seed `plantedAt` at load |
| Storage access/write throws | continue in memory; write returns `false` |
| PiP API unavailable | render no small-window button or warning |
| PiP namespace exists but `requestWindow` is not callable | treat it as unavailable and render no small-window button |
| PiP request rejects/closes | keep or restore the same surface and state |
| Keyboard spotlight has no revealed target on Enter/Space | announce one transient miss; do not change or persist game state |
| Multiple resize deliveries before one frame | commit one projection from the latest valid dimensions |
| Surface moves into PiP before resize scheduling | request the frame from the surface's current window |
| `320x240` narrow surface | use the compact composition, preserve 44px controls, and create no horizontal or vertical overflow |
| Reduced motion | remove travel/pulse animation while retaining spotlight, layer shadow, tray pressure, static large-fish delivery, cat pose, and transition semantics |

## 5. Good / Base / Bad Cases

- Good: combination and bond progress persist before decorative delivery finishes.
- Base: unsupported PiP and blocked storage still provide complete play.
- Good: hiding the opener does not pause an active PiP surface.
- Good: reveal state derives from canonical coordinates but remains entirely
  local to `FishField.vue`.
- Good: activating the home cat reveals intent first; only the explicit search
  action starts looking or creates a guard target.
- Good: reloading after level, tray, combination, or guard changes starts a clean
  level-one board while lifetime `clearCount`, `fishFedCount`, and `plantedAt`
  remain intact.
- Bad: a hidden fish keeps a pointer hit box or light coordinates are saved.
- Bad: the cat trigger calls `requestCatSearch` directly or pet/menu state is
  added to the persisted snapshot.
- Bad: controller creation either resumes the stored game or calls
  `createFreshSnapshot` in a way that replaces lifetime plant experience.
- Bad: a component calls `localStorage` or computes blockers itself.
- Bad: a component increments `fishFedCount`, invents a fourth large-fish
  inventory entry, or removes a single fish on a cat drop.
- Bad: hover state, timers, focus, DOM nodes, or audio objects enter snapshots.
- Bad: a second Vue mount is created for the small window.

## 6. Tests Required

1. controller tray selection, exact three-fish combination IDs, automatic feed,
   clear callback, finite inventory, level advancement, durable count
   persistence, and default-muted sound;
2. immediate stable persistence plus automatic completion, away cancellation,
   and dispose cancellation of the 1-1.5 second loss preview;
3. version-four snapshot round-trip, load-result source metadata, full-tray
   normalization, version-three feed-credit migration, four-kind and eight-kind
   version-two migration, opaque legacy IDs, version-one migration, malformed
   JSON/schema, duplicate IDs, invalid geometry/inventory, per-kind imbalance,
   tray/level/counter/pet/plant bounds, inaccessible storage, and quota failure;
4. browser checks at `320x568`, `390x844`, `768x1024`, and `1440x900` for no
   horizontal overflow, pointer/touch reveal, afterglow, retained focus and
   drag visibility, keyboard and semantic selection, lower-overlap selection,
   nearby settling motion, small-to-large delivery, cat eating, tray clear,
   plant growth, persistence, and no console errors;
5. reduced-motion and supported/unsupported/rejected PiP paths.
   Include resize-delivery coalescing, latest-size wins, pending-frame
   cancellation, and a `320x240` compact-surface browser check.
6. unlimited automatic feeds including fourth/tenth/later fish, newcomer/
   familiar/bonded thresholds, yarn/cushion stage projection, every-third
   full-to-lying-to-sleeping timing, and interruption by a later combination.
7. pristine intro eligibility and serial timing, every takeover path, away and
   disposal cancellation, untouched-refresh replay, operated-state suppression,
   and mutual replacement of transient feedback.
8. pure projections for cross-layer intro targets, tray pressure boundaries,
   spotlight hint-ring membership without reveal/actionability, combination
   plant response, single-fish direct-feed rejection without mutation, 960ms
   level feedback, and loss/level input locking.
9. pure fish accessible-name projections for zero/one/multiple overlaps,
   one-based layers, small-size tray action wording, and current-piece
   reprojection after an upper fish leaves; browser-check the resulting names
   and unified Enter/Space/F action paths.
10. cat interaction regressions: direct activation stays home, petting replaces
    transient feedback without persistence, and explicit search retains all
    rejection/travel/guard rules; browser-check first-action focus, arrow
    navigation, Escape/outside dismissal, focus restoration, and PiP document
    movement. Assert the guide retains only the exact guarded ID even when
    canonical neighbors fall inside the guide beam's visual radius. Assert
    search priority `two matching tray fish > one > zero`, with distance and ID
    tie-breaks, and assert a leaving action menu is immediately non-interactive
    and absent from the accessibility tree.
11. controller-entry regressions: a valid level/tray/guard snapshot becomes a
    fresh level-one game with empty transient inventory and IDs starting at one
    while preserving `clearCount`, `fishFedCount`, `plantedAt`, and
    `soundEnabled`; missing, empty, and inaccessible storage generate only one
    pristine field; PiP movement keeps the same mounted controller and session.
12. pointer gesture regressions: the shared 7px threshold classifies sub-
    threshold movement as a tap and boundary-or-greater movement as a scan;
    browser-check that a blank-surface touch tap selects its nearest locally
    revealed fish once, while scan release and cancellation select nothing.
13. browser hit-test the transparent cat-artwork area against nearby fish in
    standing and lying pose groups; retain the pose trigger's 44px minimum and
    the separate outer drag-to-cat drop geometry.

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
const loaded = loadAmbientSnapshotResult(resolveBrowserStorage(), random);
const stored = loaded.snapshot;
const initial = loaded.loadedFromStorage
  ? {
      ...stored,
      game: createLevelState(1, stored.game.clearCount, 1, random),
      pet: { ...stored.pet, guardedPieceId: null },
    }
  : stored;
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

Touch search and guided reveal must stay separate:

```ts
// Wrong: every fish around the cat's guide point becomes actionable.
getRevealedPieceIds(pieces, guidedPiece.pile);

// Correct: the pointer light owns radius reveal; the guide retains one ID.
getRevealedPieceIds(pieces, pointerLight, [guidedPiece.id]);
```
