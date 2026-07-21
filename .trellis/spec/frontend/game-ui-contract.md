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

createAmbientController(options?: AmbientControllerOptions): AmbientController

interface AmbientSnapshotV3 {
  readonly version: 3;
  readonly game: AmbientGameState;
  readonly preferences: { readonly soundEnabled: boolean };
  readonly plant: { readonly plantedAt: number };
}

loadAmbientSnapshot(storage: StorageLike | null, random?: RandomSource): AmbientSnapshotV3
saveAmbientSnapshot(storage: StorageLike | null, snapshot: AmbientSnapshotV3): boolean
createDocumentPipController(onSurfaceChange: (surfaceWindow: Window | null) => void): DocumentPipController
```

## 3. Contracts

- Root page is immediately playable: no player name, lobby, start gate, HUD,
  score, leaderboard, round result, or restart modal.
- Pointer entry and `focus-within` gather pieces; pointer exit returns the
  authored spread. Narrow/coarse-pointer layouts stay gathered so gameplay
  never depends on hover.
- After 30 seconds without pointer or keyboard activity, a fine-pointer scene
  returns to its authored spread without mutating pile, tray, or plant state.
  Pointer movement, pointer down, or keyboard activity gathers it again.
- Native piece buttons provide 44px-or-larger targets. Blocked pieces are
  disabled and have a text-free, non-color overlap cue plus an accessible
  covering label.
  Arrow keys choose the nearest selectable piece in gathered coordinates.
- The cat is a native button whose pointer, touch, Enter, and Space activation
  requests search help only; it never toggles feeding or chooses a personality
  reaction. Awake search travels to one eligible target and guards it until
  that exact fish is selected, fed, or invalidated.
- Pointer and touch feeding use one Pointer Events drag path from a selectable
  fish to the cat's current bounds. Canonical state changes only on a valid
  drop; failed/rejected drops restore the fish. Keyboard users focus a fish and
  press `F` for the same feed transition, while Enter/Space still selects it
  into the tray.
- The current pile records at most three fed fish. Counts one and two show the
  eating pose; count three plays full, lying, then sleeping. Away state pauses
  that pose timer without resetting capacity, and the next generated pile
  resets both capacity and stable pose.
- A feed-credit settlement may animate the one or two removed tray fish but
  uses `settle` feedback, never invokes the clear callback, never celebrates
  the plant, and never changes `clearCount`.
- Cat bubbles are short, pointer-transparent, single-instance status text.
  Explicit reactions replace the current bubble; low-frequency automatic idle
  reactions never select, reveal, or approach fish. Reaction and travel timers
  pause while away without replaying missed automatic reactions.
- Stable state persists after selection, clear, recovery, preference change,
  and attention loss using `web-match3:ambient-state`. The obsolete
  `web-match3:progress` key is not read or deleted.
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
- Full-tray recovery waits about 700ms of foreground attention. Away/unmount
  cancels the timer; returning restarts it instead of consuming hidden time.
- Audio is muted by default. Explicit opt-in enables only one short clear
  sound; away/dispose stops active nodes immediately.
- Document Picture-in-Picture is feature-detected and hidden when unsupported.
  It moves the existing mounted surface, never mounts a second game/controller,
  and restores that surface on `pagehide`.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Pointer leaves and no focus remains | scatter visually; canonical state unchanged |
| Fine-pointer activity stops for 30 seconds | scatter projection only; next activity gathers and continues |
| Keyboard focus enters pile | gather, expose one roving tab stop, skip blockers |
| Fish is dropped on the cat or focused fish receives `F` below capacity | remove it from the pile, persist feed count, update cat pose |
| Fish drag ends outside the cat or feed is rejected | restore visual position; canonical pile/tray unchanged |
| Awake cat is activated with an eligible target | look, travel, guard that target, show one brief bubble |
| Guarded target is selected or fed | return cat home and clear the guard |
| Feed credit completes one/two tray fish | animate only that short group, consume credits once, no plant clear |
| Cat already has three feeds | keep feed mode off and announce that the cat is full |
| Coarse pointer or width `<=620px` | gathered projection without hover dependency |
| Seven unmatched tray entries | lock briefly, foreground timer, return two, resume |
| Window/document becomes away | persist, cancel timers, stop sound, pause motion |
| Stored JSON/schema is invalid | fresh solvable level-one snapshot, sound off |
| Valid version-two snapshot uses four or eight legacy keys | map kinds, preserve opaque IDs and progress, return version three |
| Valid version-one endless snapshot | preserve long-term progress and start a solvable version-three level-one field |
| Final triple clears | persist next harder level, gather/disappear preview, then unlock input |
| Legacy version-one snapshot lacks `plant` | preserve game/preferences and seed `plantedAt` at load |
| Storage access/write throws | continue in memory; write returns `false` |
| PiP API unavailable | render no small-window button or warning |
| PiP request rejects/closes | keep or restore the same surface and state |
| Reduced motion | near-instant projection/state changes with full semantics |

## 5. Good / Base / Bad Cases

- Good: selection persists before decorative clear feedback finishes.
- Base: unsupported PiP and blocked storage still provide complete play.
- Good: hiding the opener does not pause an active PiP surface.
- Bad: a component calls `localStorage` or computes blockers itself.
- Bad: hover state, timers, focus, DOM nodes, or audio objects enter snapshots.
- Bad: a second Vue mount is created for the small window.

## 6. Tests Required

1. controller selection, clear callback, finite inventory, level advancement,
   persistence, and default-muted sound;
   assert the clear preview contains the exact cleared IDs and settles to the
   canonical tray;
2. away cancellation/restart of the 700ms recovery timer;
3. version-three snapshot round-trip, four-kind and eight-kind version-two
   migration, opaque legacy IDs, version-one migration, malformed JSON/schema,
   duplicate IDs, invalid
   geometry/inventory, tray/level/counter/plant bounds, inaccessible storage,
   and quota failure;
4. browser checks at `320x568`, `390x844`, `768x1024`, and `1440x900` for no
   horizontal overflow, pointer/focus gather, scatter, keyboard selection,
   blocked state, tray clear, plant growth, persistence, and no console errors;
5. reduced-motion and supported/unsupported/rejected PiP paths.
6. mixed-species feeding, short-group settlement without a clear callback,
   persisted feed credits, and full-to-lying-to-sleeping pose timing.

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
```

Validation stays at the session boundary and PiP moves one mounted subtree.
