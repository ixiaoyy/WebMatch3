# Playable Game UI Implementation

## Ordered checklist

1. Add typed tile presentation, HUD, result, phase, and coordinate helpers.
2. Add an injectable Vue game controller for board creation, selection,
   ordered cascade presentation, input locking, and confirmed restart.
3. Build display-only board/tile components with mouse, touch, and roving
   keyboard input.
4. Build HUD, instructions, restart confirmation, and result presentation
   components.
5. Assemble the responsive practice-mode page and replace foundation styles
   with theme tokens, focus states, responsive layout, and reduced motion.
6. Add deterministic controller/helper tests.
7. Verify focused tests, lint, type-check, production build, required viewport
   sizes, keyboard operation, live announcements, and reduced motion.

## Validation

```powershell
pnpm --dir apps/web test -- game-ui
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
pnpm ci:web
```

Browser verification targets:

- 320x568
- 390x844
- 768x1024
- 1440x900
- reduced motion emulation
- keyboard-only selection, swap, cancel, instructions, and restart

## Risk and rollback points

- Ordered animation projection is the highest-risk boundary. Tests must prove
  that rapid activation is ignored while busy and that the final visual board
  is the engine result.
- Focus management is the main accessibility risk. Browser verification must
  cover arrow navigation and dialog focus restoration.
- UI-local resolved-move count exists only to decide whether restart needs
  confirmation; it must not be reused as score or remaining moves.
- No package or lockfile changes are expected.