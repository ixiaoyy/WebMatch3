# Ambient tab jelly desktop

## Goal

Reposition WebMatch3 as a quiet browser-tab companion: a player can switch to
the tab, make a few satisfying selections, and switch back to work without
starting a round, remembering a plan, or losing progress.

The public experience should feel like a calm desktop corner rather than a
traditional game lobby or a page that pretends it can live outside the browser.

## User Value

- The first meaningful interaction is available immediately after the tab is
  focused.
- A complete reward moment can happen in about five seconds.
- Leaving the tab has no penalty and returning has no recovery cost.
- Long-term progress is visible through the evolving desktop scene rather than
  exposed levels, experience bars, or task systems.

## Confirmed Product Facts

- The product is an ordinary independent website, not a browser extension or
  packaged desktop application.
- Every optional presentation mode must also be implemented through browser
  capabilities; no companion binary, extension, or operating-system
  integration may be required.
- The base experience cannot remain visible over other sites or office
  software.
- The intended usage pattern is a pinned browser tab that the player visits for
  short, interruptible interactions.
- Browser backgrounding must pause the experience rather than simulate offline
  progress.

## Requirements

### R1 — Quiet desktop composition

- Use
  `.trellis/tasks/07-20-ambient-jelly-desktop/research/visual-reference.png`
  as the visual-material and lighting reference.
- Use a full-viewport, soft wallpaper-like background with generous negative
  space: pale lavender-blue ambient light, a subtle wall/table horizon, soft
  natural foliage shadow on the left, and the playable vignette on the right.
- Place the primary play area near the lower-right on desktop, approximately
  `320 × 300 px`, without a conventional panel border.
- Give the plant a dimensional green-leaf and light ceramic-pot treatment, and
  give jellies a translucent glass/resin body, internal color, bright edge
  highlight, soft contact shadow, and restrained reward glow consistent with
  the reference.
- Keep fixed navigation, game title treatments, level selection, promotional
  surfaces, and full-screen boards out of the main experience.
- Keep settings discoverable but visually quiet.
- On smaller screens, preserve the same immediate-play intent while adapting
  the composition to the available viewport without horizontal scrolling.

### R2 — Tap-to-tray matching

- Replace swap-based grid play with a selection mechanic built from scattered
  jelly pieces.
- Never present the pieces as cells, rows, columns, a checkerboard, or another
  visibly gridded layout. Arrange them as a freeform scattered cluster with
  shallow overlaps and stacking, visually closer to a layered tile-selection
  pile than a Match-3 board.
- A jelly with meaningful overlap from a higher-layer jelly is unavailable
  until the covering jelly is removed. Keep stacks shallow (normally two or
  three layers), make blocked state legible without relying on color, and
  retain several selectable choices rather than constructing a punishing
  puzzle.
- Present four visually and shape-distinct jelly kinds.
- Start with roughly 15–20 visible pile pieces across the shallow layers.
- Selecting a jelly moves it into a seven-slot temporary tray.
- Three matching jellies in the tray clear automatically and produce a brief,
  restrained reward response.
- Clearing a set adds visible growth to a small plant and replenishes the
  playable cluster.
- Do not introduce a timer, formal round start, level completion, or high-
  pressure fail state.
- A full tray must not immediately end the game; recovery should remain soft
  and non-punitive.
- When all seven slots are occupied without a match, pause input briefly,
  automatically return two strategically selected jellies to the desktop,
  compact the remaining tray, and ensure the refreshed cluster offers a quick
  follow-up match. Do not require a recovery button or erase plant progress.
- A newly initialized or replenished state must expose at least three
  currently selectable jellies of one kind so a quick match is available.

### R3 — Three experience states

- **Idle:** jellies rest in a loose, freeform spread across the desktop surface
  with restrained ambient life and no prompt to start.
- **Engaged:** moving the pointer into the play region or moving keyboard focus
  into it gathers the jellies into a compact, shallow layered stack. Leaving
  the region returns them to their authored scattered positions.
- On coarse-pointer devices where hover is unavailable, keep the pieces in the
  practical gathered layout while the surface is active; the main interaction
  must never depend on hover alone.
- **Away:** `visibilitychange`, window blur, or equivalent loss of attention on
  the currently active surface pauses motion and sound, saves the exact state,
  and does not calculate failures or offline rewards. When the mounted game is
  in Picture-in-Picture, hiding the opener tab alone does not make the small
  window away.

### R4 — Zero-cost resume and persistence

- Save state after each meaningful interaction.
- Restore the previous layout directly from same-origin browser storage after
  reloads, tab closure, and browser restarts.
- Do not show welcome-back messages, continue prompts, reconnection states,
  offline rewards, daily tasks, or catch-up animation.
- The restored scene must be interactive within 500 ms of the document becoming
  active on a representative local production build.
- Corrupt or incompatible stored state must fall back to a playable fresh state
  without blocking the page.

### R5 — Calm browser behavior

- Use `果冻` as the short document title and a single high-recognition
  aqua/green jelly as the favicon for pinned-tab use. Do not repeat the title
  as a large in-page brand treatment.
- When the browser exposes Document Picture-in-Picture, provide a quiet,
  user-initiated control that moves the playable surface into a browser-owned
  always-on-top HTML window.
- Hide the control entirely when the capability is unavailable; unsupported
  browsers must retain the complete base experience without warnings or
  install suggestions.
- The main page and optional picture-in-picture window must share one canonical
  game state, and closing the small window must return control to the unchanged
  main scene.
- Default to muted audio and do not request browser notifications.
- A quiet settings control may let the player opt into one short, soft clear
  sound. Persist the preference, stop audio immediately when the experience is
  away, and do not add background music or continuous ambience.
- Do not accumulate timers, rewards, penalties, or tasks while hidden.
- Respect `prefers-reduced-motion` without removing state feedback.

### R6 — Long-term environmental growth

- Represent progress through the desktop environment, starting with plant
  growth. The first clear must produce a visible sprout, the first ten clears
  must produce several obvious changes, and the plant should reach its mature
  silhouette at roughly eighty clears.
- After maturity, continue occasional non-numeric changes such as an extra leaf
  or flower rather than displaying a completion or maximum-level state.
- Avoid prominent numerical level, experience, streak, currency, or mission
  systems in the primary surface.
- Keep the persistence contract extensible for future scene objects, seasonal
  changes, jelly materials, or visiting characters without requiring those
  systems in the first implementation.

## Out of Scope

- Preserving the legacy swap-grid mode on another route, behind a hidden
  control, or as a selectable alternate mode. The new desktop experience
  replaces the existing public product completely.
- Browser extensions, desktop packaging, operating-system overlays, or claims
  that the default website floats above other applications.
- Accounts, cloud sync, notifications, login, social systems, monetization,
  daily check-ins, events, conventional campaign levels, or leaderboards.
- Background progression or offline rewards.
- Reproducing the pressure/failure loop of high-stakes tray-matching games.

## Acceptance Criteria

- [ ] Opening the root page reveals a playable desktop scene with no lobby,
      onboarding gate, start button, or modal.
- [ ] At `1440×900`, the composition materially matches the supplied reference:
      cool lavender-blue light, large empty left/center field, soft foliage
      shadow, and a plant-plus-jelly vignette anchored at the lower-right.
- [ ] The browser tab title is `果冻` and the pinned-tab favicon remains
      recognizable at favicon size.
- [ ] A player can select three matching jellies and see them clear from the
      tray while the plant visibly advances.
- [ ] The playable cluster has no visible or implied grid; pieces use varied
      freeform positions, rotations, overlaps, and depth.
- [ ] On desktop, entering the play region gathers the scattered jellies into
      a shallow stack and leaving it returns them to the desktop spread; focus
      and coarse-pointer behavior preserve the same usable interaction state.
- [ ] The four jelly kinds retain distinct silhouettes while sharing the
      reference's translucent, luminous glass/resin material and grounded
      contact shadows.
- [ ] Higher-layer pieces block meaningfully overlapped lower pieces; removing
      the covering piece immediately exposes the lower piece, and the blocked
      state is clear to pointer, touch, keyboard, and assistive-technology
      users.
- [ ] Every newly generated or replenished stable scene exposes at least three
      selectable same-kind pieces.
- [ ] A full tray does not produce a game-over screen or erase progress.
- [ ] A full unmatched tray automatically frees two slots after a short,
      non-blocking feedback beat and leaves an achievable follow-up match.
- [ ] Reloading or reopening the site restores the same cluster, tray, and plant
      state directly.
- [ ] Hiding or blurring the active game surface pauses ambient motion and
      sound; returning resumes the same state without an interstitial. Hiding
      only the opener while its game is active in Picture-in-Picture does not
      pause the small window.
- [ ] The interface works with pointer, touch, and keyboard input, has visible
      focus states, and does not rely on color alone to identify jelly kinds.
- [ ] The interface fits at `320 px` viewport width without horizontal
      scrolling and preserves practical touch targets.
- [ ] Reduced-motion mode preserves selection, matching, and tray-full
      feedback without continuous motion.
- [ ] On browsers with Document Picture-in-Picture, the player can open the
      game in the browser-owned small window, continue playing the same state,
      close it, and resume on the main page.
- [ ] Browsers without Document Picture-in-Picture expose no broken or disabled
      small-window control and retain all base functionality.
- [ ] Audio is silent on first use; after the player explicitly enables it,
      only a short clear sound plays, and hiding or blurring the active surface
      stops sound immediately.
- [ ] The plant changes on the first clear, has multiple visible stages during
      the first ten clears, reaches a mature form around eighty clears, and
      continues subtle visible growth afterward without a level label.
- [ ] The production build passes the repository's required frontend checks.
