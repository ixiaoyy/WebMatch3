import { describe, expect, it } from "vitest";

import {
  AmbientEngineError,
  createLevelState,
  createInitialState,
  createSeededRandom,
  getBlockerIds,
  getLevelConfig,
  getSelectablePieces,
  hasQuickMatch,
  recoverFullTray,
  selectPiece,
  type AmbientGameState,
  type PilePiece,
  type TrayPiece,
} from "./ambient";

describe("ambient jelly engine", () => {
  it("creates an irregular, shallow, immediately playable scene", () => {
    const state = createInitialState(createSeededRandom(42));

    expect(state.pieces).toHaveLength(18);
    expect(state.level).toBe(1);
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

  it("matches blocker geometry to the rendered jelly height", () => {
    const lower: PilePiece = {
      id: "lower",
      kind: "aqua",
      pile: { x: 0.5, y: 0.5 },
      spread: { x: 0.2, y: 0.2 },
      rotation: 0,
      scale: 1,
      layer: 0,
    };
    const upper: PilePiece = {
      ...lower,
      id: "upper",
      kind: "rose",
      pile: { x: 0.5, y: 0.635 },
      layer: 1,
    };

    expect(getBlockerIds([lower, upper], lower.id)).toEqual([upper.id]);
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
    expect(third.state.pieces).toHaveLength(15);
    expect(hasQuickMatch(third.state.pieces)).toBe(true);
  });

  it("constructs every progressive level with a complete removal path", () => {
    for (let level = 1; level <= 8; level += 1) {
      const random = createSeededRandom(100 + level);
      let state = createLevelState(level, 0, 1, random);
      let clears = 0;

      while (state.level === level) {
        const selectable = getSelectablePieces(state.pieces);
        const highestLayer = Math.max(...state.pieces.map((piece) => piece.layer));
        const exposedLayer = selectable.filter((piece) => piece.layer === highestLayer);
        const matching = exposedLayer.find(
          (piece) => exposedLayer.filter(
            (candidate) => candidate.kind === piece.kind,
          ).length >= 3,
        );
        expect(matching).toBeDefined();
        if (!matching) break;
        const triple = exposedLayer
          .filter((piece) => piece.kind === matching.kind)
          .slice(0, 3);

        for (const piece of triple) {
          const result = selectPiece(state, piece.id, random);
          expect(result.kind === "moved" || result.kind === "cleared").toBe(true);
          if (result.kind === "cleared") clears += 1;
          state = result.state;
        }
      }

      expect(state.level).toBe(level + 1);
      expect(clears).toBe(getLevelConfig(level).pieceCount / 3);
    }
  });

  it("raises piece, layer, and kind difficulty without exceeding the layout cap", () => {
    expect(getLevelConfig(1)).toEqual({
      pieceCount: 18,
      layerCount: 2,
      kindCount: 3,
    });
    expect(getLevelConfig(2)).toEqual({
      pieceCount: 21,
      layerCount: 2,
      kindCount: 4,
    });
    expect(getLevelConfig(3).layerCount).toBe(3);
    expect(getLevelConfig(7).pieceCount).toBe(36);
    expect(getLevelConfig(99).pieceCount).toBe(36);
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
    expect(result.state.nextPieceId).toBe(state.nextPieceId);
    expect(result.returned.every((returned) => result.state.pieces.some(
      (piece) => piece.id === returned.id && piece.kind === returned.kind,
    ))).toBe(true);
    expect(
      getSelectablePieces(result.state.pieces).some(
        (piece) => piece.kind === result.preservedKind,
      ),
    ).toBe(true);
    const completingPiece = getSelectablePieces(result.state.pieces).find(
      (piece) => piece.kind === result.preservedKind,
    );
    expect(completingPiece).toBeDefined();
    if (!completingPiece) return;
    const completion = selectPiece(
      result.state,
      completingPiece.id,
      createSeededRandom(32),
    );
    expect(completion.kind).toBe("cleared");
    expect(completion.state.tray).toHaveLength(3);
  });

  it("rejects invalid random sources", () => {
    expect(() => createInitialState(() => 1)).toThrow(AmbientEngineError);
    expect(() => createInitialState(() => Number.NaN)).toThrow(AmbientEngineError);
  });
});
