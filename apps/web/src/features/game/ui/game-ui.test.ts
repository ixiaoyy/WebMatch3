import { describe, expect, it } from "vitest";

import {
  createSeededRandom,
  listLegalMoves,
  wouldSwapCreateMatch,
  type Board,
  type Coordinate,
  type Swap,
} from "@/features/game/engine";

import { createGameController } from "./game-controller";
import {
  getTileAriaLabel,
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
      "紫罗兰星印，第 2 行，第 3 列，已选中",
    );
  });
});

describe("game controller", () => {
  it("selects, cancels, and moves a non-adjacent selection", async () => {
    const game = createGameController({
      random: createSeededRandom(11),
      wait: async () => undefined,
    });

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
    });
    const original = game.board.value;
    const swap = findNoMatchSwap(original);

    await game.activate(swap.from);
    await game.activate(swap.to);

    expect(game.board.value).toBe(original);
    expect(game.visualBoard.value).toBe(original);
    expect(game.resolvedMoves.value).toBe(0);
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
    });
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

  it("confirms restart only after a resolved move", async () => {
    const game = createGameController({
      random: createSeededRandom(51),
      wait: async () => undefined,
    });
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
  });
});

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
    });
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
