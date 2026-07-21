# Replace jelly assets with felt fish

## Goal

Replace the current translucent jelly presentation with a large, dense pile of
felt fish using all eight distinct species from the supplied visual set. The
experience should be defined as much by the quantity and shared overlapping
pile as by the number of species.

## Delivery Priority

Asset production comes first. Create exactly one fish per implementation
micro-task and stop after saving it. Do not generate the eight fish in one call
or modify game code before all eight final assets exist.

## Confirmed Facts

- The current UI maps four `JellyKind` values to four WebP assets in
  `apps/web/src/features/game/ui/game-ui.ts`.
- The requested target is eight playable fish kinds. Implementation therefore
  must expand the existing four-kind registry and saved-state validation to eight
  rather than treating the extra fish as unused alternates.
- The current piece renderer, tray, pile geometry, and accessibility labels live
  under `apps/web/src/features/game/ui` and `apps/web/src/features/game/engine`.
- The stable visual reference is
  `../07-21-cat-companion-fish-feeding/research/fish-reference.png`.
- The reference contains eight distinct silhouettes: blue whale, koi, sardine,
  pufferfish, goldfish, clownfish, angelfish, and betta fish.
- `JELLY_KINDS` is the shared source used by generation, matching, recovery,
  persistence validation, controller labels, and the UI presentation registry.
  Adding kinds there keeps snapshot version 2 compatible; existing four-kind
  saves remain valid without a schema migration.
- The existing level generator already emits complete triples from an active
  prefix of the shared kind registry. Supporting more kinds requires extending
  the kind-count configuration, not replacing the solvability algorithm.
- This task is asset and presentation work only; feeding behavior belongs to
  `07-21-cat-fish-feeding`.

## Requirements

- Produce eight clearly distinguishable playable fish kinds based on the
  supplied felt reference, using varied species, silhouettes, colors, fins, and
  markings; all eight fish must appear in the product rather than being reduced
  to four selected variants.
- Increase the total fish count materially beyond the current 36-piece ceiling.
  All active fish belong to one dense overlapping pile; do not split the fish
  into species groups, separate piles, rows, or isolated collections.
- Generate each fish independently from the shared reference. One generation
  call creates one species only; completing one fish never regenerates or
  overwrites another accepted asset.
- Keep one coherent material system across all eight: soft handmade felt,
  visible stitched seams, rounded volume, black bead eyes, subtle pink cheeks,
  soft lavender-compatible lighting, and grounded contact shadows.
- Give each fish a transparent background and tightly controlled transparent
  margins so its clickable area matches the visible body.
- Compose every asset facing consistently unless a deliberate mirrored variant
  is required by layout; avoid baked-in backgrounds, text, bubbles, plants,
  containers, or unrelated props.
- Replace the current jelly imagery in the pile, tray, and favicon/title-facing
  presentation where applicable. Expand the logical kind registry from four to
  eight while keeping the rule "three identical kinds clear" unchanged.
- Extend the active-kind progression to expose all eight kinds while retaining
  the existing complete-triple generation and achievable opening-match rules.
- This asset task does not change the snapshot schema. Preserve existing saves
  during asset delivery; the follow-on `07-21-rename-jelly-domain-to-fish` task
  owns canonical species-key migration and the new snapshot version.
- Update visible and assistive labels from jelly terminology to the appropriate
  fish names. Do not rely on color alone to distinguish kinds.
- Keep rendered size and silhouette bounds compatible with existing overlap and
  blocked-piece geometry, or explicitly adjust and verify that geometry if the
  fish bodies materially change the hit area.
- Extend authored pile geometry and blocker coverage for the higher piece count
  so the dense pile remains selectable instead of repeatedly reusing identical
  coordinates.
- Export web-appropriate optimized assets with sufficient resolution for high-
  density displays and without obvious halos, clipped fins, or compression
  artifacts.
- Preserve the original source/reference and record the final mapping from each
  logical kind to its fish species, asset filename, accessible name, and primary
  identifying silhouette feature.
- Do not implement cat feeding, eating animation, fullness, speech bubbles, or
  persistence changes in this task.

## Out of Scope

- Replacing the pile-generation algorithm or changing tray matching, level
  completion, recovery rules, snapshot version, or persistence schema.
- Creating the cat asset or any cat animation.
- Adding more than the requested eight playable fish kinds.
- Rebuilding the wallpaper, plant, or entire desktop composition.
- Changing `JELLY_KINDS`, generation, persistence, UI registries, or page
  composition during an individual fish-asset micro-task.

## Acceptance Criteria

- [ ] Eight production-ready transparent fish assets are available as eight
      playable matching kinds in both pile and tray.
- [ ] A materially larger number of fish appears together in one dense,
      overlapping playable pile.
- [ ] Each fish is recognizable by silhouette and accessible name without
      depending on color.
- [ ] All eight materially match the supplied handmade felt reference and feel
      like one asset family.
- [ ] No asset has a baked background, visible matte halo, clipped extremity,
      excessive empty margin, or obvious compression artifact.
- [ ] Pointer/touch hit targets and blocked-piece detection remain aligned with
      the visible fish bodies.
- [ ] Existing selection, overlap, tray, and recovery behavior remains valid;
      matching still clears three identical fish.
- [ ] Existing four-kind saves remain loadable during asset delivery; the
      follow-on domain-migration task preserves them while canonicalizing all
      eight fish kinds.
- [ ] Fresh/replenished eight-kind piles remain solvable and expose an achievable
      opening match.
- [ ] Assets remain crisp at their largest supported rendered size and do not
      cause horizontal scrolling at 320 px.
- [ ] The logical-kind-to-fish mapping and final filenames are documented.

## Dependency and Handoff

- Runs after `07-21-cat-companion-visual` and before `07-21-cat-fish-feeding`.
- Delivers stable fish asset URLs, labels, silhouettes, and geometry assumptions
  for the feeding interaction task.
- Run separately; do not start feeding implementation in the same task.

## Deferred Decision

- Decide the initial fish count, growth step, and upper bound after the asset
  micro-tasks; this does not block production of the first fish.
- Decide whether the dense pile remains stacked while idle or still uses the
  existing attention-driven scatter/gather behavior.
