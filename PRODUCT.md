# Ambient Fish Product Context

## Register

product

## Users

Ambient Fish serves people who want a five-second, interruption-friendly
moment in a pinned browser tab. They should be able to touch a few satisfying
objects, see a small environmental reward, and return to work without a start
gate or a penalty for leaving a field unfinished.

## Product Purpose

Provide a calm browser-native desktop corner built around finding visible
same-species felt fish. Progress persists locally and is expressed through a
growing plant, not scores, missions, timers, or failure screens. The first
field teaches the rule with three obvious triples; later fields ask the player
to spot the only species shown three times among pairs. The website never
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
2. **Search without pressure.** Every fish is visible, separated, and directly
   selectable. The challenge is visual counting, never uncovering a blocked
   target or guessing whether artwork is clickable.
3. **Five seconds is enough.** Level one opens with three species shown three
   times each. From level two onward, every wave has one obvious triple among
   pairs and no start gate.
4. **Start fresh without ceremony.** Each new page/controller opens a fresh
   first-difficulty field while preserving lifetime plant clears, planting age,
   and the sound preference. Picture-in-Picture keeps the current mounted
   session rather than starting another field.
5. **Growth instead of pressure.** Clears visibly evolve the plant. A full tray
   triggers a brief, quiet loss response and rebuilds only the current wave;
   completed groups in the level remain intact.
6. **Finish, then deepen.** The first level requires all three visible groups.
   Later levels require 5, 8, 13, 21, 34… refreshed triples before advancing,
   without placing a numeric level HUD over the scene.
7. **Rules stay testable.** Wave composition, selection, clearing, retained
   level progress, and loss restart remain pure and independent from Vue and
   browser services.
8. **The cat collaborates, not competes.** Activating the cat opens two explicit
   interactions: pet it for transient affection, or ask it to find one useful
   useful fish. Search keeps an independent guide light on the fish after the
   cat arrives. Feeding stays automatic after three matching fish are selected.

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
- Keep every fish visibly separated and independently actionable through
  pointer, touch, and keyboard navigation.
- Maintain at least 44 px effective targets and fit 320 px without horizontal
  scrolling.
- Preserve all state feedback under `prefers-reduced-motion`; hover may enrich
  presentation but search and feeding never require it on coarse-pointer
  devices.
