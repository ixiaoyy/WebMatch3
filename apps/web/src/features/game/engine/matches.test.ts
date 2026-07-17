import { describe, expect, it } from "vitest";

import {
  createBoardFromTypes,
  findMatches,
  hasLegalMove,
  listLegalMoves,
} from "./index";

describe("findMatches", () => {
  it("keeps horizontal and vertical groups while deduplicating intersections", () => {
    const board = createBoardFromTypes([
      ["A", "B", "C", "D", "E"],
      ["F", "G", "X", "H", "I"],
      ["J", "X", "X", "X", "K"],
      ["L", "M", "X", "N", "O"],
      ["P", "Q", "X", "R", "S"],
    ]);

    const matches = findMatches(board);

    expect(matches.groups).toHaveLength(2);
    expect(matches.groups.map((group) => group.axis)).toEqual([
      "horizontal",
      "vertical",
    ]);
    expect(matches.groups.map((group) => group.coordinates.length)).toEqual([
      3, 4,
    ]);
    expect(matches.coordinates).toHaveLength(6);
    expect(matches.coordinates).toContainEqual({ row: 2, column: 2 });
  });

  it("finds long and simultaneous groups", () => {
    const board = createBoardFromTypes([
      ["A", "A", "A", "A", "B", "B", "B"],
      ["C", "D", "E", "F", "G", "H", "I"],
      ["J", "K", "L", "M", "N", "O", "P"],
    ]);

    const matches = findMatches(board);

    expect(matches.groups).toHaveLength(2);
    expect(matches.groups[0].coordinates).toHaveLength(4);
    expect(matches.groups[1].coordinates).toHaveLength(3);
    expect(matches.coordinates).toHaveLength(7);
  });

  it("deduplicates the shared endpoint of an L-shaped match", () => {
    const board = createBoardFromTypes([
      ["A", "B", "C", "D"],
      ["E", "F", "X", "G"],
      ["H", "I", "X", "J"],
      ["X", "X", "X", "J"],
      ["M", "N", "O", "P"],
    ]);

    const matches = findMatches(board);

    expect(matches.groups).toHaveLength(2);
    expect(matches.groups.map((group) => group.coordinates.length)).toEqual([
      3, 3,
    ]);
    expect(matches.coordinates).toHaveLength(5);
    expect(matches.coordinates).toContainEqual({ row: 3, column: 2 });
  });
});

describe("legal moves", () => {
  it("enumerates each playable adjacent swap once", () => {
    const board = createBoardFromTypes([
      ["A", "B", "A"],
      ["C", "A", "C"],
      ["B", "C", "B"],
    ]);

    const moves = listLegalMoves(board);

    expect(hasLegalMove(board)).toBe(true);
    expect(moves).toContainEqual({
      from: { row: 0, column: 1 },
      to: { row: 1, column: 1 },
    });
    for (const move of moves) {
      const distance =
        Math.abs(move.from.row - move.to.row) +
        Math.abs(move.from.column - move.to.column);
      expect(distance).toBe(1);
    }
  });

  it("recognizes a stable board without a legal move", () => {
    const board = createBoardFromTypes([
      ["A", "B", "C"],
      ["B", "C", "A"],
      ["C", "A", "B"],
    ]);

    expect(findMatches(board).coordinates).toHaveLength(0);
    expect(listLegalMoves(board)).toHaveLength(0);
    expect(hasLegalMove(board)).toBe(false);
  });
});
