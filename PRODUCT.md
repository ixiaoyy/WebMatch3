# Ambient Jelly Product Context

## Register

product

## Users

Ambient Jelly serves people who want a five-second, interruption-friendly
moment in a pinned browser tab. They should be able to touch a few satisfying
objects, see a small environmental reward, and return to work without starting
or finishing a round.

## Product Purpose

Provide a calm browser-native desktop corner built around freeform jelly
selection. Progress persists locally and is expressed through a growing plant,
not scores, levels, missions, timers, or failure screens. The website never
claims to remain visible above other applications; Document Picture-in-Picture
is an optional browser-owned enhancement when available.

`WebMatch3` remains an internal repository name. The public tab title is
`果冻`, with no large in-page logo treatment.

## Brand Personality

Quiet, tactile, luminous, and gently alive. The scene should feel like a
rain-washed windowsill in cool afternoon light: restrained enough to leave open
in a work browser, but materially rich when the player touches it.

## Design Principles

1. **The desktop is the frame.** Preserve generous negative space and anchor
   the playable vignette near the lower-right rather than enclosing it in a
   board or card.
2. **Gather on attention.** Jellies rest loosely across the surface, gather into
   a shallow playable pile on pointer or keyboard engagement, and scatter when
   attention leaves.
3. **Five seconds is enough.** A fresh or replenished scene always offers a
   quick visible match with no start gate or remembered plan.
4. **Resume without ceremony.** Save stable state after meaningful actions and
   restore it directly, with no welcome-back or offline-reward flow.
5. **Growth instead of pressure.** Clears visibly evolve the plant; tray
   saturation recovers softly and never becomes game over.
6. **Rules stay testable.** Occlusion, selection, clearing, recovery, and
   generation remain pure and independent from Vue and browser services.

## Anti-references

- No rectangular board, cells, rows, columns, swap interaction, HUD, lobby,
  campaign level, leaderboard, score, timer, mission, or prominent currency.
- No candy-wrapper styling, casino spectacle, continuous ambient audio, or
  reward animation that competes with the quiet scene.
- No extension, desktop package, operating-system overlay, notification, or
  claim that the ordinary page floats above other software.
- No hidden legacy route that preserves the previous classic Match-3 product.

## Accessibility & Inclusion

- Support pointer, touch, and full keyboard play with visible focus.
- Use both silhouette and accessible names to identify the four jelly kinds.
- Keep blocked state perceivable without color and expose it semantically.
- Maintain at least 44 px effective targets and fit 320 px without horizontal
  scrolling.
- Preserve all state feedback under `prefers-reduced-motion`; hover may enrich
  layout but must never be required on coarse-pointer devices.
