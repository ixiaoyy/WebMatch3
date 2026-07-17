# Fresh Glass Candy 视觉重做设计

## Visual target

唯一视觉源为：

```text
.trellis/spec/frontend/assets/fresh-glass-candy-reference.png
```

实现匹配其蓝紫光环境、玻璃外围信息层、深色中央棋盘和立体糖果质感。参考图
是方向与比例基线，不是可复制的产品品牌或功能清单。

## Architecture and ownership

```text
global.scss
  -> shared Fresh Glass tokens, page background, buttons and dialogs

GameView
  -> responsive shell
  -> GameHud
  -> GameBoard -> GameTile (display only, local raster assets)
  -> GameInstructions / restart actions
  -> RestartDialog / GameResultDialog

createGameController
  -> unchanged selection, chronology, input locking and restart

engine
  -> unchanged rules and deterministic results
```

No decorative component may call engine functions. `GameTile` receives only a
tile type and resolves presentation through the existing UI presentation
boundary.

## Delivery boundaries

The parent task owns the shared visual contract and final integration only.
Implementation is split into three ordered children:

```text
existing generated PNGs
  -> candy-assets: six validated transparent PNGs + manifest
  -> ui-restyle: presentation contract + responsive Fresh Glass UI
  -> visual-qa: viewport evidence + design-qa.md + defect fixes
```

No child may pull work forward from a later child. In particular, asset work
does not edit UI code, UI work does not reinterpret source-generation images,
and visual QA does not regenerate assets.

## Asset strategy

Use the four existing PNGs under:

```text
C:\Users\phpxi\.codex\generated_images\019f6edd-116b-7331-bf97-afb671a655f6
```

They are 1254×1254 RGB files without alpha. The user explicitly approved one
additional generated source for each missing type; the selected sources are:

```text
.trellis/tasks/07-17-fresh-glass-candy-assets/research/sources/violet-source.png
.trellis/tasks/07-17-fresh-glass-candy-assets/research/sources/rose-source.png
```

The asset child removes backgrounds locally, normalizes geometry, validates
alpha, and saves final PNGs under `apps/web/src/features/game/ui/assets/`.
These six sources are now fixed; do not generate further variants.

| Type | Shape | Key background |
|---|---|---|
| coral | red rounded-square candy | green |
| amber | golden-yellow drop candy | green |
| lime | green leaf/triangle candy | magenta |
| aqua | blue round/orb candy | green |
| violet | purple flower candy | green |
| rose | pink heart candy | green |

The UI uses normal `<img>` elements with intrinsic square sizing. CSS supplies
layout and interaction states, not replacement candy drawings.

## Responsive composition

- Desktop: a top glass bar, compact left HUD, centered square board, and compact
  right actions/instructions rail.
- Tablet: HUD becomes a compact strip and the right rail may move below the
  board before the grid becomes too small.
- Mobile: header, HUD, board, feedback, then actions/instructions; safe-area
  padding and `100dvh` remain in effect.
- No viewport may gain horizontal overflow. The board is always the
  highest-contrast and highest-priority surface.

## Component contracts

- Replace `TilePresentation.glyph` with an asset URL; accessibility labels stay
  text-only.
- `GameHud` continues to render `null` values honestly as practice state.
- Dialogs keep current focus trap/restore behavior; only presentation changes.
- Right-side controls expose only existing events. No fake tool button appears.

## Motion and state

- Preserve the controller's phase waits and chronology.
- Existing phase classes remain the source for swap, clear, settle/spawn,
  invalid, and shuffle presentation.
- Selection uses a high-contrast ring plus depth; keyboard focus remains
  distinct from selection.
- Reduced motion keeps outlines, opacity, status text, and live announcements.

## Compatibility and rollback

- No package dependency, engine signature, persistence, or data migration.
- All generated assets are local and bundled by Vite.
- Rollback restores the touched UI/style files and removes the six assets.

## Visual QA

Capture 1440×900 for direct reference comparison, then 320×568, 390×844, and
768×1024 for responsive validation. Record findings in `design-qa.md` and fix
every P0/P1/P2 issue before handoff.

## Image-inspection budget

- Read metadata before pixels.
- Never open multiple original-size images in one tool call.
- Create a <=512px preview before visual inspection and inspect one preview at
  a time.
- Persist the observation immediately so a resumed session does not need to
  reopen the same source.
- The reference image is inspected only by the visual-QA child; implementation
  relies on this design contract and final assets.
