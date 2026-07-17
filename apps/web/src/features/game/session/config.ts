import type { SessionConfig } from "./types";

export const DEFAULT_SESSION_CONFIG: SessionConfig = Object.freeze({
  initialMoves: 18,
  targetScore: 12_000,
  pointsPerTile: 100,
  longMatchBonusPerTile: 75,
  multiGroupBonus: 150,
  leaderboardLimit: 10,
  historyLimit: 500,
});
