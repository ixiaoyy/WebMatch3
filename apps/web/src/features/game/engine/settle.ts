import {
  assertBoard,
  coordinateKey,
  createBoard,
  createTileFactory,
  resolveEngineConfig,
} from "./board";
import { Match3EngineError } from "./errors";
import { findMatches } from "./matches";
import { sampleIndex } from "./random";
import type {
  Board,
  CascadeRound,
  EngineConfig,
  MatchResult,
  MovedTile,
  RandomSource,
  RemovedTile,
  SettlementResult,
  SpawnedTile,
  Tile,
} from "./types";

export function settleBoard(
  board: Board,
  random: RandomSource,
  input: Partial<EngineConfig> = {},
): SettlementResult {
  assertBoard(board);
  const config = resolveEngineConfig({
    ...input,
    rows: board.rows,
    columns: board.columns,
  });
  const createTile = createTileFactory(board);
  const cascades: CascadeRound[] = [];
  let current = board;
  let matches = findMatches(current);

  while (matches.coordinates.length > 0) {
    if (cascades.length >= config.maxCascadeDepth) {
      throw new Match3EngineError(
        "cascade-limit-exceeded",
        `The board still contains matches after ${config.maxCascadeDepth} cascade rounds.`,
      );
    }

    const round = settleRound(
      current,
      matches,
      cascades.length + 1,
      config.tileTypes,
      random,
      createTile,
    );
    cascades.push(round);
    current = round.after;
    matches = findMatches(current);
  }

  return { board: current, cascades };
}

function settleRound(
  board: Board,
  matches: MatchResult,
  index: number,
  tileTypes: readonly string[],
  random: RandomSource,
  createTile: (type: string) => Tile,
): CascadeRound {
  const removedKeys = new Set(matches.coordinates.map(coordinateKey));
  const removed: RemovedTile[] = matches.coordinates.map((coordinate) => ({
    tile: board.cells[coordinate.row][coordinate.column],
    from: coordinate,
  }));
  const moved: MovedTile[] = [];
  const spawned: SpawnedTile[] = [];
  const nextCells: (Tile | undefined)[][] = Array.from(
    { length: board.rows },
    () => Array<Tile | undefined>(board.columns),
  );

  for (let column = 0; column < board.columns; column += 1) {
    let writeRow = board.rows - 1;

    for (let readRow = board.rows - 1; readRow >= 0; readRow -= 1) {
      if (removedKeys.has(`${readRow}:${column}`)) {
        continue;
      }
      const tile = board.cells[readRow][column];
      nextCells[writeRow][column] = tile;
      if (writeRow !== readRow) {
        moved.push({
          tile,
          from: { row: readRow, column },
          to: { row: writeRow, column },
        });
      }
      writeRow -= 1;
    }

    const spawnCount = writeRow + 1;
    for (let row = 0; row < spawnCount; row += 1) {
      const type = tileTypes[sampleIndex(random, tileTypes.length)];
      const tile = createTile(type);
      nextCells[row][column] = tile;
      spawned.push({
        tile,
        from: { row: row - spawnCount, column },
        to: { row, column },
      });
    }
  }

  const after = createBoard(
    nextCells.map((row) =>
      row.map((tile) => {
        if (!tile) {
          throw new Match3EngineError(
            "invalid-board",
            "A settled board contains an unfilled coordinate.",
          );
        }
        return tile;
      }),
    ),
  );

  return {
    index,
    before: board,
    matches,
    removed,
    moved,
    spawned,
    after,
  };
}
