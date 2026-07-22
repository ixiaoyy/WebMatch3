# Ambient Fish design QA

## Evidence

The files below are the pre-spotlight baseline. Final spotlight integration was
inspected interactively on 2026-07-22 at `320x568`, `390x844`, `768x1024`, and
`1440x900`; viewport measurements, transient captures, DOM state, and console
output were checked in the local browser.

- Source reference: `.trellis/tasks/07-20-ambient-jelly-desktop/research/visual-reference.png`
- Combined comparison: `.trellis/tasks/07-20-ambient-jelly-desktop/research/reference-vs-final.png`
- Responsive captures:
  - `final-320x568.png`
  - `final-390x844.png`
  - `final-768x1024.png`
  - `final-1440x900.png`
  - `responsive-contact.png`

## Review

- Reference relationship is preserved: cool lavender daylight, a pale
  wall/table horizon, broad left foliage shadow, large empty left/center field,
  and a dimensional lower-right vignette.
- The previous four-piece resin set has been replaced by eight species-specific
  felt fish with distinct silhouettes and descriptive accessible names.
- Desktop idle keeps fish visually hidden in one stable irregular field.
  Pointer movement, touch scanning, keyboard arrows, semantic focus, and drag
  all project from the same canonical coordinates without rewriting snapshots.
- Blocked pieces use disabled native buttons, reduced saturation/brightness,
  a quiet pair of overlapping outlines, and explicit accessible covering
  labels. Hidden or disabled fish do not retain pointer hit areas.
- Activating the cat requests one hidden selectable target and never feeds.
  Pointer/touch feeding requires a valid drop on the cat's current bounds;
  focused fish use `F` for the same transition while Enter/Space selects.
- The seven-slot tray is the only persistent grouped glass surface. Quiet
  controls remain secondary, touch-readable, at least 44px tall, and
  focus-visible. The empty tray remains present at very low opacity.
- The mobile composition places the cat above the centered tray and keeps the
  plant pointer-transparent. All four checked viewports matched their viewport
  width exactly with no horizontal overflow. The final integration also clamps
  a travelling/guarding cat inside the 320px surface instead of clipping it at
  an edge target.
- Away state is attached to the movable game surface, so paused motion and
  reduced-attention contrast continue to apply inside Document
  Picture-in-Picture. Reduced-motion styles remove projection and reward
  interpolation without removing semantics.
- Document title is `小鱼`. The blue felt whale supplies the favicon source.
- Pointer spotlight reveal exposed only nearby fish and retained blocker input
  gating. Cat activation entered its guarding state; keyboard `F` feeding,
  three-feed fullness, sleep progression, reload persistence, and full-cat
  rejection all produced the expected semantic status copy.
- The browser console stayed free of warnings and errors. The local browser
  rejected an actual Document Picture-in-Picture request without moving or
  duplicating the surface; dedicated controller regressions cover unsupported,
  rejected, successful move, and exact-node restoration paths.
- The active browser did not expose reduced-motion emulation. The compiled page
  contained reduced-motion rules for cat, fish, tray, plant, controls, field,
  and global transitions, while the same controller/semantic tests remained
  motion-independent.

## Result

final result: pass
