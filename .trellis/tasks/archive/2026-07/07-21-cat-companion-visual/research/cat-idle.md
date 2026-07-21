# Cat idle asset

## Status

Accepted as the first independent image micro-task.

## Execution

- Mode: built-in Image Generation
- Reference: `../07-21-cat-companion-fish-feeding/research/cat-reference.png`
- Chroma source: `generated/cat-idle-chroma.png`
- Runtime alpha asset:
  `apps/web/src/features/game/ui/assets/cat/cat-idle.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: production game character cutout, idle pose only
Input image: Image 1 is the identity, material, proportions, and craft-style reference; do not copy its lavender background.
Primary request: Create exactly one full-body orange handmade felt cat companion in a calm neutral idle standing pose, facing mostly forward with a slight three-quarter turn, both front paws relaxed at its sides, friendly closed-mouth expression.
Subject identity: preserve the reference cat's round oversized head, compact rounded body, short legs, curved striped tail, orange felt, cream muzzle and oval belly, cream paw tips, pink inner ears and cheeks, glossy black bead eyes, tiny brown stitched nose and mouth, subtle orange forehead and cheek stripes, visible hand stitching and fine fuzzy felt fibers.
Composition: one character only, centered, entire ears, paws, and tail visible, generous even padding, consistent upright proportions suitable for later pose variants.
Lighting: soft cool upper-left studio light compatible with a pale lavender browser scene; dimensional but restrained.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: crisp complete silhouette; no cast shadow, no contact shadow, no reflection; no fish, food, plant, tray, furniture, props, speech bubble, ZZZ, words, letters, watermark, border, or additional character; do not use #00ff00 anywhere in the cat.
```

## Validation

- Output: RGBA, 1254 × 1254.
- Alpha subject bounds: `(307, 125)–(1031, 1109)`.
- Transparent margins: left 307, top 125, right 223, bottom 145 px.
- Partially transparent edge pixels: 4,758.
- Green-dominant nontransparent spill pixels: 0.
- Visual inspection: complete ears, whiskers, paws, and tail; identity, felt
  texture, stitched seams, bead eyes, and color blocking match the reference.
