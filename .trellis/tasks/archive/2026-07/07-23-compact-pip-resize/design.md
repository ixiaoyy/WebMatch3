# Design

## Existing flow

`ResizeObserver` reads the movable `.ambient-surface`, computes
`FieldProjection`, and writes a Vue ref consumed by fish rendering, pointer
inverse projection, and cat guard placement. Document PiP moves that exact
surface into another document.

## Resize scheduling

Keep the observer as the source of content-box dimensions. Add one local
animation-frame scheduler:

1. Store the latest finite width and height from each observer delivery.
2. If no frame is pending, request one.
3. On the frame, clear the handle and commit one projection from the latest
   dimensions.
4. On unmount, cancel the handle and discard pending dimensions.

The immediate bounding-box projection after observation remains synchronous so
the first render does not wait for a frame. The scheduling primitive should be
testable with injected or controllable frame callbacks rather than real time.

## Compact layout

Use the existing `ambient-surface--in-pip` state to remove PiP minimum-height
constraints. Apply the same height-aware composition variables to every
`<=620px × <=430px` surface so ordinary narrow windows and PiP cannot drift:

- tray bottom/height and vignette gap;
- cat width/height and home/guard offsets;
- plant visual footprint;
- spotlight projection reserve.

Prefer CSS variables and current component media hooks over duplicate markup.
Do not hide native controls or remove semantic plant feedback. If the smallest
height cannot show every decorative bitmap, visually reduce decoration while
keeping accessible state.

## State invariants

- No engine or session module changes.
- No alternate coordinates for PiP.
- No stored layout mode.
- No second application/controller.
- Existing `pagehide` restore path remains authoritative.

## Test strategy

- Unit-test coalescing, latest-size wins, and unmount cancellation.
- Retain supported/unsupported/rejected PiP DOM-identity tests.
- Browser screenshot/smoke checks at 430×560 and 320×240, plus normal
  320×568 and desktop layouts to detect responsive regressions.
- Check keyboard focus, cat activation, tray visibility, reduced motion, and
  console output.

## Rollback

The scheduler and PiP-specific CSS can be reverted without migrating state.
If a compact breakpoint harms the normal page, isolate the rule under the PiP
class rather than changing canonical projection inputs.
