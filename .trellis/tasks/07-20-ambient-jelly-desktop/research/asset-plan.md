# Ambient Jelly asset plan

Reference: `visual-reference.png` (1448 × 1086). It establishes the cool
lavender daylight, pale wall/table horizon, left foliage shadow, translucent
resin material, and lower-right visual weight. Browser chrome and the pictured
plant/jellies are reference-only and must not be baked into the wallpaper.

## Runtime assets

| Asset | Runtime slot | Source target | Requirements |
| --- | --- | --- | --- |
| Wallpaper | full viewport, `cover` | 2048 × 1280 WebP | Pale lavender wall/table, soft left foliage shadow, generous empty field, no UI/text/plant/jellies |
| Aqua orb | 72–92 px desktop | 384 × 384 transparent WebP | Round aqua jelly, recognizable highlight and contact shadow |
| Amber drop | 72–92 px desktop | 384 × 384 transparent WebP | Teardrop amber jelly, distinct from orb at 48 px |
| Lime leaf | 72–92 px desktop; favicon source | 384 × 384 transparent WebP | Leaf-like green jelly, strong silhouette at 32 px |
| Rose heart | 72–92 px desktop | 384 × 384 transparent WebP | Soft heart-shaped rose jelly, not candy-wrapper styling |
| Ceramic pot | 128–176 px desktop | 512 × 512 transparent WebP | Light ceramic pot, matching light direction and tabletop contact shadow |
| Growth layers | within plant silhouette | 512 × 512 transparent WebP each | Compatible stems/leaves/flower, aligned to the same pot origin |
| Favicon | browser tab | 32 × 32 PNG and `.ico` | Derived from the accepted lime jelly; no text |

## Generation and acceptance

- Generate against the supplied visual reference, with one coherent material
  vocabulary and the same upper-left daylight direction.
- Use chroma-key source backgrounds for cutouts, remove the key locally, then
  inspect alpha edges against both light and dark mats.
- Keep subjects centered with enough transparent margin for glow and shadow;
  do not use a sprite sheet in the runtime UI.
- Validate the four silhouettes together at 48 px before integration.
- Accept one stable set and record the final prompt/output mapping here before
  UI tuning; later layout work should reuse the accepted files.

## Accepted runtime set

All source prompts live beside their generated sources under `generated/`.
Color-key sources were processed with the bundled ImageGen chroma-key helper,
then resized onto transparent 512 × 512 canvases. Green or magenta spill was
removed only from the matching keyed assets. The accepted runtime files are:

- `apps/web/src/features/game/ui/assets/ambient/wallpaper.webp`
- `apps/web/src/features/game/ui/assets/ambient/jelly-aqua.webp`
- `apps/web/src/features/game/ui/assets/ambient/jelly-amber.webp`
- `apps/web/src/features/game/ui/assets/ambient/jelly-lime.webp`
- `apps/web/src/features/game/ui/assets/ambient/jelly-rose.webp`
- `apps/web/src/features/game/ui/assets/ambient/plant-pot.webp`
- `apps/web/src/features/game/ui/assets/ambient/plant-foliage.webp`
- `apps/web/public/favicon.ico`, `favicon-32.png`, and `favicon-64.png`

The wallpaper source is 1586 × 992 (16:10), intentionally close to the source
reference ratio. Runtime QA confirmed four distinct silhouettes at one scale,
clean transparent margins, and no remaining chroma patch behind the lime leaf.
