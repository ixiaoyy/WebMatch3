# Ambient Fish design QA

## Evidence

The files below are the pre-spotlight baseline. Final spotlight integration was
inspected interactively on 2026-07-22 at `320x568`, `390x844`, `768x1024`, and
`1440x900`; viewport measurements, transient captures, DOM state, and console
output were checked in the local browser.

- Source reference: `research/visual-reference.png`
- Combined comparison: `research/reference-vs-final.png`
- Responsive captures:
  - `research/final-320x568.png`
  - `research/final-390x844.png`
  - `research/final-768x1024.png`
  - `research/final-1440x900.png`
  - `research/responsive-contact.png`

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

baseline result: pass

---

# Approved layout redesign QA — 2026-07-22

## Comparison target

- Source visual truth: `research/qa-2026-07-22/layout-reference.webp`
- Implementation screenshot: `research/qa-2026-07-22/layout-polished-active.webp`
- Full-view comparison: `research/qa-2026-07-22/layout-comparison-polished.webp`
- Source pixels: `1136 x 1387`; the `1136 x 1247` app region below the browser chrome was normalized to `1391 x 1527`.
- Implementation pixels and CSS viewport: `1391 x 1527` at browser density `1x`.
- State: keyboard spotlight active over the live persisted fish field; quiet controls, empty tray, idle cat, and zero-growth plant visible.

## Evidence and result

- The approved composition now carries through: the search spotlight owns the lower-middle, the cat and pot read as one right-side vignette, and the tray sits directly beneath that activity instead of disappearing at the page edge.
- Typography and copy use the existing product font stack and the exact `静音` / `小窗` labels. Their size, spacing, and idle contrast now match the reference hierarchy closely.
- Layout rhythm uses shared tray and companion anchors. The `1391 x 1527`, `1440 x 900`, and `320 x 568` captures all reported zero horizontal and vertical overflow.
- Colors and tokens preserve the existing lavender wallpaper, quiet ink colors, and translucent tray treatment. The tray remains secondary but is visibly present in its empty state.
- Image fidelity is preserved by using the repository's original wallpaper, felt-cat, fish, pot, and plant-stage assets. No placeholder or reconstructed artwork was introduced.
- Pointer movement revealed the live fish field and moved the spotlight into the new play region. After the final reload, the console recorded no new warnings or errors; its retained history contained only transient prop warnings from an earlier hot-reload boundary while a concurrent fish-interaction edit was still incomplete.
- A separate focused-region comparison was not needed: the full-height comparison renders the only text and all foreground assets large enough to assess directly.

## Comparison history

- First implementation capture: `research/qa-2026-07-22/layout-active-v2.webp`.
- Earlier P2 findings: the cat and plant were materially smaller than the selected mock, the empty tray was too faint, and the portrait spotlight was vertically oriented.
- Fixes: increased desktop companion scale, coordinated their shared baseline, raised empty-tray opacity, enlarged the tray, and added a wide portrait spotlight shape.
- The final polish pass removed the full-screen grey spotlight veil, enlarged and overlapped the cat/pot vignette, gave the tray a brighter ceramic rim and recessed slots, and anchored the zero-growth bud at the center of the pot opening.
- Post-fix evidence: `research/qa-2026-07-22/layout-comparison-polished.webp` shows the corrected hierarchy, grouping, material depth, and plant-stage alignment.

## Accepted differences

- The selected mock depicts three separated decorative fish; the implementation shows the current canonical layered game state, so revealed fish may overlap. Preserving real game geometry is intentional.
- The mock shows a small planted sprout. At zero growth the implementation uses the existing bud-stage asset positioned at the pot opening; later growth states continue to use the persisted progression system.

## Validation

- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web typecheck`
- `pnpm --dir apps/web test`
- `pnpm --dir apps/web build`

final result: passed

---

# Tray fidelity polish — 2026-07-22

## Comparison target

- Source visual truth: `research/qa-2026-07-22/tray-reference.webp`.
- Earlier implementation evidence: `research/qa-2026-07-22/tray-before.webp`.
- Final implementation crop: `research/qa-2026-07-22/tray-polish-v4.webp`.
- Focused normalized comparison: `research/qa-2026-07-22/tray-comparison-v4.webp`.
- State: empty seven-slot tray.
- Source tray bounds: `422 x 81` pixels; normalized to `560 x 106` for comparison.
- Implementation tray bounds: `560 x 106` CSS pixels at browser density `1x` in a `1391 x 1527` viewport.

## Findings and iteration history

- P2, resolved: the previous implementation was a wide `700px` rectangular panel with an `18px` radius, while the source is a compact `5.2:1` pill with semicircular ends. The tray is now `560 x 106`, uses a full-pill shell, and preserves the composition center by increasing its desktop right offset.
- P2, resolved in the second focused pass: the first pill iteration had undersized, widely spaced recesses and an over-bright white shell. Slot tracks now use `3px` gaps with larger circular wells, and the shell/recess colors were reduced toward the source's lavender ceramic depth.
- Post-fix evidence: `research/qa-2026-07-22/tray-comparison-v4.webp` shows matched outer proportion, end curvature, recess count, recess diameter, and spacing. Remaining color variation comes from the wallpaper illumination visible through both translucent treatments and is acceptable.

## Required fidelity surfaces

- Fonts and typography: not present in this focused component.
- Spacing and layout rhythm: the source `422:81` ratio and implementation `560:106` ratio both resolve to approximately `5.2:1`; all seven recesses use equal tracks and consistent `3px` gaps.
- Colors and visual tokens: the tray uses the existing cool lavender scene palette, a restrained translucent shell, white ceramic highlights, and blue-violet inset shadows rather than the earlier white glass-panel treatment.
- Image quality and asset fidelity: no decorative raster was substituted. The tray remains a semantic, dynamic seven-slot list so repository fish assets and clear animations continue to render in live slots.
- Copy and content: the existing accessible label `小鱼托盘` and seven empty-slot announcements are unchanged.

## Responsive and interaction evidence

- `research/qa-2026-07-22/tray-mobile-320x568.webp`: `296 x 57` tray, zero horizontal or vertical overflow.
- `research/qa-2026-07-22/tray-wide-1440x900.webp`: `560 x 106` tray, zero horizontal or vertical overflow.
- The final browser pass reported no console warnings or errors.
- The clear-animation gap compensation was changed from `5px` to `3px` to match the new grid gap; selection and clear behavior remain covered by the existing game tests.

final result: passed
