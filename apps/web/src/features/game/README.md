# Ambient Fish feature

The public game is a persistent freeform felt-fish desktop, not a grid-based
Match-3 session. Pure pile, occlusion, finite solvable level generation, tray
clears, progression, and loss-restart rules live in `engine/`. Versioned local
persistence lives in `session/`. Vue,
attention lifecycle, optional Document Picture-in-Picture, sound, and visual
projection live in `ui/`.

The engine owns one stable, seed-reproducible normalized field and explicit
overlap relationships. Finite footprint-aware rejection sampling keeps every
generated point inside reserved-area-safe regions, balances shuffled visual
layers, and falls back deterministically when random candidates degenerate.
Every remaining fish is selectable; `FishField` uses those relationships to
fan a revealed stack into distinct pointer targets, then briefly settles its
neighbors when one is removed. Spotlight coordinates, touch afterglow, focus,
drag, separation, and settling motion stay local UI projection and never enter
snapshots.
Narrow/short surfaces apply a reversible UI-only projection that reserves the
lower cat/tray area; pointer search and cat guard travel share that projection,
so resize and Picture-in-Picture never rewrite canonical positions.

Pointer movement, touch scanning, and keyboard arrows reveal nearby fish.
Enter/Space selects a revealed or semantically focused fish into the tray.
An untouched first field runs one interruptible, controller-timed visual lesson:
the initial light finds a cross-layer match, those fish lift, and the first tray
slot responds. Any input or attention handoff cancels it, and no tutorial state
is persisted. The same controller feedback projection coordinates origin tuck,
tray landing, feed acceptance/rejection, clear versus settlement, level arrival,
and loss; only afterglow, drag return, and nearby slip remain component-local.
Activating the home cat opens explicit pet and search actions. Petting produces
only transient affection; choosing search asks it to find, light, and guard one
hidden fish. Feeding stays separate through pointer-captured drag-to-cat or the
focused fish `F` shortcut. Up to three fish of any species may be fed, and one
or two matching tray fish may use those feed credits to complete and disappear.

Each level is constructed from complete kind triples dealt across distinct
three-kind spatial groups. Balanced visual layers never gate selection, so the
kind schedule always retains a complete solution. Clears never replenish the
current level. Emptying the pile advances to a gradually denser level. A full
tray briefly remains visible as failure feedback while the persisted stable
state immediately restarts at level one with plant experience preserved.

Version-three persistence validates canonical game state, preferences, plant
age, and a guarded fish ID. A new page/controller always generates a fresh
level-one field with an empty tray, no fed fish, and the cat home; only lifetime
`clearCount`, `plantedAt`, and the sound preference carry into that session.
The same mounted Vue surface moves into Document Picture-in-Picture and reflows
there without creating a second controller or resetting the current field.
