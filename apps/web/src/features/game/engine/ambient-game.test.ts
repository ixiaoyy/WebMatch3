import { describe, expect, it } from "vitest";

import {
  AmbientEngineError,
  FISH_KINDS,
  createLevelState,
  createInitialState,
  createSeededRandom,
  feedPiece,
  getBlockerIds,
  getLevelConfig,
  getSelectablePieces,
  hasQuickMatch,
  recoverFullTray,
  selectPiece,
  type AmbientGameState,
  type FedFish,
  type PilePiece,
  type TrayPiece,
} from "./ambient";

describe("ambient fish engine", () => {
  it("creates a stable mixed, shallow, immediately playable scene", () => {
    const state = createInitialState(createSeededRandom(42));

    expect(state.pieces).toHaveLength(36);
    expect(state.level).toBe(1);
    expect(new Set(state.pieces.map((piece) => piece.id)).size).toBe(36);
    expect(new Set(state.pieces.map((piece) => piece.kind)).size).toBeGreaterThan(1);
    expect(state.pieces.every((piece) => piece.layer >= 0 && piece.layer <= 2)).toBe(true);
    expect(state.pieces.every((piece) =>
      piece.pile.x === piece.spread.x && piece.pile.y === piece.spread.y,
    )).toBe(true);
    expect(state.pieces.every((piece) => Array.isArray(piece.blockerIds))).toBe(true);
    expect(state.pieces.some((piece) => (piece.blockerIds?.length ?? 0) > 0)).toBe(true);
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

  it("matches blocker geometry to the rendered fish height", () => {
    const lower: PilePiece = {
      id: "lower",
      kind: "whale",
      pile: { x: 0.5, y: 0.5 },
      spread: { x: 0.2, y: 0.2 },
      rotation: 0,
      scale: 1,
      layer: 0,
    };
    const upper: PilePiece = {
      ...lower,
      id: "upper",
      kind: "pufferfish",
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
    expect(third.state.pieces).toHaveLength(33);
    expect(hasQuickMatch(third.state.pieces)).toBe(true);
  });

  it("stores only higher-layer blockers and ignores them after removal", () => {
    const state = createInitialState(createSeededRandom(9));
    const blocked = state.pieces.find((piece) =>
      (piece.blockerIds?.length ?? 0) > 0
    );
    expect(blocked).toBeDefined();
    if (!blocked) return;
    const blockers = getBlockerIds(state.pieces, blocked.id);

    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.every((blockerId) =>
      state.pieces.find((piece) => piece.id === blockerId)!.layer > blocked.layer
    )).toBe(true);
    const withoutBlockers = state.pieces.filter(
      (piece) => !blockers.includes(piece.id),
    );
    expect(getBlockerIds(withoutBlockers, blocked.id)).toEqual([]);
  });

  it("feeds any three selectable species without growing the plant", () => {
    const base = createInitialState(createSeededRandom(23));
    const targets = FISH_KINDS.slice(0, 3).map((kind, index) => ({
      ...base.pieces.find((piece) => piece.kind === kind)!,
      id: `feed-${index}`,
      kind,
      pile: { x: 0.15 + index * 0.25, y: 0.2 },
      layer: 0 as const,
    }));
    let state: AmbientGameState = {
      ...base,
      pieces: [
        ...targets,
        { ...base.pieces[0], id: "keep", pile: { x: 0.9, y: 0.9 }, layer: 0 },
      ],
    };
    expect(targets).toHaveLength(3);

    for (const target of targets) {
      const result = feedPiece(state, target.id, createSeededRandom(24));
      expect(result.kind).toBe("fed");
      state = result.state;
    }

    expect(state.fed.map((piece) => piece.kind)).toEqual(
      targets.map((piece) => piece.kind),
    );
    expect(state.fed.every((piece) => !piece.settled)).toBe(true);
    expect(state.clearCount).toBe(0);
  });

  it("uses feed credits once to remove a one- or two-fish tray group", () => {
    const base = createInitialState(createSeededRandom(25));
    const triple = getSelectablePieces(base.pieces).filter(
      (piece, _, pieces) =>
        pieces.filter((candidate) => candidate.kind === piece.kind).length >= 3,
    );
    const targets = triple
      .filter((piece) => piece.kind === triple[0].kind)
      .slice(0, 3);

    const firstFeed = feedPiece(base, targets[0].id, createSeededRandom(26));
    expect(firstFeed.kind).toBe("fed");
    const firstTray = selectPiece(firstFeed.state, targets[1].id, createSeededRandom(27));
    expect(firstTray.kind).toBe("moved");
    const twoFishSettlement = selectPiece(
      firstTray.state,
      targets[2].id,
      createSeededRandom(28),
    );
    expect(twoFishSettlement.kind).toBe("settled");
    expect(twoFishSettlement.state.tray).toHaveLength(0);
    expect(twoFishSettlement.state.fed).toEqual([
      { id: targets[0].id, kind: targets[0].kind, settled: true },
    ]);
    expect(twoFishSettlement.state.clearCount).toBe(0);

    const creditKind = "whale" as const;
    const fed: readonly FedFish[] = [
      { id: "fed-1", kind: creditKind, settled: false },
    ];
    const customState: AmbientGameState = {
      ...base,
      pieces: [
        { ...base.pieces[0], id: "feed-2", kind: creditKind, layer: 0 },
        { ...base.pieces[1], id: "keep-1", kind: "koi", layer: 0 },
      ],
      tray: [{ id: "tray-1", kind: creditKind }],
      fed,
    };
    const oneFishSettlement = feedPiece(
      customState,
      "feed-2",
      createSeededRandom(29),
    );
    expect(oneFishSettlement.kind).toBe("fed");
    if (oneFishSettlement.kind !== "fed") return;
    expect(oneFishSettlement.settled).toEqual(customState.tray);
    expect(oneFishSettlement.state.tray).toHaveLength(0);
    expect(oneFishSettlement.state.fed.every((piece) => piece.settled)).toBe(true);
    expect(oneFishSettlement.state.clearCount).toBe(base.clearCount);
  });

  it("prioritizes a normal tray triple over unused feed credit", () => {
    const base = createInitialState(createSeededRandom(33));
    const target = getSelectablePieces(base.pieces)[0];
    const state: AmbientGameState = {
      ...base,
      pieces: [{ ...target, id: "third", layer: 0 }],
      tray: [
        { id: "first", kind: target.kind },
        { id: "second", kind: target.kind },
      ],
      fed: [{ id: "credit", kind: target.kind, settled: false }],
    };

    const result = selectPiece(state, "third", createSeededRandom(34));
    expect(result.kind).toBe("cleared");
    expect(result.state.clearCount).toBe(1);
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
    expect(FISH_KINDS).toEqual([
      "whale",
      "koi",
      "sardine",
      "pufferfish",
      "goldfish",
      "clownfish",
      "angelfish",
      "betta",
    ]);
    expect(getLevelConfig(1)).toEqual({
      pieceCount: 36,
      layerCount: 2,
      kindCount: 3,
    });
    expect(getLevelConfig(2)).toEqual({
      pieceCount: 42,
      layerCount: 2,
      kindCount: 4,
    });
    expect(Array.from({ length: 6 }, (_, index) =>
      getLevelConfig(index + 1).kindCount,
    )).toEqual([3, 4, 5, 6, 7, 8]);
    expect(getLevelConfig(99).kindCount).toBe(8);
    expect(getLevelConfig(3).layerCount).toBe(3);
    expect(Array.from({ length: 5 }, (_, index) =>
      getLevelConfig(index + 1).pieceCount,
    )).toEqual([36, 42, 48, 54, 60]);
    expect(getLevelConfig(7).pieceCount).toBe(60);
    expect(getLevelConfig(99).pieceCount).toBe(60);

    const densestLevel = createLevelState(5, 0, 1, createSeededRandom(105));
    expect(densestLevel.pieces).toHaveLength(60);
    expect(new Set(densestLevel.pieces.map((piece) =>
      `${piece.pile.x.toFixed(3)}:${piece.pile.y.toFixed(3)}`,
    )).size).toBe(60);

    const levelSix = createLevelState(6, 0, 1, createSeededRandom(106));
    expect(new Set(levelSix.pieces.map((piece) => piece.kind))).toEqual(
      new Set(FISH_KINDS),
    );
    for (const kind of FISH_KINDS) {
      expect(levelSix.pieces.filter((piece) => piece.kind === kind).length % 3).toBe(0);
    }
  });

  it("returns two pieces from a full tray without erasing progress", () => {
    const base = createInitialState(createSeededRandom(30));
    const tray: readonly TrayPiece[] = [
      { id: "t1", kind: "whale" },
      { id: "t2", kind: "koi" },
      { id: "t3", kind: "sardine" },
      { id: "t4", kind: "pufferfish" },
      { id: "t5", kind: "whale" },
      { id: "t6", kind: "koi" },
      { id: "t7", kind: "sardine" },
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
