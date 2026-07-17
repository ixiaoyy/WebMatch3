import { describe, expect, it } from "vitest";

import {
  Match3EngineError,
  createBoardFromTypes,
  createSeededRandom,
  ensurePlayableBoard,
  findMatches,
  generateBoard,
  hasLegalMove,
  listLegalMoves,
  shuffleBoard,
} from "./index";

const THREE_TYPES = ["A", "B", "C"] as const;

describe("generateBoard", () => {
  it("creates a reproducible stable board with a legal move", () => {
    const first = generateBoard({}, createSeededRandom(20260717));
    const second = generateBoard({}, createSeededRandom(20260717));

    expect(first).toEqual(second);
    expect(first.fallbackUsed).toBe(false);
    expect(first.board.rows).toBe(8);
    expect(first.board.columns).toBe(8);
    expect(findMatches(first.board).coordinates).toHaveLength(0);
    expect(hasLegalMove(first.board)).toBe(true);
    expect(new Set(first.board.cells.flat().map((tile) => tile.id)).size).toBe(
      64,
    );
  });

  it("uses a deterministic playable fallback when attempts are disabled", () => {
    const generated = generateBoard(
      {
        rows: 4,
        columns: 5,
        tileTypes: THREE_TYPES,
        maxGenerationAttempts: 0,
      },
      () => 0,
    );

    expect(generated.fallbackUsed).toBe(true);
    expect(findMatches(generated.board).coordinates).toHaveLength(0);
    expect(listLegalMoves(generated.board)).toContainEqual({
      from: { row: 0, column: 1 },
      to: { row: 1, column: 1 },
    });
  });

  it("rejects invalid configuration and random values", () => {
    expect(() =>
      generateBoard(
        { tileTypes: ["A", "A", "B"], maxGenerationAttempts: 0 },
        () => 0,
      ),
    ).toThrowError(Match3EngineError);

    expect(() =>
      generateBoard(
        { tileTypes: THREE_TYPES, maxGenerationAttempts: 1 },
        () => 1,
      ),
    ).toThrowError(
      expect.objectContaining({ code: "invalid-random-value" }),
    );
  });
});

describe("shuffleBoard", () => {
  it("preserves ids and the type multiset when a bounded shuffle succeeds", () => {
    const source = generateBoard({}, createSeededRandom(17)).board;
    const result = shuffleBoard(
      source,
      { maxShuffleAttempts: 500 },
      createSeededRandom(29),
    );

    expect(result.kind).toBe("shuffled");
    expect(findMatches(result.board).coordinates).toHaveLength(0);
    expect(hasLegalMove(result.board)).toBe(true);
    expect(sortedIds(result.board)).toEqual(sortedIds(source));
    expect(typeCounts(result.board)).toEqual(typeCounts(source));
  });

  it("rebuilds explicitly when a stable dead board cannot be shuffled", () => {
    const deadBoard = createBoardFromTypes([
      ["A", "B", "C"],
      ["B", "C", "A"],
      ["C", "A", "B"],
    ]);

    const result = ensurePlayableBoard(
      deadBoard,
      {
        tileTypes: THREE_TYPES,
        maxShuffleAttempts: 0,
        maxGenerationAttempts: 0,
      },
      () => 0,
    );

    expect(result.kind).toBe("rebuilt");
    expect(findMatches(result.board).coordinates).toHaveLength(0);
    expect(hasLegalMove(result.board)).toBe(true);
    expect(sortedIds(result.board)).not.toEqual(sortedIds(deadBoard));
  });
});

function sortedIds(board: {
  readonly cells: readonly (readonly { readonly id: string }[])[];
}): string[] {
  return board.cells
    .flat()
    .map((tile) => tile.id)
    .sort();
}

function typeCounts(board: {
  readonly cells: readonly (readonly { readonly type: string }[])[];
}): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tile of board.cells.flat()) {
    counts[tile.type] = (counts[tile.type] ?? 0) + 1;
  }
  return counts;
}
