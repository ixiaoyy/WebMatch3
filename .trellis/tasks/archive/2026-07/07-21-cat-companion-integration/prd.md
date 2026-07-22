# Cat companion integration and QA

## Goal

Integrate the completed cat features with persistence, away-state behavior,
responsive layout, accessibility, reduced motion, and Document Picture-in-
Picture without regressing the ambient matching game.

## Requirements

- Reconcile the canonical snapshot schema for feed count, fullness/sleep pose,
  and any reaction state that must survive surface movement or reload.
- Migrate or safely default older saved states; corrupt pet data must not block
  loading a playable game.
- Keep one canonical state when the game moves between the opener and supported
  Document Picture-in-Picture.
- Pause animation, speech-bubble timing, and sound when the active surface is
  away; do not count hidden time toward hunger or wake-up behavior.
- Verify pointer, touch, keyboard, screen-reader announcements, focus visibility,
  contrast, reduced motion, and 320 px responsive behavior.
- Verify spotlight search equivalence: pointer tracking, touch press-and-drag,
  keyboard-controlled light movement, and a non-visual direct semantic path for
  screen-reader users.
- Verify that cat placement and bubbles do not interfere with pile occlusion,
  tray recovery, plant growth, settings, or Picture-in-Picture controls.
- Keep default audio muted and introduce no notification or background system.

## Acceptance Criteria

- [x] Old, current, and corrupt snapshots each load into a valid playable state.
- [x] Feed count and full/sleep state survive reload and Picture-in-Picture moves.
- [x] Away state freezes pet behavior with no queued burst on return.
- [x] Pointer, touch, keyboard, and assistive-technology paths can feed and react.
- [x] The complete interface remains usable without horizontal scrolling at
      320 px and retains the intended composition at 1440×900.
- [x] Reduced-motion mode preserves all functional and textual feedback.
- [x] Existing matching, recovery, persistence, plant, settings, and browser-
      capability tests remain green after the final integration.

## Dependency and Handoff

- Runs only after the visual, feeding, and reaction child tasks are complete.
- This is the final consolidation task, not permission to reimplement all prior
  children in one run.

## Final verification

- Focused engine, storage, controller, spotlight, and Picture-in-Picture tests
  passed before the consolidated check.
- Interactive browser QA covered the four required viewport sizes, pointer
  reveal, cat search, keyboard feeding, full/sleep persistence, semantic status
  feedback, request-rejection fallback, reduced-motion CSS presence, and a
  clean console.
- The browser could not emulate a reduced-motion operating-system preference or
  open a real Document Picture-in-Picture surface. Those paths are covered by
  motion-independent controller behavior, compiled CSS inspection, and the
  dedicated Picture-in-Picture unit regressions.
