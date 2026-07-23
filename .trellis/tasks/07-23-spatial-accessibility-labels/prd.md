# Spatial accessibility labels

## Goal

Let screen-reader and keyboard users understand each fish's stable depth and
overlap context while preserving concise species and action instructions.

## Background

- Fish currently expose a descriptive species name and keyboard actions.
- Their visual layer is present only as `data-layer`.
- The global live region announces game results.
- Current game rules intentionally allow every remaining fish to be selected;
  higher-layer overlap is visual context, not an unavailable state.

## Requirements

### R1 — Truthful spatial description

Each fish accessible name must include its one-based layer and whether zero,
one, or multiple higher-layer fish overlap it. Wording must describe overlap,
not say "blocked", "unavailable", or "uncovered".

### R2 — Dynamic accuracy

When an overlapping fish leaves the field, the lower fish name must update from
the current canonical pieces. No overlap description is persisted.

### R3 — Preserve species and action guidance

Keep the existing eight species names and Enter/Space/F guidance, including the
cat-resting variant. Avoid duplicating game-result text already owned by the
polite live region.

### R4 — Preserve actionability

All remaining fish keep the current semantic and keyboard action path
regardless of layer or overlap. No `disabled`, `aria-disabled`, tab order, or
selection-rule change may derive from overlap count.

### R5 — Keep wording in the UI layer

The engine may continue to expose blocker IDs as geometry metadata, but Chinese
accessible prose belongs to the UI projection and must not enter engine state
or snapshots.

## Acceptance Criteria

- [ ] AC1: A top piece announces its species, one-based layer, zero higher
      overlaps, and current actions.
- [ ] AC2: A lower piece with one or multiple higher overlaps announces the
      correct count without implying it cannot be selected.
- [ ] AC3: Removing an overlapping piece updates the lower piece's accessible
      name on the next render.
- [ ] AC4: Feedable and resting-cat action guidance remains correct.
- [ ] AC5: Pointer, Tab/arrow navigation, Enter/Space selection, and `F` feeding
      behavior are unchanged.
- [ ] AC6: Focused unit/component tests and one final `pnpm ci:web` pass.

## Out of Scope

- Game-rule or overlap-geometry changes.
- Spatial audio or verbose live announcements on pointer movement.
- Persisting accessibility projection fields.
- Reordering fish solely by visual depth.
