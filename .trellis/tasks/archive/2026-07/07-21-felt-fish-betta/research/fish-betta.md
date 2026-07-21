# Betta fish asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for betta-named files. No prior standalone betta fish asset was found; only the
shared eight-fish reference existed.

## Generation mode

Built-in image generation with the shared reference as a style and identity
reference. One generation call produced one species on a flat chroma-key
background. The final runtime PNG was created with the bundled chroma-key
removal helper.

## Final prompt

```text
Use case: stylized-concept
Asset type: production matching-game piece asset
Input images: Image 1 is the style and identity reference; use only the bottom-right lavender, purple, and blue betta fish as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt betta fish matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: compact lavender felt betta fish facing left; softly rounded lavender head and body; subtle overlapping stitched felt scales on the rear flank; visible warm stitched seams around every panel; one glossy black bead eye; one small round pink cheek; tiny lavender lips; multiple very large layered flowing fins radiating below and behind the body in deep violet and royal purple; broad bright cornflower-blue fan tail with separate ribbed lobes; blue upper rear fin; long graceful felt fin edges, never translucent; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one betta fish only, centered in a square frame, clean side view, entire body and every tip of the layered flowing fins and fan tail visible, generous even padding, unmistakable flowing silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the betta fish only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the betta fish; all fins must be opaque felt; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the betta fish.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(113, 181, 1204, 1051)`.
- Visible-pixel coverage: 40.116%.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-betta-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-betta.png`
