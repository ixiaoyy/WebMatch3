# Ambient Fish feature

The public game is a persistent freeform felt-fish desktop, not a grid-based
Match-3 session. Pure pile, occlusion, finite solvable level generation, tray
clears, progression, and loss-restart rules live in `engine/`. Versioned local
persistence lives in `session/`. Vue,
attention lifecycle, optional Document Picture-in-Picture, sound, and visual
projection live in `ui/`.

The engine owns one stable normalized field and explicit overlap relationships.
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
Activating the cat only asks it to find, light, and guard one hidden fish;
feeding stays separate through pointer-captured drag-to-cat or the focused
fish `F` shortcut. Up to three fish of any species may be fed, and one or two
matching tray fish may use those feed credits to complete and disappear.

Each level is constructed from same-layer triples, so removing upper groups
before lower groups is always a complete solution. Clears never replenish the
current level. Emptying the pile advances to a gradually denser level. A full
tray briefly remains visible as failure feedback while the persisted stable
state immediately restarts at level one with plant experience preserved.

Version-three persistence stores canonical game, preferences, plant age, and
only a validated guarded fish ID. Missing, malformed, stale, full-tray, or
full-cat guard state safely restores a playable level with the cat home. The
same mounted Vue surface
moves into Document Picture-in-Picture and reflows there without creating a
second controller.
