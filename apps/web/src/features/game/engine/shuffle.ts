import {
  assertBoard,
  createBoard,
  createTileFactory,
  resolveEngineConfig,
} from "./board";
import { Match3EngineError } from "./errors";
import { generateBoard } from "./generate";
import { findMatches, hasLegalMove } from "./matches";
import { sampleIndex } from "./random";
import type {
  Board,
  EngineConfig,
  PlayabilityResult,
  RandomSource,
  Tile,
} from "./types";

export function ensurePlayableBoard(
  board: Board,
  input: Partial<EngineConfig>,
  random: RandomSource,
): PlayabilityResult {
  assertBoard(board);
  if (findMatches(board).coordinates.length > 0) {
    throw new Match3EngineError(
      "invalid-board",
      "Playability can only be checked after the board is stable.",
    );
  }
  if (hasLegalMove(board)) {
    return { kind: "unchanged", board };
  }
  return shuffleBoard(board, input, random);
}

export function shuffleBoard(
  board: Board,
  input: Partial<EngineConfig>,
  random: RandomSource,
): PlayabilityResult {
  assertBoard(board);
  const config = resolveBoardConfig(board, input);
  const originalTiles = board.cells.flat();

  for (let attempt = 0; attempt < config.maxShuffleAttempts; attempt += 1) {
    const tiles = [...originalTiles];
    fisherYates(tiles, random);
    const candidate = createBoard(
      Array.from({ length: board.rows }, (_, row) =>
        tiles.slice(row * board.columns, (row + 1) * board.columns),
      ),
    );
    if (
      findMatches(candidate).coordinates.length === 0 &&
      hasLegalMove(candidate)
    ) {
      return { kind: "shuffled", board: candidate };
    }
  }

  const generated = generateBoard(config, random);
  const createTile = createTileFactory(board);
  const rebuilt = createBoard(
    generated.board.cells.map((row) =>
      row.map((tile) => createTile(tile.type)),
    ),
  );
  return { kind: "rebuilt", board: rebuilt };
}

function resolveBoardConfig(
  board: Board,
  input: Partial<EngineConfig>,
): EngineConfig {
  if (
    (input.rows !== undefined && input.rows !== board.rows) ||
    (input.columns !== undefined && input.columns !== board.columns)
  ) {
    throw new Match3EngineError(
      "invalid-config",
      "Engine configuration dimensions must match the input board.",
    );
  }
  return resolveEngineConfig({
    ...input,
    rows: board.rows,
    columns: board.columns,
  });
}

function fisherYates(tiles: Tile[], random: RandomSource): void {
  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const target = sampleIndex(random, index + 1);
    [tiles[index], tiles[target]] = [tiles[target], tiles[index]];
  }
}
