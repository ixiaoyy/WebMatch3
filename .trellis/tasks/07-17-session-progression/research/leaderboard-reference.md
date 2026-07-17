# Leaderboard reference

## Source

- User-provided clipboard image, recorded on 2026-07-17.
- Repository copy: `leaderboard-reference.png`
- Dimensions: 1672×941
- Pixel format: 24-bit RGB
- SHA-256:
  `D37AC08A21C9B6DDF7DE66BE5CAF8D40ED144340FB8F1A26E0F7452B7FC19D2F`

## Intended scope

Use this image only for leaderboard hierarchy and composition inside the
existing Fresh Glass game screen. It does not replace the approved board,
background, typography, or candy assets.

## Visual observations

- The first three places form a distinct podium with rank, avatar, name, and
  score visible as one compact unit.
- Lower ranks use dense rows with rank on the left and score aligned right.
- A warm full-row highlight makes the current player easy to find.
- Three tabs provide a clear ranking scope switch without navigating away.
- A soft cream panel, rounded rows, restrained separators, and candy imagery
  keep the ranking readable while matching the game theme.

## Translation into WebMatch3

- Tabs are `本周`, `本月`, and `总排行`; all data remains local to the
  current browser.
- Show at most ten unique player names per period, using each player's best
  completed score in that period.
- Use the same bundled default candy avatar for every player.
- Reuse Fresh Glass tokens and the existing candy asset system instead of
  recreating the painted scene or extracting images from the reference.
- Highlight entries whose name matches the active player.
- Keep all controls keyboard reachable, use a real tablist, and preserve
  readable layout down to 320×568.

## Explicit exclusions

- Do not implement a friends leaderboard, social graph, season, season badge,
  season timer, weekly rewards, or online identity.
- Do not copy the `果冻消消乐` logo or the illustrated character avatars.
- Do not add back, home, or challenge buttons from the reference.
- Do not ship the full reference image as a page background.
