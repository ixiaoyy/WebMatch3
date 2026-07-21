# Cat companion visual foundation

## Goal

Introduce the orange felt cat as a calm desktop-scene companion and establish
the visual states needed by later feeding and reaction tasks.

## Requirements

- Use `../07-21-cat-companion-fish-feeding/research/cat-reference.png` as the
  primary reference: orange felt texture, rounded proportions, pink cheeks,
  glossy black eyes, stitched details, cream muzzle/belly, and friendly mood.
- Place the cat near the playable vignette without covering selectable fish,
  the seven-slot tray, plant feedback, quiet controls, or speech bubbles.
- Provide visually distinct base poses for idle, eating, belly-full, lying down,
  and sleeping with `ZZZ`; this task may use static placeholders for transitions.
- Preserve the ambient lavender lighting and soft grounded contact shadows.
- Keep the cat readable at desktop, tablet, and 320 px mobile widths.
- Do not add feeding logic, randomized reactions, sounds, or dialogue here.

## Acceptance Criteria

- [ ] The cat materially matches the supplied orange felt reference.
- [ ] Idle, eating, full, lying, and sleeping poses are visually distinguishable.
- [ ] The cat does not obscure or shrink the existing primary game controls.
- [ ] Layout has no horizontal scrolling at 320 px and remains clear at 1440×900.
- [ ] Reduced-motion mode can switch poses without relying on large animation.
- [ ] No game rules or persistence schema are changed in this child task.

## Dependency and Handoff

- Depends on the existing ambient desktop being stable.
- Must finish before `07-21-cat-fish-feeding` and `07-21-cat-reactions`.
- Deliver stable asset/state names for later tasks; do not start later children
  in the same run.
