# Spotlight cat collaboration — design

The controller owns a throttled search/guard state machine and delegates every
feed to `feedPiece`. The field emits pointer-captured drag coordinates;
`GameView` alone compares the final point with the rendered cat bounds. Cat
reactions are selected from typed state pools and remain transient UI state.
