import {
  areAdjacent,
  areSameCoordinate,
  assertBoard,
  coordinateKey,
  isInBounds,
  swapTiles,
} from "./board";
import { Match3EngineError } from "./errors";
import { findMatches } from "./matches";
import { settleBoard } from "./settle";
import { ensurePlayableBoard } from "./shuffle";
import type {
  Board,
  Coordinate,
  EngineConfig,
  RandomSource,
  Swap,
  SwapResult,
} from "./types";

export function executeSwap(
  board: Board,
  from: Coordinate,
  to: Coordinate,
  random: RandomSource,
  config: Partial<EngineConfig> = {},
): SwapResult {
  assertBoard(board);

  if (!isInBounds(board, from) || !isInBounds(board, to)) {
    return { kind: "invalid", reason: "out-of-bounds", board };
  }
  if (areSameCoordinate(from, to)) {
    return { kind: "invalid", reason: "same-cell", board };
  }
  if (!areAdjacent(from, to)) {
    return { kind: "invalid", reason: "not-adjacent", board };
  }
  if (findMatches(board).coordinates.length > 0) {
    throw new Match3EngineError(
      "invalid-board",
      "Swaps require a stable board without existing matches.",
    );
  }

  const swap: Swap = { from, to };
  const swapped = swapTiles(board, from, to);
  const matches = findMatches(swapped);
  const swappedKeys = new Set([coordinateKey(from), coordinateKey(to)]);
  const createsMatch = matches.coordinates.some((coordinate) =>
    swappedKeys.has(coordinateKey(coordinate)),
  );

  if (!createsMatch) {
    return { kind: "no-match", board, swap };
  }

  const settlement = settleBoard(swapped, random, config);
  const playability = ensurePlayableBoard(settlement.board, config, random);

  return {
    kind: "resolved",
    board: playability.board,
    swap,
    cascades: settlement.cascades,
    playability,
  };
}
