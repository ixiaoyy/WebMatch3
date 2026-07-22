export const FISH_KINDS = [
  "whale",
  "koi",
  "sardine",
  "pufferfish",
  "goldfish",
  "clownfish",
  "angelfish",
  "betta",
] as const;

export type FishKind = (typeof FISH_KINDS)[number];
export type RandomSource = () => number;

export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface PilePiece {
  readonly id: string;
  readonly kind: FishKind;
  readonly pile: Point;
  readonly spread: Point;
  readonly rotation: number;
  readonly scale: number;
  readonly layer: 0 | 1 | 2;
  readonly blockerIds?: readonly string[];
}

export interface TrayPiece {
  readonly id: string;
  readonly kind: FishKind;
}

export interface FedFish extends TrayPiece {
  readonly settled: boolean;
}

export interface AmbientGameState {
  readonly pieces: readonly PilePiece[];
  readonly tray: readonly TrayPiece[];
  readonly fed: readonly FedFish[];
  readonly clearCount: number;
  readonly level: number;
  readonly nextPieceId: number;
}

export interface MissingSelection {
  readonly kind: "missing";
  readonly state: AmbientGameState;
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
  readonly levelAdvanced: boolean;
}

export interface SettledSelection {
  readonly kind: "settled";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly settled: readonly TrayPiece[];
  readonly levelAdvanced: boolean;
}

export interface LostSelection {
  readonly kind: "lost";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly tray: readonly TrayPiece[];
}

export type SelectionResult =
  | MissingSelection
  | MovedSelection
  | ClearedSelection
  | SettledSelection
  | LostSelection;

export interface FedFishResult {
  readonly kind: "fed";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly settled: readonly TrayPiece[];
  readonly levelAdvanced: boolean;
}

export interface FeedMissingResult {
  readonly kind: "missing";
  readonly state: AmbientGameState;
}

export interface FeedFullResult {
  readonly kind: "full";
  readonly state: AmbientGameState;
}

export type FeedResult =
  | FedFishResult
  | FeedMissingResult
  | FeedFullResult;
