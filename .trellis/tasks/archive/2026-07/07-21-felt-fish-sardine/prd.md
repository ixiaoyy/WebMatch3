# Sardine felt fish asset

## Goal

Create only the slender blue sardine felt fish runtime asset and its prompt record.

## Requirements

- The pre-generation search must cover runtime assets, active and archived task
  research, and project temporary output. Reuse a suitable existing sardine
  asset if one already exists.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the middle-left sardine.
- Preserve its long blue felt body, cream face and belly, dark spotted flank,
  visible stitched seams, glossy black bead eye, pink cheek, small fins, and
  narrow split tail.
- Render one centered side-view sardine facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-sardine.png`.
- Save the final prompt and generation record under this task's `research/`
  directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent blue sardine asset exists at the stable runtime path.
- [ ] The sardine remains recognizable as the reference character at game-piece
      scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. Create the pufferfish as a
separate child task rather than continuing in this run.
