# Compact PiP and resize scheduling

## Goal

Keep Ambient Fish calm, legible, and operable when its existing mounted surface
is resized into a small Document Picture-in-Picture window, without projection
churn or changes to canonical game state.

## Background

- PiP requests 430×560 but the user can resize the browser-owned window.
- The current PiP surface has `min-height: 430px`.
- A general short-landscape rule raises the surface minimum to 620 px, which
  can clip a compact PiP viewport instead of adapting it.
- ResizeObserver currently commits each delivered size directly to Vue state.

## Requirements

### R1 — Compact PiP composition

Add a compact layout shared by PiP and ordinary narrow windows at the same
dimensions. It must render at 320×240 for stress verification and remain
comfortable at the requested 430×560 PiP size.

Essential controls, the searchable fish field, tray state, and cat action must
remain reachable without horizontal scrolling. Decorative plant treatment may
shrink or simplify at the smallest height, but progress feedback must remain
available through semantics.

### R2 — Preserve interaction targets

Keep native focusable actions and an effective 44 px minimum target. Compact
visual sizing must not make keyboard or assistive-technology paths depend on
hover or precise pointer placement.

### R3 — Coalesce projection updates

ResizeObserver may record every delivered size, but must commit at most one
`fieldProjection` update per animation frame using the latest dimensions.
Initial mount projection remains immediate and pending work is cancelled on
unmount.

### R4 — Preserve canonical state

Resize and PiP transitions must only reproject the existing state. They must
not regenerate pieces, change IDs/layers/coordinates, or persist a viewport
variant.

### R5 — Preserve lifecycle behavior

Opening, rejecting, closing, blurring, and refocusing PiP must retain the
existing single mounted surface, attention, timer, sound-stop, and restore
behavior.

## Acceptance Criteria

- [x] AC1: At 430×560, the PiP layout has no clipped essential control, cat
      action, tray, or intentional horizontal overflow.
- [x] AC2: At a 320×240 stress viewport, essential pointer and keyboard actions
      remain reachable and the surface does not rely on a 430/620 px minimum
      height.
- [x] AC3: A burst of ResizeObserver deliveries before one animation frame
      causes one projection commit using the last dimensions.
- [x] AC4: Unmount cancels a scheduled projection commit.
- [x] AC5: Resize/PiP tests prove canonical piece coordinates and mounted DOM
      identity remain unchanged.
- [x] AC6: Reduced-motion state retains all interaction and feedback semantics.
- [x] AC7: Focused tests and one final `pnpm ci:web` pass.

## Out of Scope

- Spatial hash or blocker-rule changes.
- New PiP API/polyfill or a second Vue mount.
- New wallpaper, theme, audio, or persistence behavior.
- Changes to requested PiP dimensions unless compact QA proves the current
  request itself is unusable.
