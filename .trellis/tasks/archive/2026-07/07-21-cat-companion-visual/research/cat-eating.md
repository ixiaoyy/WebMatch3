# Cat eating asset

## Status

Accepted as the second independent image micro-task.

## Execution

- Mode: built-in Image Generation
- References:
  - `../07-21-cat-companion-fish-feeding/research/cat-reference.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-idle.png`
- Chroma source: `generated/cat-eating-chroma.png`
- Runtime alpha asset:
  `apps/web/src/features/game/ui/assets/cat/cat-eating.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: production game character cutout, eating pose only
Input images: Image 1 is the original identity and handmade felt material reference. Image 2 is the accepted production idle asset and is the strict reference for character identity, proportions, palette, lighting, stitching, and scale.
Primary request: Create exactly one full-body version of the same orange felt cat in a clearly readable eating pose. The cat sits upright, leans forward slightly, holds both small front paws together just below its mouth as if holding a tiny morsel, has a gently open happy mouth with a small pink tongue, and looks pleased. No food object is visible.
Identity invariants: keep the same round oversized head, compact rounded body, short legs, curved striped tail, orange felt, cream muzzle and oval belly, cream paw tips, pink inner ears and cheeks, glossy black bead eyes, tiny brown stitched nose and mouth, forehead and cheek stripes, visible hand stitching, fuzzy felt fibers, and friendly proportions as Image 2.
Composition: one character only, centered, entire ears, seated feet, paws, body, and tail visible, generous even padding; framing and subject scale consistent with the accepted idle asset.
Lighting: same soft cool upper-left studio light as Image 2, compatible with a pale lavender browser scene.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: change only the pose and eating expression; crisp complete silhouette; no cast shadow, no contact shadow, no reflection; no fish, food, bowl, plate, plant, tray, furniture, props, speech bubble, ZZZ, words, letters, watermark, border, or additional character; do not use #00ff00 anywhere in the cat.
```

## Validation

- Output: RGBA, 1254 × 1254.
- Alpha subject bounds: `(299, 148)–(1009, 1104)`.
- Transparent margins: left 299, top 148, right 245, bottom 150 px.
- Partially transparent edge pixels: 4,082.
- Green-dominant nontransparent spill pixels: 0.
- Visual inspection: ears, whiskers, paws, seated feet, and tail are complete;
  eating intent is clear without a baked food object; identity, felt material,
  stitched seams, bead eyes, and palette remain consistent with `cat-idle.png`.
