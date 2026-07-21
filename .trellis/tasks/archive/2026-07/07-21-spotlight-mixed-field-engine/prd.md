# Spotlight mixed field engine

## Goal

Generate one stable full-field mix of scattered fish and local piles with
viewport-independent blocker relationships.

## Requirements

- New levels use one canonical normalized position; attention never moves fish.
- Every level contains scattered pieces and overlapping local groups.
- New pieces store explicit blocker IDs; removed blockers reveal immediately.
- Old snapshots without blocker IDs remain playable through the legacy geometry fallback.
- Preserve triples, finite completion, recovery, deterministic generation, and level caps.

## Acceptance Criteria

- [ ] Generated positions are stable and unique through the 60-piece cap.
- [ ] Explicit blockers match the generated local piles and preserve a complete solution.
- [ ] Old canonical and legacy snapshots still load without losing progress.
- [ ] No Vue, DOM, spotlight, cat, or reaction behavior enters the engine.

## Validation handoff

Implementation is archived when this slice is complete. Consolidated tests and
build run only in the final integration task, per user direction.
