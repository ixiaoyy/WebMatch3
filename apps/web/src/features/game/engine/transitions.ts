import { createLevelState } from "./pile";
import {
  type AmbientGameState,
  type FedFish,
  type FeedResult,
  type FishKind,
  type RandomSource,
  type SelectionResult,
  type TrayPiece,
} from "./ambient-types";

const MAX_FED_FISH = 3;

export function restartAfterLoss(
  state: AmbientGameState,
  random: RandomSource = Math.random,
): AmbientGameState {
  return createLevelState(1, state.clearCount, state.nextPieceId, random);
}

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

export function feedPiece(
  state: AmbientGameState,
  pieceId: string,
  random: RandomSource = Math.random,
): FeedResult {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) return { kind: "missing", state };

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
