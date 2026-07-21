# Spotlight reveal/input — design

`FishField.vue` owns transient `inactive/searching/afterglow/dragging` state and
normalized light coordinates. It derives a revealed ID set from canonical
positions and emits only that projection upward for cat target filtering.
`FishPiece.vue` gates pointer events and opacity from the projection while
remaining a native semantic button.
