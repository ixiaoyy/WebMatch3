# Blue whale felt fish asset

## Goal

Create the first standalone runtime fish asset: the blue felt whale from the
shared eight-fish reference. Stop after this one asset is saved.

## Requirements

- Before generating, search runtime assets, active and archived task research,
  and project temporary output for an existing whale asset. Reuse it if it
  already satisfies this task.
- Use `../07-21-cat-companion-fish-feeding/research/fish-reference.png` as the
  style and identity reference, focusing only on the upper-left blue whale.
- Preserve its rounded blue felt body, cream ribbed belly, stitched seams,
  glossy black bead eye, pink cheek, side fins, split tail, and water spout.
- Render one centered side-view whale facing left on a flat removable green
  chroma-key background, with no other fish, props, text, floor, reflection,
  contact shadow, or scene background.
- Save the final alpha PNG as
  `apps/web/src/features/game/ui/assets/fish/fish-whale.png`.
- Save the final prompt under this task's `research/` directory.
- Do not generate another fish or modify application code in this task.

## Acceptance Criteria

- [ ] One transparent blue whale asset exists at the stable runtime path.
- [ ] The whale remains recognizable as the reference character at game-piece
      scale and has no baked background or unrelated object.
- [ ] The prompt record exists, and no other fish or runtime code is changed.

## Handoff

Return to the parent task after saving this asset. Create the next fish as a
separate child task rather than continuing in this run.
