# Design

## 1. Current ownership and evidence

- `FishField.vue` owns revealed IDs and the current fan/separation projection. Its inline pairwise offsets use fixed `10px/22px` pushes and a `32px` cap, but do not prove independent 44px hit regions or account for transparent rectangular button overlap.
- `FishPiece.vue` owns one native button, pointer capture, drag threshold and activation. Its visual and hit box currently share the same `62–88px` rectangle.
- `CatCompanion.vue` already calls `closeInteraction(true)` before emitting either action and watches travel/loss state. A narrow-only residual menu therefore needs event/transition/runtime investigation before changing state logic.
- `FishField.vue` currently emits only a successful activation. Enter/Space with no nearest revealed fish has no output path to the shared status live region in `GameView.vue`.
- `document-pip.ts` exposes `supported: Boolean(api)` and `QuietControls.vue` uses `v-if="pipSupported"`. The observed unsupported button conflicts with that source, so API shape and loaded build identity are part of the root-cause check.
- `ambient-controller.ts` chooses the eligible hidden fish nearest the cat start point. It does not currently consider tray species counts.

## 2. Runtime-alignment gate

Before implementation, reproduce each issue from a clean current-source dev session and from a fresh production preview in an isolated browser profile.

For the menu and PiP discrepancy, capture:

- rendered component state and the active transition classes;
- event order from action click/keyboard activation to `travelPhase` update;
- `typeof window.documentPictureInPicture?.requestWindow` in the surface's current owner window;
- loaded asset/build identity and active Service Worker controller;
- post-action accessibility tree and live-region text.

The temporary tracing must be removed after the cause is identified. If a clean build cannot reproduce a symptom, treat cache/delivery as the defect and do not add duplicate component state.

## 3. Workstream A — deterministic fish target projection

Keep canonical geometry untouched and replace the unverified inline offset heuristic with a pure, deterministic UI projection that can be unit-tested.

The preferred projection model is:

1. Project canonical centers into surface pixels.
2. Build collision groups only from currently revealed/retained selectable fish.
3. In stable piece-ID/layer order, fan each group around its canonical centroid until every interactive core has at least 44px center separation, then clamp the group inside the searchable safe bounds.
4. Separate the 44px interactive core from the larger felt bitmap so transparent image corners do not intercept another core. Visual overlap may remain, but hit cores may not overlap.
5. Keep the projected offsets stable for an active pointer gesture. Pointer down captures one piece identity; pointer up/click may activate only that identity once.
6. Recompute only when the revealed set, current pieces, projection size or retained focus/drag target changes. The result never enters controller state or storage.

Place the pure projection beside existing spotlight projection helpers unless implementation evidence shows a more local owner. Any new helper must include the project-required method-level contract comment.

Do not solve this with a global z-index raise, a larger overlapping transparent button, or DOM-derived blocker rules: each can preserve the wrong-target failure.

## 4. Workstream B — cat menu lifecycle

Use one `interactionOpen` source of truth. On either menu action:

1. synchronously mark the menu closed and detach document listeners;
2. make any retained leave-transition node inert, pointer-transparent and hidden from the accessibility tree in the same render turn;
3. emit exactly one selected action;
4. restore or retain focus on a valid cat trigger without reopening the menu from the originating event.

If the reproduction proves the menu is only a stale cached component, fix the build/update path and retain the existing component behavior. If it is a Vue leave-transition artifact, keep or remove the visual fade based on whether it can satisfy the same-tick interaction/a11y requirement.

## 5. Workstream C — keyboard search miss

Add a dedicated `searchMiss` UI event from `FishField` when Enter/Space has a light position but no revealed selectable target. `GameView` forwards it to the existing transient status owner; no engine transition or persistence call occurs.

Use concise copy such as “这里还没有照到小鱼，继续移动探照灯”。Do not announce arrow movement. A monotonically changing UI-only feedback token may be used only if the same meaningful miss must be re-announced after another status; it must not create repeated announcements for held keys.

## 6. Workstream D — PiP capability matrix

Feature detection must require a callable `requestWindow` on the current surface window, not merely a truthy namespace object. Keep unsupported behavior aligned with the current product contract: no button and no warning.

Distinguish:

- unsupported: no callable API, no control;
- request rejected: control was valid, surface stays in place, one live status explains failure;
- opened: move the existing surface and keep the current controller;
- closed/pagehide: restore the same node and attention lifecycle.

If the surface moves documents, all detection/listener reads use the owning document/window. Do not add a polyfill or second mount.

## 7. Workstream E — match-aware cat search

Derive current tray counts in the controller and rank the already filtered eligible hidden candidates by:

1. descending tray count for the candidate species (`2`, then `1`, then `0`);
2. existing distance-to-cat ordering;
3. stable piece ID as a deterministic final tie-breaker if needed.

This stays a UI-controller assistance policy, not a change to engine selection legality. D1 was accepted by the user on 2026-08-05.

## 8. Verification matrix

| Area | Automated check | Browser/play check |
|---|---|---|
| Fish targets | pure collision/fan fixtures, boundaries, stable IDs, pointer single-activation | mouse and coarse-pointer at `1280×720`, `320×568`, `320×240`, including animation start/mid/end |
| Cat menu | state/event sequence where practical | pointer and keyboard action, Escape/outside close, accessibility tree, reduced motion |
| Keyboard miss | no target emits miss; target still activates; no canonical mutation | arrows then Enter/Space on empty and occupied light positions; live text inspection |
| PiP | absent, malformed, rejected, opened, restored API fixtures | unsupported browser plus supported Chromium Document PiP |
| Core loop | existing engine/controller/session suites | triple clear, full field advance, seven-slot restart, feed credit, reload/preferences |

Run focused tests during each workstream. Run `pnpm ci:web` once after the final combined diff.

## 9. Rollback boundaries

- Fish fan/hit projection can be reverted independently because it carries no canonical or stored state.
- Menu, keyboard-miss and PiP fixes are separate UI paths and should remain independently reversible.
- Match-aware cat ranking remains isolated from the four defect fixes so it can be reviewed and reverted independently.
- No migration or stored snapshot version change is expected.
