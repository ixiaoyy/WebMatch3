import { randomBetween, sampleIndex, shuffle } from "./ambient-random";
import {
  FISH_KINDS,
  type AmbientGameState,
  type FishKind,
  type PilePiece,
  type Point,
  type RandomSource,
} from "./ambient-types";

export interface LevelConfig {
  readonly pieceCount: number;
  readonly layerCount: 2 | 3;
  readonly kindCount: 3 | 4 | 5 | 6 | 7 | 8;
}

interface LayoutRegion {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

const KIND_COUNT_BY_LEVEL = [3, 4, 5, 6, 7, 8] as const;
const INITIAL_PIECE_COUNT = 36;
const PIECE_COUNT_STEP = 6;
export const MAX_PIECE_COUNT = 60;

export const INITIAL_DISCOVERY_POINT: Point = Object.freeze({ x: 0.5, y: 0.45 });
export const DISCOVERY_RADIUS_X = 0.115;
export const DISCOVERY_RADIUS_Y = 0.165;

const FIELD_MIN_X = 0.06;
const FIELD_MAX_X = 0.9;
const FIELD_MIN_Y = 0.08;
const FIELD_MAX_Y = 0.8;
const RESERVED_CORNER_MIN_X = 0.72;
const RESERVED_CORNER_MAX_Y = 0.36;
const MAX_LAYOUT_ATTEMPTS = 24;
// Random layouts keep extra breathing room. The fallback uses a denser,
// pre-verified lattice so all 20 groups still fit without unbounded retries.
const MIN_RANDOM_GROUP_FOOTPRINT_DISTANCE = 0.6;
const MIN_FALLBACK_GROUP_FOOTPRINT_DISTANCE = 0.44;
const MIN_DISCOVERY_FOOTPRINT_DISTANCE = 0.5;
const TAU = Math.PI * 2;

const LAYOUT_REGIONS: readonly LayoutRegion[] = Object.freeze([
  { minX: 0.14, maxX: 0.2, minY: 0.15, maxY: 0.21 },
  { minX: 0.37, maxX: 0.44, minY: 0.15, maxY: 0.22 },
  { minX: 0.59, maxX: 0.64, minY: 0.15, maxY: 0.23 },
  { minX: 0.15, maxX: 0.22, minY: 0.41, maxY: 0.49 },
  { minX: 0.68, maxX: 0.75, minY: 0.43, maxY: 0.5 },
  { minX: 0.15, maxX: 0.22, minY: 0.68, maxY: 0.72 },
  { minX: 0.41, maxX: 0.49, minY: 0.68, maxY: 0.72 },
  { minX: 0.79, maxX: 0.82, minY: 0.69, maxY: 0.72 },
]);

const HIT_WIDTH = 0.2;
// Rotation never changes the overlap footprint, keeping 360-degree fish aligned
// with their stable interaction and settling relationships.
const HIT_HEIGHT = 0.29;
const BLOCKED_OVERLAP_RATIO = 0.28;

export function isSafeFieldPoint(point: Point): boolean {
  return Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= FIELD_MIN_X &&
    point.x <= FIELD_MAX_X &&
    point.y >= FIELD_MIN_Y &&
    point.y <= FIELD_MAX_Y &&
    !(point.x > RESERVED_CORNER_MIN_X && point.y < RESERVED_CORNER_MAX_Y);
}

function footprintDistance(first: Point, second: Point): number {
  return Math.hypot(
    (first.x - second.x) / HIT_WIDTH,
    (first.y - second.y) / HIT_HEIGHT,
  );
}

function isSafeGroupCenter(point: Point): boolean {
  const maximumGroupRadius = 0.07;
  return point.x >= FIELD_MIN_X + maximumGroupRadius &&
    point.x <= FIELD_MAX_X - maximumGroupRadius &&
    point.y >= FIELD_MIN_Y + maximumGroupRadius &&
    point.y <= FIELD_MAX_Y - maximumGroupRadius &&
    !(point.x > RESERVED_CORNER_MIN_X - maximumGroupRadius &&
      point.y < RESERVED_CORNER_MAX_Y + maximumGroupRadius);
}

function sampleRegionPoint(region: LayoutRegion, random: RandomSource): Point {
  return {
    x: randomBetween(random, region.minX, region.maxX),
    y: randomBetween(random, region.minY, region.maxY),
  };
}

function getFallbackRegionPoint(
  region: LayoutRegion,
): Point {
  return {
    x: region.minX + (region.maxX - region.minX) * 0.2,
    y: region.minY + (region.maxY - region.minY) * 0.2,
  };
}

function sampleGlobalCenterPoint(random: RandomSource): Point {
  return {
    x: randomBetween(random, FIELD_MIN_X + 0.07, FIELD_MAX_X - 0.07),
    y: randomBetween(random, FIELD_MIN_Y + 0.07, FIELD_MAX_Y - 0.07),
  };
}

function canUseGroupCenter(
  point: Point,
  centers: readonly Point[],
  minimumDistance = MIN_RANDOM_GROUP_FOOTPRINT_DISTANCE,
): boolean {
  return isSafeGroupCenter(point) &&
    footprintDistance(point, INITIAL_DISCOVERY_POINT) >=
      MIN_DISCOVERY_FOOTPRINT_DISTANCE &&
    centers.every((center) =>
      footprintDistance(point, center) >= minimumDistance
    );
}

function createFallbackGroupCenters(groupCount: number): readonly Point[] {
  // Keep one center in every acceptance region before filling the remaining
  // capacity; slicing smaller levels must never reintroduce a large blank area.
  const coverage = [
    { x: 0.15, y: 0.16 },
    { x: 0.49, y: 0.16 },
    { x: 0.64, y: 0.29 },
    { x: 0.15, y: 0.42 },
    { x: 0.66, y: 0.55 },
    { x: 0.15, y: 0.72 },
    { x: 0.49, y: 0.72 },
    { x: 0.83, y: 0.72 },
  ] as const;
  const upper = [0.16, 0.29, 0.42].flatMap((y) =>
    [0.15, 0.32, 0.49, 0.64].map((x) => ({ x, y }))
  );
  const lower = [0.55, 0.72].flatMap((y) =>
    [0.15, 0.32, 0.49, 0.66, 0.83].map((x) => ({ x, y }))
  );
  const centers: Point[] = [];
  for (const candidate of [...coverage, ...upper, ...lower]) {
    if (canUseGroupCenter(
      candidate,
      centers,
      MIN_FALLBACK_GROUP_FOOTPRINT_DISTANCE,
    )) centers.push(candidate);
  }
  if (centers.length < groupCount) {
    throw new RangeError(
      `The deterministic layout fallback has ${centers.length}/${groupCount} groups.`,
    );
  }
  return centers.slice(0, groupCount);
}

function createGroupCenters(
  groupCount: number,
  random: RandomSource,
): readonly Point[] {
  const regions = shuffle(random, LAYOUT_REGIONS);
  const centers: Point[] = [];

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const region = regions[groupIndex % regions.length];
    let selectedCandidate: Point | null = null;

    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      const candidate = groupIndex < regions.length
        ? sampleRegionPoint(region, random)
        : sampleGlobalCenterPoint(random);
      if (canUseGroupCenter(candidate, centers)) {
        selectedCandidate = candidate;
        break;
      }
    }

    if (!selectedCandidate && groupIndex < regions.length) {
      const fallback = getFallbackRegionPoint(region);
      if (canUseGroupCenter(fallback, centers)) selectedCandidate = fallback;
    }
    if (!selectedCandidate) return createFallbackGroupCenters(groupCount);
    centers.push(selectedCandidate);
  }

  return centers;
}

function createGroupPoints(
  center: Point,
  groupIndex: number,
  random: RandomSource,
): readonly Point[] {
  const angle = randomBetween(random, 0, TAU);
  const radius = groupIndex % 4 === 0
    ? randomBetween(random, 0.06, 0.07)
    : randomBetween(random, 0.035, 0.05);
  return Array.from({ length: 3 }, (_, memberIndex) => {
    const memberAngle = angle + memberIndex * TAU / 3;
    return {
      x: center.x + Math.cos(memberAngle) * radius,
      y: center.y + Math.sin(memberAngle) * radius,
    };
  });
}

function createLayoutPoints(
  groupCount: number,
  random: RandomSource,
): readonly Point[] {
  return createGroupCenters(groupCount, random).flatMap((center, groupIndex) =>
    createGroupPoints(center, groupIndex, random)
  );
}

function createDiscoveryPoints(random: RandomSource): readonly Point[] {
  const anchor = {
    x: INITIAL_DISCOVERY_POINT.x + randomBetween(random, -0.018, 0.018),
    y: INITIAL_DISCOVERY_POINT.y + randomBetween(random, -0.025, 0.025),
  };
  const angle = randomBetween(random, 0, TAU);
  const radius = randomBetween(random, 0.052, 0.063);
  return Array.from({ length: 3 }, (_, index) => {
    const pointAngle = angle + index * TAU / 3;
    return {
      x: anchor.x + Math.cos(pointAngle) * radius,
      y: anchor.y + Math.sin(pointAngle) * radius,
    };
  });
}

function createPiece(
  id: number,
  kind: FishKind,
  random: RandomSource,
  layer: 0 | 1 | 2,
  fieldPoint: Point,
): PilePiece {
  return {
    id: `fish-${id}`,
    kind,
    pile: fieldPoint,
    spread: fieldPoint,
    rotation: randomBetween(random, 0, 360),
    scale: randomBetween(random, 0.92, 1.05),
    layer,
    blockerIds: [],
  };
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
  random: RandomSource,
): readonly (0 | 1 | 2)[] {
  const baseCount = Math.floor(groupCount / layerCount);
  const remainder = groupCount % layerCount;
  const layers: (0 | 1 | 2)[] = [];
  for (let layer = 0; layer < layerCount; layer += 1) {
    const groupsOnLayer = baseCount + (layer >= layerCount - remainder ? 1 : 0);
    layers.push(...Array.from({ length: groupsOnLayer }, () => layer as 0 | 1 | 2));
  }
  return shuffle(random, layers);
}

function createKindSchedule(
  activeKinds: readonly FishKind[],
  groupCount: number,
  kindOffset: number,
): readonly FishKind[] {
  // Build complete matching triples first, then deal them across spatial groups.
  const remaining = new Map(activeKinds.map((kind) => [kind, 0]));
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const kind = activeKinds[(kindOffset + groupIndex) % activeKinds.length];
    remaining.set(kind, (remaining.get(kind) ?? 0) + 3);
  }

  const kindIndexes = new Map(activeKinds.map((kind, index) => [kind, index]));
  const schedule: FishKind[] = [];
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const priorityStart = (kindOffset + groupIndex) % activeKinds.length;
    const groupKinds = activeKinds
      .filter((kind) => (remaining.get(kind) ?? 0) > 0)
      .sort((left, right) => {
        const countDifference =
          (remaining.get(right) ?? 0) - (remaining.get(left) ?? 0);
        if (countDifference !== 0) return countDifference;

        const leftPriority =
          ((kindIndexes.get(left) ?? 0) - priorityStart + activeKinds.length) %
          activeKinds.length;
        const rightPriority =
          ((kindIndexes.get(right) ?? 0) - priorityStart + activeKinds.length) %
          activeKinds.length;
        return leftPriority - rightPriority;
      })
      .slice(0, 3);

    if (groupKinds.length !== 3) {
      throw new RangeError("Unable to distribute three distinct fish kinds per group.");
    }

    for (const kind of groupKinds) {
      schedule.push(kind);
      remaining.set(kind, (remaining.get(kind) ?? 0) - 1);
    }
  }

  if ([...remaining.values()].some((count) => count !== 0)) {
    throw new RangeError("Unable to distribute the complete fish kind schedule.");
  }

  return schedule;
}

function ensureDiscoveryLayerVariety(
  groupLayers: readonly (0 | 1 | 2)[],
  discoveryIndexes: readonly number[],
): readonly (0 | 1 | 2)[] {
  const layers = [...groupLayers];
  const discoveryGroups = discoveryIndexes.map((index) => Math.floor(index / 3));
  if (new Set(discoveryGroups.map((groupIndex) => layers[groupIndex])).size > 1) {
    return layers;
  }
  const replacementGroup = layers.findIndex((layer, groupIndex) =>
    !discoveryGroups.includes(groupIndex) && layer !== layers[discoveryGroups[0]]
  );
  if (replacementGroup < 0) return layers;
  const targetGroup = discoveryGroups[1];
  [layers[targetGroup], layers[replacementGroup]] = [
    layers[replacementGroup],
    layers[targetGroup],
  ];
  return layers;
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

function withBlockerIds(pieces: readonly PilePiece[]): readonly PilePiece[] {
  return pieces.map((piece) => ({
    ...piece,
    blockerIds: pieces
      .filter((candidate) =>
        candidate.layer > piece.layer &&
        overlapRatio(piece, candidate) >= BLOCKED_OVERLAP_RATIO
      )
      .map((candidate) => candidate.id),
  }));
}

export function createLevelState(
  level: number,
  clearCount: number,
  nextPieceId: number,
  random: RandomSource = Math.random,
): AmbientGameState {
  const config = getLevelConfig(level);
  const groupCount = config.pieceCount / 3;
  const activeKinds = FISH_KINDS.slice(0, config.kindCount);
  const kindOffset = sampleIndex(random, activeKinds.length);
  const kindSchedule = createKindSchedule(activeKinds, groupCount, kindOffset);
  const discoveryKind = activeKinds[kindOffset];
  const discoveryIndexes = kindSchedule
    .map((kind, index) => kind === discoveryKind ? index : -1)
    .filter((index) => index >= 0)
    .slice(0, 3);
  const groupLayers = ensureDiscoveryLayerVariety(
    createGroupLayers(groupCount, config.layerCount, random),
    discoveryIndexes,
  );
  const positions = [...createLayoutPoints(groupCount, random)];
  const discoveryPoints = createDiscoveryPoints(random);
  for (let index = 0; index < discoveryIndexes.length; index += 1) {
    positions[discoveryIndexes[index]] = discoveryPoints[index];
  }
  const pieces = Array.from({ length: config.pieceCount }, (_, offset) =>
    createPiece(
      nextPieceId + offset,
      kindSchedule[offset],
      random,
      groupLayers[Math.floor(offset / 3)],
      positions[offset],
    )
  );
  const piecesWithBlockers = withBlockerIds(pieces);

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

export function getBlockerIds(
  pieces: readonly PilePiece[],
  pieceId: string,
): readonly string[] {
  const piece = pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) return [];

  if (piece.blockerIds !== undefined) {
    const remainingIds = new Set(pieces.map((candidate) => candidate.id));
    return piece.blockerIds.filter((blockerId) => remainingIds.has(blockerId));
  }

  return pieces
    .filter((candidate) =>
      candidate.layer > piece.layer &&
      overlapRatio(piece, candidate) >= BLOCKED_OVERLAP_RATIO
    )
    .map((candidate) => candidate.id);
}

export function getSelectablePieces(
  pieces: readonly PilePiece[],
): readonly PilePiece[] {
  return pieces;
}

export function hasQuickMatch(pieces: readonly PilePiece[]): boolean {
  const counts = new Map<FishKind, number>();
  for (const piece of getSelectablePieces(pieces)) {
    counts.set(piece.kind, (counts.get(piece.kind) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

export function hasDiscoverableMatch(pieces: readonly PilePiece[]): boolean {
  const candidatesByKind = new Map<FishKind, PilePiece[]>();
  for (const piece of getSelectablePieces(pieces)) {
    const distance = Math.hypot(
      (piece.pile.x - INITIAL_DISCOVERY_POINT.x) / DISCOVERY_RADIUS_X,
      (piece.pile.y - INITIAL_DISCOVERY_POINT.y) / DISCOVERY_RADIUS_Y,
    );
    if (distance > 1) continue;
    const candidates = candidatesByKind.get(piece.kind) ?? [];
    candidates.push(piece);
    candidatesByKind.set(piece.kind, candidates);
  }
  return [...candidatesByKind.values()].some((candidates) =>
    candidates.length >= 3 &&
    new Set(candidates.map((piece) => piece.layer)).size >= 2
  );
}
