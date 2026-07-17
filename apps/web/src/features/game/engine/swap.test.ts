import { describe, expect, it } from "vitest";

import { createBoardFromTypes, executeSwap } from "./index";

const BOARD_TYPES = [
  ["A", "B", "A"],
  ["C", "A", "C"],
  ["B", "C", "B"],
] as const;

describe("executeSwap", () => {
  it.each([
    {
      name: "out-of-bounds coordinates",
      from: { row: -1, column: 0 },
      to: { row: 0, column: 0 },
      reason: "out-of-bounds",
    },
    {
      name: "the same cell",
      from: { row: 0, column: 0 },
      to: { row: 0, column: 0 },
      reason: "same-cell",
    },
    {
      name: "a diagonal cell",
      from: { row: 0, column: 0 },
      to: { row: 1, column: 1 },
      reason: "not-adjacent",
    },
    {
      name: "a non-adjacent cell",
      from: { row: 0, column: 0 },
      to: { row: 2, column: 0 },
      reason: "not-adjacent",
    },
  ] as const)("rejects $name without changing the board", (testCase) => {
    const board = createBoardFromTypes(BOARD_TYPES);
    const before = structuredClone(board);

    const result = executeSwap(
      board,
      testCase.from,
      testCase.to,
      () => 0,
      { tileTypes: ["A", "B", "C"] },
    );

    expect(result).toMatchObject({
      kind: "invalid",
      reason: testCase.reason,
    });
    expect(result.board).toBe(board);
    expect(board).toEqual(before);
  });

  it("returns a rollback result for an adjacent swap without a match", () => {
    const board = createBoardFromTypes(BOARD_TYPES);
    const before = structuredClone(board);

    const result = executeSwap(
      board,
      { row: 2, column: 0 },
      { row: 2, column: 1 },
      () => 0,
      { tileTypes: ["A", "B", "C"] },
    );

    expect(result.kind).toBe("no-match");
    expect(result.board).toBe(board);
    expect(board).toEqual(before);
  });

  it("resolves a valid swap and returns complete cascade data", () => {
    const board = createBoardFromTypes(BOARD_TYPES);
    const values = [0, 0.4, 0.8];
    let index = 0;

    const result = executeSwap(
      board,
      { row: 0, column: 1 },
      { row: 1, column: 1 },
      () => {
        const value = values[index % values.length];
        index += 1;
        return value;
      },
      {
        tileTypes: ["A", "B", "C"],
        maxShuffleAttempts: 0,
        maxGenerationAttempts: 0,
      },
    );

    expect(result.kind).toBe("resolved");
    if (result.kind !== "resolved") {
      throw new Error("Expected the swap to resolve.");
    }
    expect(result.cascades).toHaveLength(1);
    expect(result.cascades[0].matches.coordinates).toHaveLength(3);
    expect(result.board).not.toBe(board);
    expect(result.playability.kind).toMatch(/unchanged|rebuilt/);
  });
});
