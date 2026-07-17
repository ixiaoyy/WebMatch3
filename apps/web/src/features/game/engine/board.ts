import { Match3EngineError } from "./errors";
import {
  DEFAULT_ENGINE_CONFIG,
  type Board,
  type Coordinate,
  type EngineConfig,
  type Tile,
} from "./types";

export function resolveEngineConfig(
  input: Partial<EngineConfig> = {},
): EngineConfig {
  const config: EngineConfig = {
    rows: input.rows ?? DEFAULT_ENGINE_CONFIG.rows,
    columns: input.columns ?? DEFAULT_ENGINE_CONFIG.columns,
    tileTypes: [...(input.tileTypes ?? DEFAULT_ENGINE_CONFIG.tileTypes)],
    maxGenerationAttempts:
      input.maxGenerationAttempts ??
      DEFAULT_ENGINE_CONFIG.maxGenerationAttempts,
    maxShuffleAttempts:
      input.maxShuffleAttempts ?? DEFAULT_ENGINE_CONFIG.maxShuffleAttempts,
    maxCascadeDepth:
      input.maxCascadeDepth ?? DEFAULT_ENGINE_CONFIG.maxCascadeDepth,
  };

  if (
    !Number.isInteger(config.rows) ||
    !Number.isInteger(config.columns) ||
    config.rows < 3 ||
    config.columns < 3
  ) {
    throw new Match3EngineError(
      "invalid-config",
      "Boards must have at least three integer rows and columns.",
    );
  }

  const uniqueTypes = new Set(config.tileTypes);
  if (
    config.tileTypes.length < 3 ||
    uniqueTypes.size !== config.tileTypes.length ||
    config.tileTypes.some(
      (type) => typeof type !== "string" || type.trim().length === 0,
    )
  ) {
    throw new Match3EngineError(
      "invalid-config",
      "At least three unique, non-empty tile types are required.",
    );
  }

  if (
    !isNonNegativeInteger(config.maxGenerationAttempts) ||
    !isNonNegativeInteger(config.maxShuffleAttempts) ||
    !Number.isInteger(config.maxCascadeDepth) ||
    config.maxCascadeDepth <= 0
  ) {
    throw new Match3EngineError(
      "invalid-config",
      "Generation and shuffle limits must be non-negative integers, and the cascade limit must be positive.",
    );
  }

  return config;
}

export function assertBoard(board: Board): void {
  if (
    !Number.isInteger(board.rows) ||
    !Number.isInteger(board.columns) ||
    board.rows <= 0 ||
    board.columns <= 0 ||
    board.cells.length !== board.rows
  ) {
    throw new Match3EngineError(
      "invalid-board",
      "Board dimensions must be positive integers matching the cell matrix.",
    );
  }

  const ids = new Set<string>();
  for (const row of board.cells) {
    if (row.length !== board.columns) {
      throw new Match3EngineError(
        "invalid-board",
        "Every board row must match the declared column count.",
      );
    }

    for (const tile of row) {
      if (
        typeof tile.id !== "string" ||
        tile.id.length === 0 ||
        typeof tile.type !== "string" ||
        tile.type.length === 0 ||
        ids.has(tile.id)
      ) {
        throw new Match3EngineError(
          "invalid-board",
          "Every tile must have a non-empty, board-unique id and type.",
        );
      }
      ids.add(tile.id);
    }
  }
}

export function createBoardFromTypes(
  types: readonly (readonly string[])[],
): Board {
  if (types.length === 0 || types[0]?.length === 0) {
    throw new Match3EngineError(
      "invalid-board",
      "A type matrix must contain at least one row and column.",
    );
  }

  const columns = types[0].length;
  if (
    types.some(
      (row) =>
        row.length !== columns ||
        row.some((type) => typeof type !== "string" || type.length === 0),
    )
  ) {
    throw new Match3EngineError(
      "invalid-board",
      "A type matrix must be rectangular and contain non-empty type names.",
    );
  }

  let nextId = 1;
  return createBoard(
    types.map((row) =>
      row.map((type) => ({
        id: `tile-${nextId++}`,
        type,
      })),
    ),
  );
}

export function createBoard(cells: readonly (readonly Tile[])[]): Board {
  const board: Board = {
    rows: cells.length,
    columns: cells[0]?.length ?? 0,
    cells: cells.map((row) => row.map((tile) => ({ ...tile }))),
  };
  assertBoard(board);
  return board;
}

export function createTileFactory(board?: Board): (type: string) => Tile {
  const usedIds = new Set<string>();
  let nextId = 1;

  if (board) {
    assertBoard(board);
    for (const row of board.cells) {
      for (const tile of row) {
        usedIds.add(tile.id);
        const match = /^tile-(\d+)$/.exec(tile.id);
        if (match) {
          nextId = Math.max(nextId, Number(match[1]) + 1);
        }
      }
    }
  }

  return (type: string) => {
    while (usedIds.has(`tile-${nextId}`)) {
      nextId += 1;
    }
    const tile: Tile = { id: `tile-${nextId++}`, type };
    usedIds.add(tile.id);
    return tile;
  };
}

export function isInBounds(board: Board, coordinate: Coordinate): boolean {
  return (
    Number.isInteger(coordinate.row) &&
    Number.isInteger(coordinate.column) &&
    coordinate.row >= 0 &&
    coordinate.row < board.rows &&
    coordinate.column >= 0 &&
    coordinate.column < board.columns
  );
}

export function areSameCoordinate(
  first: Coordinate,
  second: Coordinate,
): boolean {
  return first.row === second.row && first.column === second.column;
}

export function areAdjacent(first: Coordinate, second: Coordinate): boolean {
  return (
    Math.abs(first.row - second.row) +
      Math.abs(first.column - second.column) ===
    1
  );
}

export function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.row}:${coordinate.column}`;
}

export function swapTiles(
  board: Board,
  first: Coordinate,
  second: Coordinate,
): Board {
  assertBoard(board);
  if (!isInBounds(board, first) || !isInBounds(board, second)) {
    throw new Match3EngineError(
      "invalid-board",
      "Cannot swap coordinates outside the board.",
    );
  }

  const cells = board.cells.map((row) => [...row]);
  const firstTile = cells[first.row][first.column];
  const secondTile = cells[second.row][second.column];
  cells[first.row][first.column] = secondTile;
  cells[second.row][second.column] = firstTile;
  return createBoard(cells);
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
