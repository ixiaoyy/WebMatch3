# Spotlight state and visual integration

## Goal

Persist only coherent pet state and finish the quiet responsive spotlight
composition before the separate final QA task.

## Requirements

- Persist a valid guarding target; safely default missing/corrupt targets home.
- Never persist light, afterglow, drag, timers, or temporary reactions.
- Keep the empty tray faint, controls subdued, and cat/plant always visible.
- Reproject the same state through resize and Document Picture-in-Picture.
- Update product, README, design QA, and executable UI/storage contracts.

## Acceptance Criteria

- [x] Reload restores game/feed/guard state or safely returns the cat home.
- [x] 320px through desktop layout has no intentional object/input overlap.
- [x] Away, reduced motion, and PiP preserve semantics without queued reactions.
- [x] Documentation describes the implemented spotlight interaction.

## Validation handoff

This development slice is archived before consolidated verification. The
following cat-companion integration task owns all tests, build, and browser QA.
