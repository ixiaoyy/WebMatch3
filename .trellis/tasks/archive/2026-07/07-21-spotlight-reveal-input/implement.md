# Spotlight reveal/input — implementation

- [x] Replace gather/scatter with a full-surface stable field.
- [x] Add local reveal derivation and hidden pointer-hit gating.
- [x] Add mouse, touch/afterglow, keyboard light, and semantic selection paths.
- [x] Clear transient search state on away/unmount.
- [x] Add focused input/projection regression cases and update UI specs.
- [x] Defer execution of validation commands to final integration.

Implementation completed on 2026-07-21. Regression cases were written but not
executed; consolidated tests and browser QA remain owned by the final
integration task.
