import {
  FISH_KINDS,
  MAX_PIECE_COUNT,
  createLevelState,
  createInitialState,
  getLevelConfig,
  restartAfterLoss,
  type AmbientGameState,
  type FedFish,
  type FishKind,
  type PilePiece,
  type Point,
  type RandomSource,
  type TrayPiece,
} from "../engine";

export const AMBIENT_STORAGE_KEY = "web-match3:ambient-state";
export const AMBIENT_SNAPSHOT_VERSION = 3;

export interface AmbientPreferences {
  readonly soundEnabled: boolean;
}

export interface AmbientPlantProgress {
  readonly plantedAt: number;
}

export interface AmbientPetProgress {
  readonly guardedPieceId: string | null;
}

export interface AmbientSnapshotV3 {
  readonly version: 3;
  readonly game: AmbientGameState;
  readonly preferences: AmbientPreferences;
  readonly plant: AmbientPlantProgress;
  readonly pet: AmbientPetProgress;
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

const LEGACY_V2_KIND_MAP = {
  aqua: "whale",
  amber: "koi",
  lime: "sardine",
  rose: "pufferfish",
  goldfish: "goldfish",
  clownfish: "clownfish",
  angelfish: "angelfish",
  betta: "betta",
} as const satisfies Readonly<Record<string, FishKind>>;

type LegacyV2Kind = keyof typeof LEGACY_V2_KIND_MAP;
type KindParser = (value: unknown) => FishKind | null;

function parseFishKind(value: unknown): FishKind | null {
  return typeof value === "string" && FISH_KINDS.includes(value as FishKind)
    ? value as FishKind
    : null;
}

function parseLegacyV2Kind(value: unknown): FishKind | null {
  if (
    typeof value !== "string" ||
    !Object.prototype.hasOwnProperty.call(LEGACY_V2_KIND_MAP, value)
  ) {
    return null;
  }
  return LEGACY_V2_KIND_MAP[value as LegacyV2Kind];
}

function parsePoint(value: unknown): Point | null {
  if (!isRecord(value)) return null;
  if (!isFiniteInRange(value.x, 0, 1) || !isFiniteInRange(value.y, 0, 1)) {
    return null;
  }
  return { x: value.x, y: value.y };
}

function parsePilePiece(value: unknown, parseKind: KindParser): PilePiece | null {
  if (!isRecord(value)) return null;
  const pile = parsePoint(value.pile);
  const spread = parsePoint(value.spread);
  const kind = parseKind(value.kind);
  const blockerIds = value.blockerIds === undefined
    ? undefined
    : Array.isArray(value.blockerIds) && value.blockerIds.every(
      (id) => typeof id === "string" && id.length > 0,
    )
      ? value.blockerIds as string[]
      : null;
  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    !kind ||
    !pile ||
    !spread ||
    !isFiniteInRange(value.rotation, -360, 360) ||
    !isFiniteInRange(value.scale, 0.5, 1.5) ||
    (value.layer !== 0 && value.layer !== 1 && value.layer !== 2) ||
    blockerIds === null ||
    (blockerIds !== undefined &&
      (blockerIds.includes(value.id) || new Set(blockerIds).size !== blockerIds.length))
  ) {
    return null;
  }
  return {
    id: value.id,
    kind,
    pile,
    spread,
    rotation: value.rotation,
    scale: value.scale,
    layer: value.layer,
    ...(blockerIds === undefined ? {} : { blockerIds }),
  };
}

function parseTrayPiece(value: unknown, parseKind: KindParser): TrayPiece | null {
  if (!isRecord(value)) return null;
  const kind = parseKind(value.kind);
  if (typeof value.id !== "string" || value.id.length === 0 || !kind) {
    return null;
  }
  return { id: value.id, kind };
}

function parseFedFish(value: unknown, parseKind: KindParser): FedFish | null {
  const piece = parseTrayPiece(value, parseKind);
  if (!piece || !isRecord(value) || typeof value.settled !== "boolean") {
    return null;
  }
  return { ...piece, settled: value.settled };
}

interface ParsedGameParts {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly fed: readonly FedFish[];
  readonly clearCount: number;
  readonly nextPieceId: number;
}

function parseGameParts(
  value: unknown,
  parseKind: KindParser,
  allowMissingFed = false,
): ParsedGameParts | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pieces) ||
    !Array.isArray(value.tray) ||
    (!allowMissingFed && !Array.isArray(value.fed)) ||
    (value.fed !== undefined && !Array.isArray(value.fed))
  ) {
    return null;
  }
  const rawFed = Array.isArray(value.fed) ? value.fed : [];
  if (
    value.pieces.length > MAX_PIECE_COUNT ||
    value.tray.length > 7 ||
    rawFed.length > 3
  ) return null;

  const pieces = value.pieces.map((piece) => parsePilePiece(piece, parseKind));
  const tray = value.tray.map((piece) => parseTrayPiece(piece, parseKind));
  const fed = rawFed.map((piece) => parseFedFish(piece, parseKind));
  if (
    pieces.some((piece) => piece === null) ||
    tray.some((piece) => piece === null) ||
    fed.some((piece) => piece === null)
  ) {
    return null;
  }

  const parsedPieces = pieces.filter((piece): piece is PilePiece => piece !== null);
  const parsedTray = tray.filter((piece): piece is TrayPiece => piece !== null);
  const parsedFed = fed.filter((piece): piece is FedFish => piece !== null);
  const ids = [
    ...parsedPieces.map((piece) => piece.id),
    ...parsedTray.map((piece) => piece.id),
    ...parsedFed.map((piece) => piece.id),
  ];
  if (new Set(ids).size !== ids.length) return null;
  if (!isSafeCounter(value.clearCount, 0) || !isSafeCounter(value.nextPieceId, 1)) {
    return null;
  }

  return {
    pieces: parsedPieces,
    tray: parsedTray,
    fed: parsedFed,
    clearCount: value.clearCount,
    nextPieceId: value.nextPieceId,
  };
}

function parseGame(
  value: unknown,
  parseKind: KindParser,
  allowMissingFed = false,
): AmbientGameState | null {
  if (!isRecord(value) || !isSafeCounter(value.level, 1)) return null;
  const parts = parseGameParts(value, parseKind, allowMissingFed);
  if (!parts) return null;
  const unsettledFed = parts.fed.filter((piece) => !piece.settled);
  const total = parts.pieces.length + parts.tray.length + unsettledFed.length;
  const recordedTotal = parts.pieces.length + parts.tray.length + parts.fed.length;
  const maximum = getLevelConfig(value.level).pieceCount;
  if (
    total === 0 ||
    total > maximum ||
    recordedTotal > maximum ||
    total % 3 !== 0
  ) return null;

  for (const kind of FISH_KINDS) {
    const remaining = [...parts.pieces, ...parts.tray, ...unsettledFed].filter(
      (piece) => piece.kind === kind,
    ).length;
    if (remaining % 3 !== 0) return null;
  }
  return { ...parts, level: value.level };
}

function parsePlant(value: unknown, now: number): AmbientPlantProgress | null {
  if (value === undefined) return { plantedAt: now };
  if (!isRecord(value) || !isSafeCounter(value.plantedAt, 0)) return null;
  return { plantedAt: value.plantedAt };
}

function parsePreferences(value: unknown): AmbientPreferences | null {
  if (!isRecord(value) || typeof value.soundEnabled !== "boolean") return null;
  return { soundEnabled: value.soundEnabled };
}

function parsePet(
  value: unknown,
  game: AmbientGameState,
): AmbientPetProgress {
  if (
    !isRecord(value) ||
    (value.guardedPieceId !== null && typeof value.guardedPieceId !== "string")
  ) {
    return { guardedPieceId: null };
  }
  const guardedPieceId = value.guardedPieceId;
  if (
    guardedPieceId === null ||
    game.fed.length >= 3 ||
    !game.pieces.some((piece) => piece.id === guardedPieceId)
  ) {
    return { guardedPieceId: null };
  }
  return { guardedPieceId };
}

export function parseAmbientSnapshot(
  value: unknown,
  now = Date.now(),
): AmbientSnapshotV3 | null {
  if (!isRecord(value) || value.version !== AMBIENT_SNAPSHOT_VERSION) return null;
  const preferences = parsePreferences(value.preferences);
  const game = parseGame(value.game, parseFishKind);
  const plant = parsePlant(value.plant, now);
  if (!game || !preferences || !plant) return null;
  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game,
    preferences,
    plant,
    pet: parsePet(value.pet, game),
  };
}

function migrateLegacyV2Snapshot(
  value: unknown,
  now: number,
): AmbientSnapshotV3 | null {
  if (!isRecord(value) || value.version !== 2) return null;
  const preferences = parsePreferences(value.preferences);
  const game = parseGame(value.game, parseLegacyV2Kind, true);
  const plant = parsePlant(value.plant, now);
  if (!game || !preferences || !plant) return null;
  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game,
    preferences,
    plant,
    pet: parsePet(value.pet, game),
  };
}

function migrateLegacyV1Snapshot(
  value: unknown,
  random: RandomSource,
  now: number,
): AmbientSnapshotV3 | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const legacyGame = parseGameParts(value.game, parseLegacyV2Kind, true);
  const preferences = parsePreferences(value.preferences);
  const plant = parsePlant(value.plant, now);
  if (!legacyGame || !preferences || !plant) return null;
  if (
    legacyGame.pieces.length + legacyGame.tray.length !== 18 ||
    legacyGame.fed.length !== 0
  ) return null;

  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game: createLevelState(
      1,
      legacyGame.clearCount,
      legacyGame.nextPieceId,
      random,
    ),
    preferences,
    plant,
    pet: { guardedPieceId: null },
  };
}

export function createFreshSnapshot(
  random: RandomSource = Math.random,
  now = Date.now(),
): AmbientSnapshotV3 {
  return {
    version: AMBIENT_SNAPSHOT_VERSION,
    game: createInitialState(random),
    preferences: { soundEnabled: false },
    plant: { plantedAt: now },
    pet: { guardedPieceId: null },
  };
}

function normalizeLoadedSnapshot(
  snapshot: AmbientSnapshotV3,
  random: RandomSource,
): AmbientSnapshotV3 {
  if (snapshot.game.tray.length < 7) return snapshot;
  return {
    ...snapshot,
    game: restartAfterLoss(snapshot.game, random),
    pet: { guardedPieceId: null },
  };
}

export function loadAmbientSnapshot(
  storage: StorageLike | null,
  random: RandomSource = Math.random,
  now = Date.now(),
): AmbientSnapshotV3 {
  if (!storage) return createFreshSnapshot(random, now);
  try {
    const raw = storage.getItem(AMBIENT_STORAGE_KEY);
    if (!raw) return createFreshSnapshot(random, now);
    const parsed = JSON.parse(raw) as unknown;
    const snapshot = parseAmbientSnapshot(parsed, now) ??
      migrateLegacyV2Snapshot(parsed, now) ??
      migrateLegacyV1Snapshot(parsed, random, now) ??
      createFreshSnapshot(random, now);
    return normalizeLoadedSnapshot(snapshot, random);
  } catch {
    return createFreshSnapshot(random, now);
  }
}

export function saveAmbientSnapshot(
  storage: StorageLike | null,
  snapshot: AmbientSnapshotV3,
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
