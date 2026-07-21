# Spotlight cat collaboration

## Goal

Connect hidden-fish search, guarding, reactions, and direct drag-to-cat feeding
without competing click semantics.

## Requirements

- Cat activation only requests a legal hidden target and never feeds.
- The cat looks, travels, guards, and returns when the target resolves.
- Mouse/touch feeding requires a valid drop on the cat's current bounds.
- Focused fish use `F` for the equivalent feed transition; Enter/Space selects.
- Full/resting cats reject search and feeding with accessible feedback.
- Automatic reactions stay low-frequency, non-locating, and away-safe.

## Acceptance Criteria

- [ ] Click/touch/keyboard cat activation produces the same search request.
- [ ] Guarding never reveals or resolves the target automatically.
- [ ] Valid drops feed; invalid drops restore; plant progress never changes.
- [ ] Guard position becomes the live drop target and target resolution returns home.
- [ ] Bubbles are non-stacking, non-repeating, throttled, and pointer-transparent.

## Validation handoff

Implementation is archived when this slice is complete. Consolidated checks
remain owned by final integration.
