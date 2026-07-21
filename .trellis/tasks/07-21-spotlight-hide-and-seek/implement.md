# 探照灯捉迷藏实施计划

## Dependency gate

- [ ] Finish and verify all eight fish assets and their canonical registry.
- [ ] Finish `07-21-rename-jelly-domain-to-fish` with old-save compatibility.
- [ ] Finish canonical three-feed state and cat reaction primitives.
- [ ] Re-read this task after dependency completion and reconcile renamed paths.

## Implementation sequence

1. **Mixed field engine**
   - Replace spread/gather presentation data with stable singleton/group layout
     metadata and explicit blocker relationships.
   - Preserve constructed triples, quick opening match, recovery, finite
     completion, and deterministic generation.
   - Add migration/default handling for existing valid snapshots.

2. **Fish field presentation**
   - Replace the fixed lower-right cluster with a full-surface fish field.
   - Project normalized anchors plus fish-relative group offsets into responsive
     safe areas without breaking visual/logical blockers.

3. **Spotlight controller**
   - Add inactive/searching/afterglow/dragging states.
   - Derive reveal and hit-enabled fish from normalized light coordinates.
   - Add responsive reveal radius and reduced-motion behavior.

4. **Pointer, touch, and keyboard search**
   - Implement pointer tracking, touch press-and-drag scanning, afterglow, and
     keyboard-controlled light movement.
   - Preserve normal Tab traversal and visible focus.
   - Add the semantic non-visual fish action path.

5. **Drag-to-feed integration**
   - Add pointer-captured drag state, moving fish rendering, cat drop detection,
     rejected-drop restoration, and canonical feed delegation.
   - Verify feeding never changes the tray or plant `clearCount`.

6. **Cat search and guard flow**
   - Wire cat activation to deterministic hidden selectable-target lookup.
   - Implement search, travel, guard, return, target invalidation, temporary
     feed-drop location, and full/sleep rejection.
   - Keep automatic idle reactions low-frequency and non-revealing.

7. **Stealth UI hierarchy**
   - Keep fish hidden outside the light, cat/plant visible, empty tray faint,
     and quiet controls subdued until engagement.
   - Update live-region and accessible labels for every result state.

8. **Persistence and surface integration**
   - Persist stable layout and necessary cat state; exclude transient light and
     drag state.
   - Reproject rather than regenerate on resize and Picture-in-Picture moves.
   - Pause transient scheduling while away.

9. **Final documentation and visual QA**
   - Update `PRODUCT.md`, feature README, and `design-qa.md` to the accepted
     fish/spotlight behavior.
   - Capture responsive idle, search, drag, guard, full/sleep, keyboard-focus,
     and reduced-motion states.

## Focused verification

- `pnpm test:web`
- `pnpm lint:web`
- `pnpm typecheck:web`
- `pnpm build:web`
- Final in-browser verification at 320×568, 390×844, 768×1024, and 1440×900.
- Pointer, touch emulation, keyboard-only, screen-reader semantics,
  `prefers-reduced-motion`, away/return, reload, and Document Picture-in-Picture.

## Risk and rollback points

- Engine layout/blocker changes land separately from visual reveal behavior so
  solvability regressions can be isolated.
- Snapshot migration is verified before enabling the new field by default.
- Drag feed delegates to one engine transition; UI never removes fish directly.
- Do not delete old assets or compatibility data until the domain-rename task
  and old-snapshot tests are green.
