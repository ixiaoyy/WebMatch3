import { randomBetween, sampleIndex } from "./ambient-random";
import {
  FISH_KINDS,
  type AmbientGameState,
  type FishKind,
  type PilePiece,
  type Point,
  type RandomSource,
} from "./ambient-types";

interface PieceTemplate {
  readonly pile: Point;
  readonly spread: Point;
  readonly rotation: number;
  readonly scale: number;
}

export interface LevelConfig {
  readonly pieceCount: number;
  readonly layerCount: 2 | 3;
  readonly kindCount: 3 | 4 | 5 | 6 | 7 | 8;
}

const KIND_COUNT_BY_LEVEL = [3, 4, 5, 6, 7, 8] as const;
const INITIAL_PIECE_COUNT = 36;
const PIECE_COUNT_STEP = 6;

const SCATTER_POINTS = [
  { x: 0.16, y: 0.28 },
  { x: 0.46, y: 0.17 },
  { x: 0.77, y: 0.30 },
] as const;
const CLUSTER_ANCHORS = [
  { x: 0.34, y: 0.39 },
  { x: 0.64, y: 0.40 },
  { x: 0.81, y: 0.56 },
  { x: 0.49, y: 0.59 },
  { x: 0.23, y: 0.66 },
  { x: 0.66, y: 0.71 },
] as const;
const CLUSTER_OFFSETS = [
  { x: -0.027, y: 0.018 },
  { x: 0, y: -0.023 },
  { x: 0.029, y: 0.019 },
] as const;

const TEMPLATES: readonly PieceTemplate[] = Object.freeze([
  { pile: { x: 0.24, y: 0.69 }, spread: { x: 0.08, y: 0.22 }, rotation: -12, scale: 0.94 },
  { pile: { x: 0.43, y: 0.73 }, spread: { x: 0.30, y: 0.12 }, rotation: 9, scale: 1.02 },
  { pile: { x: 0.62, y: 0.70 }, spread: { x: 0.56, y: 0.18 }, rotation: -5, scale: 0.96 },
  { pile: { x: 0.79, y: 0.72 }, spread: { x: 0.84, y: 0.12 }, rotation: 14, scale: 0.92 },
  { pile: { x: 0.31, y: 0.51 }, spread: { x: 0.18, y: 0.47 }, rotation: 7, scale: 0.98 },
  { pile: { x: 0.53, y: 0.52 }, spread: { x: 0.48, y: 0.42 }, rotation: -10, scale: 1.03 },
  { pile: { x: 0.72, y: 0.51 }, spread: { x: 0.77, y: 0.38 }, rotation: 5, scale: 0.95 },
  { pile: { x: 0.39, y: 0.61 }, spread: { x: 0.10, y: 0.76 }, rotation: -8, scale: 1.03 },
  { pile: { x: 0.58, y: 0.62 }, spread: { x: 0.35, y: 0.70 }, rotation: 12, scale: 0.94 },
  { pile: { x: 0.73, y: 0.62 }, spread: { x: 0.65, y: 0.76 }, rotation: -4, scale: 1.01 },
  { pile: { x: 0.35, y: 0.42 }, spread: { x: 0.91, y: 0.61 }, rotation: 13, scale: 0.92 },
  { pile: { x: 0.55, y: 0.40 }, spread: { x: 0.24, y: 0.91 }, rotation: -11, scale: 1.04 },
  { pile: { x: 0.70, y: 0.40 }, spread: { x: 0.53, y: 0.92 }, rotation: 4, scale: 0.97 },
  { pile: { x: 0.45, y: 0.52 }, spread: { x: 0.82, y: 0.89 }, rotation: -6, scale: 1.05 },
  { pile: { x: 0.62, y: 0.51 }, spread: { x: 0.20, y: 0.31 }, rotation: 10, scale: 0.96 },
  { pile: { x: 0.51, y: 0.34 }, spread: { x: 0.69, y: 0.26 }, rotation: -9, scale: 1.02 },
  { pile: { x: 0.31, y: 0.58 }, spread: { x: 0.40, y: 0.28 }, rotation: 6, scale: 0.93 },
  { pile: { x: 0.69, y: 0.58 }, spread: { x: 0.95, y: 0.32 }, rotation: -3, scale: 1.04 },
  { pile: { x: 0.20, y: 0.57 }, spread: { x: 0.05, y: 0.52 }, rotation: 11, scale: 0.91 },
  { pile: { x: 0.82, y: 0.57 }, spread: { x: 0.96, y: 0.54 }, rotation: -13, scale: 0.98 },
  { pile: { x: 0.27, y: 0.36 }, spread: { x: 0.07, y: 0.92 }, rotation: -7, scale: 1.02 },
  { pile: { x: 0.76, y: 0.34 }, spread: { x: 0.94, y: 0.84 }, rotation: 8, scale: 0.95 },
  { pile: { x: 0.42, y: 0.27 }, spread: { x: 0.41, y: 0.06 }, rotation: 15, scale: 0.93 },
  { pile: { x: 0.64, y: 0.26 }, spread: { x: 0.69, y: 0.08 }, rotation: -12, scale: 1.01 },
  { pile: { x: 0.18, y: 0.76 }, spread: { x: 0.23, y: 0.58 }, rotation: 4, scale: 0.96 },
  { pile: { x: 0.86, y: 0.75 }, spread: { x: 0.73, y: 0.55 }, rotation: -5, scale: 0.92 },
  { pile: { x: 0.50, y: 0.82 }, spread: { x: 0.50, y: 0.82 }, rotation: 9, scale: 1.04 },
  { pile: { x: 0.30, y: 0.78 }, spread: { x: 0.15, y: 0.36 }, rotation: -14, scale: 0.97 },
  { pile: { x: 0.72, y: 0.79 }, spread: { x: 0.86, y: 0.30 }, rotation: 7, scale: 1.00 },
  { pile: { x: 0.20, y: 0.44 }, spread: { x: 0.34, y: 0.96 }, rotation: 12, scale: 0.94 },
  { pile: { x: 0.84, y: 0.45 }, spread: { x: 0.62, y: 0.96 }, rotation: -9, scale: 1.03 },
  { pile: { x: 0.37, y: 0.47 }, spread: { x: 0.31, y: 0.35 }, rotation: 5, scale: 0.95 },
  { pile: { x: 0.67, y: 0.45 }, spread: { x: 0.59, y: 0.34 }, rotation: -4, scale: 1.02 },
  { pile: { x: 0.52, y: 0.58 }, spread: { x: 0.79, y: 0.68 }, rotation: 13, scale: 0.92 },
  { pile: { x: 0.41, y: 0.37 }, spread: { x: 0.44, y: 0.58 }, rotation: -10, scale: 1.04 },
  { pile: { x: 0.61, y: 0.36 }, spread: { x: 0.98, y: 0.70 }, rotation: 6, scale: 0.96 },
  { pile: { x: 0.14, y: 0.64 }, spread: { x: 0.12, y: 0.10 }, rotation: -6, scale: 0.95 },
  { pile: { x: 0.88, y: 0.63 }, spread: { x: 0.88, y: 0.22 }, rotation: 11, scale: 1.01 },
  { pile: { x: 0.22, y: 0.29 }, spread: { x: 0.05, y: 0.36 }, rotation: -13, scale: 0.93 },
  { pile: { x: 0.83, y: 0.29 }, spread: { x: 0.95, y: 0.44 }, rotation: 7, scale: 1.03 },
  { pile: { x: 0.29, y: 0.67 }, spread: { x: 0.14, y: 0.66 }, rotation: 4, scale: 0.97 },
  { pile: { x: 0.77, y: 0.67 }, spread: { x: 0.89, y: 0.73 }, rotation: -8, scale: 0.94 },
  { pile: { x: 0.46, y: 0.78 }, spread: { x: 0.27, y: 0.83 }, rotation: 12, scale: 1.02 },
  { pile: { x: 0.56, y: 0.76 }, spread: { x: 0.59, y: 0.84 }, rotation: -4, scale: 0.96 },
  { pile: { x: 0.25, y: 0.40 }, spread: { x: 0.08, y: 0.64 }, rotation: 9, scale: 1.04 },
  { pile: { x: 0.79, y: 0.41 }, spread: { x: 0.93, y: 0.63 }, rotation: -11, scale: 0.92 },
  { pile: { x: 0.33, y: 0.32 }, spread: { x: 0.19, y: 0.16 }, rotation: 5, scale: 0.98 },
  { pile: { x: 0.69, y: 0.31 }, spread: { x: 0.78, y: 0.16 }, rotation: -7, scale: 1.01 },
  { pile: { x: 0.46, y: 0.45 }, spread: { x: 0.37, y: 0.48 }, rotation: 14, scale: 0.94 },
  { pile: { x: 0.58, y: 0.46 }, spread: { x: 0.64, y: 0.48 }, rotation: -12, scale: 1.03 },
  { pile: { x: 0.49, y: 0.63 }, spread: { x: 0.47, y: 0.68 }, rotation: 3, scale: 0.96 },
  { pile: { x: 0.60, y: 0.67 }, spread: { x: 0.72, y: 0.68 }, rotation: -5, scale: 1.02 },
  { pile: { x: 0.39, y: 0.70 }, spread: { x: 0.25, y: 0.74 }, rotation: 10, scale: 0.93 },
  { pile: { x: 0.67, y: 0.73 }, spread: { x: 0.76, y: 0.76 }, rotation: -9, scale: 0.99 },
  { pile: { x: 0.24, y: 0.79 }, spread: { x: 0.06, y: 0.84 }, rotation: 6, scale: 1.04 },
  { pile: { x: 0.80, y: 0.80 }, spread: { x: 0.94, y: 0.92 }, rotation: -14, scale: 0.95 },
  { pile: { x: 0.16, y: 0.50 }, spread: { x: 0.16, y: 0.40 }, rotation: 8, scale: 0.97 },
  { pile: { x: 0.88, y: 0.50 }, spread: { x: 0.86, y: 0.48 }, rotation: -6, scale: 1.03 },
  { pile: { x: 0.45, y: 0.29 }, spread: { x: 0.38, y: 0.18 }, rotation: 11, scale: 0.94 },
  { pile: { x: 0.57, y: 0.28 }, spread: { x: 0.61, y: 0.20 }, rotation: -10, scale: 1.02 },
]);

export const MAX_PIECE_COUNT = TEMPLATES.length;

const HIT_WIDTH = 0.2;
// The rendered fish target is about 86px tall inside the 300px pile surface.
// Keep the canonical hit geometry aligned with that visual footprint so a
// vertically covered fish cannot remain selectable through its lower half.
const HIT_HEIGHT = 0.29;
const BLOCKED_OVERLAP_RATIO = 0.28;

function jitterPoint(point: Point, random: RandomSource, amount: number): Point {
  return {
    x: Math.min(0.98, Math.max(0.02, point.x + randomBetween(random, -amount, amount))),
    y: Math.min(0.98, Math.max(0.02, point.y + randomBetween(random, -amount, amount))),
  };
}

function createPiece(
  id: number,
  kind: FishKind,
  template: PieceTemplate,
  random: RandomSource,
  layer: 0 | 1 | 2,
  fieldPoint: Point,
): PilePiece {
  const position = jitterPoint(fieldPoint, random, 0.006);
  return {
    id: `fish-${id}`,
    kind,
    pile: position,
    spread: position,
    rotation: template.rotation + randomBetween(random, -3, 3),
    scale: template.scale + randomBetween(random, -0.025, 0.025),
    layer,
    blockerIds: [],
  };
}

function getFieldPoint(slotIndex: number, memberIndex: number): Point {
  if (slotIndex === 0) return SCATTER_POINTS[memberIndex];
  const anchor = CLUSTER_ANCHORS[(slotIndex - 1) % CLUSTER_ANCHORS.length];
  const offset = CLUSTER_OFFSETS[memberIndex];
  return { x: anchor.x + offset.x, y: anchor.y + offset.y };
}

export function getLevelConfig(level: number): LevelConfig {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError("Level must be a positive safe integer.");
  }
  return {
    pieceCount: Math.min(
      MAX_PIECE_COUNT,
      INITIAL_PIECE_COUNT + (level - 1) * PIECE_COUNT_STEP,
    ),
    layerCount: level >= 3 ? 3 : 2,
    kindCount: KIND_COUNT_BY_LEVEL[
      Math.min(level - 1, KIND_COUNT_BY_LEVEL.length - 1)
    ],
  };
}

function createGroupLayers(
  groupCount: number,
  layerCount: 2 | 3,
): readonly (0 | 1 | 2)[] {
  const baseCount = Math.floor(groupCount / layerCount);
  const remainder = groupCount % layerCount;
  const layers: (0 | 1 | 2)[] = [];
  for (let layer = 0; layer < layerCount; layer += 1) {
    const groupsOnLayer = baseCount + (layer >= layerCount - remainder ? 1 : 0);
    layers.push(...Array.from({ length: groupsOnLayer }, () => layer as 0 | 1 | 2));
  }
  return layers;
}

export function createLevelState(
  level: number,
  clearCount: number,
  nextPieceId: number,
  random: RandomSource = Math.random,
): AmbientGameState {
  const config = getLevelConfig(level);
  const groupCount = config.pieceCount / 3;
  const groupLayers = createGroupLayers(groupCount, config.layerCount);
  const layerSlots = new Map<0 | 1 | 2, number>();
  const groupSlots = groupLayers.map((layer) => {
    const slot = layerSlots.get(layer) ?? 0;
    layerSlots.set(layer, slot + 1);
    return slot;
  });
  const activeKinds = FISH_KINDS.slice(0, config.kindCount);
  const kindOffset = sampleIndex(random, activeKinds.length);
  const pieces = Array.from({ length: config.pieceCount }, (_, offset) => {
    const groupIndex = Math.floor(offset / 3);
    const kind = activeKinds[(kindOffset + groupIndex) % activeKinds.length];
    const template = TEMPLATES[(nextPieceId + offset - 1) % TEMPLATES.length];
    const memberIndex = offset % 3;
    return createPiece(
      nextPieceId + offset,
      kind,
      template,
      random,
      groupLayers[groupIndex],
      getFieldPoint(groupSlots[groupIndex], memberIndex),
    );
  });
  const piecesWithBlockers = pieces.map((piece) => ({
    ...piece,
    blockerIds: pieces
      .filter(
        (candidate) =>
          candidate.layer > piece.layer &&
          fieldOverlapRatio(piece, candidate) >= BLOCKED_OVERLAP_RATIO,
      )
      .map((candidate) => candidate.id),
  }));

  return {
    pieces: piecesWithBlockers,
    tray: [],
    fed: [],
    clearCount,
    level,
    nextPieceId: nextPieceId + piecesWithBlockers.length,
  };
}

export function createInitialState(
  random: RandomSource = Math.random,
): AmbientGameState {
  return createLevelState(1, 0, 1, random);
}

function overlapRatio(lower: PilePiece, upper: PilePiece): number {
  const lowerWidth = HIT_WIDTH * lower.scale;
  const lowerHeight = HIT_HEIGHT * lower.scale;
  const upperWidth = HIT_WIDTH * upper.scale;
  const upperHeight = HIT_HEIGHT * upper.scale;
  const overlapWidth = Math.max(
    0,
    Math.min(lower.pile.x + lowerWidth / 2, upper.pile.x + upperWidth / 2) -
      Math.max(lower.pile.x - lowerWidth / 2, upper.pile.x - upperWidth / 2),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(lower.pile.y + lowerHeight / 2, upper.pile.y + upperHeight / 2) -
      Math.max(lower.pile.y - lowerHeight / 2, upper.pile.y - upperHeight / 2),
  );
  return (overlapWidth * overlapHeight) / (lowerWidth * lowerHeight);
}

function fieldOverlapRatio(lower: PilePiece, upper: PilePiece): number {
  const horizontalDistance = Math.abs(lower.pile.x - upper.pile.x);
  const verticalDistance = Math.abs(lower.pile.y - upper.pile.y);
  const overlapWidth = Math.max(0, 0.075 - horizontalDistance);
  const overlapHeight = Math.max(0, 0.105 - verticalDistance);
  return (overlapWidth * overlapHeight) / (0.075 * 0.105);
}

export function getBlockerIds(
  pieces: readonly PilePiece[],
  pieceId: string,
): readonly string[] {
  const piece = pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) {
    return [];
  }

  if (piece.blockerIds) {
    const remainingIds = new Set(pieces.map((candidate) => candidate.id));
    return piece.blockerIds.filter((blockerId) => remainingIds.has(blockerId));
  }

  return pieces
    .filter(
      (candidate) =>
        candidate.layer > piece.layer &&
        overlapRatio(piece, candidate) >= BLOCKED_OVERLAP_RATIO,
    )
    .map((candidate) => candidate.id);
}

export function getSelectablePieces(
  pieces: readonly PilePiece[],
): readonly PilePiece[] {
  return pieces.filter((piece) => getBlockerIds(pieces, piece.id).length === 0);
}

export function hasQuickMatch(pieces: readonly PilePiece[]): boolean {
  const counts = new Map<FishKind, number>();
  for (const piece of getSelectablePieces(pieces)) {
    counts.set(piece.kind, (counts.get(piece.kind) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

export function returnTrayPiecesToPile(
  state: AmbientGameState,
  returned: readonly { readonly id: string; readonly kind: FishKind }[],
  random: RandomSource,
): readonly PilePiece[] {
  const recoveryAnchors = [
    { pile: { x: 0.14, y: 0.22 }, spread: { x: 0.08, y: 0.20 } },
    { pile: { x: 0.86, y: 0.22 }, spread: { x: 0.92, y: 0.20 } },
  ] as const;
  return returned.map((piece, offset) => {
    const template = TEMPLATES[(state.pieces.length + offset) % TEMPLATES.length];
    const anchor = recoveryAnchors[offset % recoveryAnchors.length];
    return {
      id: piece.id,
      kind: piece.kind,
      pile: jitterPoint(anchor.pile, random, 0.008),
      spread: jitterPoint(anchor.spread, random, 0.008),
      rotation: template.rotation,
      scale: template.scale,
      layer: 2,
      blockerIds: [],
    };
  });
}

export function exposePieceForRecovery(
  pieces: readonly PilePiece[],
  pieceId: string,
  random: RandomSource,
): readonly PilePiece[] {
  return pieces.map((piece) => piece.id === pieceId
    ? {
        ...piece,
        pile: jitterPoint({ x: 0.5, y: 0.18 }, random, 0.008),
        spread: jitterPoint({ x: 0.5, y: 0.12 }, random, 0.008),
        layer: 2,
        blockerIds: [],
      }
    : piece);
}
