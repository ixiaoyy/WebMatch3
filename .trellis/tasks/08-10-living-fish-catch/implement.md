# 鱼群寻物与分波通关 — Implementation Plan

## Phase 1 — engine contract

- [x] Add level goals and per-level progress to canonical state.
- [x] Replace triple-only piled generation with first-level triples and later unique-triple waves.
- [x] Replace random pile geometry with authored, non-overlapping school points and restrained rotation.
- [x] Make combination refresh/advance and soft loss restart pure and deterministic.

## Phase 2 — presentation and interaction

- [x] Keep all fish visible and remove overlap/fanning behavior from the active UI path.
- [x] Preserve the selected reference composition: S-curve fish field, generous whitespace, right-side vignette, quiet tray.
- [x] Hold the outgoing field until catch/merge/feed completes, then reveal the next wave.
- [x] Update intro, level, accessibility, companion and live-region copy for the new find-the-only-triple rules.
- [x] Replace cat search/guard interaction with pet/play companion actions.
- [x] Add one bounded yarn-and-pounce animation with compact and reduced-motion behavior.
- [x] Remove active cat target/travel state while retaining v4 snapshot compatibility.
- [x] Replace the two-step cat menu with direct cat-body and yarn native controls.
- [x] Add head/belly/paws pet zones, three rotating yarn-play variants, and low-frequency curious motion.
- [x] Re-anchor reaction copy inside the visible cat canvas and preserve static reduced-motion feedback.

## Phase 3 — compatibility and verification

- [x] Update storage parsing for `levelProgress` and legacy v4 boards.
- [x] Update engine, controller, UI and storage tests.
- [x] Run focused tests, lint, type-check and build.
- [x] Test the first level and one later-wave refresh in the browser at desktop and compact sizes.
- [x] Compare the rendered desktop state against the selected fusion image and record QA without modifying user-owned QA artifacts.
- [x] Stage production code only; keep task docs, tests and QA evidence unstaged unless explicitly approved.
- [x] Verify direct pet/play interaction at desktop and compact sizes, including keyboard and repeated activation.

## Validation commands

```powershell
pnpm --dir apps/web test -- ambient-game.test.ts ambient-controller.test.ts ambient-storage.test.ts game-ui.test.ts
pnpm lint:web
pnpm typecheck:web
pnpm build:web
pnpm ci:web
```
