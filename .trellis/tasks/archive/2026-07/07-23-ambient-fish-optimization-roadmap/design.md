# Design

## Task topology

This parent is a planning and integration boundary only:

1. `07-23-compact-pip-resize` — P0, first implementation target.
2. `07-23-spatial-accessibility-labels` — P1, independent second target.

The children touch adjacent Vue surfaces but have separate acceptance paths.
The PiP child owns viewport projection and responsive composition. The
accessibility child owns semantic descriptions passed to fish buttons.

## Architectural boundaries

- Canonical positions, selection, complete-clear guarantees, and blocker
  metadata remain in `features/game/engine`.
- Browser resize and PiP lifecycle remain in `features/game/ui`.
- Accessibility wording remains a UI projection; no localized prose enters the
  engine or saved snapshot.
- The existing single mounted surface continues to move between the opener and
  Document PiP. No second Vue application is mounted.
- No new dependency is required by either child.

## Ordering rationale

Compact PiP is first because current CSS explicitly forces a 430 px PiP
minimum height and then a 620 px minimum height on short landscape viewports.
That contradicts the desired compact corner experience and can clip content.
The accessibility change is high value but does not repair a visible layout
failure.

## Deferred decision gates

- Spatial indexing: require a reproducible interaction trace showing the
  current 60-piece field misses an agreed frame budget.
- Persistence scheduling: require long-task or input-latency evidence and a
  reliable flush-on-exit design before weakening immediate saves.
- Core package extraction: require a second implemented consumer.
- Additional ambience: require a separate product-design review because
  continuous audio is prohibited and new visuals affect the brand contract.

## Rollback

Each child can be reverted independently. Neither changes storage schema,
engine state, or PWA output, so rollback restores only the previous UI
projection or accessible wording.
