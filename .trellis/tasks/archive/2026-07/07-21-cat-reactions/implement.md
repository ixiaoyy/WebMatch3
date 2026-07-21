# Cat reactions and speech bubbles — implementation plan

## Sequence

- [x] Add typed, state-specific, non-repeating reaction pools.
- [x] Add throttled search, travelling, guarding, and target-resolution state.
- [x] Add low-frequency automatic idle reactions and away-safe bubble timing.
- [x] Reserve cat activation for search; add pointer/touch drag-to-cat feeding and keyboard `F` equivalence.
- [x] Render one pointer-transparent bubble and restrained CSS motion tokens.
- [x] Keep the guarding cat beside its target and return it when resolved.
- [x] Add pure reaction and controller regression cases.
- [x] Update executable frontend specs.
- [ ] Run consolidated verification only after all planned development tasks.

## Validation deferred by user

Do not run lint, type-check, tests, build, or browser QA during this task slice.
Run them once after all queued development tasks have been implemented.
