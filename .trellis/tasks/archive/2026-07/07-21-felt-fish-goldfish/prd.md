# Goldfish felt fish asset

## Goal

Create only the orange-and-cream goldfish felt runtime asset and its prompt record.

## Requirements

- The pre-generation search must cover runtime assets, active and archived task
  research, and project temporary output. Reuse a suitable existing goldfish
  asset if one already exists.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the middle-right goldfish.
- Preserve its rounded cream felt body, bright orange head and back patches,
  visible stitched seams, glossy black bead eye, pink cheek, layered orange
  fins, and long flowing cream-and-orange split tail.
- Render one centered side-view goldfish facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-goldfish.png`.
- Save the final prompt and generation record under this task's `research/`
  directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent orange-and-cream goldfish asset exists at the stable
      runtime path.
- [ ] The goldfish remains recognizable as the reference character at
      game-piece scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. Create the clownfish as a
separate child task rather than continuing in this run.
