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
