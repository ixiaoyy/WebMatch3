# Cat reactions and speech bubbles — design

## Boundary

Reaction eligibility and non-repeating copy selection live in a pure UI-domain
module. The ambient controller owns throttling, timers, search/guard state, and
away lifecycle. `CatCompanion.vue` renders the current reaction and bubble but
never selects targets or mutates game state.

Cat activation is reserved for search help. Feeding uses direct pointer/touch
drag from a selectable fish to the cat's current drop region; there is no feed
mode or separate feed button. Keyboard users focus a selectable fish and press
`F` for the same engine feed transition, while Enter/Space still moves it into
the tray.

## Reaction contract

Reactions are grouped by idle, recently fed, full, sleeping, searching,
guarding, and unavailable states. Each entry has a stable ID, concise Chinese
text, and a small CSS motion token. Selection excludes the previous reaction
ID whenever the eligible pool has an alternative. Reactions never enter the
canonical game snapshot.

Only one bubble exists. Explicit actions replace the current bubble. Automatic
idle reactions use a fresh low-frequency foreground delay and never choose a
fish, change position, or reveal content. Away state cancels that schedule and
pauses the remaining bubble duration; return resumes only the bubble and starts
a new full automatic delay.

## Search and guarding

Awake, not-full activation selects one currently legal candidate, enters a
short looking/travelling sequence, then stores its piece ID as the guarded
target. Repeated activation is throttled and cannot dislodge a valid guard.
The cat remains positioned beside the target until that exact fish is selected
or fed, or until it becomes invalid. Resolution returns the cat home.

Fish drag is ephemeral UI state: canonical removal happens only after pointer
release inside the cat's current bounds and engine validation. Failed or
rejected drops snap back without changing pile or tray. Pointer capture keeps
touch and mouse paths identical, and a movement threshold prevents the
post-drag click from also selecting the fish.

The current field has no spotlight reveal state yet, so target eligibility is
exposed behind a controller predicate that currently defaults to all selectable
fish. The spotlight child supplies the hidden/unrevealed predicate later.

## Accessibility and motion

The cat remains a native button for pointer, touch, Enter, and Space. Its label
describes search availability, current guard/full state, and its role as the
fish drop target. Fish expose `F` through `aria-keyshortcuts` and their label.
Bubbles are live status text, pointer-transparent, and never receive focus.
CSS motions stop under reduced motion while the same text and state changes
remain.

## Rollback

Remove the reaction module, reaction/search controller refs and timers, bubble
markup, guarding position styles, and drag wiring. Feeding engine state and cat
pose assets remain intact.
