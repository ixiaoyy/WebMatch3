# Cat sleeping asset

## Status

Accepted as the fifth independent image micro-task.

## Execution

- Mode: built-in Image Generation
- References:
  - `../07-21-cat-companion-fish-feeding/research/cat-reference.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-idle.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-lying.png`
- Chroma source: `generated/cat-sleeping-chroma.png`
- Runtime alpha asset:
  `apps/web/src/features/game/ui/assets/cat/cat-sleeping.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: production game character cutout, sleeping pose only
Input images: Image 1 is the original identity and handmade felt material reference. Image 2 is the accepted production idle asset and is the strict reference for identity, palette, facial construction, lighting, stitching, and material. Image 3 is the accepted awake lying asset and is the strict reference for the horizontal body silhouette, scale, and orientation.
Primary request: Create exactly one full-body version of the same orange felt cat peacefully asleep on its belly. Preserve the horizontal resting composition from Image 3, but lower the round head gently onto the neatly crossed cream front paws, close both eyes as soft dark-brown curved stitched eyelids, relax the ears slightly outward, soften the mouth into a tiny peaceful smile, let the hindquarters rest naturally, and curl the striped tail close alongside the body. The pose must read unmistakably as asleep without any symbols or text.
Identity invariants: keep the same oversized round head, compact rounded body, short limbs, orange felt, cream muzzle and belly, cream paw tips, pink inner ears and cheeks, tiny brown stitched nose and mouth, forehead and cheek stripes, visible hand stitching, fuzzy felt fibers, and friendly proportions as the accepted assets. Closed stitched eyelids replace the visible bead eyes only for this sleeping pose.
Composition: one character only, centered in a horizontal composition, entire relaxed ears, face, crossed front paws under the head, body, hind feet, and curled tail visible, generous even padding; subject scale and orientation consistent with Image 3.
Lighting: same soft cool upper-left studio light as the accepted assets, compatible with a pale lavender browser scene.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: change only from awake lying to sleeping; crisp complete silhouette; no cast shadow, no contact shadow, no reflection; no fish, food, bowl, plate, plant, tray, cushion, blanket, furniture, props, speech bubble, ZZZ, sleep marks, stars, words, letters, watermark, border, or additional character; do not open the eyes or lift the head; do not use #00ff00 anywhere in the cat.
```

## Validation

- Output: RGBA, 1402 × 1122.
- Alpha subject bounds: `(128, 237)–(1288, 926)`.
- Transparent margins: left 128, top 237, right 114, bottom 196 px.
- Partially transparent edge pixels: 3,496.
- Green-dominant nontransparent spill pixels: 0.
- Visual inspection: head rests on crossed front paws, stitched eyelids are
  closed, ears and tail are relaxed, and the sleeping state is unmistakable
  without embedded text; identity and felt material remain consistent.
