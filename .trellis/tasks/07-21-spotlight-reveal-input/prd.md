# Spotlight reveal and input

## Goal

Hide fish by default and reveal only a local area through equivalent mouse,
touch, keyboard, and assistive-technology paths.

## Requirements

- Expand the fish field across the active surface without moving canonical fish.
- Mouse movement, touch search, keyboard arrows, and touch afterglow control one UI-local light.
- Only revealed fish receive pointer hits; dragged/focused fish remain visible.
- Enter/Space selects a revealed fish; Tab and screen readers retain a direct semantic path.
- Away state clears transient light state; reduced motion removes interpolation only.

## Acceptance Criteria

- [ ] Fish are not visually identifiable before search.
- [ ] Pointer, touch, keyboard, and semantic users can discover and select legal fish.
- [ ] Hidden fish cannot intercept pointer input and blocked fish remain unavailable.
- [ ] Light coordinates, afterglow, and drag motion never enter snapshots.

## Validation handoff

Implementation is archived when this slice is complete. Consolidated tests and
browser QA run only in the final integration task.
