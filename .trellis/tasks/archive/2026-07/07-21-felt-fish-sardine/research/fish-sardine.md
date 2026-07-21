# Sardine asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for sardine-named files. No prior standalone sardine asset was found; only the
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
Input images: Image 1 is the style and identity reference; use only the middle-left slender blue sardine as the subject reference, not as a crop or edit target.
Primary request: create one standalone handmade felt sardine matching the reference character.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Subject: elongated streamlined sardine facing left; medium-blue felt back and upper body; cream-white felt face, lower flank, and belly; a neat row of dark navy bead-like spots and short dash markings along the side; visible warm stitched seams around body panels; one glossy black bead eye; one small round pink cheek; compact top and lower fins; narrow forked split tail; friendly calm expression.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, same material family and proportions as Image 1.
Composition/framing: exactly one sardine only, centered in a square frame, clean side view, entire body, fins, and tail visible, generous even padding, long strong silhouette readable at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the sardine only, restrained highlights.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the sardine; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the sardine.
```

## Validation

- RGBA size: 1254×1254.
- All four corner alpha values are zero.
- Visible-pixel bounding box: `(74, 387, 1195, 816)`.
- Visible-pixel coverage: 18.445%, consistent with the intentionally elongated
  silhouette.
- No green-dominant visible pixels remain after despill.

## Outputs

- Chroma source: `research/generated/fish-sardine-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-sardine.png`
