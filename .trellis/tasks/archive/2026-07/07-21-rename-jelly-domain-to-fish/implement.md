# Fish 全领域语义迁移实施计划

## Dependency gate

- [x] All eight fish assets and final species-key mapping are complete.
- [x] Snapshot the full working-tree diff and identify user-owned WIP paths.
- [x] Re-run the legacy-name inventory because fish-asset work may add files.

## Implementation status

- [x] Canonical eight-species registry and `fish-<id>` generation.
- [x] Canonical fish presentation registry, title, and favicon reference.
- [x] Version-three snapshots with isolated version-one/version-two adapters.
- [x] Fish-named Vue files, selectors, and animations.
- [x] Current copy, accessibility labels, and product documentation.
- [x] Removal of obsolete runtime fish-predecessor assets.
- [ ] Consolidated verification and final exception audit after all development tasks.

## Implementation sequence

1. **Canonical registry and engine types**
   - Add `FISH_KINDS`, `FishKind`, and the final eight species keys.
   - Rename engine imports/exports, kind collections, generator IDs, transition
     types, comments, tests, and fixtures without compatibility aliases.

2. **Canonical presentation registry**
   - Add `FishPresentation` and `getFishPresentation` backed by all eight final
     assets and Chinese species labels.
   - Update favicon/title-facing presentation and set the tab title to `小鱼`.

3. **Snapshot version and legacy adapter**
   - Add the new canonical snapshot parser using Fish kinds only.
   - Isolate v1/v2 legacy kind literals and deterministic mapping in the
     storage migration boundary.
   - Preserve opaque IDs and all progression/preferences fields, then write
     only the canonical schema.

4. **Vue files and styles**
   - Rename `JellyCluster.vue` to `FishField.vue`, `JellyPiece.vue` to
     `FishPiece.vue`, and `JellyTray.vue` to `FishTray.vue`.
   - Update component symbols/imports plus `.fish-*` classes, keyframes, data
     hooks, and test selectors.

5. **Copy and accessibility**
   - Replace all current status, live-region, ARIA, blocked-state, tray, page,
     and test text with specific Fish language.
   - Verify all eight species remain distinguishable without color alone.

6. **Current documentation**
   - Update `PRODUCT.md`, feature README, active future-task PRDs, and final
     design QA truth; preserve archives and research provenance.

7. **Asset cleanup**
   - Verify all old runtime jelly assets are unreferenced.
   - Remove only the four confirmed obsolete `jelly-*.webp` application assets.

8. **Final audit and exception record**
   - Run case-insensitive content and filename scans.
   - Remove every defect and record only legacy-migration/test or historical
     exceptions with exact paths and reasons.

## Verification

- Focused engine generation, selection, recovery, and transition tests.
- Snapshot tests for valid v1, valid v2, canonical new version, corrupt data,
  opaque legacy IDs, tray state, and all eight Fish kinds.
- Controller/presentation/component tests for Chinese labels and `小鱼` title.
- `pnpm test:web`
- `pnpm lint:web`
- `pnpm typecheck:web`
- `pnpm build:web`
- Browser smoke verification for pile/field, tray, restore, and 320px layout.

## Completion scan

- Active content: `rg -n -i "jelly|果冻" apps/web PRODUCT.md design-qa.md`
- Active filenames: `rg --files apps/web | rg -i "jelly"`
- Unarchived related tasks: case-insensitive scan with the approved historical
  and compatibility exception list applied.

Do not mark complete while an unexplained hit remains.
