export interface Tile {
  readonly id: string;
  readonly type: string;
}

export interface Coordinate {
  readonly row: number;
  readonly column: number;
}

export interface Board {
  readonly rows: number;
  readonly columns: number;
  readonly cells: readonly (readonly Tile[])[];
}

export type MatchAxis = "horizontal" | "vertical";

export interface MatchGroup {
  readonly axis: MatchAxis;
  readonly coordinates: readonly Coordinate[];
}

export interface MatchResult {
  readonly groups: readonly MatchGroup[];
  readonly coordinates: readonly Coordinate[];
}

export interface Swap {
  readonly from: Coordinate;
  readonly to: Coordinate;
}

export type LegalMove = Swap;

export interface RemovedTile {
  readonly tile: Tile;
  readonly from: Coordinate;
}

export interface MovedTile {
  readonly tile: Tile;
  readonly from: Coordinate;
  readonly to: Coordinate;
}

export interface SpawnedTile {
  readonly tile: Tile;
  readonly from: Coordinate;
  readonly to: Coordinate;
}

export interface CascadeRound {
  readonly index: number;
  readonly before: Board;
  readonly matches: MatchResult;
  readonly removed: readonly RemovedTile[];
  readonly moved: readonly MovedTile[];
  readonly spawned: readonly SpawnedTile[];
  readonly after: Board;
}

export interface SettlementResult {
  readonly board: Board;
  readonly cascades: readonly CascadeRound[];
}

export type RandomSource = () => number;

export interface EngineConfig {
  readonly rows: number;
  readonly columns: number;
  readonly tileTypes: readonly string[];
  readonly maxGenerationAttempts: number;
  readonly maxShuffleAttempts: number;
  readonly maxCascadeDepth: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = Object.freeze({
  rows: 8,
  columns: 8,
  tileTypes: Object.freeze([
    "coral",
    "amber",
    "lime",
    "aqua",
    "violet",
    "rose",
  ]),
  maxGenerationAttempts: 100,
  maxShuffleAttempts: 100,
  maxCascadeDepth: 100,
});

export interface GeneratedBoard {
  readonly board: Board;
  readonly fallbackUsed: boolean;
}

export interface UnchangedPlayability {
  readonly kind: "unchanged";
  readonly board: Board;
}

export interface ShuffledPlayability {
  readonly kind: "shuffled";
  readonly board: Board;
}

export interface RebuiltPlayability {
  readonly kind: "rebuilt";
  readonly board: Board;
}

export type PlayabilityResult =
  | UnchangedPlayability
  | ShuffledPlayability
  | RebuiltPlayability;

export type InvalidSwapReason =
  | "out-of-bounds"
  | "same-cell"
  | "not-adjacent";

export interface InvalidSwapResult {
  readonly kind: "invalid";
  readonly reason: InvalidSwapReason;
  readonly board: Board;
}

export interface NoMatchSwapResult {
  readonly kind: "no-match";
  readonly board: Board;
  readonly swap: Swap;
}

export interface ResolvedSwapResult {
  readonly kind: "resolved";
  readonly board: Board;
  readonly swap: Swap;
  readonly cascades: readonly CascadeRound[];
  readonly playability: PlayabilityResult;
}

export type SwapResult =
  | InvalidSwapResult
  | NoMatchSwapResult
  | ResolvedSwapResult;
