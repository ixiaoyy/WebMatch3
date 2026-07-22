# Ambient tab jelly desktop — implementation plan

## Scope

Package: `apps/web`

This is a complete root-product replacement. Work stays within the existing
Vue/Vite package and uses no new runtime dependency.

## Ordered implementation

### 1. Align product and browser shell

- Update `PRODUCT.md` to replace the classic session Match-3 framing with the
  ambient pinned-tab product contract.
- Update `apps/web/index.html` with the `果冻` title, accurate description, and
  generated lime-jelly favicon.
- Replace global tokens and document styling with the rain-washed windowsill
  palette, semantic focus/away/reduced-motion rules, and Picture-in-Picture
  document defaults.

Rollback point: browser metadata and tokens can be reverted independently
before feature logic lands.

### 2. Produce and validate the reference-aligned visual assets

- Use the supplied `research/visual-reference.png` as the Image Generation
  reference.
- Produce a responsive lavender wall/table wallpaper with the left foliage
  shadow but no game pieces, plant, browser chrome, text, or controls.
- Produce a coherent transparent four-jelly set: aqua orb, amber drop, lime
  leaf, and rose heart. Match the reference's translucent glass/resin material
  while preserving four distinct silhouettes.
- Produce a compatible transparent ceramic pot and modular stem/leaf elements
  for staged growth.
- Normalize and validate alpha, transparent margins, dimensions, visual
  consistency, and small-size favicon legibility before UI integration.
- Record prompts and source-to-output decisions under the task research
  directory; do not keep regenerating accepted assets during UI work.

Rollback point: keep generated candidates outside runtime imports until the
selected set passes asset validation.

### 3. Replace the legacy game engine

- Remove grid/swap/match/cascade/shuffle modules and their grid-specific tests.
- Add immutable ambient state, freeform pile templates, explicit randomness,
  geometric blocker calculation, generation, selection, three-kind clear,
  replenishment, quick-match enforcement, and automatic full-tray recovery.
- Keep all rule consumers behind `@/features/game/engine`.
- Add deterministic unit tests for:
  - unique IDs, four kinds, 16–20 irregular pieces, and shallow layers;
  - no grid-like coordinate contract;
  - meaningful higher-layer blocking and immediate reveal;
  - blocked/missing selection immutability;
  - tray order, automatic triples, replacement pieces, and `clearCount`;
  - seven-slot unmatched state and two-piece automatic recovery;
  - quick-match availability after generation, clearing, and recovery;
  - invalid random values and input-state immutability.

Rollback point: finish and test the pure engine before connecting Vue.

### 4. Replace session persistence

- Remove player, scoring, leaderboard, history, and completed-round storage.
- Add a versioned ambient snapshot, strict `unknown` validation, safe default
  storage acquisition, load/save boundaries, and preference persistence.
- Use the new `web-match3:ambient-state` key and leave the legacy key unread.
- Add tests for round-trip, malformed JSON/schema, invalid geometry/IDs/kinds,
  blocked/quota storage, tray bounds, counter bounds, and fresh-state fallback.

Rollback point: persistence can be disabled by injecting `null` while keeping
the pure engine playable.

### 5. Build controller and lifecycle services

- Add the Vue controller for canonical state, stable persistence, ephemeral
  feedback, spatial keyboard focus, recovery timing, and disposal tokens.
- Add attention tracking across main and Picture-in-Picture windows.
- Add the default-muted, opt-in one-shot sound helper.
- Add the progressive Document Picture-in-Picture service that moves one
  mounted subtree and returns it on `pagehide`.
- Unit-test controller selection, persistence frequency, away/resume behavior,
  timer cancellation/restart, reduced motion, focus repair, storage failure,
  and sound gating with injected fakes.

Rollback point: keep the game in the main document if the Picture-in-Picture
service is not connected or supported.

### 6. Replace the public UI

- Rebuild `GameView.vue` as the full-viewport quiet scene.
- Add the freeform layered `JellyCluster`, native-button `JellyPiece`,
  seven-slot `JellyTray`, code-native `GrowingPlant`, and `QuietControls`.
- Integrate the accepted wallpaper, plant layers, and aqua/amber/lime/rose
  jelly assets; remove legacy assets only after import searches show no
  consumer.
- Remove old HUD, instructions, dialogs, result, leaderboard, grid, and player
  components.
- Implement idle/engaged/away states, including desktop-spread idle positions,
  pointer/focus gathering into the canonical shallow pile, pointer-exit
  scattering, and a coarse-pointer gathered fallback. Also implement blocked-
  piece cues, clear/recovery feedback, plant milestones, accessible live
  status, and the responsive lower-center fallback.
- Ensure the main-page anchor remains calm while the mounted surface is in the
  small window.

### 7. Remove dead legacy code and update contracts

- Search all imports before deleting legacy controller/UI/session/engine files.
- Remove unused files and obsolete tests without retaining a hidden classic
  route.
- Rewrite the frontend game engine, game UI, and visual design specs around the
  ambient pile contracts; update index descriptions and checklists.
- Keep directory and toolchain contracts intact unless implementation evidence
  requires a narrow correction.

### 8. Verification

Run focused checks first:

```powershell
pnpm --dir apps/web test -- ambient-game
pnpm --dir apps/web test -- storage
pnpm --dir apps/web test -- ambient-controller
```

Then run the repository-required package check once:

```powershell
pnpm ci:web
```

Browser verification on the production preview:

- `320×568`, `390×844`, `768×1024`, and `1440×900`;
- no horizontal overflow and no grid-like layout at any viewport;
- desktop pointer entry gathers the jellies, pointer exit restores the scatter,
  keyboard focus gathers them, and coarse-pointer play does not require hover;
- pointer, touch-sized controls, roving keyboard focus, Enter/Space selection;
- blocked pieces cannot be activated and become available after blockers move;
- immediate three-kind clear and plant growth;
- full tray auto-recovers after the foreground delay without failure;
- reload restores exact pile, tray, plant, and sound preference;
- hide/blur pauses motion and sound and consumes no recovery time;
- reduced-motion retains every semantic state;
- Picture-in-Picture opens only from user activation when supported, keeps the
  same state, survives opener-tab hiding, and returns the subtree on close;
- unsupported/rejected Picture-in-Picture has a clean fallback;
- console has no Vue warnings or uncaught errors.

Capture final screenshots at the four required viewports and inspect the
freeform pile, lower-right hierarchy, reference fidelity, focus/blocked
contrast, tray legibility, and plant stages.

## Risk notes

- Moving a Vue-owned DOM subtree between documents must be verified in both dev
  and production builds; never mount a second controller as a shortcut.
- Browser clamping means Picture-in-Picture width/height are hints, so the
  surface must respond to the actual small-window viewport.
- The pile must use authored irregular templates and jitter. A rectangular
  array with hidden borders still violates the product requirement.
- Do not let replenishment indefinitely cover the same lower pieces; tests and
  manual play should confirm blockers cycle out.
- Do not retain hidden score, failure, round, or leaderboard state in the new
  controller.

## Review gate

Do not run `task.py start` or edit application code until the user reviews and
approves `prd.md`, `design.md`, and this implementation plan.
