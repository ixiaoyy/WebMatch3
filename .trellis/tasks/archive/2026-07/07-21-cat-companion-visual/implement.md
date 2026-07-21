# Cat companion visual foundation — implementation plan

## Ordered micro-tasks

- [x] Generate and extract `cat-idle.png` as one image task.
- [x] Generate and extract `cat-eating.png` as one image task.
- [x] Generate and extract `cat-full.png` as one image task.
- [x] Generate and extract `cat-lying.png` as one image task.
- [x] Generate and extract `cat-sleeping.png` as one image task.
- [x] Add the stable pose registry and `CatCompanion.vue` after the required
      assets exist; do not regenerate accepted images during UI work.
- [ ] Integrate the cat into `GameView.vue`.
- [ ] After all implementation work is complete, perform one final manual
      verification against the PRD.

## Current execution slice

Only the first unchecked implementation micro-task is in scope for the current
run.

## Rollback

Generated candidates stay outside runtime imports until accepted. Removing one
unreferenced candidate fully rolls back that micro-task without touching code
or another pose.
