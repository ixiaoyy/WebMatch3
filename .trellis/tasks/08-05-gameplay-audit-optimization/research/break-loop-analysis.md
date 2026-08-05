# Bug Analysis: Gameplay audit interaction regressions

## 1. Root Cause Category

- **Fish target identity — D / E (test gap and implicit assumption):** the
  visual bitmap rectangle also served as the hit target, while the fan heuristic
  moved centers by unverified fixed offsets. Visual separation therefore did
  not prove independent 44px intent targets.
- **Keyboard miss — B (component/controller contract):** `FishField` owned the
  no-target branch, but it had no event into the controller-owned live status.
- **Cat menu — E (transition/runtime assumption):** clean current-source dev did
  close the menu, so the old screenshot was not evidence for a second state
  bug. A Vue leave node could still survive briefly without an explicit inert
  and accessibility contract.
- **PiP — E / D (capability assumption and integration gap):** a truthy namespace
  did not prove a callable API. The browser's isolated evaluator also disagreed
  with the application world: the main world exposed a callable API whose
  native request can suspend automation indefinitely.
- **Cat choice — A (missing product policy):** distance ordering was implemented
  as designed, but the desired tray-risk policy had never been specified.

## 2. Why Earlier Approaches Were Insufficient

1. Fixed pixel fan offsets improved appearance but did not measure or test the
   actual interactive cores.
2. Treating the old narrow screenshot as a current state bug would have added a
   second menu state; clean-source reproduction instead showed the useful fix
   was to harden the retained leave node.
3. Treating an isolated-world `undefined` PiP probe as browser capability was a
   false inference. A temporary main-world probe proved the API was callable.
4. A Promise timeout covers rejected or non-settling API implementations in
   tests, but the in-app browser's native PiP path can suspend document timers.
   The product therefore also gives synchronous opening feedback, and this
   harness limitation is not presented as a successful native-window check.

## 3. Prevention Mechanisms

| Priority | Mechanism | Specific action | Status |
|---|---|---|---|
| P0 | Architecture | Separate stable 44px button cores from larger rotating bitmaps; keep offsets UI-only | DONE |
| P0 | Test coverage | Pure collision/boundary fixtures and pointer single-activation regression | DONE |
| P1 | Accessibility | Make transition-retained menus inert, a11y-hidden, and pointer-transparent in the leave hook | DONE |
| P1 | Contract | Route empty keyboard activation to the existing transient live status without persistence | DONE |
| P1 | Capability | Require callable PiP API and cover absent, malformed, rejected, pending, open, and restore paths | DONE |
| P2 | Policy | Rank legal hidden cat candidates by tray count, then distance, then stable ID | DONE |
| P1 | Integration | Browser-play clear, next-field, and seven-slot restart at compact and desktop sizes | DONE |

## 4. Systematic Expansion

- **Similar issues:** any UI where a large transparent bitmap is also the
  clickable box needs core-target measurement; any transition-retained dialog
  or menu needs an inert leave contract.
- **Design improvement:** canonical engine geometry remains immutable; all
  collision fan-out and capability feedback stay in the UI layer.
- **Process improvement:** compare clean dev, production output, main-world
  capability shape, accessibility tree, and screenshots before attributing a
  runtime symptom to current source.

## 5. Knowledge Capture

- [x] Updated `frontend/game-ui-contract.md` with keyboard miss, menu leave,
      callable PiP, and match-priority contracts.
- [x] Added deterministic regression tests for every new pure/controller path.
- [x] Recorded actual browser main-loop and responsive evidence in this task.
- [x] Template sync is not applicable: this application repository has no
      `src/templates/markdown/spec/` or CLI template mirror.
- [x] Spec documentation remains unstaged under the repository rule that docs
      are not auto-staged; production source remains staged separately.
