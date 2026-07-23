# Ambient Fish focused optimization roadmap

## Goal

Turn the submitted optimization proposal into an evidence-backed delivery
sequence that improves the pinned-tab and Picture-in-Picture experience without
rebuilding features that already exist or adding complexity without a measured
need.

## Background

- The product must remain quiet, tactile, immediately playable, locally
  resumable, keyboard accessible, and usable at 320 px width.
- `pnpm ci:web` passed on 2026-07-23: zero lint warnings, successful
  type-check, 7 test files / 66 tests, and a production PWA build.
- The detailed code and build audit is recorded in
  `research/proposal-audit.md`.

## Requirements

### R1 — Deliver the confirmed P0 compact-surface correction

The child task `07-23-compact-pip-resize` must make the existing mounted
surface usable in compact PiP sizes and coalesce projection updates during
continuous resizing. It must not regenerate or persist canonical fish
coordinates.

### R2 — Deliver the confirmed P1 spatial accessibility improvement

The child task `07-23-spatial-accessibility-labels` must add truthful layer and
overlap context to fish accessible names while preserving the rule that every
remaining fish is actionable.

### R3 — Do not duplicate existing capability

Do not create implementation work for PWA installation/offline precaching,
programmatic one-shot Web Audio, or deterministic complete-clear tests. These
are present and covered by the current build or tests.

### R4 — Require evidence before performance architecture changes

Do not introduce a spatial hash, debounced persistence, or a separate
`@ambient-fish/core` package in this roadmap. Reconsider only after profiling
identifies a user-visible budget violation or a real second runtime consumer
exists.

### R5 — Preserve the quiet product boundary

Do not add continuous ambient audio. Theme packs, additional generated assets,
cat eye tracking, magnetic drag behavior, and decorative particles remain
separate product-design candidates rather than hidden scope in these
reliability tasks.

## Acceptance Criteria

- [ ] AC1: Both child tasks have testable PRDs and reviewed technical plans.
- [ ] AC2: The compact PiP child is ordered before the accessibility child.
- [ ] AC3: Every accepted, deferred, and rejected proposal is traceable to
      inspected code, product text, tests, or build output.
- [ ] AC4: Neither child changes engine solvability, persisted snapshot schema,
      PWA configuration, or the default-muted one-shot sound contract.
- [ ] AC5: Each child passes its focused checks and one final `pnpm ci:web`.
- [ ] AC6: Final integration review confirms the same canonical game survives
      resize, PiP handoff, keyboard navigation, and screen-reader naming.

## Out of Scope

- Spatial hash or collision-engine replacement.
- Idle or delayed local-storage writes.
- New PWA/service-worker work.
- A second solver suite that duplicates the existing 64-seed complete-clear
  coverage.
- Engine workspace-package extraction.
- Continuous soundscape, theme packs, or new bitmap asset production.
