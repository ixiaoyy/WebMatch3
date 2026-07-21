import { describe, expect, it } from "vitest";

import {
  AmbientEngineError,
  createInitialState,
  createSeededRandom,
  getBlockerIds,
  getSelectablePieces,
  hasQuickMatch,
  recoverFullTray,
  selectPiece,
  type AmbientGameState,
  type TrayPiece,
} from "./ambient";

describe("ambient jelly engine", () => {
  it("creates an irregular, shallow, immediately playable scene", () => {
    const state = createInitialState(createSeededRandom(42));

    expect(state.pieces).toHaveLength(18);
    expect(new Set(state.pieces.map((piece) => piece.id)).size).toBe(18);
    expect(new Set(state.pieces.map((piece) => piece.kind)).size).toBeGreaterThan(1);
    expect(state.pieces.every((piece) => piece.layer >= 0 && piece.layer <= 2)).toBe(true);
    expect(state.pieces.some((piece) => piece.pile.x !== piece.spread.x)).toBe(true);
    expect(hasQuickMatch(state.pieces)).toBe(true);
  });

  it("blocks meaningful lower overlaps and reveals them synchronously", () => {
    const state = createInitialState(createSeededRandom(7));
    const blocked = state.pieces.find(
      (piece) => getBlockerIds(state.pieces, piece.id).length > 0,
    );
    expect(blocked).toBeDefined();
    if (!blocked) return;

    const blockedResult = selectPiece(state, blocked.id, createSeededRandom(8));
    expect(blockedResult.kind).toBe("blocked");
    expect(blockedResult.state).toBe(state);

    const blockerId = getBlockerIds(state.pieces, blocked.id)[0];
    const withoutBlocker = {
      ...state,
      pieces: state.pieces.filter((piece) => piece.id !== blockerId),
    };
    expect(getBlockerIds(withoutBlocker.pieces, blocked.id)).not.toContain(blockerId);
  });

  it("does not mutate the state for a missing selection", () => {
    const state = createInitialState(createSeededRandom(4));
    const snapshot = structuredClone(state);
    const result = selectPiece(state, "absent", createSeededRandom(5));

    expect(result.kind).toBe("missing");
    expect(result.state).toBe(state);
    expect(state).toEqual(snapshot);
  });

  it("moves selectable pieces in tray order and clears a triple", () => {
    let state = createInitialState(createSeededRandom(19));
    const match = getSelectablePieces(state.pieces).filter(
      (piece, _, selectable) =>
        selectable.filter((candidate) => candidate.kind === piece.kind).length >= 3,
    );
    const targets = match.filter((piece) => piece.kind === match[0].kind).slice(0, 3);

    const first = selectPiece(state, targets[0].id, createSeededRandom(20));
    expect(first.kind).toBe("moved");
    state = first.state;
    const second = selectPiece(state, targets[1].id, createSeededRandom(21));
    expect(second.kind).toBe("moved");
    state = second.state;
    expect(state.tray.map((piece) => piece.id)).toEqual([targets[0].id, targets[1].id]);

    const third = selectPiece(state, targets[2].id, createSeededRandom(22));
    expect(third.kind).toBe("cleared");
    expect(third.state.tray).toHaveLength(0);
    expect(third.state.clearCount).toBe(1);
    expect(third.state.pieces).toHaveLength(18);
    expect(hasQuickMatch(third.state.pieces)).toBe(true);
  });

  it("returns two pieces from a full tray without erasing progress", () => {
    const base = createInitialState(createSeededRandom(30));
    const tray: readonly TrayPiece[] = [
      { id: "t1", kind: "aqua" },
      { id: "t2", kind: "amber" },
      { id: "t3", kind: "lime" },
      { id: "t4", kind: "rose" },
      { id: "t5", kind: "aqua" },
      { id: "t6", kind: "amber" },
      { id: "t7", kind: "lime" },
    ];
    const state: AmbientGameState = { ...base, tray, clearCount: 9 };
    const result = recoverFullTray(state, createSeededRandom(31));

    expect(result.returned).toHaveLength(2);
    expect(result.state.tray).toHaveLength(5);
    expect(result.state.pieces).toHaveLength(base.pieces.length + 2);
    expect(result.state.clearCount).toBe(9);
    expect(
      getSelectablePieces(result.state.pieces).some(
        (piece) => piece.kind === result.preservedKind,
      ),
    ).toBe(true);
  });

  it("rejects invalid random sources", () => {
    expect(() => createInitialState(() => 1)).toThrow(AmbientEngineError);
    expect(() => createInitialState(() => Number.NaN)).toThrow(AmbientEngineError);
  });
});
