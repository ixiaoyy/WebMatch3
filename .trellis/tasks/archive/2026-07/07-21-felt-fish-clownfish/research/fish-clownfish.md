# Clownfish asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for clownfish-named files. No prior standalone clownfish asset was found; only
the shared eight-fish reference existed.

## Generation mode

Built-in image generation with the shared reference as a style and identity
reference. One generation call produced one species on a flat chroma-key
background. The final runtime PNG was created with the bundled chroma-key
removal helper.

## Final prompt

```text
Use case: stylized-concept
Asset type: production matching-game piece asset
Input images: Image 1 is the style and identity reference; use only the bottom-left orange clownfish as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt clownfish matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: rounded compact clownfish facing left; vivid warm-orange felt body; exactly three broad cream-white vertical felt bands across the head, middle, and tail base; narrow dark charcoal felt edging around the cream bands and along the outer dorsal, lower, side fins, and fan tail; visible warm stitched seams around every panel; one glossy black bead eye; one small round pink cheek; tiny orange lips; short rounded fins; compact fan tail; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one clownfish only, centered in a square frame, clean side view, entire body, all fins, and tail visible, generous even padding, bold striped silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the clownfish only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the clownfish; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the clownfish.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(76, 229, 1222, 963)`.
- Visible-pixel coverage: 32.181%.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-clownfish-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-clownfish.png`
