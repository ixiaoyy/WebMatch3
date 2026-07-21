# Betta felt fish asset

## Goal

Create only the lavender betta felt runtime asset and its prompt record.

## Requirements

- The pre-generation search must cover runtime assets, active and archived task
  research, and project temporary output. Reuse a suitable existing betta fish
  asset if one already exists.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the bottom-right betta fish.
- Preserve its lavender felt body, subtle stitched scales, glossy black bead
  eye, pink cheek, and large layered purple-and-blue flowing fins and fan tail.
- Render one centered side-view betta fish facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-betta.png`.
- Save the final prompt and generation record under this task's `research/`
  directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent lavender, purple, and blue betta fish asset exists at the
      stable runtime path.
- [ ] The betta fish remains recognizable as the reference character at
      game-piece scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. The next slice may begin the
shared kind-registry integration, but it must run as a separate task.
