# Replace jelly assets with felt fish — design

## Boundary

Produce the eight runtime fish assets before changing any engine, persistence,
registry, component, or page code. Each fish is an independent micro-task. The
later code phase will increase total inventory and compose every fish into one
dense overlapping pile rather than separate groups.

## Stable asset names

1. `fish-whale.png` — blue whale with cream ribbed belly and water spout.
2. `fish-koi.png` — white koi with red patches and fan tail.
3. `fish-sardine.png` — slender blue sardine with spotted flank.
4. `fish-puffer.png` — round ochre pufferfish with soft felt spikes.
5. `fish-goldfish.png` — orange-and-cream goldfish with flowing tail.
6. `fish-clownfish.png` — orange clownfish with cream bands and dark edging.
7. `fish-angelfish.png` — yellow, cream, and charcoal tall-finned angelfish.
8. `fish-betta.png` — lavender betta fish with layered blue-purple fins.

## Logical kind mapping

| Current key | Fish | Runtime asset | Accessible identity |
| --- | --- | --- | --- |
| `aqua` | Blue whale | `fish-whale.png` | Blue body, cream ribbed belly, water spout |
| `amber` | Koi | `fish-koi.png` | White body, red patches, fan tail |
| `lime` | Sardine | `fish-sardine.png` | Slender blue body, spotted flank |
| `rose` | Pufferfish | `fish-puffer.png` | Round ochre body, soft felt spikes |
| `goldfish` | Goldfish | `fish-goldfish.png` | Orange-and-cream body, flowing tail |
| `clownfish` | Clownfish | `fish-clownfish.png` | Orange body, cream bands, dark edging |
| `angelfish` | Angelfish | `fish-angelfish.png` | Tall yellow-and-charcoal fins |
| `betta` | Betta fish | `fish-betta.png` | Layered blue-purple fins |

## Per-fish production contract

- Before any generation call, search runtime assets, active and archived task
  research, and project temporary output for the species. Reuse a suitable
  existing asset instead of generating a duplicate.
- Use the parent `research/fish-reference.png` as a style and identity
  reference, not as a runtime crop.
- Use one built-in image-generation call for one species only.
- Render one centered side-view felt fish on a flat removable chroma-key
  background, with no props, text, floor, reflection, or cast shadow.
- Convert the selected result to an alpha PNG and save it under
  `apps/web/src/features/game/ui/assets/fish/` using the stable name above.
- Record that fish's final prompt under this task's `research/` directory.
- Do not import the asset or change code during the asset micro-task.

## Current slice

All eight standalone fish assets, prompt records, shared eight-kind registry,
and the 36-to-60 piece-count progression with 60 authored geometry slots are
complete. The next slice replaces presentation mapping and accessible labels;
canonical Fish-domain renaming remains in its follow-on task.

## Final manual verification

After all assets and code integration are complete, the user performs one
manual verification against the PRD.
