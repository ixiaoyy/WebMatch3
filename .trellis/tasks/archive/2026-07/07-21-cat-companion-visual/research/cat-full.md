# Cat full-belly asset

## Status

Accepted as the third independent image micro-task.

## Execution

- Mode: built-in Image Generation
- References:
  - `../07-21-cat-companion-fish-feeding/research/cat-reference.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-idle.png`
  - `apps/web/src/features/game/ui/assets/cat/cat-eating.png`
- Chroma source: `generated/cat-full-chroma.png`
- Runtime alpha asset:
  `apps/web/src/features/game/ui/assets/cat/cat-full.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: production game character cutout, belly-full pose only
Input images: Image 1 is the original identity and handmade felt material reference. Image 2 is the accepted production idle asset and is the strict reference for identity, proportions, palette, lighting, stitching, and scale. Image 3 confirms the same character in a seated pose.
Primary request: Create exactly one full-body version of the same orange felt cat in a clearly readable belly-full pose. The cat sits upright but leans back slightly, its cream belly is gently rounded and a little fuller than normal, both front paws rest openly on the belly, shoulders relaxed, glossy bead eyes remain open, and the face has a contented small closed smile with slightly rosy cheeks. The cat is awake and pleased, not sleepy.
Identity invariants: keep the same round oversized head, compact rounded body, short legs, curved striped tail, orange felt, cream muzzle and oval belly, cream paw tips, pink inner ears and cheeks, glossy black bead eyes, tiny brown stitched nose and mouth, forehead and cheek stripes, visible hand stitching, fuzzy felt fibers, and friendly proportions as the accepted assets.
Composition: one character only, centered, entire ears, seated feet, both belly-holding paws, rounded body, and tail visible, generous even padding; framing and subject scale consistent with the accepted assets.
Lighting: same soft cool upper-left studio light as the accepted assets, compatible with a pale lavender browser scene.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: change only the pose and full-belly expression; crisp complete silhouette; no cast shadow, no contact shadow, no reflection; no fish, food, bowl, plate, plant, tray, furniture, props, speech bubble, ZZZ, sleep marks, words, letters, watermark, border, or additional character; do not make the cat lie down or close its eyes; do not use #00ff00 anywhere in the cat.
```

## Validation

- Output: RGBA, 1254 × 1254.
- Alpha subject bounds: `(264, 112)–(1047, 1107)`.
- Transparent margins: left 264, top 112, right 207, bottom 147 px.
- Partially transparent edge pixels: 4,418.
- Green-dominant nontransparent spill pixels: 0.
- Visual inspection: full rounded belly and both belly-holding paws read clearly;
  the cat remains awake; ears, whiskers, feet, and tail are complete; identity,
  felt material, seams, bead eyes, and palette remain consistent with the set.
