import {
  JELLY_KINDS,
  createInitialState,
  type AmbientGameState,
  type JellyKind,
  type PilePiece,
  type Point,
  type RandomSource,
  type TrayPiece,
} from "../engine";

export const AMBIENT_STORAGE_KEY = "web-match3:ambient-state";
export const AMBIENT_SNAPSHOT_VERSION = 1;

export interface AmbientPreferences {
  readonly soundEnabled: boolean;
}

export interface AmbientPlantProgress {
  readonly plantedAt: number;
}

export interface AmbientSnapshotV1 {
  readonly version: 1;
  readonly game: AmbientGameState;
  readonly preferences: AmbientPreferences;
  readonly plant: AmbientPlantProgress;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCounter(value: unknown, minimum: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= minimum;
}

function isFiniteInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum;
}

function isJellyKind(value: unknown): value is JellyKind {
  return typeof value === "string" && JELLY_KINDS.includes(value as JellyKind);
}

function parsePoint(value: unknown): Point | null {
  if (!isRecord(value)) return null;
  if (!isFiniteInRange(value.x, 0, 1) || !isFiniteInRange(value.y, 0, 1)) {
    return null;
  }
  return { x: value.x, y: value.y };
}

function parsePilePiece(value: unknown): PilePiece | null {
  if (!isRecord(value)) return null;
  const pile = parsePoint(value.pile);
  const spread = parsePoint(value.spread);
  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    !isJellyKind(value.kind) ||
    !pile ||
    !spread ||
    !isFiniteInRange(value.rotation, -360, 360) ||
    !isFiniteInRange(value.scale, 0.5, 1.5) ||
    (value.layer !== 0 && value.layer !== 1 && value.layer !== 2)
  ) {
    return null;
  }
  return {
    id: value.id,
    kind: value.kind,
    pile,
    spread,
    rotation: value.rotation,
    scale: value.scale,
    layer: value.layer,
  };
}

function parseTrayPiece(value: unknown): TrayPiece | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0 || !isJellyKind(value.kind)) {
    return null;
  }
  return { id: value.id, kind: value.kind };
}

function parseGame(value: unknown): AmbientGameState | null {
  if (!isRecord(value) || !Array.isArray(value.pieces) || !Array.isArray(value.tray)) {
    return null;
  }
  if (value.pieces.length > 18 || value.tray.length > 7) return null;
  if (value.pieces.length + value.tray.length !== 18) return null;

  const pieces = value.pieces.map(parsePilePiece);
  const tray = value.tray.map(parseTrayPiece);
  if (pieces.some((piece) => piece === null) || tray.some((piece) => piece === null)) {
    return null;
  }

  const parsedPieces = pieces.filter((piece): piece is PilePiece => piece !== null);
  const parsedTray = tray.filter((piece): piece is TrayPiece => piece !== null);
  const ids = [...parsedPieces.map((piece) => piece.id), ...parsedTray.map((piece) => piece.id)];
  if (new Set(ids).size !== ids.length) return null;
  if (!isSafeCounter(value.clearCount, 0) || !isSafeCounter(value.nextPieceId, 1)) {
    return null;
  }

  return {
    pieces: parsedPieces,
    tray: parsedTray,
    clearCount: value.clearCount,
    nextPieceId: value.nextPieceId,
  };
}

export function parseAmbientSnapshot(
  value: unknown,
  now = Date.now(),
): AmbientSnapshotV1 | null {
  if (!isRecord(value) || value.version !== AMBIENT_SNAPSHOT_VERSION) return null;
  if (!isRecord(value.preferences) || typeof value.preferences.soundEnabled !== "boolean") {
    return null;
  }
  const game = parseGame(value.game);
  if (!game) return null;
  let plantedAt = now;
  if (value.plant !== undefined) {
    if (!isRecord(value.plant) || !isSafeCounter(value.plant.plantedAt, 0)) {
      return null;
    }
    plantedAt = value.plant.plantedAt;
  }
  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game,
    preferences: { soundEnabled: value.preferences.soundEnabled },
    plant: { plantedAt },
  };
}

export function createFreshSnapshot(
  random: RandomSource = Math.random,
  now = Date.now(),
): AmbientSnapshotV1 {
  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game: createInitialState(random),
    preferences: { soundEnabled: false },
    plant: { plantedAt: now },
  };
}

export function loadAmbientSnapshot(
  storage: StorageLike | null,
  random: RandomSource = Math.random,
  now = Date.now(),
): AmbientSnapshotV1 {
  if (!storage) return createFreshSnapshot(random, now);
  try {
    const raw = storage.getItem(AMBIENT_STORAGE_KEY);
    if (!raw) return createFreshSnapshot(random, now);
    return parseAmbientSnapshot(JSON.parse(raw), now) ?? createFreshSnapshot(random, now);
  } catch {
    return createFreshSnapshot(random, now);
  }
}

export function saveAmbientSnapshot(
  storage: StorageLike | null,
  snapshot: AmbientSnapshotV1,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function resolveBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
