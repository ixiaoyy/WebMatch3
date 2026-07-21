# Goldfish asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for goldfish-named files. No prior standalone goldfish asset was found; only the
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
Input images: Image 1 is the style and identity reference; use only the middle-right orange-and-cream goldfish as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt goldfish matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: rounded fancy goldfish facing left; cream-white felt face and belly; bright orange-red felt cap around the eye and forehead; layered irregular orange felt patches across the back and side; visible warm stitched seams around all body panels; one glossy black bead eye; one small round pink cheek; tiny cream lips; tall layered peach-and-orange dorsal fin; broad orange side and lower fins; very long flowing split fan tail in cream and orange with stitched ribs and two elegant lobes; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one goldfish only, centered in a square frame, clean side view, entire body, every fin, and both flowing tail lobes visible, generous even padding, distinctive flowing silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the goldfish only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the goldfish; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the goldfish.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(63, 244, 1213, 977)`.
- Visible-pixel coverage: 31.593%.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-goldfish-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-goldfish.png`
