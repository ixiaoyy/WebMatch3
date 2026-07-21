import { randomBetween, sampleIndex } from "./ambient-random";
import {
  JELLY_KINDS,
  type AmbientGameState,
  type JellyKind,
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
  readonly kindCount: 3 | 4;
}

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
]);

const HIT_WIDTH = 0.2;
// The rendered jelly target is about 86px tall inside the 300px pile surface.
// Keep the canonical hit geometry aligned with that visual footprint so a
// vertically covered jelly cannot remain selectable through its lower half.
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
  kind: JellyKind,
  template: PieceTemplate,
  random: RandomSource,
  layer: 0 | 1 | 2,
): PilePiece {
  return {
    id: `jelly-${id}`,
    kind,
    pile: jitterPoint(template.pile, random, 0.012),
    spread: jitterPoint(template.spread, random, 0.014),
    rotation: template.rotation + randomBetween(random, -3, 3),
    scale: template.scale + randomBetween(random, -0.025, 0.025),
    layer,
  };
}

export function getLevelConfig(level: number): LevelConfig {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError("Level must be a positive safe integer.");
  }
  return {
    pieceCount: Math.min(36, 18 + (level - 1) * 3),
    layerCount: level >= 3 ? 3 : 2,
    kindCount: level >= 2 ? 4 : 3,
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
  const activeKinds = JELLY_KINDS.slice(0, config.kindCount);
  const kindOffset = sampleIndex(random, activeKinds.length);
  const pieces = Array.from({ length: config.pieceCount }, (_, offset) => {
    const groupIndex = Math.floor(offset / 3);
    const kind = activeKinds[(kindOffset + groupIndex) % activeKinds.length];
    const template = TEMPLATES[(nextPieceId + offset - 1) % TEMPLATES.length];
    return createPiece(
      nextPieceId + offset,
      kind,
      template,
      random,
      groupLayers[groupIndex],
    );
  });

  return {
    pieces,
    tray: [],
    clearCount,
    level,
    nextPieceId: nextPieceId + pieces.length,
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

export function getBlockerIds(
  pieces: readonly PilePiece[],
  pieceId: string,
): readonly string[] {
  const piece = pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) {
    return [];
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
  const counts = new Map<JellyKind, number>();
  for (const piece of getSelectablePieces(pieces)) {
    counts.set(piece.kind, (counts.get(piece.kind) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

export function returnTrayPiecesToPile(
  state: AmbientGameState,
  returned: readonly { readonly id: string; readonly kind: JellyKind }[],
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
      }
    : piece);
}
