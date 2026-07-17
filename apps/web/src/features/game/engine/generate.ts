import {
  createBoard,
  createTileFactory,
  resolveEngineConfig,
} from "./board";
import { Match3EngineError } from "./errors";
import { findMatches, hasLegalMove } from "./matches";
import { sampleIndex } from "./random";
import type {
  Board,
  EngineConfig,
  GeneratedBoard,
  RandomSource,
  Tile,
} from "./types";

export function generateBoard(
  input: Partial<EngineConfig>,
  random: RandomSource,
): GeneratedBoard {
  const config = resolveEngineConfig(input);

  for (
    let attempt = 0;
    attempt < config.maxGenerationAttempts;
    attempt += 1
  ) {
    const board = buildCandidateBoard(config, random);
    if (hasLegalMove(board)) {
      return { board, fallbackUsed: false };
    }
  }

  const board = buildFallbackBoard(config);
  if (findMatches(board).coordinates.length > 0 || !hasLegalMove(board)) {
    throw new Match3EngineError(
      "generation-failed",
      "The deterministic fallback could not produce a stable playable board.",
    );
  }

  return { board, fallbackUsed: true };
}

function buildCandidateBoard(
  config: EngineConfig,
  random: RandomSource,
): Board {
  const createTile = createTileFactory();
  const cells: Tile[][] = [];

  for (let row = 0; row < config.rows; row += 1) {
    const currentRow: Tile[] = [];
    cells.push(currentRow);

    for (let column = 0; column < config.columns; column += 1) {
      const startIndex = sampleIndex(random, config.tileTypes.length);
      const type = chooseType(
        config.tileTypes,
        startIndex,
        cells,
        row,
        column,
      );
      currentRow.push(createTile(type));
    }
  }

  return createBoard(cells);
}

function buildFallbackBoard(config: EngineConfig): Board {
  const createTile = createTileFactory();
  const cells: (Tile | undefined)[][] = Array.from(
    { length: config.rows },
    () => Array<Tile | undefined>(config.columns),
  );
  const [first, second, third] = config.tileTypes;

  cells[0][0] = createTile(first);
  cells[0][1] = createTile(second);
  cells[0][2] = createTile(first);
  cells[1][0] = createTile(third);
  cells[1][1] = createTile(first);
  cells[1][2] = createTile(third);

  for (let row = 0; row < config.rows; row += 1) {
    for (let column = 0; column < config.columns; column += 1) {
      if (cells[row][column]) {
        continue;
      }
      const startIndex =
        (row * config.columns + column) % config.tileTypes.length;
      const type = chooseType(
        config.tileTypes,
        startIndex,
        cells,
        row,
        column,
      );
      cells[row][column] = createTile(type);
    }
  }

  return createBoard(
    cells.map((row) =>
      row.map((tile) => {
        if (!tile) {
          throw new Match3EngineError(
            "generation-failed",
            "The fallback board contains an unfilled coordinate.",
          );
        }
        return tile;
      }),
    ),
  );
}

function chooseType(
  tileTypes: readonly string[],
  startIndex: number,
  cells: readonly (readonly (Tile | undefined)[])[],
  row: number,
  column: number,
): string {
  for (let offset = 0; offset < tileTypes.length; offset += 1) {
    const type = tileTypes[(startIndex + offset) % tileTypes.length];
    if (!wouldCreateImmediateMatch(cells, row, column, type)) {
      return type;
    }
  }

  throw new Match3EngineError(
    "generation-failed",
    `No tile type can fill coordinate ${row}:${column} without an immediate match.`,
  );
}

function wouldCreateImmediateMatch(
  cells: readonly (readonly (Tile | undefined)[])[],
  row: number,
  column: number,
  type: string,
): boolean {
  const horizontal =
    column >= 2 &&
    cells[row][column - 1]?.type === type &&
    cells[row][column - 2]?.type === type;
  const vertical =
    row >= 2 &&
    cells[row - 1][column]?.type === type &&
    cells[row - 2][column]?.type === type;
  return horizontal || vertical;
}
