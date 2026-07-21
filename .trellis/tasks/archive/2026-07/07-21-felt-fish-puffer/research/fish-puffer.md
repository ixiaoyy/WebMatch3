# Pufferfish asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for pufferfish-named files. No prior standalone pufferfish asset was found; only
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
Input images: Image 1 is the style and identity reference; use only the center round ochre pufferfish as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt pufferfish matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: very round inflated pufferfish facing left; warm ochre-gold felt upper half and cream-white felt lower belly; visible warm stitched seam around the two body panels; many short soft rounded conical felt spikes distributed across the body, never sharp or realistic; one glossy black bead eye; one small round pink cheek; tiny cream puckered lips; two small ribbed golden-yellow side fins; short ribbed golden-yellow fan tail; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one pufferfish only, centered in a square frame, clean side view, entire round body, every outer spike, fins, mouth, and tail visible, generous even padding, distinctive circular silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the pufferfish only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the pufferfish; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the pufferfish.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(200, 217, 1150, 973)`.
- Visible-pixel coverage: 30.305%.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-puffer-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-puffer.png`
