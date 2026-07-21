# Fish 全领域语义迁移设计

## 1. Migration boundary

The active product has one canonical vocabulary: Fish. Compatibility with old
saved data is handled at one storage boundary and must not leak aliases back
into the engine, controller, components, or presentation registry.

Historical Trellis archives, original generation prompts, old conversation
logs, and Git history remain unchanged because they record the product that
existed at that time.

## 2. Canonical naming map

| Legacy name | Canonical name |
|---|---|
| `JELLY_KINDS` | `FISH_KINDS` |
| `JellyKind` | `FishKind` |
| `JellyPresentation` | `FishPresentation` |
| `getJellyPresentation` | `getFishPresentation` |
| `isJellyKind` | `isFishKind` |
| `JellyCluster.vue` | `FishField.vue` |
| `JellyPiece.vue` | `FishPiece.vue` |
| `JellyTray.vue` | `FishTray.vue` |
| `.jelly-*` / `jelly-*` animation names | `.fish-*` / `fish-*` |
| new `jelly-<id>` values | new `fish-<id>` values |

`FishField` is selected instead of `FishCluster` because the accepted spotlight
design contains scattered single fish and local piles across one searchable
surface. Neutral terms such as `ambient`, `piece`, `pile`, `tray`, `point`, and
`state` remain when they still describe the structure accurately.

The final kind union uses the eight species keys delivered by the fish-asset
task (whale, koi, sardine, pufferfish, goldfish, clownfish, angelfish, and betta,
subject to the asset task's final filename registry). Old color/material keys
are never exported as canonical `FishKind` values.

## 3. Source migration

Migrate from the engine outward in one coherent change:

1. Define the canonical fish registry and types.
2. Update generator, transitions, selection/recovery, public engine exports,
   controller, persistence parser, and tests.
3. Rename Vue component files and imports.
4. Rename scoped CSS classes, keyframes, data hooks, test selectors, visible
   copy, status messages, and ARIA labels.
5. Switch presentation imports to all eight fish assets and remove old assets
   only after build-time reference checks pass.

Do not introduce temporary `type JellyKind = FishKind` aliases. A temporary
broken intermediate state inside the local edit is acceptable; the completed
change must expose only Fish APIs.

## 4. Snapshot migration

Use a new canonical snapshot schema version for fish species keys. The storage
module keeps parsers for supported legacy v1/v2 inputs in a dedicated legacy
section or module:

- validate the old structure with legacy literals local to that boundary;
- map each old logical kind deterministically to one canonical fish species;
- keep existing entity IDs unchanged as opaque identity strings;
- validate the mapped canonical game before returning it;
- save the next snapshot only in the new canonical schema.

Newly generated entities use `fish-<id>`. Existing `jelly-<id>` strings may
remain inside a restored in-progress game until those entities leave play; no
runtime logic may branch on either prefix.

The migration preserves level, remaining pieces, tray membership, clear count,
next ID, preferences, plant state, and all later cat fields supplied by the
feeding task. Unmappable or corrupt data follows the existing safe fresh-state
fallback. Migration tests own every permitted active-code `jelly` literal.

## 5. Presentation registry and assets

One registry maps every `FishKind` to:

- stable species key;
- final asset URL;
- Chinese accessible name;
- distinguishing silhouette description when needed by surrounding copy.

Pile/field, tray, announcements, and favicon/title-facing presentation all use
this registry. The page title is exactly `小鱼`.

Delete the four `jelly-*.webp` assets only after all eight final fish assets are
present, imported, visually validated, and included in a successful build. Do
not rewrite the original fish or jelly research assets kept as evidence.

## 6. Documentation scope

Update current truth-bearing material:

- `PRODUCT.md`;
- `design-qa.md` after new visual verification;
- `apps/web/src/features/game/README.md`;
- relevant unarchived Trellis tasks that describe future Fish work;
- application title, status copy, labels, and current tests.

Do not rewrite archived tasks, prompt provenance, screenshots of the old
product, or historical Git content.

## 7. Audit contract

Run a case-insensitive final scan across active source, tests, root product
docs, and unarchived related tasks. Classify each remaining hit as one of:

1. required legacy snapshot literal/test fixture;
2. historical evidence explicitly excluded by the PRD;
3. defect to remove before completion.

No current engine/UI API, filename, selector, visible copy, asset import, or
canonical fixture may remain in category 1. Record the small exception list in
task research or final QA evidence so future scans can distinguish compatibility
from regression.

## 8. Risk and rollback

The main risks are partial symbol migration, old-save loss, enum/asset mismatch,
and accidental deletion of user-created fish assets. Preserve the user's dirty
work, rename only confirmed targets, and verify the complete diff before and
after file moves.

If migration fails, roll back the Fish-domain code batch without deleting old
assets or snapshots. Do not use whole-file restore on files containing unrelated
user changes.

