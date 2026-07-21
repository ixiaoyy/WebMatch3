# Angelfish asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for angelfish-named files. No prior standalone angelfish asset was found; only
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
Input images: Image 1 is the style and identity reference; use only the bottom-center yellow, cream, and charcoal angelfish as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt angelfish matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: tall laterally compressed angelfish facing left; golden-yellow felt body; broad cream-white vertical face band behind the snout and eye; one broad charcoal-black vertical band through the rear body; charcoal-black ribbed fan tail; visible warm stitched seams around every color panel; one glossy black bead eye; one small round pink cheek; small yellow lips; dramatically tall pointed golden-yellow dorsal fin rising above the body; matching long pointed golden-yellow lower anal fin; charcoal edging and inserts on the tall fins; two short charcoal lower feeler fins; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one angelfish only, centered in a square frame, clean side view, entire body, full tips of the tall upper and lower fins, feeler fins, and tail visible, generous even padding, unmistakable tall triangular silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the angelfish only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the angelfish; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the angelfish.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(156, 85, 1110, 1131)`.
- Visible-pixel coverage: 36.895%.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-angelfish-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-angelfish.png`
