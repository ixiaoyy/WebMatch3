# Ambient Jelly design QA

## Evidence

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
- Aqua orb, amber drop, lime leaf, and rose heart remain distinct at the same
  runtime scale and share one translucent resin material family.
- Desktop idle state is an irregular desktop spread. Keyboard focus gathers
  the same native buttons into the canonical shallow pile; pointer hover has a
  CSS `:hover` path plus the pointer-entry state path. Narrow and coarse-pointer
  layouts remain gathered without hover.
- Blocked pieces use disabled native buttons, reduced saturation/brightness,
  a quiet `覆` cue, and explicit accessible covering labels.
- The seven-slot tray is the only persistent grouped glass surface. Quiet
  controls remain secondary and focus-visible.
- `320x568` has `scrollWidth === 320`; all captured viewports fit without
  horizontal scrolling. Mobile uses the practical gathered layout.
- Document title is `果冻`. The accepted lime silhouette supplies the favicon.
- In-app browser console review found no warnings or errors.

## Result

final result: passed
