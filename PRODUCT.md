# Ambient Fish Product Context

## Register

product

## Users

Ambient Fish serves people who want a five-second, interruption-friendly
moment in a pinned browser tab. They should be able to touch a few satisfying
objects, see a small environmental reward, and return to work without a start
gate or a penalty for leaving a field unfinished.

## Product Purpose

Provide a calm browser-native desktop corner built around freeform felt-fish
selection. Progress persists locally and is expressed through a growing plant,
not scores, numeric levels, missions, timers, or failure screens. Each finite
fish field can be cleared completely; the next field becomes gradually denser
and more layered. The website never
claims to remain visible above other applications; Document Picture-in-Picture
is an optional browser-owned enhancement when available.

`WebMatch3` remains an internal repository name. The public tab title is
`小鱼`, with no large in-page logo treatment.

## Brand Personality

Quiet, tactile, luminous, and gently alive. The scene should feel like a
rain-washed windowsill in cool afternoon light: restrained enough to leave open
in a work browser, but materially rich when the player touches it.

## Design Principles

1. **The desktop is the frame.** Preserve generous negative space, let search
   use the open surface, and keep the visible cat/plant/tray vignette near the
   lower edges rather than enclosing play in a board or card.
2. **Search without pressure.** Fish keep one stable hidden arrangement.
   Pointer movement, touch scanning, or keyboard arrows reveal only a nearby
   area; focused and dragged fish remain available without moving canonical
   game state.
3. **Five seconds is enough.** Every new field opens with a nearby discoverable
   match and a constructed complete solution, with no start gate.
4. **Resume without ceremony.** Save stable state after meaningful actions and
   restore it directly, with no welcome-back or offline-reward flow.
5. **Growth instead of pressure.** Clears visibly evolve the plant; tray
   saturation recovers softly and never becomes game over.
6. **Finish, then deepen.** Clears permanently reduce the current field.
   Emptying it opens a larger or more layered solvable field without showing
   a numeric level HUD.
7. **Rules stay testable.** Occlusion, selection, clearing, recovery, and
   generation remain pure and independent from Vue and browser services.
8. **The cat collaborates, not competes.** Activating the cat asks it to find
   one hidden legal fish; when it arrives, it immediately keeps an independent
   guide light on that fish. Feeding is a separate action: drag a fish onto the
   cat, or use `F` from a focused fish; any species may be fed up to the
   current three-fish capacity.

## Anti-references

- No rectangular board, cells, rows, columns, swap interaction, HUD, lobby,
  level picker, numeric level label, leaderboard, score, timer, mission, or
  prominent currency.
- No candy-wrapper styling, casino spectacle, continuous ambient audio, or
  reward animation that competes with the quiet scene.
- No extension, desktop package, operating-system overlay, notification, or
  claim that the ordinary page floats above other software.
- No hidden legacy route that preserves the previous classic Match-3 product.

## Accessibility & Inclusion

- Support pointer, touch, and full keyboard play with visible focus.
- Use species, silhouette, and accessible names to identify all eight fish kinds.
- Keep overlapping fish individually actionable whenever their visible target
  can be reached, including through keyboard navigation.
- Maintain at least 44 px effective targets and fit 320 px without horizontal
  scrolling.
- Preserve all state feedback under `prefers-reduced-motion`; hover may enrich
  presentation but search and feeding never require it on coarse-pointer
  devices.
