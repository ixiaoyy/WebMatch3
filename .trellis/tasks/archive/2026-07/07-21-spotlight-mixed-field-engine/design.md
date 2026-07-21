# Mixed field engine — design

`PilePiece.pile` is the stable normalized field position and new levels copy it
to the legacy `spread` projection for compatibility. Logical triple groups are
assigned authored scatter/cluster slots per layer. New pieces persist explicit
`blockerIds`; `getBlockerIds` filters those IDs against remaining pieces. Old
pieces without the field fall back to the previous overlap calculation.

Snapshot version three accepts optional blocker IDs so existing valid saves do
not require a destructive migration. Recovery pieces are exposed singletons
with an explicit empty blocker list.
