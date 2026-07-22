import type { PilePiece, Point } from "../engine";

export type SpotlightMode = "inactive" | "searching" | "afterglow" | "dragging";
export type SpotlightDirection = "up" | "right" | "down" | "left";

export interface FieldProjection {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export const FULL_FIELD_PROJECTION: FieldProjection = Object.freeze({
  left: 0,
  top: 0,
  width: 1,
  height: 1,
});

const SPOTLIGHT_RADIUS_X = 0.115;
const SPOTLIGHT_RADIUS_Y = 0.165;

export function getFieldProjection(
  surfaceWidth: number,
  surfaceHeight: number,
): FieldProjection {
  if (surfaceWidth <= 620 || surfaceHeight <= 620) {
    return { left: 0, top: 0, width: 1, height: 0.74 };
  }
  return FULL_FIELD_PROJECTION;
}

export function projectFieldPoint(
  point: Point,
  projection: FieldProjection,
): Point {
  return {
    x: projection.left + point.x * projection.width,
    y: projection.top + point.y * projection.height,
  };
}

export function unprojectFieldPoint(
  point: Point,
  projection: FieldProjection,
): Point {
  return {
    x: Math.min(1, Math.max(0, (point.x - projection.left) / projection.width)),
    y: Math.min(1, Math.max(0, (point.y - projection.top) / projection.height)),
  };
}

export function getRevealedPieceIds(
  pieces: readonly PilePiece[],
  light: Point | null,
  retainedPieceIds: readonly (string | null)[] = [],
): ReadonlySet<string> {
  const pieceIds = new Set(pieces.map((piece) => piece.id));
  const ids = new Set(
    retainedPieceIds.filter((pieceId): pieceId is string =>
      pieceId !== null && pieceIds.has(pieceId)
    ),
  );
  if (!light) return ids;
  for (const piece of pieces) {
    const distance = Math.hypot(
      (piece.pile.x - light.x) / SPOTLIGHT_RADIUS_X,
      (piece.pile.y - light.y) / SPOTLIGHT_RADIUS_Y,
    );
    if (distance <= 1) ids.add(piece.id);
  }
  return ids;
}

export function moveSpotlight(
  current: Point | null,
  direction: SpotlightDirection,
  fast = false,
): Point {
  const origin = current ?? { x: 0.5, y: 0.45 };
  const multiplier = fast ? 2 : 1;
  const movement: Readonly<Record<SpotlightDirection, Point>> = {
    up: { x: 0, y: -0.075 },
    right: { x: 0.055, y: 0 },
    down: { x: 0, y: 0.075 },
    left: { x: -0.055, y: 0 },
  };
  const delta = movement[direction];
  return {
    x: Math.min(0.94, Math.max(0.06, origin.x + delta.x * multiplier)),
    y: Math.min(0.88, Math.max(0.1, origin.y + delta.y * multiplier)),
  };
}

export function findNearestRevealedPiece(
  pieces: readonly PilePiece[],
  revealedIds: ReadonlySet<string>,
  light: Point,
): PilePiece | null {
  return [...pieces]
    .filter((piece) => revealedIds.has(piece.id))
    .sort((first, second) =>
      Math.hypot(first.pile.x - light.x, first.pile.y - light.y) -
      Math.hypot(second.pile.x - light.x, second.pile.y - light.y)
    )[0] ?? null;
}
