export {
  areAdjacent,
  areSameCoordinate,
  assertBoard,
  createBoard,
  createBoardFromTypes,
  isInBounds,
  resolveEngineConfig,
  swapTiles,
} from "./board";
export { Match3EngineError } from "./errors";
export type { Match3EngineErrorCode } from "./errors";
export { generateBoard } from "./generate";
export {
  findMatches,
  hasLegalMove,
  listLegalMoves,
  wouldSwapCreateMatch,
} from "./matches";
export { createSeededRandom } from "./random";
export { settleBoard } from "./settle";
export { ensurePlayableBoard, shuffleBoard } from "./shuffle";
export { executeSwap } from "./swap";
export {
  DEFAULT_ENGINE_CONFIG,
  type Board,
  type CascadeRound,
  type Coordinate,
  type EngineConfig,
  type GeneratedBoard,
  type InvalidSwapReason,
  type LegalMove,
  type MatchAxis,
  type MatchGroup,
  type MatchResult,
  type MovedTile,
  type PlayabilityResult,
  type RandomSource,
  type RemovedTile,
  type SettlementResult,
  type SpawnedTile,
  type Swap,
  type SwapResult,
  type Tile,
} from "./types";
