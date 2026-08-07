import { describe, expect, it } from "vitest";

import {
  AmbientEngineError,
  FISH_KINDS,
  createLevelState,
  createInitialState,
  createSeededRandom,
  getBlockerIds,
  getLevelConfig,
  getSelectablePieces,
  hasDiscoverableMatch,
  hasQuickMatch,
  isSafeFieldPoint,
  selectPiece,
  type AmbientGameState,
  type PilePiece,
} from "./ambient";

/**
 * Finds one same-species triple from the supplied pile.
 * @param pieces Candidate pile pieces, optionally spanning multiple species.
 * @returns An ordered triple, or null when no species has three fish.
 */
function findCompleteSet(
  pieces: readonly PilePiece[],
): readonly [PilePiece, PilePiece, PilePiece] | null {
  for (const kind of FISH_KINDS) {
    const [first, second, third] = pieces.filter((piece) =>
      piece.kind === kind
    );
    if (first && second && third) return [first, second, third];
  }
  return null;
}

function footprintsOverlap(first: PilePiece, second: PilePiece): boolean {
  const firstWidth = 0.2 * first.scale;
  const firstHeight = 0.29 * first.scale;
  const secondWidth = 0.2 * second.scale;
  const secondHeight = 0.29 * second.scale;
  const overlapWidth = Math.max(
    0,
    Math.min(first.pile.x + firstWidth / 2, second.pile.x + secondWidth / 2) -
      Math.max(first.pile.x - firstWidth / 2, second.pile.x - secondWidth / 2),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(first.pile.y + firstHeight / 2, second.pile.y + secondHeight / 2) -
      Math.max(first.pile.y - firstHeight / 2, second.pile.y - secondHeight / 2),
  );
  return overlapWidth * overlapHeight / (firstWidth * firstHeight) >= 0.28;
}

const EXPECTED_COVERAGE_REGIONS = [
  { minX: 0.06, maxX: 0.3, minY: 0.08, maxY: 0.34 },
  { minX: 0.3, maxX: 0.54, minY: 0.08, maxY: 0.34 },
  { minX: 0.54, maxX: 0.72, minY: 0.08, maxY: 0.35 },
  { minX: 0.06, maxX: 0.36, minY: 0.3, maxY: 0.61 },
  { minX: 0.57, maxX: 0.9, minY: 0.35, maxY: 0.63 },
  { minX: 0.06, maxX: 0.3, minY: 0.54, maxY: 0.8 },
  { minX: 0.3, maxX: 0.65, minY: 0.55, maxY: 0.8 },
  { minX: 0.65, maxX: 0.9, minY: 0.54, maxY: 0.8 },
] as const;

function isInsideExpectedSafeRegion(piece: PilePiece): boolean {
  return piece.pile.x >= 0.06 &&
    piece.pile.x <= 0.9 &&
    piece.pile.y >= 0.08 &&
    piece.pile.y <= 0.8 &&
    !(piece.pile.x > 0.72 && piece.pile.y < 0.36);
}

function getMissingExpectedRegions(pieces: readonly PilePiece[]): readonly number[] {
  return EXPECTED_COVERAGE_REGIONS.map((region, index) => pieces.some((piece) =>
    piece.pile.x >= region.minX &&
    piece.pile.x <= region.maxX &&
    piece.pile.y >= region.minY &&
    piece.pile.y <= region.maxY
  ) ? -1 : index).filter((index) => index >= 0);
}

function maxMeaningfulOverlapCount(pieces: readonly PilePiece[]): number {
  return Math.max(...pieces.map((piece) => pieces.filter((candidate) =>
    candidate.id !== piece.id && footprintsOverlap(piece, candidate)
  ).length));
}

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

  it("deals three distinct fish kinds into every spatial group", () => {
    for (let level = 1; level <= 8; level += 1) {
      const seed = 80 + level;
      const state = createLevelState(level, 0, 1, createSeededRandom(seed));
      const repeated = createLevelState(level, 0, 1, createSeededRandom(seed));

      expect(repeated).toEqual(state);
      for (let offset = 0; offset < state.pieces.length; offset += 3) {
        const kinds = state.pieces
          .slice(offset, offset + 3)
          .map((piece) => piece.kind);
        expect(new Set(kinds).size).toBe(3);
      }
      for (const kind of FISH_KINDS) {
        const kindPieces = state.pieces.filter((piece) => piece.kind === kind);
        expect(kindPieces.length % 3).toBe(0);
      }
    }
  });

  it("generates deterministic safe layouts with broad coverage and bounded overlap", () => {
    const layouts = new Set<string>();
    const layerOrders = new Set<string>();
    const rotationQuadrants = new Set<number>();
    let maxBlockerCount = 0;
    let maxOverlapCount = 0;

    for (let seed = 1; seed <= 64; seed += 1) {
      const level = 1 + seed % 8;
      const state = createLevelState(level, seed, 1, createSeededRandom(seed));
      const repeated = createLevelState(level, seed, 1, createSeededRandom(seed));
      expect(repeated).toEqual(state);
      expect(state.pieces.every(isInsideExpectedSafeRegion)).toBe(true);
      expect(state.pieces.every((piece) => isSafeFieldPoint(piece.pile))).toBe(true);
      expect(getMissingExpectedRegions(state.pieces), `seed ${seed} covers all regions`).toEqual([]);
      expect(hasDiscoverableMatch(state.pieces)).toBe(true);
      const discoveryMatch = FISH_KINDS.map((kind) => state.pieces
        .map((piece, index) => ({ piece, groupIndex: Math.floor(index / 3) }))
        .filter(({ piece }) => piece.kind === kind && Math.hypot(
          (piece.pile.x - 0.5) / 0.115,
          (piece.pile.y - 0.45) / 0.165,
        ) <= 1)
      ).find((candidates) =>
        findCompleteSet(candidates.map(({ piece }) => piece)) !== null &&
        new Set(candidates.map(({ groupIndex }) => groupIndex)).size >= 3 &&
        new Set(candidates.map(({ piece }) => piece.layer)).size >= 2
      );
      expect(discoveryMatch, `seed ${seed} has a cross-group discovery match`)
        .toBeDefined();

      const xs = state.pieces.map((piece) => piece.pile.x);
      const ys = state.pieces.map((piece) => piece.pile.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.45);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.45);
      expect(new Set(state.pieces.map((piece) =>
        `${piece.pile.x.toFixed(6)}:${piece.pile.y.toFixed(6)}`
      )).size).toBe(state.pieces.length);
      const occupiedQuadrants = new Set(state.pieces.map((piece) =>
        `${piece.pile.x < 0.5 ? "left" : "right"}:${
          piece.pile.y < 0.45 ? "top" : "bottom"
        }`
      ));
      expect(occupiedQuadrants.size).toBe(4);

      for (const piece of state.pieces) {
        expect(piece.rotation).toBeGreaterThanOrEqual(0);
        expect(piece.rotation).toBeLessThan(360);
        rotationQuadrants.add(Math.floor(piece.rotation / 90));
        expect(piece.blockerIds).toEqual(state.pieces
          .filter((candidate) =>
            candidate.layer > piece.layer && footprintsOverlap(piece, candidate)
          )
          .map((candidate) => candidate.id));
        maxBlockerCount = Math.max(
          maxBlockerCount,
          piece.blockerIds?.length ?? 0,
        );
        const overlapping = state.pieces.filter((candidate) =>
          candidate.id !== piece.id &&
          footprintsOverlap(piece, candidate)
        );
        maxOverlapCount = Math.max(maxOverlapCount, overlapping.length);
      }

      const groupLayers = Array.from(
        { length: state.pieces.length / 3 },
        (_, groupIndex) => state.pieces[groupIndex * 3].layer,
      );
      for (let offset = 0; offset < state.pieces.length; offset += 3) {
        expect(new Set(state.pieces.slice(offset, offset + 3).map(
          (piece) => piece.layer,
        )).size).toBe(1);
      }
      const layerCounts = Array.from({ length: getLevelConfig(level).layerCount },
        (_, layer) => groupLayers.filter((value) => value === layer).length,
      );
      expect(Math.max(...layerCounts) - Math.min(...layerCounts)).toBeLessThanOrEqual(1);
      layerOrders.add(groupLayers.join(""));
      layouts.add(state.pieces.map((piece) =>
        `${piece.pile.x.toFixed(4)}:${piece.pile.y.toFixed(4)}`
      ).join("|"));
    }

    expect(rotationQuadrants).toEqual(new Set([0, 1, 2, 3]));
    expect(layerOrders.size).toBeGreaterThan(16);
    expect(layouts.size).toBe(64);
    expect(maxBlockerCount).toBeLessThanOrEqual(12);
    expect(maxOverlapCount).toBeLessThanOrEqual(13);
  });

  it("uses a finite safe fallback for constant and extreme random sources", () => {
    for (const unit of [0, 0.5, 0.999_999]) {
      let callCount = 0;
      const constantRandom = () => {
        callCount += 1;
        return unit;
      };
      const state = createLevelState(5, 0, 1, constantRandom);
      const repeated = createLevelState(5, 0, 1, () => unit);

      expect(repeated).toEqual(state);
      expect(callCount).toBeLessThan(2_000);
      expect(state.pieces).toHaveLength(60);
      expect(state.pieces.every(isInsideExpectedSafeRegion)).toBe(true);
      expect(state.pieces.every((piece) => isSafeFieldPoint(piece.pile))).toBe(true);
      expect(
        getMissingExpectedRegions(state.pieces),
        `constant ${unit} covers all regions`,
      ).toEqual([]);
      expect(hasDiscoverableMatch(state.pieces)).toBe(true);
      expect(
        maxMeaningfulOverlapCount(state.pieces),
        `constant ${unit} keeps overlap bounded`,
      ).toBeLessThanOrEqual(13);
      expect(new Set(state.pieces.map((piece) =>
        `${piece.pile.x.toFixed(6)}:${piece.pile.y.toFixed(6)}`
      )).size).toBe(state.pieces.length);
    }
  });

  it("allows lower overlaps to be selected while retaining overlap metadata", () => {
    const state = createInitialState(createSeededRandom(7));
    const blocked = state.pieces.find(
      (piece) => getBlockerIds(state.pieces, piece.id).length > 0,
    );
    expect(blocked).toBeDefined();
    if (!blocked) return;

    expect(getSelectablePieces(state.pieces)).toHaveLength(state.pieces.length);
    const selectedResult = selectPiece(state, blocked.id, createSeededRandom(8));
    expect(selectedResult.kind).toBe("moved");
    expect(selectedResult.state.pieces.some((piece) => piece.id === blocked.id)).toBe(false);

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

  it("moves small fish in tray order and combines a same-species triple", () => {
    let state = createInitialState(createSeededRandom(19));
    const targets = findCompleteSet(getSelectablePieces(state.pieces));
    expect(targets).not.toBeNull();
    if (!targets) return;

    const first = selectPiece(state, targets[0].id, createSeededRandom(20));
    expect(first.kind).toBe("moved");
    state = first.state;
    const second = selectPiece(state, targets[1].id, createSeededRandom(21));
    expect(second.kind).toBe("moved");
    state = second.state;
    expect(state.tray.map((piece) => piece.id)).toEqual([targets[0].id, targets[1].id]);

    const third = selectPiece(state, targets[2].id, createSeededRandom(22));
    expect(third.kind).toBe("combined");
    if (third.kind !== "combined") return;
    expect(third.combined.map((piece) => piece.id)).toEqual(
      targets.map((piece) => piece.id),
    );
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

  it("combines the earliest same-species triple and leaves other fish", () => {
    const base = createInitialState(createSeededRandom(25));
    const customState: AmbientGameState = {
      ...base,
      pieces: [
        { ...base.pieces[0], id: "third-whale", kind: "whale" },
        { ...base.pieces[1], id: "keep", kind: "koi" },
      ],
      tray: [
        { id: "first-whale", kind: "whale" },
        { id: "keep-koi", kind: "koi" },
        { id: "second-whale", kind: "whale" },
      ],
    };
    const result = selectPiece(customState, "third-whale", createSeededRandom(29));
    expect(result.kind).toBe("combined");
    if (result.kind !== "combined") return;
    expect(result.combined.map((piece) => piece.id)).toEqual([
      "first-whale",
      "second-whale",
      "third-whale",
    ]);
    expect(result.state.tray).toEqual([
      { id: "keep-koi", kind: "koi" },
    ]);
    expect(result.state.clearCount).toBe(1);
  });

  it("does not combine mixed species", () => {
    const base = createInitialState(createSeededRandom(33));
    const source = base.pieces[0];
    const pieces = [
      { ...source, id: "whale-1", kind: "whale" as const },
      { ...source, id: "whale-2", kind: "whale" as const },
      { ...source, id: "koi-1", kind: "koi" as const },
      { ...source, id: "koi-2", kind: "koi" as const },
    ];
    let state: AmbientGameState = { ...base, pieces, tray: [] };

    for (const piece of pieces) {
      const result = selectPiece(state, piece.id, createSeededRandom(34));
      expect(result.kind).toBe("moved");
      state = result.state;
    }

    expect(state.tray).toHaveLength(4);
    expect(state.clearCount).toBe(0);
  });

  it("constructs every progressive level with a complete removal path", () => {
    for (let level = 1; level <= 8; level += 1) {
      const random = createSeededRandom(100 + level);
      let state = createLevelState(level, 0, 1, random);
      let clears = 0;

      while (state.level === level) {
        const selectable = getSelectablePieces(state.pieces);
        const triple = findCompleteSet(selectable);
        expect(triple).not.toBeNull();
        if (!triple) break;

        for (const piece of triple) {
          const result = selectPiece(state, piece.id, random);
          expect(result.kind === "moved" || result.kind === "combined").toBe(true);
          if (result.kind === "combined") clears += 1;
          state = result.state;
        }
      }

      expect(state.level).toBe(level + 1);
      expect(clears).toBe(getLevelConfig(level).pieceCount / 3);
    }
  });

  it("completely clears sixty-four seeded layouts", () => {
    for (let seed = 1; seed <= 64; seed += 1) {
      const level = 1 + seed % 8;
      const random = createSeededRandom(1_000 + seed);
      let state = createLevelState(level, 0, 1, random);

      while (state.level === level) {
        const triple = findCompleteSet(state.pieces);
        expect(triple).not.toBeNull();
        if (!triple) break;
        for (const piece of triple) {
          state = selectPiece(state, piece.id, random).state;
        }
      }

      expect(state.level).toBe(level + 1);
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
      const kindPieces = levelSix.pieces.filter((piece) => piece.kind === kind);
      expect(kindPieces.length % 3).toBe(0);
    }
  });

  it("loses on a seventh ordinary fish and restarts level one without progress loss", () => {
    const base = createLevelState(3, 9, 101, createSeededRandom(30));
    const target = base.pieces.find((piece) => piece.kind === "pufferfish");
    expect(target).toBeDefined();
    if (!target) return;
    const tray = [
      { id: "t1", kind: "whale" },
      { id: "t2", kind: "whale" },
      { id: "t3", kind: "sardine" },
      { id: "t4", kind: "sardine" },
      { id: "t5", kind: "koi" },
      { id: "t6", kind: "koi" },
    ] as const;
    const state: AmbientGameState = {
      ...base,
      tray,
    };
    const firstNewPieceId = state.nextPieceId;
    const result = selectPiece(state, target.id, createSeededRandom(31));

    expect(result.kind).toBe("lost");
    if (result.kind !== "lost") return;
    expect(result.tray).toEqual([
      ...tray,
      { id: target.id, kind: target.kind },
    ]);
    expect(result.state.level).toBe(1);
    expect(result.state.pieces).toHaveLength(36);
    expect(result.state.pieces[0]?.id).toBe(`fish-${firstNewPieceId}`);
    expect(result.state.tray).toEqual([]);
    expect(result.state.clearCount).toBe(9);
    expect(result.state.nextPieceId).toBe(firstNewPieceId + 36);
  });

  it("combines three small fish before applying the full-tray loss", () => {
    const base = createInitialState(createSeededRandom(32));
    const target = base.pieces.find((piece) => piece.kind === "whale");
    expect(target).toBeDefined();
    if (!target) return;
    const tripleTray = [
      { id: "w1", kind: "whale" },
      { id: "w2", kind: "whale" },
      { id: "k1", kind: "koi" },
      { id: "k2", kind: "koi" },
      { id: "s1", kind: "sardine" },
      { id: "p1", kind: "pufferfish" },
    ] as const;

    const triple = selectPiece({
      ...base,
      pieces: [target],
      tray: tripleTray,
    }, target.id, createSeededRandom(33));
    expect(triple.kind).toBe("combined");
    expect(triple.state.tray).toHaveLength(4);
  });

  it("rejects invalid random sources", () => {
    expect(() => createInitialState(() => 1)).toThrow(AmbientEngineError);
    expect(() => createInitialState(() => Number.NaN)).toThrow(AmbientEngineError);
  });
});
