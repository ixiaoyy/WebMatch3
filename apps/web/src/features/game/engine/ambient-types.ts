export const JELLY_KINDS = ["aqua", "amber", "lime", "rose"] as const;

export type JellyKind = (typeof JELLY_KINDS)[number];
export type RandomSource = () => number;

export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface PilePiece {
  readonly id: string;
  readonly kind: JellyKind;
  readonly pile: Point;
  readonly spread: Point;
  readonly rotation: number;
  readonly scale: number;
  readonly layer: 0 | 1 | 2;
}

export interface TrayPiece {
  readonly id: string;
  readonly kind: JellyKind;
}

export interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly clearCount: number;
  readonly nextPieceId: number;
}

export interface MissingSelection {
  readonly kind: "missing";
  readonly state: AmbientGameState;
}

export interface BlockedSelection {
  readonly kind: "blocked";
  readonly state: AmbientGameState;
  readonly blockerIds: readonly string[];
}

export interface MovedSelection {
  readonly kind: "moved";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
}

export interface ClearedSelection {
  readonly kind: "cleared";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly cleared: readonly TrayPiece[];
}

export interface RecoveryNeededSelection {
  readonly kind: "recovery-needed";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
}

export type SelectionResult =
  | MissingSelection
  | BlockedSelection
  | MovedSelection
  | ClearedSelection
  | RecoveryNeededSelection;

export interface RecoveryResult {
  readonly state: AmbientGameState;
  readonly returned: readonly TrayPiece[];
  readonly preservedKind: JellyKind;
}
