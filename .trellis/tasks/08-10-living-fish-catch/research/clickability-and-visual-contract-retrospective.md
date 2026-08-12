## Bug Analysis: Visible Fish Still Felt Unclickable and Crowded

### 1. Root Cause Category

- **Category**: B/D/E — cross-layer contract, test gap, and implicit assumption.
- **Specific Cause**: The engine, visual projection, artwork size, semantic hit
  target, and native pointer lifecycle were treated as separate concerns. A fish
  could render much larger than its 44px button, while tap activation happened
  on pointer-up and removed the node before the browser completed native click.
  Earlier rule changes also left the old compressed field projection intact.

### 2. Why Fixes Failed

1. Changing pile rules alone fixed solvability but not the compressed render
   projection, so the result still looked like a pile.
2. Making every fish revealed fixed visibility but did not enlarge the actual
   hit target, so visible artwork still contained dead-looking edges.
3. Adding motion and feedback improved decoration but did not fix native tap
   ownership; rapid three-fish input could drop one activation.
4. Enlarging every fish uniformly would have fixed level one but recreated hit
   overlap in later 15/17-fish waves and on compact screens.

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|---|---|---|---|
| P0 | Architecture | Native click owns taps; pointer-up owns drag completion only | DONE |
| P0 | Visual contract | Couple artwork scale and semantic target size | DONE |
| P0 | Browser regression | Rapid-click three distinct IDs and assert refresh/advance | DONE |
| P1 | Responsive contract | Size fish from configured wave capacity, not remaining count | DONE |
| P1 | Visual QA | Compare source/build at identical pixels in one image | DONE |
| P1 | Documentation | Replace obsolete hidden-pile specs with current wave contracts | DONE |

### 4. Systematic Expansion

- **Similar Issues**: Cat transparent canvases, plant art, tray ghosts, and PiP
  resizing can also make visible pixels disagree with the active hit geometry.
- **Design Improvement**: Keep canonical wave rules in the engine, timed field
  replacement in the controller, and size/hit projection in the components.
- **Process Improvement**: A gameplay redesign is not complete until engine
  counts, real browser interaction, rendered rectangles, and reference capture
  all agree.

### 5. Knowledge Capture

- [x] Updated frontend engine contract.
- [x] Updated frontend UI/session contract.
- [x] Updated frontend visual contract.
- [x] Added engine/controller/storage/browser regressions.
- [x] Recorded exact desktop and compact comparison evidence outside the repo.

## Bug Analysis: Selected Fish Disappeared, Reappeared, Then Moved

### 1. Root Cause Category

- **Category**: A/D/E — missing spec, browser coverage gap, and implicit
  assumption.
- **Specific Cause**: One canonical selection created two independently animated
  visual actors. Vue retained the selected `FishPiece` for its 220ms leave
  transition while `FishCatchFlight` mounted a fixed 70px proxy. The rendered
  source measured about 94–108px on desktop, so the overlap and size mismatch
  read as disappear, pop back, then move instead of one continuous catch.

### 2. Why Fixes Failed

1. No speculative surface fix was applied. Source, retained-leave, and proxy
   geometry were measured first, which separated timing duplication from image
   loading, controller state, and reduced-motion hypotheses.
2. Changing only the proxy size would still have left two visible actors at the
   source for 220ms; changing only the leave transition would still have caused
   a large fixed-size pop. Both ownership and geometry had to change together.

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|---|---|---|---|
| P0 | Visual ownership | Hide the retained selected source in the same render that mounts its proxy | DONE |
| P0 | Rendered geometry | Start the proxy from the measured source center, size, and rotation; scale toward the measured tray slot | DONE |
| P0 | Browser regression | Assert zero visible source ghosts and exact start-size parity after selection | DONE |
| P1 | Responsive regression | Repeat geometry parity at `430x560` and assert no horizontal overflow | DONE |
| P1 | Documentation | Record single-actor handoff in the frontend visual contract | DONE |

### 4. Systematic Expansion

- **Similar Issues**: Tray-to-cat delivery and wave refresh also cross component
  boundaries. They must define which actor owns each phase instead of layering
  unrelated leave and proxy animations.
- **Design Improvement**: Keep canonical selection immediate, but treat visual
  ownership and rendered geometry as one UI transaction. A proxy must replace,
  not accompany, the source actor.
- **Process Improvement**: For motion handoffs, inspect live rectangles and
  visible actor counts at desktop and compact sizes; unit state timing alone
  cannot detect a discontinuous image handoff.

### 5. Knowledge Capture

- [x] Updated the frontend visual contract with the single-actor handoff rule.
- [x] Added desktop, rapid-click, and compact browser evidence for the fix.
- [x] Kept wave-refresh leave motion separate because it begins only after feed
  contact and does not compete with the selected-fish catch proxy.
- [x] Confirmed this project has no spec template mirror to synchronize.
