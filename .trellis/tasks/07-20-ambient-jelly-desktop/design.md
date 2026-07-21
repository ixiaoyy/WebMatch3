# Ambient tab jelly desktop — technical design

## 1. Summary

Replace the current round-based swap Match-3 application with one persistent
browser-native desktop scene. The new game uses a small freeform pile of
overlapping jelly pieces, a seven-slot tray, automatic three-of-a-kind clears,
soft full-tray recovery, and non-numeric plant growth.

The implementation remains a Vue/Vite single page with no new runtime
dependency. Pure game transitions stay independent from Vue, DOM APIs, timers,
storage, sound, and Picture-in-Picture.

## 2. Product and visual direction

Physical scene: an office worker in cool late-afternoon light switches to a
quiet pinned tab for five seconds, touches three glossy objects beside a small
plant, then returns to work.

The visual direction is a **rain-washed windowsill**:

- the supplied reference at
  `research/visual-reference.png` is the source of truth for lighting,
  atmosphere, material, and broad composition;
- a pale lavender-blue wall and tabletop separated by a nearly invisible
  horizon, with cool daylight and soft depth;
- a diffuse, natural foliage shadow entering from the left without becoming an
  interactive illustration;
- most of the viewport left intentionally empty;
- a dimensional light ceramic pot and growing green plant anchoring the
  lower-right;
- four translucent glass/resin jelly silhouettes with internal color, edge
  highlights, contact shadows, and a restrained lavender reward glow; they
  rest in a loose desktop spread and gather into a shallow irregular pile when
  the play surface is engaged;
- no board surface, cells, rectangular tile matrix, top bar, HUD, or game-card
  shell;
- one quiet control cluster that becomes legible on hover or focus;
- state motion only: reveal, tray move, clear, recovery, and plant growth.

The current candy PNGs establish useful silhouette identities but are too
opaque and saturated to match the supplied material reference. Implementation
will create a coherent replacement set for aqua orb, amber drop, lime leaf,
and rose heart, using the reference image as an Image Generation input, then
validate transparent margins and favicon readability. The lime jelly supplies
the pinned-tab favicon.

The wallpaper and plant should also reach the reference's dimensional quality.
Use a responsive raster wallpaper without UI, plant, or jellies for the
lavender wall/table and left foliage shadow. Build the growing plant from a
small coherent transparent asset set (ceramic pot plus compatible stems/leaves)
whose layers can be revealed at milestones. Do not bake the plant or playable
jellies into the wallpaper.

## 3. Module boundaries

The existing `apps/web/src/features/game` ownership boundary remains, but its
legacy grid engine, session rules, components, and tests are replaced rather
than kept as an alternate mode.

```text
features/game/
├── engine/
│   ├── types.ts
│   ├── random.ts
│   ├── pile.ts
│   ├── transitions.ts
│   ├── index.ts
│   └── ambient-game.test.ts
├── session/
│   ├── types.ts
│   ├── storage.ts
│   ├── index.ts
│   └── storage.test.ts
└── ui/
    ├── GameView.vue
    ├── ambient-controller.ts
    ├── ambient-controller.test.ts
    ├── document-pip.ts
    ├── sound.ts
    ├── game-ui.ts
    ├── components/
    │   ├── JellyCluster.vue
    │   ├── JellyPiece.vue
    │   ├── JellyTray.vue
    │   ├── GrowingPlant.vue
    │   └── QuietControls.vue
    └── assets/
```

`App.vue` remains a thin top-level assembly point. Global wallpaper, document
defaults, tokens, focus, reduced-motion, and Picture-in-Picture document rules
remain in `app/styles/global.scss`; feature styling stays with its components.

## 4. Canonical game model

```ts
type JellyKind = "aqua" | "amber" | "lime" | "rose";

interface PilePiece {
  id: string;
  kind: JellyKind;
  x: number;       // normalized freeform coordinate, 0..1
  y: number;       // normalized freeform coordinate, 0..1
  rotation: number;
  scale: number;
  layer: number;   // shallow z-order, normally 0..2
}

interface AmbientGameState {
  pieces: readonly PilePiece[];
  tray: readonly TrayPiece[];
  clearCount: number;
  nextPieceId: number;
}
```

The model stores no grid coordinate. Each authored template supplies both a
scattered desktop position and an engaged pile position for every piece, with
bounded jitter. The canonical blocker calculation uses the engaged pile
geometry; the idle spread is a visual projection that makes the objects feel
placed on a desktop without changing game rules. Templates intentionally avoid
rows and columns in both projections.

### Occlusion

A lower piece is blocked when an active higher-layer piece overlaps a
meaningful portion of its normalized hit rectangle. The pure engine calculates
the blocker IDs; the UI consumes that result and does not infer availability
from DOM geometry.

- blocked pieces remain visually present but have restrained contrast and a
  small non-color-only lock/covered cue;
- blocked pieces are disabled for pointer, touch, and keyboard activation;
- their accessible description names the covering state;
- removing a higher piece recomputes availability synchronously.

### Generation

- A new state contains 16–20 pieces across two or three shallow layers.
- IDs are unique and transitions never mutate an input state.
- Geometry is template-based and irregular, not a randomized grid.
- Type assignment guarantees at least three currently selectable pieces of one
  kind.
- Replenishment after a clear inserts three pieces into freeform positions and
  rechecks the same quick-match invariant.
- Randomness is explicit. Production may use `Math.random`; tests use a seeded
  source.

### Selection and clearing

`selectPiece(state, id, random)` returns a discriminated transition:

- `blocked` or `missing`: unchanged state;
- `moved`: piece removed from pile and appended to the tray;
- `cleared`: three same-kind tray entries removed, `clearCount` incremented,
  and three replacement pieces added;
- `recovery-needed`: the stable state has seven unmatched tray entries.

The controller may keep an ephemeral visual snapshot for a short clear
animation, but it persists the stable post-transition state immediately.

### Automatic recovery

With four kinds, seven unmatched tray entries necessarily contain at least one
pair. Recovery preserves one pair, returns two strategically selected
non-pair entries to the pile, compacts the tray, and ensures a currently
selectable jelly can complete the preserved pair.

Recovery starts only after about 700 ms of foreground attention. Losing
attention cancels the timer without consuming hidden time; returning restarts
the brief feedback beat. Recovery never changes `clearCount`.

## 5. Session persistence

Use a new key, `web-match3:ambient-state`, and leave the obsolete score key
untouched but unread. The stored record is versioned:

```ts
interface AmbientSnapshotV1 {
  version: 1;
  game: AmbientGameState;
  preferences: {
    soundEnabled: boolean;
  };
}
```

- Reads begin as `unknown` and validate version, bounds, unique IDs, kinds,
  geometry, shallow layers, tray size, counter safety, and referential
  consistency.
- Invalid, unavailable, or inaccessible storage falls back to a fresh playable
  state.
- Writes occur after each selection, clear, recovery, preference change, and
  before an active surface becomes away.
- Storage failures never block in-memory play.
- Ephemeral animation phase, focus, hover, timers, audio objects, DOM/window
  references, and Picture-in-Picture state are not persisted.

## 6. Controller and attention lifecycle

`createAmbientController` owns Vue refs, focus choice, the 700 ms recovery
timer, persistence calls, clear feedback, audio, and the active/away state.
Every timer has a generation token or explicit cancellation path.

Attention is surface-aware:

- without Picture-in-Picture, active means the main document is visible and
  its window has focus;
- while Picture-in-Picture is open, active means the small window is visible
  and focused; hiding the opener alone does not pause the moved game;
- blur, visibility loss, small-window `pagehide`, and unmount immediately stop
  sound, pause/cancel timers, persist state, and add the CSS paused state;
- focus/visibility restoration resumes from the same canonical state without
  a welcome, reconnect, or catch-up transition.

Continuous ambient motion uses CSS only and is disabled by both the away state
and `prefers-reduced-motion`.

## 7. Interaction and accessibility

- Pieces are native buttons with at least 44 px effective hit targets.
- One selectable piece participates in the tab order. Arrow keys move focus to
  the nearest selectable piece in the requested spatial direction; Enter or
  Space selects it; blocked pieces are skipped.
- When a focused piece leaves the pile, focus moves to the nearest remaining
  selectable piece.
- The tray is an ordered status list with seven persistent slots and a polite
  live announcement for move, clear, and recovery outcomes.
- Kind remains identifiable through both the raster silhouette and an
  accessible name.
- Pointer entry and `focus-within` gather the loose desktop spread into the
  canonical shallow pile; pointer exit returns it to the authored spread.
  Coarse-pointer devices use the gathered projection while active. Reduced-
  motion mode switches projections without animated travel.
- At narrow widths the vignette moves to the lower center and may use most of
  the width, but it remains a freeform pile rather than turning into a grid.

## 8. Plant growth

`clearCount` is the only growth input and is never shown as a score. Visual
milestones are derived, not stored separately:

```text
0, 1, 3, 6, 10, 18, 30, 50, 80 clears
```

The first clear produces a sprout; early thresholds add obvious stems/leaves;
80 clears produces the mature silhouette. Later thresholds add a bounded set
of leaves or flowers at increasing intervals. The scene never labels a maximum
level.

The plant is composed from the generated transparent ceramic pot and compatible
stem/leaf elements so it can grow while retaining the supplied reference's
dimensional material. It is not a baked background or sketchy SVG. Motion is
decorative, paused while away, and removed under reduced motion.

## 9. Audio

No audio plays by default. After explicit opt-in, a small Web Audio helper
creates one short clear sound from a user gesture-enabled `AudioContext`.
There is no music or ambient loop. The helper tracks active nodes and stops or
suspends them immediately on away/dispose. Preference is stored with the
snapshot.

## 10. Document Picture-in-Picture

The research record is
`research/document-picture-in-picture.md`.

- Feature-detect `window.documentPictureInPicture`; render no entry when absent.
- Call `requestWindow({ width, height })` synchronously from the user's control
  activation because transient activation is required.
- Copy relevant style/link elements into the new document, then move the
  already-mounted playable DOM subtree into its body. Moving one subtree keeps
  one Vue instance and one canonical state.
- Leave the main-page anchor visually quiet while the game is in the small
  window.
- On the small window's `pagehide`, move the subtree back to its anchor,
  reconnect attention listeners, and restore a practical focus target.
- On rejection, keep the game in the main page and announce a short non-modal
  status.
- Production requires HTTPS for the enhancement; localhost remains sufficient
  for development.

## 11. Compatibility and migration

- The root page becomes the new experience; there is no alternate legacy
  route.
- The old `web-match3:progress` record is ignored rather than migrated into
  unrelated ambient state or destructively deleted.
- Existing useful global accessibility utilities are retained. The old candy
  PNGs are replaced by the reference-aligned four-kind asset set; unused legacy
  components, assets, rules, score/session storage, and tests are removed.
- `PRODUCT.md` and the frontend engine/UI/visual specs must be updated to match
  the new product contract so future work does not reintroduce a board-first
  swap game.

## 12. Failure and rollback behavior

- Invalid stored data → fresh playable scene.
- Storage read/write failure → in-memory play continues.
- Invalid selection → no state change.
- Picture-in-Picture rejection/closure → main-page scene remains/restores.
- Audio creation failure → remain silent without blocking clear feedback.
- Interrupted animation → stable canonical state remains usable.
- Unexpected engine failure → keep the last persisted stable state and expose a
  quiet inline recovery status; never show a game-over modal.

Rollback is a source rollback to the previous application. No server schema,
remote data, account data, or destructive local migration is involved.
