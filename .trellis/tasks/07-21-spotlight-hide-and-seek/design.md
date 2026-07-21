# 探照灯捉迷藏技术设计

## 1. Scope and dependencies

This feature is implemented only after the following contracts are stable:

1. `07-21-felt-fish-assets` supplies the final eight fish kinds and assets.
2. `07-21-rename-jelly-domain-to-fish` removes legacy domain APIs from active code.
3. `07-21-cat-fish-feeding` supplies canonical feed count, removal, fullness,
   persistence, and solvability behavior.
4. `07-21-cat-reactions` supplies cat pose/reaction primitives compatible with
   click-to-search and low-frequency automatic personality actions.

The spotlight task owns the mixed fish-field layout, reveal model, search
inputs, drag interaction, cat search/guard coordination, and idle UI hierarchy.
It does not reimplement matching, plant growth, or feed solvability.

## 2. Canonical mixed layout

### 2.1 Layout representation

Replace the visual `spread -> pile` state switch with one stable field layout.
Each fish has:

- a normalized field anchor that survives viewport changes;
- an optional local group identifier;
- a local offset expressed relative to rendered fish size, not viewport width;
- a visual depth/layer;
- explicit blocker relationships generated with the group.

Singleton groups create scattered fish. Multi-fish groups create irregular
local piles. Explicit blockers keep selection rules pure and stable even when
desktop, mobile, and Picture-in-Picture surfaces have different aspect ratios.
The engine resolves blockers only against fish still present in the field.

### 2.2 Safe placement

The generator uses authored normalized safe regions and excludes reserved areas
for the plant, cat home slot, visible tray, quiet controls, and viewport insets.
Each level must contain both singleton and grouped fish. Random jitter is
deterministic from the existing generation source, and the resulting canonical
layout is persisted with the game snapshot.

Responsive projection may move anchors inside the current safe bounds when the
viewport class changes, but it must keep group membership, local offsets,
layers, and blockers stable. It must never separate a visual blocker from the
fish it logically covers.

## 3. Spotlight model

Create a UI-local spotlight controller with these states:

- `inactive`: no visual fish is revealed;
- `searching`: an active pointer, touch, or keyboard light position exists;
- `afterglow`: the last touch position fades briefly after release;
- `dragging`: the dragged fish remains visible independently of the light.

The controller owns normalized surface coordinates and derives the set of fish
inside the reveal radius. The fish field uses this derived set for opacity,
filter, and pointer hit gating. A CSS mask/gradient may enrich the edge, but it
cannot be the only interaction guard because visually hidden buttons must not
intercept pointer input.

The background is not darkened or illuminated. Only fish and their necessary
selection/blocked feedback respond to the reveal field. Radius and feathering
use responsive CSS variables and are tuned at 320×568, 390×844, 768×1024, and
1440×900 rather than stored in game state.

## 4. Input contracts

### 4.1 Pointer

Pointer movement across the game surface updates the light. A revealed,
selectable fish accepts a normal click and follows the existing tray-selection
transition. Hidden fish have no pointer hit surface.

### 4.2 Touch

Touch press starts a light at the contact point; moving the contact scans the
surface. Movement beginning on a selectable fish enters drag mode after a small
distance threshold. Releasing a searching touch starts afterglow. Releasing a
drag over the active cat drop zone requests feeding; releasing elsewhere
returns the fish to its canonical position.

Touch handling must distinguish surface search, fish drag, and intended page
gestures without relying on browser HTML drag-and-drop.

### 4.3 Keyboard

The search surface is keyboard focusable. Arrow keys move a visible light point
in predictable steps; a modified arrow key may move faster. Enter/Space selects
a revealed selectable fish. Tab leaves the surface normally for the cat and
quiet controls. Focus visibility does not depend on animation.

### 4.4 Screen readers

Assistive technology receives a semantic collection of currently selectable
fish and actions for tray selection and feeding. It does not have to discover
visual coordinates. Blocked fish remain semantically unavailable with an
explanation consistent with the visual path.

## 5. Drag-to-feed

Use pointer capture and an explicit drag state rather than native HTML drag.
Drag state contains the fish ID, origin, current surface point, and whether the
cat drop zone is active. The dragged fish renders above the scene and remains
visible after leaving the spotlight.

Only selectable fish can start a drag. Feed success delegates to the canonical
engine feeding transition. It removes the fish, leaves the tray unchanged,
updates cat fullness, and never increments plant `clearCount`. A failed or
rejected drop restores the fish without changing canonical state.

The drop zone follows the cat: normally it is the home slot; while guarding it
is the cat's temporary position beside the target.

## 6. Cat collaboration state

The spotlight integration coordinates these observable states:

`home -> searching -> guarding -> returning -> home`

Feeding may transition the cat through eating/full/lying/sleeping states owned
by the feeding feature. Full, lying, or sleeping states reject search requests.

Activating the awake cat selects one hidden, currently selectable fish. Prefer
a deterministic nearest target from the cat's current/home position, excluding
fish already revealed or resolved. The cat travels to a safe offset beside the
target and guards it without automatically revealing, selecting, or feeding it.
The target binding persists until that fish enters the tray, is fed, or becomes
invalid through another canonical transition. Then the cat returns home.

Idle automatic reactions are low-frequency, state-appropriate, and unrelated
to fish locations. They pause while the surface is away and never queue for
replay. They cannot interrupt searching, guarding, eating, fullness, or sleep.

## 7. UI hierarchy

- Fish: fully hidden outside the active light, except a dragged fish.
- Cat and plant: always visible as desktop-scene objects.
- Tray: near-transparent while empty; readable once it contains any fish.
- Quiet controls: low-opacity at rest; readable on hover, touch engagement, or
  keyboard focus.
- Status feedback: concise live-region text with no timer, score, counter, map,
  or remaining-fish HUD.

## 8. Persistence and surface movement

Persist canonical mixed layout, feed count, cat fullness/pose, and a guarding
target when needed to restore a coherent state. Do not persist pointer/touch
light coordinates, afterglow, drag motion, or transient idle reactions.

Older valid snapshots are migrated/defaulted through the domain-migration
boundary without clearing user progress. On reload, an invalid guarding target
returns the cat home. Picture-in-Picture and viewport changes reproject the
same normalized layout and current cat state; they do not regenerate fish.

## 9. Motion, away state, and rollback

`prefers-reduced-motion` removes travel, afterglow, and pose interpolation while
preserving immediate reveal, target indication, focus, and textual feedback.
Away state pauses cat scheduling and visual animation without changing search,
feed, or progression state.

The implementation remains separable behind the fish-field presentation. If
visual QA rejects the spotlight, the reveal controller and field presentation
can be disabled while retaining the migrated Fish domain and feeding engine.
