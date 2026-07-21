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
  readonly layer: 0 | 1 | 2;
}
const TEMPLATES: readonly PieceTemplate[] = Object.freeze([
  { pile: { x: 0.24, y: 0.69 }, spread: { x: 0.08, y: 0.22 }, rotation: -12, scale: 0.94, layer: 0 },
  { pile: { x: 0.43, y: 0.73 }, spread: { x: 0.30, y: 0.12 }, rotation: 9, scale: 1.02, layer: 0 },
  { pile: { x: 0.62, y: 0.70 }, spread: { x: 0.56, y: 0.18 }, rotation: -5, scale: 0.96, layer: 0 },
  { pile: { x: 0.79, y: 0.72 }, spread: { x: 0.84, y: 0.12 }, rotation: 14, scale: 0.92, layer: 0 },
  { pile: { x: 0.31, y: 0.51 }, spread: { x: 0.18, y: 0.47 }, rotation: 7, scale: 0.98, layer: 0 },
  { pile: { x: 0.53, y: 0.52 }, spread: { x: 0.48, y: 0.42 }, rotation: -10, scale: 1.03, layer: 0 },
  { pile: { x: 0.72, y: 0.51 }, spread: { x: 0.77, y: 0.38 }, rotation: 5, scale: 0.95, layer: 0 },
  { pile: { x: 0.39, y: 0.61 }, spread: { x: 0.10, y: 0.76 }, rotation: -8, scale: 1.03, layer: 1 },
  { pile: { x: 0.58, y: 0.62 }, spread: { x: 0.35, y: 0.70 }, rotation: 12, scale: 0.94, layer: 1 },
  { pile: { x: 0.73, y: 0.62 }, spread: { x: 0.65, y: 0.76 }, rotation: -4, scale: 1.01, layer: 1 },
  { pile: { x: 0.35, y: 0.42 }, spread: { x: 0.91, y: 0.61 }, rotation: 13, scale: 0.92, layer: 1 },
  { pile: { x: 0.55, y: 0.40 }, spread: { x: 0.24, y: 0.91 }, rotation: -11, scale: 1.04, layer: 1 },
  { pile: { x: 0.70, y: 0.40 }, spread: { x: 0.53, y: 0.92 }, rotation: 4, scale: 0.97, layer: 1 },
  { pile: { x: 0.45, y: 0.52 }, spread: { x: 0.82, y: 0.89 }, rotation: -6, scale: 1.05, layer: 2 },
  { pile: { x: 0.62, y: 0.51 }, spread: { x: 0.20, y: 0.31 }, rotation: 10, scale: 0.96, layer: 2 },
  { pile: { x: 0.51, y: 0.34 }, spread: { x: 0.69, y: 0.26 }, rotation: -9, scale: 1.02, layer: 2 },
  { pile: { x: 0.31, y: 0.58 }, spread: { x: 0.40, y: 0.28 }, rotation: 6, scale: 0.93, layer: 2 },
  { pile: { x: 0.69, y: 0.58 }, spread: { x: 0.95, y: 0.32 }, rotation: -3, scale: 1.04, layer: 2 },
]);

const HIT_WIDTH = 0.2;
const HIT_HEIGHT = 0.18;
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
  forceTopLayer = false,
): PilePiece {
  return {
    id: `jelly-${id}`,
    kind,
    pile: jitterPoint(template.pile, random, 0.012),
    spread: jitterPoint(template.spread, random, 0.014),
    rotation: template.rotation + randomBetween(random, -3, 3),
    scale: template.scale + randomBetween(random, -0.025, 0.025),
    layer: forceTopLayer ? 2 : template.layer,
  };
}

export function createInitialState(
  random: RandomSource = Math.random,
): AmbientGameState {
  const guaranteedKind = JELLY_KINDS[sampleIndex(random, JELLY_KINDS.length)];
  const pieces = TEMPLATES.map((template, index) => {
    const kind = index >= 13 && index <= 15
      ? guaranteedKind
      : JELLY_KINDS[sampleIndex(random, JELLY_KINDS.length)];
    return createPiece(index + 1, kind, template, random);
  });

  return {
    pieces,
    tray: [],
    clearCount: 0,
    nextPieceId: pieces.length + 1,
  };
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

export function createReplacementPieces(
  state: AmbientGameState,
  random: RandomSource,
  count = 3,
): readonly PilePiece[] {
  const kind = JELLY_KINDS[sampleIndex(random, JELLY_KINDS.length)];
  return Array.from({ length: count }, (_, offset) => {
    const template = TEMPLATES[(state.nextPieceId + offset) % TEMPLATES.length];
    return createPiece(state.nextPieceId + offset, kind, template, random, true);
  });
}

export function returnTrayPiecesToPile(
  state: AmbientGameState,
  returnedKinds: readonly JellyKind[],
  random: RandomSource,
): readonly PilePiece[] {
  return returnedKinds.map((kind, offset) => {
    const template = TEMPLATES[(state.nextPieceId + offset) % TEMPLATES.length];
    return createPiece(state.nextPieceId + offset, kind, template, random, true);
  });
}
