import {
  createLevelState,
  exposePieceForRecovery,
  getBlockerIds,
  getSelectablePieces,
  returnTrayPiecesToPile,
} from "./pile";
import {
  JELLY_KINDS,
  type AmbientGameState,
  type JellyKind,
  type RandomSource,
  type RecoveryResult,
  type SelectionResult,
  type TrayPiece,
} from "./ambient-types";

function findTriple(
  tray: readonly TrayPiece[],
  kind: JellyKind,
): readonly TrayPiece[] {
  return tray.filter((piece) => piece.kind === kind).slice(0, 3);
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

  const blockerIds = getBlockerIds(state.pieces, pieceId);
  if (blockerIds.length > 0) {
    return { kind: "blocked", state, blockerIds };
  }

  const selected: TrayPiece = { id: piece.id, kind: piece.kind };
  const pieces = state.pieces.filter((candidate) => candidate.id !== pieceId);
  const tray = [...state.tray, selected];
  const triple = findTriple(tray, selected.kind);

  if (triple.length === 3) {
    const clearedIds = new Set(triple.map((candidate) => candidate.id));
    const remainingTray = tray.filter((candidate) => !clearedIds.has(candidate.id));
    const clearCount = state.clearCount + 1;
    const levelAdvanced = pieces.length === 0 && remainingTray.length === 0;
    return {
      kind: "cleared",
      selected,
      cleared: triple,
      levelAdvanced,
      state: levelAdvanced
        ? createLevelState(state.level + 1, clearCount, state.nextPieceId, random)
        : { ...state, pieces, tray: remainingTray, clearCount },
    };
  }

  const nextState: AmbientGameState = { ...state, pieces, tray };
  if (tray.length === 7) {
    return { kind: "recovery-needed", state: nextState, selected };
  }
  return { kind: "moved", state: nextState, selected };
}

function countKinds(tray: readonly TrayPiece[]): Map<JellyKind, number> {
  const counts = new Map<JellyKind, number>();
  for (const kind of JELLY_KINDS) {
    counts.set(kind, 0);
  }
  for (const piece of tray) {
    counts.set(piece.kind, (counts.get(piece.kind) ?? 0) + 1);
  }
  return counts;
}

export function recoverFullTray(
  state: AmbientGameState,
  random: RandomSource = Math.random,
): RecoveryResult {
  if (state.tray.length < 7) {
    const fallbackKind = state.tray[0]?.kind ?? "aqua";
    return { state, returned: [], preservedKind: fallbackKind };
  }

  const counts = countKinds(state.tray);
  const preservedKind = JELLY_KINDS
    .filter((kind) => (counts.get(kind) ?? 0) >= 2)
    .find((kind) => state.pieces.some((piece) => piece.kind === kind)) ??
    JELLY_KINDS.reduce((best, kind) =>
      (counts.get(kind) ?? 0) > (counts.get(best) ?? 0) ? kind : best,
    );
  const preservedIds = new Set(
    state.tray
      .filter((piece) => piece.kind === preservedKind)
      .slice(0, 2)
      .map((piece) => piece.id),
  );
  const returned = state.tray
    .filter((piece) => !preservedIds.has(piece.id))
    .slice(-2);
  const returnedIds = new Set(returned.map((piece) => piece.id));
  const completingPiece = state.pieces.find((piece) => piece.kind === preservedKind);
  const hasCompletingPiece = getSelectablePieces(state.pieces).some(
    (piece) => piece.kind === preservedKind,
  );
  const returnedPieces = returnTrayPiecesToPile(state, returned, random);
  let pieces = [...state.pieces, ...returnedPieces];
  if (!hasCompletingPiece && completingPiece) {
    pieces = [...exposePieceForRecovery(pieces, completingPiece.id, random)];
  }

  return {
    returned,
    preservedKind,
    state: {
      ...state,
      pieces,
      tray: state.tray.filter((piece) => !returnedIds.has(piece.id)),
    },
  };
}
