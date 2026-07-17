import {
  assertBoard,
  coordinateKey,
  swapTiles,
} from "./board";
import type {
  Board,
  Coordinate,
  LegalMove,
  MatchAxis,
  MatchGroup,
  MatchResult,
} from "./types";

export function findMatches(board: Board): MatchResult {
  assertBoard(board);
  const groups: MatchGroup[] = [];

  for (let row = 0; row < board.rows; row += 1) {
    scanLine(
      board.columns,
      (column) => board.cells[row][column].type,
      (column) => ({ row, column }),
      "horizontal",
      groups,
    );
  }

  for (let column = 0; column < board.columns; column += 1) {
    scanLine(
      board.rows,
      (row) => board.cells[row][column].type,
      (row) => ({ row, column }),
      "vertical",
      groups,
    );
  }

  const uniqueCoordinates = new Map<string, Coordinate>();
  for (const group of groups) {
    for (const coordinate of group.coordinates) {
      uniqueCoordinates.set(coordinateKey(coordinate), coordinate);
    }
  }

  const coordinates = [...uniqueCoordinates.values()].sort(
    (first, second) =>
      first.row - second.row || first.column - second.column,
  );

  return { groups, coordinates };
}

export function listLegalMoves(board: Board): readonly LegalMove[] {
  assertBoard(board);
  const moves: LegalMove[] = [];

  for (let row = 0; row < board.rows; row += 1) {
    for (let column = 0; column < board.columns; column += 1) {
      const from = { row, column };
      if (column + 1 < board.columns) {
        const to = { row, column: column + 1 };
        if (wouldSwapCreateMatch(board, from, to)) {
          moves.push({ from, to });
        }
      }
      if (row + 1 < board.rows) {
        const to = { row: row + 1, column };
        if (wouldSwapCreateMatch(board, from, to)) {
          moves.push({ from, to });
        }
      }
    }
  }

  return moves;
}

export function hasLegalMove(board: Board): boolean {
  assertBoard(board);

  for (let row = 0; row < board.rows; row += 1) {
    for (let column = 0; column < board.columns; column += 1) {
      const from = { row, column };
      if (
        column + 1 < board.columns &&
        wouldSwapCreateMatch(board, from, { row, column: column + 1 })
      ) {
        return true;
      }
      if (
        row + 1 < board.rows &&
        wouldSwapCreateMatch(board, from, { row: row + 1, column })
      ) {
        return true;
      }
    }
  }

  return false;
}

export function wouldSwapCreateMatch(
  board: Board,
  from: Coordinate,
  to: Coordinate,
): boolean {
  const swapped = swapTiles(board, from, to);
  const matches = findMatches(swapped);
  const targetKeys = new Set([coordinateKey(from), coordinateKey(to)]);
  return matches.coordinates.some((coordinate) =>
    targetKeys.has(coordinateKey(coordinate)),
  );
}

function scanLine(
  length: number,
  getType: (index: number) => string,
  getCoordinate: (index: number) => Coordinate,
  axis: MatchAxis,
  groups: MatchGroup[],
): void {
  let start = 0;

  while (start < length) {
    const type = getType(start);
    let end = start + 1;
    while (end < length && getType(end) === type) {
      end += 1;
    }

    if (end - start >= 3) {
      const coordinates: Coordinate[] = [];
      for (let index = start; index < end; index += 1) {
        coordinates.push(getCoordinate(index));
      }
      groups.push({ axis, coordinates });
    }

    start = end;
  }
}
