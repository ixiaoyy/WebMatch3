# Implementation checklist

## Phase 0 — Reproduction and scope lock

- [x] Read the task PRD/design and injected frontend contracts before changing code.
- [x] Start the current workspace in a clean isolated browser session; reproduce or disprove each recorded symptom against current source.
- [x] Build once through final CI, serve a fresh production preview, and verify the app shell, manifest, and generated Service Worker return 200.
- [x] For the menu and PiP source/runtime conflicts, identify the exact root cause and update `research/playtest-audit.md` before choosing a fix.
- [x] Confirm D1 with the user; match-aware cat search was approved on 2026-08-05.

## Phase 1 — P0 fish target correctness

- [x] Add deterministic failing fixtures for revealed collision groups, viewport edges, stable ordering and compact projected bounds.
- [x] Extract the reveal/fan layout into a pure UI projection with method-level contract comments.
- [x] Guarantee independent `44×44px` interaction cores while allowing larger felt bitmaps; clamp projected groups to the searchable safe region.
- [x] Lock pointer identity from pointerdown through tap/drag completion and prevent duplicate activation during animated repositioning.
- [x] Preserve hidden pointer transparency, focus retention, arrow navigation, Enter/Space, `F`, drag-to-cat and reduced-motion behavior.
- [ ] Run focused spotlight/game UI tests and browser-check desktop plus both narrow sizes before proceeding.

## Phase 2 — P1 menu lifecycle

- [ ] Add the smallest regression that reproduces the actual narrow-menu cause; do not add a second menu state.
- [x] Close and deactivate the menu synchronously for both actions and all input modes; make any leave node inert and a11y-hidden.
- [ ] Verify focus restoration, Escape/outside dismissal, PiP owner-document listeners and reduced motion.
- [ ] Browser-check `1280×720`, `320×568` and `320×240`; confirm no lingering menu/menuitem or scene-blocking hit box.

## Phase 3 — P1 keyboard empty-search feedback

- [x] Add a failing unit case for a no-target search miss and its controller-owned status behavior.
- [x] Add the UI-only miss event/status path and concise polite announcement; include method-level comments for new methods.
- [x] Prove the miss does not select, feed, persist, or announce on every arrow key.
- [x] Browser-check an empty miss with unchanged 36-piece field and empty tray; successful actions continue replacing status.

## Phase 4 — P1 PiP fallback

- [x] Add capability tests for absent namespace, non-callable `requestWindow`, rejected/pending request, successful move and restore.
- [x] Require a callable API and keep the control absent when unsupported.
- [x] Preserve the same mounted surface/session and expose opening/failure status without changing game state.
- [ ] Verify clean dev and production preview behavior, including Service Worker update behavior if it caused the mismatch.

## Phase 5 — P2 match-aware cat search

- [x] Add deterministic controller tests for two-in-tray, one-in-tray, zero-in-tray, distance ordering and existing fallback paths.
- [x] Rank only already legal, hidden candidates; preserve all refusal, travel, guard and return rules.
- [ ] Play the case with two matching tray fish and confirm the helper selects a legal matching species when available.

## Phase 6 — Combined regression and handoff

- [x] Complete real triples through the controller and observe the normal clear path.
- [x] Clear all 36 first-field fish and verify atomic arrival of the 42-fish field without a numeric level HUD.
- [x] Select four species in a `2/2/2/1` pattern, observe the seven-fish loss preview, and verify automatic 36-fish level-one restart with an empty tray.
- [ ] Verify drag and `F` feeding, feed-credit settlement, refresh-new-session semantics and sound preference persistence.
- [ ] Check mouse, coarse pointer/touch emulation, keyboard-only and reduced-motion paths at `1280×720`, `320×568`, `320×240` and `430×560`.
- [x] Verify no horizontal/vertical overflow at `320×568`, `430×560`, and `1280×720`; verify no stale menu/menuitem remains in the accessibility tree.
- [x] Run the smallest relevant focused suites, then run `pnpm ci:web` once on the final code state.
- [x] Review the complete diff against PRD acceptance criteria; update this checklist with evidence and leave unrelated working-tree files untouched.

## Definition of done

- All applicable PRD acceptance criteria are checked with reproducible evidence.
- No canonical engine coordinate, blocker, game rule, snapshot schema or database change was introduced without explicit evidence and approval.
- D1 is implemented with deterministic tests as approved by the user.
- User review and execution approval were received on 2026-08-05; remaining environment-only gaps are documented rather than overstated.
