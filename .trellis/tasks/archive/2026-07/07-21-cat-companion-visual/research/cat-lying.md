# Cat lying asset

## Status

Accepted as the fourth independent image micro-task.

## Execution

- Mode: built-in Image Generation
- References:
  - `../07-21-cat-companion-fish-feeding/research/cat-reference.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-idle.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-full.png`
- Chroma source: `generated/cat-lying-chroma.png`
- Runtime alpha asset:
  `apps/web/src/features/game/ui/assets/cat/cat-lying.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: production game character cutout, awake lying pose only
Input images: Image 1 is the original identity and handmade felt material reference. Image 2 is the accepted production idle asset and is the strict reference for identity, palette, facial construction, lighting, stitching, and material. Image 3 confirms the same character's seated body construction.
Primary request: Create exactly one full-body version of the same orange felt cat lying comfortably on its belly in a horizontal resting pose while clearly awake. The cat's head and chest are lifted, both glossy black bead eyes are fully open, the ears are upright, the face has a calm small closed smile, the two cream front paws are crossed neatly in front, the hindquarters rest to one side, and the striped tail curves naturally along the body.
Identity invariants: keep the same oversized round head, compact rounded body, short limbs, curved striped tail, orange felt, cream muzzle and belly, cream paw tips, pink inner ears and cheeks, glossy black bead eyes, tiny brown stitched nose and mouth, forehead and cheek stripes, visible hand stitching, fuzzy felt fibers, and friendly proportions as the accepted assets.
Composition: one character only, centered in a horizontal composition, entire ears, face, crossed front paws, body, hind feet, and tail visible, generous even padding; subject should occupy a similar visual area to the accepted assets while fitting the square canvas.
Lighting: same soft cool upper-left studio light as the accepted assets, compatible with a pale lavender browser scene.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: change only to the awake lying pose; crisp complete silhouette; no cast shadow, no contact shadow, no reflection; no fish, food, bowl, plate, plant, tray, cushion, blanket, furniture, props, speech bubble, ZZZ, sleep marks, words, letters, watermark, border, or additional character; do not close the eyes, lower the head onto the paws, or make the cat look asleep; do not use #00ff00 anywhere in the cat.
```

## Validation

- Output: RGBA, 1254 × 1254.
- Alpha subject bounds: `(142, 238)–(1158, 1019)`.
- Transparent margins: left 142, top 238, right 96, bottom 235 px.
- Partially transparent edge pixels: 3,730.
- Green-dominant nontransparent spill pixels: 0.
- Visual inspection: horizontal resting silhouette is distinct; head and chest
  remain lifted, bead eyes stay open, and ears, crossed front paws, hind foot,
  body, and tail are complete; identity and material remain consistent.
