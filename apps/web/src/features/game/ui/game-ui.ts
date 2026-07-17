import type { Coordinate } from "@/features/game/engine";

export type GamePhase =
  | "idle"
  | "swapping"
  | "invalid"
  | "clearing"
  | "settling"
  | "shuffling";

export type FocusDirection = "up" | "right" | "down" | "left";

export interface TilePresentation {
  readonly label: string;
  readonly glyph: string;
}

export interface GameHudState {
  readonly score: number | null;
  readonly targetScore: number | null;
  readonly remainingMoves: number | null;
  readonly combo: number | null;
}

export interface GameResultState {
  readonly outcome: "won" | "lost";
  readonly score: number;
  readonly targetScore: number;
  readonly remainingMoves: number;
  readonly bestScore: number;
  readonly isNewBest: boolean;
}

export function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.row}:${coordinate.column}`;
}

export function coordinatesEqual(
  first: Coordinate | null,
  second: Coordinate,
): boolean {
  return (
    first?.row === second.row && first.column === second.column
  );
}

export function moveCoordinate(
  coordinate: Coordinate,
  direction: FocusDirection,
  rows: number,
  columns: number,
): Coordinate {
  const deltas: Record<FocusDirection, Coordinate> = {
    up: { row: -1, column: 0 },
    right: { row: 0, column: 1 },
    down: { row: 1, column: 0 },
    left: { row: 0, column: -1 },
  };
  const delta = deltas[direction];

  return {
    row: Math.min(rows - 1, Math.max(0, coordinate.row + delta.row)),
    column: Math.min(
      columns - 1,
      Math.max(0, coordinate.column + delta.column),
    ),
  };
}

const TILE_PRESENTATIONS: Readonly<Record<string, TilePresentation>> = {
  coral: { label: "珊瑚圆印", glyph: "●" },
  amber: { label: "琥珀方印", glyph: "■" },
  lime: { label: "青柠菱印", glyph: "◆" },
  aqua: { label: "水蓝六角印", glyph: "⬢" },
  violet: { label: "紫罗兰星印", glyph: "✦" },
  rose: { label: "玫红花印", glyph: "✤" },
};

const UNKNOWN_PRESENTATION: TilePresentation = {
  label: "未知印记",
  glyph: "•",
};

export function getTilePresentation(type: string): TilePresentation {
  return TILE_PRESENTATIONS[type] ?? UNKNOWN_PRESENTATION;
}

export function getTileAriaLabel(
  type: string,
  coordinate: Coordinate,
  selected: boolean,
): string {
  const presentation = getTilePresentation(type);
  const selection = selected ? "，已选中" : "";
  return `${presentation.label}，第 ${coordinate.row + 1} 行，第 ${coordinate.column + 1} 列${selection}`;
}