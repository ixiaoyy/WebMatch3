import { createLevelState } from "./pile";
import {
  type AmbientGameState,
  type FishKind,
  type RandomSource,
  type SelectionResult,
  type TrayPiece,
} from "./ambient-types";

export function restartAfterLoss(
  state: AmbientGameState,
  random: RandomSource = Math.random,
): AmbientGameState {
  return createLevelState(1, state.clearCount, state.nextPieceId, random);
}

/**
 * Finds the earliest three small fish of one species that can combine.
 * @param tray Ordered tray contents after the current selection.
 * @param kind Species whose small fish should combine.
 * @returns An ordered triple, or null when fewer than three are present.
 */
function findCombination(
  tray: readonly TrayPiece[],
  kind: FishKind,
): readonly [TrayPiece, TrayPiece, TrayPiece] | null {
  const matches = tray.filter((piece) => piece.kind === kind).slice(0, 3);
  const [first, second, third] = matches;
  return first && second && third ? [first, second, third] : null;
}

export function selectPiece(
  state: AmbientGameState,
  pieceId: string,
  random: RandomSource = Math.random,
): SelectionResult {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) {
    return { kind: "missing", state };
  }

  const selected: TrayPiece = { id: piece.id, kind: piece.kind };
  const pieces = state.pieces.filter((candidate) => candidate.id !== pieceId);
  const tray = [...state.tray, selected];
  const combined = findCombination(tray, selected.kind);

  if (combined) {
    const combinedIds = new Set(combined.map((candidate) => candidate.id));
    const remainingTray = tray.filter((candidate) =>
      !combinedIds.has(candidate.id)
    );
    const clearCount = state.clearCount + 1;
    const levelAdvanced = pieces.length === 0 && remainingTray.length === 0;
    return {
      kind: "combined",
      selected,
      combined,
      fishKind: selected.kind,
      levelAdvanced,
      state: levelAdvanced
        ? createLevelState(state.level + 1, clearCount, state.nextPieceId, random)
        : { ...state, pieces, tray: remainingTray, clearCount },
    };
  }

  if (tray.length === 7) {
    return {
      kind: "lost",
      state: restartAfterLoss(state, random),
      selected,
      tray,
    };
  }
  return { kind: "moved", state: { ...state, pieces, tray }, selected };
}
