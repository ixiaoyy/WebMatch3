import { describe, expect, it } from "vitest";

import {
  Match3EngineError,
  createBoardFromTypes,
  findMatches,
  settleBoard,
} from "./index";
import type { RandomSource } from "./index";

describe("settleBoard", () => {
  it("removes matches, preserves survivor order, and reports falls and spawns", () => {
    const board = createBoardFromTypes([
      ["D", "B", "C"],
      ["E", "C", "B"],
      ["A", "B", "C"],
      ["A", "C", "B"],
      ["A", "B", "C"],
    ]);
    const before = structuredClone(board);
    const random = sequenceRandom([0.21, 0.41, 0.21]);

    const result = settleBoard(board, random, {
      tileTypes: ["A", "B", "C", "D", "E"],
    });

    expect(result.cascades).toHaveLength(1);
    const [round] = result.cascades;
    expect(round.removed).toHaveLength(3);
    expect(round.moved.map((move) => [move.from.row, move.to.row])).toEqual([
      [1, 4],
      [0, 3],
    ]);
    expect(round.spawned.map((spawn) => spawn.from.row)).toEqual([-3, -2, -1]);
    expect(result.board.cells.map((row) => row[0].type)).toEqual([
      "B",
      "C",
      "B",
      "D",
      "E",
    ]);
    expect(findMatches(result.board).coordinates).toHaveLength(0);
    expect(board).toEqual(before);
  });

  it("continues through cascades until the board is stable", () => {
    const board = createBoardFromTypes([
      ["A", "B", "C"],
      ["A", "C", "B"],
      ["A", "B", "C"],
      ["C", "A", "B"],
    ]);
    const random = sequenceRandom([0.4, 0.4, 0.4, 0, 0.8, 0.4]);

    const result = settleBoard(board, random, {
      tileTypes: ["A", "B", "C"],
    });

    expect(result.cascades).toHaveLength(2);
    expect(result.cascades.map((round) => round.removed.length)).toEqual([
      3, 3,
    ]);
    expect(result.board.cells.map((row) => row[0].type)).toEqual([
      "A",
      "C",
      "B",
      "C",
    ]);
    expect(findMatches(result.board).coordinates).toHaveLength(0);
  });

  it("raises a diagnostic error when the cascade guard is exceeded", () => {
    const board = createBoardFromTypes([
      ["A", "A", "A"],
      ["A", "A", "A"],
      ["A", "A", "A"],
    ]);

    expect(() =>
      settleBoard(board, () => 0, {
        tileTypes: ["A", "B", "C"],
        maxCascadeDepth: 1,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "cascade-limit-exceeded" }),
    );
    expect(Match3EngineError).toBeDefined();
  });
});

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}
