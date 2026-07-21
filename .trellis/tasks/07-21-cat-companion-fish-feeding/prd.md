# Cat companion and fish feeding

## Goal

Add a playful but calm desktop-pet loop to the ambient matching game: fish that
are difficult to clear may be fed directly to an orange cat, and the cat reacts
like a small desktop companion without turning the experience into a task or
timer system.

## Confirmed Facts

- The current public game is a persistent, freeform tray-matching experience in
  `apps/web/src/features/game`; it has a seven-slot tray, finite pile generation,
  same-origin persistence, away-state pausing, and reduced-motion behavior.
- The fish visual reference is
  `research/fish-reference.png`: soft handmade felt, visible stitching, rounded
  silhouettes, black bead eyes, and varied species/colors.
- The cat visual reference is
  `research/cat-reference.png`: an orange felt cat with rounded proportions,
  pink cheeks, glossy black eyes, and a friendly expression.
- This planning task does not authorize implementation.

## Requirements

### R1 — Feed difficult fish

- A currently selectable fish may be fed directly to the cat instead of moving
  into the matching tray.
- Feeding is a limited recovery choice, not an automatic hint or forced action.
- Pointer, touch, and keyboard users must all have an understandable way to
  feed a fish; drag-and-drop cannot be the only input path.
- A fed fish leaves the pile without entering the tray. Engine rules must keep
  the remaining pile completable and must not create an impossible remainder.

### R2 — Three-fish fullness cycle

- The cat may eat at most three fish in one pile/level cycle.
- The first and second fish produce progressively pleased eating reactions.
- After the third fish, the cat holds its belly, shows that it is full, lies
  down, and displays a restrained `ZZZ` sleep state.
- A full or sleeping cat cannot accept another fish.
- Default reset rule: the cat wakes and its capacity resets when the next pile
  is generated. No real-time cooldown or hidden-tab timer is introduced.

### R3 — Desktop-pet personality

- The cat remains a quiet part of the desktop composition rather than a modal,
  tutorial mascot, or progression gate.
- Clicking or activating the cat may trigger short expressions, poses, and
  concise speech bubbles.
- Reactions must be varied but non-blocking; they must not interrupt matching,
  steal keyboard focus, or repeatedly demand attention.
- Speech bubbles use short, warm copy and disappear without requiring dismissal.

### R4 — Calm product constraints

- Preserve exact game and cat state across reloads and supported Picture-in-
  Picture movement.
- Pause pet animation and reaction timing while the active game surface is
  away; do not accumulate hunger, sleep, rewards, or penalties in the background.
- Respect reduced motion and avoid continuous meowing, music, notifications,
  streaks, currencies, daily chores, or care penalties.
- Preserve mobile layout, keyboard access, visible focus, and screen-reader
  status for feeding/fullness feedback.

## Delivery Split

Implement only one child task at a time, in this order:

1. `07-21-cat-companion-visual` — cat asset, placement, and base visual states.
2. `07-21-felt-fish-assets` — integrate all
   eight production-ready felt fish assets and playable kinds.
3. `07-21-rename-jelly-domain-to-fish` — audit and migrate active code, files,
   styles, tests, persistence boundaries, copy, and live docs to canonical Fish semantics.
4. `07-21-cat-fish-feeding` — feed interaction and three-fish state machine.
5. `07-21-cat-reactions` — click expressions, actions, and speech bubbles.
6. `07-21-cat-companion-integration` — persistence, accessibility, responsive
   behavior, reduced motion, Picture-in-Picture, and regression coverage.

Do not start the parent as one monolithic implementation run.

## Out of Scope

- Accounts, virtual currency, purchasable food, health meters, care penalties,
  daily missions, notifications, or background/offline progression.
- An operating-system desktop pet, browser extension, or native overlay.
- More pets, pet customization, breeding, inventory, or long-form dialogue.
- Reworking unrelated plant progression or the complete visual direction of the
  ambient desktop.

## Acceptance Criteria

- [ ] A selectable hard-to-match fish can be fed to the cat without entering
      the tray, using pointer/touch and keyboard-accessible controls.
- [ ] Feeding never leaves the finite pile mathematically impossible to finish.
- [ ] The cat visibly distinguishes 0, 1, 2, and 3 consumed-fish states.
- [ ] On the third fish the cat holds its belly, lies down, and shows `ZZZ`.
- [ ] A sleeping cat rejects further feeding and resets only with the next pile.
- [ ] Activating the cat produces brief varied expressions/actions/bubbles
      without blocking the game.
- [ ] Cat and fish visuals materially follow the supplied felt references.
- [ ] Reload, away-state, reduced-motion, responsive, keyboard, and supported
      Picture-in-Picture behavior preserve the existing product contracts.
- [ ] The six child tasks remain independently startable and verifiable.

## Planning Gate

Do not run `task.py start` or modify application code until the user explicitly
chooses a child task and asks to begin development.
