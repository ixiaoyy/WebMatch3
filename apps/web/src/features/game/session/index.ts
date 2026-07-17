export { DEFAULT_SESSION_CONFIG } from "./config";
export {
  MAX_PLAYER_NAME_LENGTH,
  normalizePlayerName,
  validatePlayerName,
} from "./player";
export {
  createEmptyProgress,
  getDefaultProgressStorage,
  loadLocalProgress,
  PROGRESS_STORAGE_KEY,
  recordCompletedGame,
  saveLocalProgress,
  selectLeaderboard,
  type CompletedGameRecord,
  type ProgressStorage,
} from "./progress-storage";
export { safeAdd, scoreCascadeRound } from "./scoring";
export type {
  GameOutcome,
  LeaderboardEntry,
  LeaderboardPeriod,
  LocalProgress,
  PlayerNameValidation,
  RoundScore,
  SessionConfig,
  SessionPhase,
} from "./types";
