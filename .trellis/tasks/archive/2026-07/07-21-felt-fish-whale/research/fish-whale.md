# Blue whale asset record

## Pre-generation search

Searched runtime assets, active and archived Trellis task research, and `.tmp`
for fish- and whale-named files. No prior standalone fish or whale asset was
found; only the shared eight-fish reference existed.

## Generation mode

Built-in image generation with the shared reference as a style and identity
reference. One generation call produced one species on a flat chroma-key
background. The final runtime PNG was created with the bundled chroma-key
removal helper.

## Final prompt

```text
Use case: stylized-concept
Asset type: production game piece asset
Input images: Image 1 is the style and identity reference; use only the upper-left blue whale as the subject reference, not as a crop or edit target.
Primary request: create one standalone blue felt whale matching the reference character.
Subject: rounded deep-blue handmade felt whale facing left; cream ribbed felt belly; visible warm stitched seams; one glossy black bead eye; one small pink cheek; two rounded side fins; raised split tail; three soft light-blue felt water-spout lobes.
Style/medium: tactile handcrafted needle-felt and sewn plush, softly dimensional, friendly and calm, consistent with Image 1.
Composition/framing: one whale only, centered in a square frame, clean side view, entire spout, fins, belly, and tail visible, generous even padding, strong readable silhouette at small game-piece size.
Lighting/mood: soft cool lavender-compatible studio light on the whale only, restrained highlights.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Constraints: the background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use green anywhere in the whale; crisp complete outline; no cast shadow; no contact shadow; no reflection; no other fish; no props; no text; no watermark; do not redesign the whale.
```

## Outputs

- Chroma source: `research/generated/fish-whale-chroma.png`
- Runtime alpha asset: `apps/web/src/features/game/ui/assets/fish/fish-whale.png`
