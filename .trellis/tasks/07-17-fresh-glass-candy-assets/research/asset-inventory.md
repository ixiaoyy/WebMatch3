# Asset inventory

## Fixed input

| Source | Size | Pixel format | Alpha | Inspection status |
|---|---:|---|---|---|
| `call_0dbWIJe0MPuABBLv6YH7w3IP.png` | 1254×1254 | 24-bit RGB | no | preview checked: coral |
| `call_J2CIzKowHAxmsOeW8fAu9yo7.png` | 1254×1254 | 24-bit RGB | no | preview checked: aqua |
| `call_qZV8nMCFTVhC0Z8TVopY78T0.png` | 1254×1254 | 24-bit RGB | no | preview checked: amber |
| `call_Wr5mP2WwBfqStTiwuaTtGBCF.png` | 1254×1254 | 24-bit RGB | no | preview checked: lime |
| `research/sources/violet-source.png` | 1254×1254 | 24-bit RGB | no | generated and checked: violet |
| `research/sources/rose-source.png` | 1254×1254 | 24-bit RGB | no | generated and checked: rose |

Source directory:
`C:\Users\phpxi\.codex\generated_images\019f6edd-116b-7331-bf97-afb671a655f6`

## Output checklist

| Type | Output | Source/crop | Alpha | Bounds | Status |
|---|---|---|---|---|---|
| coral | `candy-coral.png` | `call_0dbWIJe0MPuABBLv6YH7w3IP.png`, centered full frame | RGBA, 0–255 | 54,46–458,466 | passed |
| amber | `candy-amber.png` | `call_qZV8nMCFTVhC0Z8TVopY78T0.png`, centered full frame | RGBA, 0–255 | 91,46–420,466 | passed |
| lime | `candy-lime.png` | `call_Wr5mP2WwBfqStTiwuaTtGBCF.png`, centered full frame | RGBA, 0–255 | 75,46–436,466 | passed |
| aqua | `candy-aqua.png` | `call_J2CIzKowHAxmsOeW8fAu9yo7.png`, centered full frame | RGBA, 0–255 | 50,46–461,466 | passed |
| violet | `candy-violet.png` | `research/sources/violet-source.png`, centered full frame | RGBA, 0–255 | 51,46–460,466 | passed |
| rose | `candy-rose.png` | `research/sources/rose-source.png`, centered full frame | RGBA, 0–255 | 46,61–466,450 | passed |

每确认一张预览或输出后立即更新对应行；已确认项不得在恢复任务时重复检查。

## Inspection notes

### call_0dbWIJe0MPuABBLv6YH7w3IP.png

- Temporary preview (deleted after final validation):
  `research/previews/call_0dbWIJe0MPuABBLv6YH7w3IP-512.png`
- Checked at 512×512 only; the original-size image was not opened.
- Contains one centered glossy red rounded-square candy on a bright green
  chroma-key background.
- No visible text or clipping. The silhouette and color match `coral`.
- Processed to
  `apps/web/src/features/game/ui/assets/candy-coral.png` at 512×512.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `54,46–458,466`.
- Automated edge scan reported 772 semi-transparent green-dominant pixels;
  the single-output visual check found no obvious green fringe or clipping.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

### call_J2CIzKowHAxmsOeW8fAu9yo7.png

- Temporary preview (deleted after final validation):
  `research/previews/call_J2CIzKowHAxmsOeW8fAu9yo7-512.png`
- Checked at 512×512 only; the original-size image was not opened.
- Contains one centered glossy blue round candy/orb on a bright green
  chroma-key background.
- No visible text or clipping. The silhouette and color match `aqua`.
- Processed to
  `apps/web/src/features/game/ui/assets/candy-aqua.png` at 512×512.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `50,46–461,466`.
- Automated edge scan reported 956 semi-transparent green-dominant pixels;
  the single-output visual check found no obvious green fringe or clipping.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

### call_qZV8nMCFTVhC0Z8TVopY78T0.png

- Temporary preview (deleted after final validation):
  `research/previews/call_qZV8nMCFTVhC0Z8TVopY78T0-512.png`
- Checked at 512×512 only; the original-size image was not opened.
- Contains one centered glossy golden-yellow drop candy on a bright green
  chroma-key background.
- No visible text or clipping. The silhouette and color match `amber`.
- Processed to
  `apps/web/src/features/game/ui/assets/candy-amber.png` at 512×512.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `91,46–420,466`.
- The edge scan counted 2,551 green-dominant semi-transparent pixels, but this
  metric over-reports the green component of normal yellow highlights. The
  single-output visual check found no obvious green fringe or clipping.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

### call_Wr5mP2WwBfqStTiwuaTtGBCF.png

- Temporary preview (deleted after final validation):
  `research/previews/call_Wr5mP2WwBfqStTiwuaTtGBCF-512.png`
- Checked at 512×512 only; the original-size image was not opened.
- Contains one centered glossy green leaf candy on a bright magenta
  chroma-key background.
- No visible text or clipping. The silhouette and color match `lime`.
- Processed to
  `apps/web/src/features/game/ui/assets/candy-lime.png` at 512×512 using the
  magenta-key path.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `75,46–436,466`.
- Automated edge scan reported 29 magenta-dominant semi-transparent pixels;
  the single-output visual check found no obvious magenta fringe or clipping.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

## Resolved source gap

- The original fixed source directory contains four PNGs covering `coral`,
  `aqua`, `amber`, and `lime`.
- The user explicitly requested generation of the missing `violet` flower and
  `rose` heart.
- Exactly one selected source for each missing type was generated with the
  built-in image tool and copied into `research/sources/`.
- Both use a flat green chroma-key background, contain one centered subject,
  and have no text or clipping.
- The six-source set is now fixed. Do not generate further variants.

## Generated source processing

### research/sources/violet-source.png

- Processed to
  `apps/web/src/features/game/ui/assets/candy-violet.png` at 512×512.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `51,46–460,466`.
- Automated edge scan reported 291 semi-transparent green-dominant pixels;
  the single-output visual check found no obvious green fringe or clipping.
- The six-petal flower silhouette remains clear and distinct at output size.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

### research/sources/rose-source.png

- Processed to
  `apps/web/src/features/game/ui/assets/candy-rose.png` at 512×512.
- Alpha range is 0–255, all four corner alpha values are 0, and the visible
  bounds are `46,61–466,450`.
- Automated edge scan reported 847 semi-transparent green-dominant pixels;
  the single-output visual check found no obvious green fringe or clipping.
- The heart silhouette and pointed base remain clear and fully visible.
- This source and output are complete; do not reopen them unless a later
  integration check finds a concrete defect.

## Unified automated validation

Command:

```powershell
& 'C:\Users\phpxi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  '.trellis/tasks/07-17-fresh-glass-candy-assets/research/validate-assets.py'
```

Result: `PASS: six distinct, decodable, normalized RGBA PNGs`

| Type | Image | Alpha | Bounds | Margins L/T/R/B | SHA-256 prefix |
|---|---|---|---|---|---|
| coral | 512×512 RGBA | 0–255 | 54,46–458,466 | 54/46/54/46 | `4e6fccff080e` |
| amber | 512×512 RGBA | 0–255 | 91,46–420,466 | 91/46/92/46 | `c781f4767c62` |
| lime | 512×512 RGBA | 0–255 | 75,46–436,466 | 75/46/76/46 | `89477a767ac5` |
| aqua | 512×512 RGBA | 0–255 | 50,46–461,466 | 50/46/51/46 | `68d5273d041e` |
| violet | 512×512 RGBA | 0–255 | 51,46–460,466 | 51/46/52/46 | `adc0fbdd4433` |
| rose | 512×512 RGBA | 0–255 | 46,61–466,450 | 46/61/46/62 | `880bf965e8e9` |

Checks covered PNG decode, file uniqueness, exact 512×512 RGBA mode, alpha
range, transparent corners, minimum 32px margin, and normalized 416–424px
maximum subject edge. Individual single-output visual checks covered visible
key-color fringe and clipping.

No component, style, engine, dependency, or build configuration changed in
this child task, so UI lint, tests, and build are deferred to the UI-restyle
child where the assets become imported consumers.

## Cleanup

- Deleted the four temporary 512×512 identification previews after the unified
  validation passed.
- Preserved the six selected source images or source references, six final
  assets, processing scripts, generation prompts, mappings, and validation
  evidence.
