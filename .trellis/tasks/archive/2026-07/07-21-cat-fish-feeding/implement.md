# Feed fish to the cat — implementation plan

## Sequence

- [x] Add persisted feed state and typed engine feed results.
- [x] Implement per-species feed credits, short-group settling, and atomic level completion.
- [x] Extend canonical and legacy snapshot parsing with feed state.
- [x] Add direct controller feeding, status feedback, and pausable cat pose sequence.
- [x] Integrate drag-to-cat feeding and keyboard `F` labels into the game view.
- [x] Add engine, storage, controller, and presentation regressions.
- [x] Update executable frontend specs.
- [ ] Run consolidated verification only after all planned development tasks.

## Validation deferred by user

Do not run lint, type-check, tests, build, or browser QA during this task slice.
Run them once after all queued development tasks have been implemented.
