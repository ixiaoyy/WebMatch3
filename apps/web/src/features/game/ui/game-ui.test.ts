import { describe, expect, it } from "vitest";

import {
  createSeededRandom,
  listLegalMoves,
  wouldSwapCreateMatch,
  type Board,
  type Coordinate,
  type Swap,
} from "@/features/game/engine";
import type { ProgressStorage } from "@/features/game/session";

import { createGameController } from "./game-controller";
import {
  getTileAriaLabel,
  getTilePresentation,
  moveCoordinate,
} from "./game-ui";

describe("game UI helpers", () => {
  it("keeps keyboard focus inside the board", () => {
    expect(moveCoordinate({ row: 0, column: 0 }, "up", 8, 8)).toEqual({
      row: 0,
      column: 0,
    });
    expect(moveCoordinate({ row: 7, column: 7 }, "right", 8, 8)).toEqual({
      row: 7,
      column: 7,
    });
    expect(moveCoordinate({ row: 3, column: 3 }, "left", 8, 8)).toEqual({
      row: 3,
      column: 2,
    });
  });

  it("describes type, position, and selection without relying on color", () => {
    expect(getTileAriaLabel("violet", { row: 1, column: 2 }, true)).toBe(
      "紫罗兰花糖，第 2 行，第 3 列，已选中",
    );
  });

  it("maps every tile type to a bundled candy image", () => {
    for (const type of ["coral", "amber", "lime", "aqua", "violet", "rose"]) {
      expect(getTilePresentation(type).assetUrl).toMatch(/candy-.*\.png$/);
    }
  });
});

describe("game controller", () => {
  it("requires a valid player name before accepting board input", async () => {
    const game = createGameController({
      random: createSeededRandom(7),
      wait: async () => undefined,
      storage: null,
    });

    await game.activate({ row: 0, column: 0 });
    expect(game.selected.value).toBeNull();
    expect(game.startGame("   ")).toMatchObject({
      ok: false,
      reason: "empty",
    });
    expect(game.startGame("  小 明  ")).toEqual({
      ok: true,
      playerName: "小 明",
    });
    expect(game.sessionPhase.value).toBe("playing");

    await game.activate({ row: 0, column: 0 });
    expect(game.selected.value).toEqual({ row: 0, column: 0 });
  });

  it("selects, cancels, and moves a non-adjacent selection", async () => {
    const game = createGameController({
      random: createSeededRandom(11),
      wait: async () => undefined,
      storage: null,
    });
    game.startGame("测试玩家");

    await game.activate({ row: 0, column: 0 });
    expect(game.selected.value).toEqual({ row: 0, column: 0 });

    await game.activate({ row: 0, column: 0 });
    expect(game.selected.value).toBeNull();

    await game.activate({ row: 0, column: 0 });
    await game.activate({ row: 3, column: 3 });
    expect(game.selected.value).toEqual({ row: 3, column: 3 });
    expect(game.resolvedMoves.value).toBe(0);
  });

  it("restores a no-match swap without recording progress", async () => {
    const game = createGameController({
      random: createSeededRandom(23),
      wait: async () => undefined,
      storage: null,
    });
    game.startGame("测试玩家");
    const original = game.board.value;
    const originalMoves = game.remainingMoves.value;
    const swap = findNoMatchSwap(original);

    await game.activate(swap.from);
    await game.activate(swap.to);

    expect(game.board.value).toBe(original);
    expect(game.visualBoard.value).toBe(original);
    expect(game.resolvedMoves.value).toBe(0);
    expect(game.remainingMoves.value).toBe(originalMoves);
    expect(game.isBusy.value).toBe(false);
    expect(game.status.value).toContain("复位");
  });

  it("projects a legal swap in order and ignores conflicting activation", async () => {
    const waits: number[] = [];
    const game = createGameController({
      random: createSeededRandom(37),
      wait: async (duration) => {
        waits.push(duration);
        await Promise.resolve();
      },
      storage: null,
    });
    game.startGame("测试玩家");
    const legalMove = listLegalMoves(game.board.value)[0];
    expect(legalMove).toBeDefined();
    if (!legalMove) {
      return;
    }

    await game.activate(legalMove.from);
    const pending = game.activate(legalMove.to);
    expect(game.isBusy.value).toBe(true);
    const canonicalDuringAnimation = game.board.value;

    await game.activate({ row: 7, column: 7 });
    expect(game.board.value).toBe(canonicalDuringAnimation);
    expect(game.selected.value).toBeNull();

    await pending;

    expect(waits.slice(0, 3)).toEqual([140, 160, 180]);
    expect(game.resolvedMoves.value).toBe(1);
    expect(game.visualBoard.value).toBe(game.board.value);
    expect(game.isBusy.value).toBe(false);
    expect(game.phase.value).toBe("idle");
  });

  it("confirms restart throughout an active game", async () => {
    const game = createGameController({
      random: createSeededRandom(51),
      wait: async () => undefined,
      storage: null,
    });
    game.startGame("测试玩家");
    const initialBoard = game.board.value;

    game.requestRestart();
    expect(game.restartConfirmVisible.value).toBe(true);
    expect(game.board.value).toBe(initialBoard);

    game.cancelRestart();
    expect(game.restartConfirmVisible.value).toBe(false);

    const legalMove = listLegalMoves(game.board.value)[0];
    expect(legalMove).toBeDefined();
    if (!legalMove) {
      return;
    }

    await game.activate(legalMove.from);
    await game.activate(legalMove.to);
    game.requestRestart();

    expect(game.restartConfirmVisible.value).toBe(true);
    expect(game.resolvedMoves.value).toBe(1);

    game.confirmRestart();
    expect(game.restartConfirmVisible.value).toBe(false);
    expect(game.resolvedMoves.value).toBe(0);
    expect(game.status.value).toContain("新棋盘");
    expect(game.playerName.value).toBe("测试玩家");
  });

  it("scores a resolved move, wins once, and preserves the player for another game", async () => {
    const storage = new CountingStorage();
    const game = createGameController({
      random: createSeededRandom(59),
      wait: async () => undefined,
      storage,
      now: () => new Date("2026-07-17T12:00:00.000Z"),
      sessionConfig: { initialMoves: 1, targetScore: 1 },
    });
    game.startGame("小红");
    const legalMove = listLegalMoves(game.board.value)[0];
    expect(legalMove).toBeDefined();
    if (!legalMove) {
      return;
    }

    await game.activate(legalMove.from);
    await game.activate(legalMove.to);

    expect(game.remainingMoves.value).toBe(0);
    expect(game.score.value).toBeGreaterThan(0);
    expect(game.bestCombo.value).toBeGreaterThanOrEqual(1);
    expect(game.sessionPhase.value).toBe("won");
    expect(game.result.value).toMatchObject({
      outcome: "won",
      playerName: "小红",
      rank: 1,
    });
    expect(game.leaderboard.value).toHaveLength(1);
    expect(game.leaderboardPeriod.value).toBe("week");
    game.setLeaderboardPeriod("month");
    expect(game.leaderboardPeriod.value).toBe("month");
    expect(game.leaderboard.value).toHaveLength(1);
    game.setLeaderboardPeriod("all");
    expect(game.leaderboard.value).toHaveLength(1);
    expect(storage.writes).toBe(1);

    const finishedBoard = game.board.value;
    await game.activate(legalMove.from);
    expect(game.board.value).toBe(finishedBoard);
    expect(storage.writes).toBe(1);

    game.startNextGame();
    expect(game.playerName.value).toBe("小红");
    expect(game.sessionPhase.value).toBe("playing");
    expect(game.result.value).toBeNull();
    expect(game.score.value).toBe(0);

    game.changePlayer();
    expect(game.playerName.value).toBe("");
    expect(game.sessionPhase.value).toBe("awaiting-player");
    expect(game.leaderboard.value).toHaveLength(1);
  });

  it("fails after the final valid move without double-writing the result", async () => {
    const storage = new CountingStorage();
    const game = createGameController({
      random: createSeededRandom(67),
      wait: async () => undefined,
      storage,
      now: () => new Date("2026-07-17T13:00:00.000Z"),
      sessionConfig: {
        initialMoves: 1,
        targetScore: Number.MAX_SAFE_INTEGER,
      },
    });
    game.startGame("小蓝");
    const legalMove = listLegalMoves(game.board.value)[0];
    expect(legalMove).toBeDefined();
    if (!legalMove) {
      return;
    }

    await game.activate(legalMove.from);
    await game.activate(legalMove.to);

    expect(game.remainingMoves.value).toBe(0);
    expect(game.sessionPhase.value).toBe("lost");
    expect(game.result.value?.outcome).toBe("lost");
    expect(storage.writes).toBe(1);

    await game.activate(legalMove.from);
    await game.activate(legalMove.to);
    expect(storage.writes).toBe(1);
  });
});

class CountingStorage implements ProgressStorage {
  value: string | null = null;
  writes = 0;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
    this.writes += 1;
  }
}

function findNoMatchSwap(board: Board): Swap {
  for (let row = 0; row < board.rows; row += 1) {
    for (let column = 0; column < board.columns; column += 1) {
      const from = { row, column };
      const candidates: Coordinate[] = [
        { row, column: column + 1 },
        { row: row + 1, column },
      ];
      for (const to of candidates) {
        if (
          to.row < board.rows &&
          to.column < board.columns &&
          !wouldSwapCreateMatch(board, from, to)
        ) {
          return { from, to };
        }
      }
    }
  }
  throw new Error("Expected the generated board to include a no-match swap.");
}
describe("reduced motion controller", () => {
  it("keeps a resolved swap playable while shortening every phase", async () => {
    const waits: number[] = [];
    const game = createGameController({
      random: createSeededRandom(73),
      reducedMotion: true,
      wait: async (duration) => {
        waits.push(duration);
      },
      storage: null,
    });
    game.startGame("测试玩家");
    const legalMove = listLegalMoves(game.board.value)[0];
    expect(legalMove).toBeDefined();
    if (!legalMove) {
      return;
    }

    await game.activate(legalMove.from);
    await game.activate(legalMove.to);

    expect(waits.length).toBeGreaterThanOrEqual(3);
    expect(waits.every((duration) => duration <= 16)).toBe(true);
    expect(game.resolvedMoves.value).toBe(1);
    expect(game.visualBoard.value).toBe(game.board.value);
  });
});
