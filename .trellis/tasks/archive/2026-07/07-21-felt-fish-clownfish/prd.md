# Clownfish felt fish asset

## Goal

Create only the orange clownfish felt runtime asset and its prompt record.

## Requirements

- The pre-generation search must cover runtime assets, active and archived task
  research, and project temporary output. Reuse a suitable existing clownfish
  asset if one already exists.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the bottom-left clownfish.
- Preserve its rounded orange felt body, three cream-white vertical bands,
  visible stitched seams, glossy black bead eye, pink cheek, and compact orange
  fins and fan tail with dark charcoal edging.
- Render one centered side-view clownfish facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-clownfish.png`.
- Save the final prompt and generation record under this task's `research/`
  directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent orange clownfish asset exists at the stable runtime path.
- [ ] The clownfish remains recognizable as the reference character at
      game-piece scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. Create the angelfish as a
separate child task rather than continuing in this run.
