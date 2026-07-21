# Feed fish to the cat

## Goal

Let a player remove up to three difficult selectable fish from the active pile
by feeding them to the cat, while keeping the finite matching puzzle completable.

## Requirements

- Treat the supplied felt fish artwork in
  `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  presentation reference; the canonical engine model uses the eight-species
  `FishKind` registry.
- Only currently selectable/unblocked pile pieces may be fed.
- Provide direct pointer/touch feeding plus a keyboard-accessible equivalent;
  dragging alone is insufficient.
- A fed piece is removed from the pile and never enters the tray.
- Feeding does not increment `clearCount` or plant growth. Matching three fish
  remains the sole plant-growth path; feeding advances only cat fullness/pose
  while still removing the fish for pile-completion purposes.
- Track a per-pile count from 0 to 3. Fish 1 and 2 trigger eating feedback; fish
  3 transitions the cat through belly-full to lying/sleeping with `ZZZ`.
- Reject feeding while the cat is sleeping and expose the reason accessibly.
- Reset capacity only when the next pile is generated; away time does not reset it.
- Extend generation/completion/recovery rules so arbitrary allowed feeds cannot
  strand non-matching remainders or make level completion impossible.
- Persist the feed count and cat state alongside the canonical game snapshot.
- Do not add click-only personality reactions or dialogue in this task.

## Acceptance Criteria

- [ ] A selectable fish can be fed instead of added to the tray.
- [ ] Feeding changes cat state and pile completion but never `clearCount` or
      plant growth; a three-fish tray clear remains the only plant-growth event.
- [ ] Blocked fish cannot be fed through pointer, touch, or keyboard paths.
- [ ] Exactly three fish may be fed per pile; a fourth attempt is rejected.
- [ ] The third fish produces full, lie-down, and `ZZZ` feedback.
- [ ] Reloading after 0–3 feeds restores the same capacity and pose.
- [ ] Hiding the active surface freezes transitions and does not reset capacity.
- [ ] Generated and partially played piles remain completable after each allowed
      feed sequence, with focused engine tests covering edge cases.
- [ ] Existing tray matching and soft full-tray recovery continue to work.

## Dependency and Handoff

- Depends on `07-21-cat-companion-visual` and `07-21-felt-fish-assets`.
- Must expose stable feeding events and state for `07-21-cat-reactions` and
  `07-21-cat-companion-integration`.
- Run as a separate implementation task.
