# Koi felt fish asset

## Goal

Create only the white-and-red koi felt fish runtime asset and its prompt record.

## Requirements

- The pre-generation search must cover runtime assets, active and archived task
  research, and project temporary output. Reuse a suitable existing koi asset
  if one already exists.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the upper-right koi.
- Preserve its rounded cream-white felt body, irregular warm-red patches,
  visible stitched seams, glossy black bead eye, pink cheek, small fins, and
  broad split fan tail.
- Render one centered side-view koi facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-koi.png`.
- Save the final prompt and generation record under this task's `research/`
  directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent white-and-red koi asset exists at the stable runtime path.
- [ ] The koi remains recognizable as the reference character at game-piece
      scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. Create the sardine as a
separate child task rather than continuing in this run.
