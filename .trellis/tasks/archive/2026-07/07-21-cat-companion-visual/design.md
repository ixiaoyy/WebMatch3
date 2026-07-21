# Cat companion visual foundation — design

## Boundary

This child task adds only the orange felt cat's visual foundation. It does not
change game rules, persistence, feeding, reactions, dialogue, or sound.

## Asset contract

Each pose is produced as an independent micro-task:

1. `cat-idle.png` — standing, friendly, calm neutral pose.
2. `cat-eating.png` — eating pose, no fish baked into the asset.
3. `cat-full.png` — standing or seated while holding its belly.
4. `cat-lying.png` — resting on its side or belly, awake.
5. `cat-sleeping.png` — lying asleep; `ZZZ` remains code-rendered so it can be
   localized and hidden accessibly.

One generation call creates one pose only. Every pose is converted to alpha
independently and saved before the next pose begins. Existing poses are never
regenerated as part of another pose's work.

All poses use the parent task's `research/cat-reference.png` as a style and
identity reference: orange handmade felt, cream muzzle and belly, pink cheeks,
glossy black bead eyes, stitched seams, rounded proportions, and cool lavender
scene lighting. Runtime files have transparent backgrounds, consistent scale,
tight but safe margins, no text, no props, and no baked contact shadow.

## UI contract

`CatCompanion.vue` owns the visual slot and accepts a stable visual-state prop.
The first implementation may wire only `idle`; later pose micro-tasks extend
the same asset registry without changing layout ownership. The cat sits near
the lower-right vignette, behind primary controls and outside the pile/tray hit
areas. It is decorative in this child task and cannot receive focus.

At narrow widths it scales and shifts without reducing existing 44 px targets
or introducing horizontal overflow. Pose changes are opacity/transform state
changes and become instant under reduced motion.
