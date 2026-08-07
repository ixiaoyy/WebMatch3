# Ambient Fish feature

The public game is a persistent freeform felt-fish desktop, not a grid-based
Match-3 session. Pure pile, overlap, finite solvable level generation,
same-species tray combination, progression, and loss-restart rules live in
`engine/`. Versioned local persistence lives in `session/`. Vue, attention
lifecycle, optional Document Picture-in-Picture, sound, cat motion, and visual
projection live in `ui/`.

The engine owns one stable, seed-reproducible normalized field and explicit
overlap relationships. Finite footprint-aware rejection sampling keeps every
generated point inside reserved-area-safe regions, balances shuffled visual
layers, and falls back deterministically when random candidates degenerate.
Every remaining fish is selectable; `FishField` uses those relationships to
fan a revealed stack into distinct pointer targets, then briefly settles its
neighbors when one is removed. Spotlight coordinates, touch afterglow, focus,
drag, separation, and settling motion stay local UI projection and never enter
snapshots. Narrow/short surfaces apply a reversible UI-only projection that
reserves the lower cat/tray area; pointer search and cat guard travel share that
projection, so resize and Picture-in-Picture never rewrite canonical positions.

Pointer movement, touch scanning, and keyboard arrows reveal nearby fish.
Enter, Space, or `F` puts a complete small fish into the tray. An untouched
first field runs one interruptible, controller-timed visual lesson: the initial
light finds a cross-layer same-species triple, those fish lift, and the first
tray slot responds. Any input or attention handoff cancels it, and no tutorial
state is persisted.

Three same-species small fish combine automatically. The exact three gather at
the tray, become one visibly larger fish, and travel to the cat while its eating
pose begins. A single small fish dragged to the cat is restored with a
combine-first hint and never mutates canonical state. Each completed fish grows
the plant, increments unlimited lifetime `fishFedCount`, and derives one of
three bond stages. Every third fish adds a short full-to-sleeping rest sequence;
later fish remain accepted and can interrupt it. Familiar and bonded stages add
the yarn ball and cushion without creating a HUD.

Activating the home cat opens explicit pet and search actions. Petting produces
only transient affection; choosing search asks it to find, light, and guard one
hidden fish, prioritizing a species with two matching tray fish before one or
none. Cat pose and motion are separate projections so breathing, chewing,
petting, travel, guarding, rest, sleep, and loss do not compete for state.

Each level is constructed from complete kind triples dealt across distinct
three-kind spatial groups. Balanced visual layers never gate selection, so the
kind schedule always retains a complete solution. Combinations never replenish
the current level. Emptying the active inventory advances to a gradually denser
level. A full unmatched tray briefly remains visible as failure feedback while
the persisted stable state immediately restarts at level one with plant and pet
experience preserved.

Version-four persistence validates canonical whole-fish game state,
preferences, plant age, a guarded fish ID, and lifetime `fishFedCount`. Legacy
v3/v2/v1 states migrate through a strict boundary and rebuild obsolete boards.
A new page/controller always generates a fresh level-one field with an empty
tray and the cat home; `clearCount`, `fishFedCount`, `plantedAt`, and sound
preference carry into that session. The same mounted Vue surface moves into
Document Picture-in-Picture and reflows there without creating a second
controller or resetting the current field.
