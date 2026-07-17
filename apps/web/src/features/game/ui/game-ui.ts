import type { Coordinate } from "@/features/game/engine";

import candyAmberUrl from "./assets/candy-amber.png";
import candyAquaUrl from "./assets/candy-aqua.png";
import candyCoralUrl from "./assets/candy-coral.png";
import candyLimeUrl from "./assets/candy-lime.png";
import candyRoseUrl from "./assets/candy-rose.png";
import candyVioletUrl from "./assets/candy-violet.png";

export type GamePhase =
  | "idle"
  | "swapping"
  | "invalid"
  | "clearing"
  | "settling"
  | "shuffling";

export type FocusDirection = "up" | "right" | "down" | "left";

export type SwipeResolution =
  | { readonly kind: "tap" }
  | { readonly kind: "blocked" }
  | { readonly kind: "swap"; readonly target: Coordinate };

export interface TilePresentation {
  readonly label: string;
  readonly assetUrl: string;
}

export interface GameHudState {
  readonly score: number | null;
  readonly targetScore: number | null;
  readonly remainingMoves: number | null;
  readonly combo: number | null;
}

export interface GameResultState {
  readonly outcome: "won" | "lost";
  readonly playerName: string;
  readonly score: number;
  readonly targetScore: number;
  readonly remainingMoves: number;
  readonly bestCombo: number;
  readonly bestScore: number;
  readonly isNewBest: boolean;
  readonly rank: number | null;
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

export function resolveSwipeGesture(
  coordinate: Coordinate,
  deltaX: number,
  deltaY: number,
  rows: number,
  columns: number,
  minimumDistance: number,
): SwipeResolution {
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);
  if (Math.max(horizontalDistance, verticalDistance) < minimumDistance) {
    return { kind: "tap" };
  }

  const direction: FocusDirection =
    horizontalDistance >= verticalDistance
      ? deltaX >= 0
        ? "right"
        : "left"
      : deltaY >= 0
        ? "down"
        : "up";
  const target = moveCoordinate(coordinate, direction, rows, columns);

  return coordinatesEqual(coordinate, target)
    ? { kind: "blocked" }
    : { kind: "swap", target };
}

const TILE_PRESENTATIONS: Readonly<Record<string, TilePresentation>> = {
  coral: { label: "珊瑚红方糖", assetUrl: candyCoralUrl },
  amber: { label: "琥珀黄水滴糖", assetUrl: candyAmberUrl },
  lime: { label: "青柠绿叶糖", assetUrl: candyLimeUrl },
  aqua: { label: "水蓝圆糖", assetUrl: candyAquaUrl },
  violet: { label: "紫罗兰花糖", assetUrl: candyVioletUrl },
  rose: { label: "玫瑰粉心形糖", assetUrl: candyRoseUrl },
};

const UNKNOWN_PRESENTATION: TilePresentation = {
  label: "未知糖果",
  assetUrl: candyAquaUrl,
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
