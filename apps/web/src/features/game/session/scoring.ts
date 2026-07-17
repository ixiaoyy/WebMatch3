import type { CascadeRound } from "@/features/game/engine";

import { DEFAULT_SESSION_CONFIG } from "./config";
import type { RoundScore, SessionConfig } from "./types";

type ScorableRound = Pick<CascadeRound, "index" | "matches">;

export function scoreCascadeRound(
  round: ScorableRound,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): RoundScore {
  const basePoints = safeMultiply(
    round.matches.coordinates.length,
    config.pointsPerTile,
  );
  const longMatchTiles = round.matches.groups.reduce(
    (total, group) => total + Math.max(0, group.coordinates.length - 3),
    0,
  );
  const longMatchBonus = safeMultiply(
    longMatchTiles,
    config.longMatchBonusPerTile,
  );
  const extraGroups = Math.max(0, round.matches.groups.length - 1);
  const multiGroupBonus = safeMultiply(
    extraGroups,
    config.multiGroupBonus,
  );
  const multiplier = Math.max(1, round.index);
  const subtotal = safeAdd(
    safeAdd(basePoints, longMatchBonus),
    multiGroupBonus,
  );

  return {
    basePoints,
    longMatchBonus,
    multiGroupBonus,
    multiplier,
    total: safeMultiply(subtotal, multiplier),
  };
}

export function safeAdd(first: number, second: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, first + second);
}

function safeMultiply(first: number, second: number): number {
  if (first === 0 || second === 0) {
    return 0;
  }
  if (first > Number.MAX_SAFE_INTEGER / second) {
    return Number.MAX_SAFE_INTEGER;
  }
  return first * second;
}
