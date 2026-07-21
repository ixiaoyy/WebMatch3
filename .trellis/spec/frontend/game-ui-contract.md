# Ambient Jelly UI and Local Session Contract

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

interface AmbientSnapshotV1 {
  readonly version: 1;
  readonly game: AmbientGameState;
  readonly preferences: { readonly soundEnabled: boolean };
  readonly plant: { readonly plantedAt: number };
}

loadAmbientSnapshot(storage: StorageLike | null, random?: RandomSource): AmbientSnapshotV1
saveAmbientSnapshot(storage: StorageLike | null, snapshot: AmbientSnapshotV1): boolean
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
  disabled and have a non-color visual cue plus an accessible covering label.
  Arrow keys choose the nearest selectable piece in gathered coordinates.
- Stable state persists after selection, clear, recovery, preference change,
  and attention loss using `web-match3:ambient-state`. The obsolete
  `web-match3:progress` key is not read or deleted.
- A clear persists canonical state immediately but may expose the pre-clear
  tray as an ephemeral 460ms preview so the exact three pieces can bubble and
  melt before the tray compacts. That preview never enters storage.
- Version-one snapshots created before `plant.plantedAt` existed migrate by
  preserving game/preferences and seeding `plantedAt` with the current load
  time. A present but invalid plant timestamp invalidates the snapshot.
- Snapshot validation begins from `unknown`: exactly 18 objects across pile and
  tray, tray length `0..7`, unique IDs, legal kinds, bounded geometry/layers,
  safe counters, version `1`, and boolean sound preference.
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
| Coarse pointer or width `<=620px` | gathered projection without hover dependency |
| Seven unmatched tray entries | lock briefly, foreground timer, return two, resume |
| Window/document becomes away | persist, cancel timers, stop sound, pause motion |
| Stored JSON/schema is invalid | fresh 18-piece playable snapshot, sound off |
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

1. controller selection, clear callback, persistence, and default-muted sound;
   assert the clear preview contains the exact cleared IDs and settles to the
   canonical tray;
2. away cancellation/restart of the 700ms recovery timer;
3. snapshot round-trip, malformed JSON/schema, duplicate IDs, invalid geometry,
   tray/counter/plant bounds, legacy plant migration, inaccessible storage,
   and quota failure;
4. browser checks at `320x568`, `390x844`, `768x1024`, and `1440x900` for no
   horizontal overflow, pointer/focus gather, scatter, keyboard selection,
   blocked state, tray clear, plant growth, persistence, and no console errors;
5. reduced-motion and supported/unsupported/rejected PiP paths.

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
