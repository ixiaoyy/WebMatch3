# Ambient Jelly feature

The public game is a persistent freeform jelly desktop, not a grid-based
Match-3 session. Pure pile, occlusion, tray, clear, replenishment, and recovery
rules live in `engine/`. Versioned local persistence lives in `session/`. Vue,
attention lifecycle, optional Document Picture-in-Picture, sound, and visual
projection live in `ui/`.

The engine owns both scattered and gathered coordinates. UI hover/focus only
chooses the projection; it never derives blockers from DOM geometry.
