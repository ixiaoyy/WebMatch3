import type { PlayerNameValidation } from "./types";

export const MAX_PLAYER_NAME_LENGTH = 12;

export function normalizePlayerName(input: string): string {
  return input.trim().replace(/\s+/gu, " ");
}

export function validatePlayerName(input: string): PlayerNameValidation {
  const playerName = normalizePlayerName(input);

  if (playerName.length === 0) {
    return {
      ok: false,
      reason: "empty",
      message: "请输入姓名后开始游戏。",
    };
  }

  if ([...playerName].length > MAX_PLAYER_NAME_LENGTH) {
    return {
      ok: false,
      reason: "too-long",
      message: `姓名最多 ${MAX_PLAYER_NAME_LENGTH} 个字符。`,
    };
  }

  return { ok: true, playerName };
}
