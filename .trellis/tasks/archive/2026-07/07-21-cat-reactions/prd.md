# Cat search reactions and speech bubbles

## Goal

Make the cat feel like a lightweight desktop pet through search assistance,
expressions, short actions, and warm speech bubbles without competing click
semantics.

## Requirements

- Pointer click, touch activation, Enter, and Space request fish-search help
  when the cat is awake, not full, and a legal hidden target exists.
- Automatic low-frequency personality reactions occur while idle and never
  locate, reveal, or move toward hidden fish. Click/touch/keyboard activation is
  reserved for search help and does not select a random idle reaction.
- Personality reactions are also attached to looking, travelling, pointing at
  a target, being full, sleeping, and rejecting unavailable requests.
- After finding a target, the cat remains beside it in a guarding/pointing state
  until that fish enters the tray or is fed; it then returns to its home slot.
- While guarding, the cat's current position is the active feed drop target.
- Select a short non-repeating reaction appropriate to the current state:
  idle/curious, recently fed/pleased, belly-full, or sleeping.
- Include facial changes and small actions such as looking around, ear turns,
  tail flicks, travelling, pawing near the target, belly pats, sleepy turns, or
  brief yawns.
- Use concise Chinese bubbles (normally 2–10 characters) with restrained copy;
  examples may include `喵～`, `再来一条？`, `好饱呀`, and `呼噜…`.
- Sleeping reactions must remain sleepy and must not silently reset fullness.
- Bubbles dismiss automatically, never stack, and do not capture input.
- Throttle repeated activation so rapid clicking cannot create visual/audio spam.
- Avoid background prompts, reward loops, care penalties, or repeated attention
  seeking. Default remains silent.
- Pause automatic reaction scheduling while the active surface is away; do not
  queue missed reactions for playback on return.
- Reduced-motion mode uses instant pose/expression changes and still communicates
  the reaction text.

## Acceptance Criteria

- [ ] Mouse, touch, and keyboard activation each request the same search action
      and produce a state-appropriate reaction.
- [ ] Idle automatic reactions remain low-frequency, non-repeating when an
      alternative exists, and never reveal or approach a hidden fish.
- [ ] The cat keeps guarding the selected target until it is resolved, accepts
      feeding at that temporary position, and then returns home.
- [ ] Consecutive activations do not repeat the same eligible reaction when an
      alternative exists.
- [ ] Reactions respect idle, fed, full, and sleeping states.
- [ ] Only one brief bubble is visible at a time and it never blocks gameplay.
- [ ] Rapid clicking is throttled without losing keyboard focus.
- [ ] Away state pauses reaction timing; returning does not replay queued actions.
- [ ] Reduced-motion and screen-reader users receive equivalent state feedback.

## Dependency and Handoff

- Depends on `07-21-cat-companion-visual` and the state/events from
  `07-21-cat-fish-feeding`.
- Run separately; do not include integration cleanup beyond this feature surface.
