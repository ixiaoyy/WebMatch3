# Ambient Fish feature

The public game is a persistent freeform felt-fish desktop, not a grid-based
Match-3 session. Pure pile, occlusion, finite solvable level generation, tray
clears, progression, and recovery rules live in `engine/`. Versioned local
persistence lives in `session/`. Vue,
attention lifecycle, optional Document Picture-in-Picture, sound, and visual
projection live in `ui/`.

The engine owns both scattered and gathered coordinates. UI hover/focus only
chooses the projection; it never derives blockers from DOM geometry.

Each level is constructed from same-layer triples, so removing upper groups
before lower groups is always a complete solution. Clears never replenish the
current level. Emptying the pile advances to a gradually denser level, while
full-tray recovery only repositions existing pieces and exposes a completing
fish.
