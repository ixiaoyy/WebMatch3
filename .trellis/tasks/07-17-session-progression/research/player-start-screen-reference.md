# Player start screen reference

## Source

- User-provided clipboard image, recorded on 2026-07-17.
- Repository copy: `player-start-screen-reference.png`
- Dimensions: 1672×941
- Pixel format: 24-bit RGB
- SHA-256:
  `010D6B5A96C91713AACCBC7B33A7A31A937F0B7B775F02529BA333A0641BF170`

## Intended scope

Use only for the player-name entry and start-game state. It does not replace
the existing Fresh Glass game-board reference or the approved six candy
assets.

## Visual observations

- A blurred match-3 board and soft sky environment establish context without
  competing with the form.
- One large centered panel owns the interaction hierarchy.
- The name label, input, and primary start button form a clear vertical path.
- The primary action uses warm reward color and substantially more visual
  weight than secondary controls.
- Floating candy silhouettes reinforce the game theme around, rather than
  inside, the input target.
- Large type, generous spacing, and a short form make the entry state readable
  at a glance.

## Translation into WebMatch3

- Keep the existing blue-lilac Fresh Glass background and use a blurred/dimmed
  live board behind the modal rather than copying the painted landscape.
- Use the repository candy PNGs only; do not crop candy art from this reference.
- Keep the form to player name plus one `开始游戏` action.
- Preserve the existing system sans typography and WCAG focus/contrast rules.
- On mobile, the dialog must fit at 320×568 without hiding the input or action.

## Explicit exclusions

- Do not copy the `果冻消消乐` logo or treat it as the product name.
- Do not add the frog avatar, guest mode, settings, level journey, or decorative
  controls without separate product requirements.
- Do not use the full reference image as a shipped page background.
