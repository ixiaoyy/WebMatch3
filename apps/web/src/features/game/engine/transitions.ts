import {
  createLevelState,
  exposePieceForRecovery,
  getBlockerIds,
  getSelectablePieces,
  returnTrayPiecesToPile,
} from "./pile";
import {
  FISH_KINDS,
  type AmbientGameState,
  type FedFish,
  type FeedResult,
  type FishKind,
  type RandomSource,
  type RecoveryResult,
  type SelectionResult,
  type TrayPiece,
} from "./ambient-types";

const MAX_FED_FISH = 3;

function findTriple(
  tray: readonly TrayPiece[],
  kind: FishKind,
): readonly TrayPiece[] {
  return tray.filter((piece) => piece.kind === kind).slice(0, 3);
}

interface CreditSettlement {
  readonly fed: readonly FedFish[];
  readonly tray: readonly TrayPiece[];
  readonly settled: readonly TrayPiece[];
}

function settleFishCredits(
  fed: readonly FedFish[],
  tray: readonly TrayPiece[],
  kind: FishKind,
): CreditSettlement | null {
  const trayFish = tray.filter((piece) => piece.kind === kind);
  const creditsNeeded = 3 - trayFish.length;
  if (creditsNeeded < 1 || creditsNeeded > 3) return null;

  const creditIds = new Set(
    fed
      .filter((piece) => piece.kind === kind && !piece.settled)
      .slice(0, creditsNeeded)
      .map((piece) => piece.id),
  );
  if (creditIds.size !== creditsNeeded) return null;

  const settledIds = new Set(trayFish.map((piece) => piece.id));
  return {
    fed: fed.map((piece) =>
      creditIds.has(piece.id) ? { ...piece, settled: true } : piece,
    ),
    tray: tray.filter((piece) => !settledIds.has(piece.id)),
    settled: trayFish,
  };
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

  const creditSettlement = settleFishCredits(state.fed, tray, selected.kind);
  if (creditSettlement) {
    const levelAdvanced = pieces.length === 0 && creditSettlement.tray.length === 0;
    return {
      kind: "settled",
      selected,
      settled: creditSettlement.settled,
      levelAdvanced,
      state: levelAdvanced
        ? createLevelState(
            state.level + 1,
            state.clearCount,
            state.nextPieceId,
            random,
          )
        : {
            ...state,
            pieces,
            tray: creditSettlement.tray,
            fed: creditSettlement.fed,
          },
    };
  }

  const nextState: AmbientGameState = { ...state, pieces, tray };
  if (tray.length === 7) {
    return { kind: "recovery-needed", state: nextState, selected };
  }
  return { kind: "moved", state: nextState, selected };
}

function countKinds(tray: readonly TrayPiece[]): Map<FishKind, number> {
  const counts = new Map<FishKind, number>();
  for (const kind of FISH_KINDS) {
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
    const fallbackKind = state.tray[0]?.kind ?? "whale";
    return { state, returned: [], preservedKind: fallbackKind };
  }

  const counts = countKinds(state.tray);
  const preservedKind = FISH_KINDS
    .filter((kind) => (counts.get(kind) ?? 0) >= 2)
    .find((kind) => state.pieces.some((piece) => piece.kind === kind)) ??
    FISH_KINDS.reduce((best, kind) =>
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

export function feedPiece(
  state: AmbientGameState,
  pieceId: string,
  random: RandomSource = Math.random,
): FeedResult {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) return { kind: "missing", state };

  const blockerIds = getBlockerIds(state.pieces, pieceId);
  if (blockerIds.length > 0) {
    return { kind: "blocked", state, blockerIds };
  }
  if (state.fed.length >= MAX_FED_FISH) return { kind: "full", state };

  const selected: TrayPiece = { id: piece.id, kind: piece.kind };
  const pieces = state.pieces.filter((candidate) => candidate.id !== pieceId);
  const fed: readonly FedFish[] = [
    ...state.fed,
    { ...selected, settled: false },
  ];
  const creditSettlement = settleFishCredits(fed, state.tray, selected.kind);
  const nextFed = creditSettlement?.fed ?? fed;
  const nextTray = creditSettlement?.tray ?? state.tray;

  const levelAdvanced = pieces.length === 0 && nextTray.length === 0;
  return {
    kind: "fed",
    selected,
    settled: creditSettlement?.settled ?? [],
    levelAdvanced,
    state: levelAdvanced
      ? createLevelState(
          state.level + 1,
          state.clearCount,
          state.nextPieceId,
          random,
        )
      : { ...state, pieces, tray: nextTray, fed: nextFed },
  };
}
