export type SessionPhase =
  | "awaiting-player"
  | "playing"
  | "resolving"
  | "won"
  | "lost";

export type GameOutcome = "won" | "lost";

export type LeaderboardPeriod = "week" | "month" | "all";

export interface SessionConfig {
  readonly initialMoves: number;
  readonly targetScore: number;
  readonly pointsPerTile: number;
  readonly longMatchBonusPerTile: number;
  readonly multiGroupBonus: number;
  readonly leaderboardLimit: number;
  readonly historyLimit: number;
}

export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  readonly bestCombo: number;
  readonly completedAt: string;
  readonly outcome: GameOutcome;
}

export interface LocalProgress {
  readonly version: 1;
  readonly bestScore: number;
  readonly bestCombo: number;
  readonly lastCompletedAt: string | null;
  readonly leaderboard: readonly LeaderboardEntry[];
  readonly history: readonly LeaderboardEntry[];
}

export type PlayerNameValidation =
  | { readonly ok: true; readonly playerName: string }
  | {
      readonly ok: false;
      readonly reason: "empty" | "too-long";
      readonly message: string;
    };

export interface RoundScore {
  readonly basePoints: number;
  readonly longMatchBonus: number;
  readonly multiGroupBonus: number;
  readonly multiplier: number;
  readonly total: number;
}
