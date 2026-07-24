import { describe, expect, it } from "vitest";

import {
  FISH_KINDS,
  createLevelState,
  createSeededRandom,
  feedPiece,
  getBlockerIds,
  getSelectablePieces,
  selectPiece,
} from "../engine";
import {
  AMBIENT_STORAGE_KEY,
  createFreshSnapshot,
  loadAmbientSnapshot,
  loadAmbientSnapshotResult,
  parseAmbientSnapshot,
  saveAmbientSnapshot,
  type StorageLike,
} from "./ambient-storage";

const LEGACY_KIND_BY_FISH = {
  whale: "aqua",
  koi: "amber",
  sardine: "lime",
  pufferfish: "rose",
  goldfish: "goldfish",
  clownfish: "clownfish",
  angelfish: "angelfish",
  betta: "betta",
} as const;

function toLegacyGame(game: ReturnType<typeof createLevelState>) {
  return {
    ...game,
    pieces: game.pieces.map((piece, index) => {
      const { blockerIds, ...legacyPiece } = piece;
      void blockerIds;
      return {
        ...legacyPiece,
        id: `jelly-${index + 1}`,
        kind: LEGACY_KIND_BY_FISH[piece.kind],
      };
    }),
    tray: game.tray.map((piece, index) => ({
      ...piece,
      id: `jelly-tray-${index + 1}`,
      kind: LEGACY_KIND_BY_FISH[piece.kind],
    })),
  };
}

function createMemoryStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("ambient snapshot storage", () => {
  it("reports whether a valid snapshot was restored or a fresh fallback was used", () => {
    const emptyStorage = createMemoryStorage();
    const emptyResult = loadAmbientSnapshotResult(
      emptyStorage,
      createSeededRandom(8),
      2_000,
    );
    expect(emptyResult).toEqual({
      snapshot: createFreshSnapshot(createSeededRandom(8), 2_000),
      loadedFromStorage: false,
    });

    const storedSnapshot = createFreshSnapshot(createSeededRandom(9), 3_000);
    expect(saveAmbientSnapshot(emptyStorage, storedSnapshot)).toBe(true);
    expect(
      loadAmbientSnapshotResult(
        emptyStorage,
        createSeededRandom(10),
        4_000,
      ),
    ).toEqual({
      snapshot: storedSnapshot,
      loadedFromStorage: true,
    });

    emptyStorage.values.set(AMBIENT_STORAGE_KEY, "not-json");
    const malformedResult = loadAmbientSnapshotResult(
      emptyStorage,
      createSeededRandom(11),
      5_000,
    );
    expect(malformedResult).toEqual({
      snapshot: createFreshSnapshot(createSeededRandom(11), 5_000),
      loadedFromStorage: false,
    });
  });

  it("round-trips exact stable state and preferences", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(10));
    const target = fresh.game.pieces.find((piece) => piece.layer === 1);
    expect(target).toBeDefined();
    if (!target) return;
    const selection = selectPiece(fresh.game, target.id, createSeededRandom(11));
    const snapshot = {
      ...fresh,
      game: {
        ...selection.state,
        pieces: selection.state.pieces.map((piece, index) => ({
          ...piece,
          rotation: index === 0 ? -12 : index === 1 ? 359.999 : piece.rotation,
        })),
      },
      preferences: { soundEnabled: true },
    };

    expect(saveAmbientSnapshot(storage, snapshot)).toBe(true);
    expect(loadAmbientSnapshot(storage, createSeededRandom(12))).toEqual(snapshot);
  });

  it("normalizes a legacy full-tray snapshot without losing permanent progress", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(15), 5_000);
    const traySources = fresh.game.pieces.slice(0, 7);
    const fedSource = fresh.game.pieces[7];
    expect(fedSource).toBeDefined();
    if (!fedSource) return;
    const snapshot = {
      ...fresh,
      game: {
        ...fresh.game,
        pieces: fresh.game.pieces.slice(8),
        tray: traySources.map(({ id, kind }) => ({ id, kind })),
        fed: [{ id: fedSource.id, kind: fedSource.kind, settled: false }],
        clearCount: 24,
      },
      preferences: { soundEnabled: true },
      pet: { guardedPieceId: fresh.game.pieces[8]?.id ?? null },
    };
    expect(saveAmbientSnapshot(storage, snapshot)).toBe(true);

    const restored = loadAmbientSnapshot(storage, createSeededRandom(16), 9_000);

    expect(restored.game.level).toBe(1);
    expect(restored.game.pieces).toHaveLength(36);
    expect(restored.game.pieces[0]?.id).toBe(`fish-${fresh.game.nextPieceId}`);
    expect(restored.game.tray).toEqual([]);
    expect(restored.game.fed).toEqual([]);
    expect(restored.game.clearCount).toBe(24);
    expect(restored.game.nextPieceId).toBe(fresh.game.nextPieceId + 36);
    expect(restored.plant.plantedAt).toBe(5_000);
    expect(restored.preferences.soundEnabled).toBe(true);
    expect(restored.pet.guardedPieceId).toBeNull();
  });

  it("round-trips mixed feed credits and explicit settled state", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(41));
    const selectable = getSelectablePieces(fresh.game.pieces);
    const matching = selectable.find((piece) =>
      selectable.filter((candidate) => candidate.kind === piece.kind).length >= 3
    );
    expect(matching).toBeDefined();
    if (!matching) return;
    const triple = selectable
      .filter((piece) => piece.kind === matching.kind)
      .slice(0, 3);
    const fed = feedPiece(fresh.game, triple[0].id, createSeededRandom(42));
    const first = selectPiece(fed.state, triple[1].id, createSeededRandom(43));
    const settled = selectPiece(first.state, triple[2].id, createSeededRandom(44));
    expect(settled.kind).toBe("settled");
    const snapshot = { ...fresh, game: settled.state };

    expect(saveAmbientSnapshot(storage, snapshot)).toBe(true);
    expect(loadAmbientSnapshot(storage, createSeededRandom(45))).toEqual(snapshot);
  });

  it("restores only a valid guard and normalizes unsafe pet state home", () => {
    const fresh = createFreshSnapshot(createSeededRandom(46));
    const target = getSelectablePieces(fresh.game.pieces)[0];
    expect(target).toBeDefined();
    if (!target) return;
    const guarded = {
      ...fresh,
      pet: { guardedPieceId: target.id },
    };
    expect(parseAmbientSnapshot(guarded)?.pet).toEqual(guarded.pet);

    const { pet: _pet, ...withoutPet } = fresh;
    void _pet;
    expect(parseAmbientSnapshot(withoutPet)?.pet.guardedPieceId).toBeNull();

    const staleGuard = {
      ...fresh,
      pet: { guardedPieceId: "missing-fish" },
    };
    expect(parseAmbientSnapshot(staleGuard)?.pet.guardedPieceId).toBeNull();

    const blockedTarget = fresh.game.pieces.find((piece) =>
      getBlockerIds(fresh.game.pieces, piece.id).length > 0
    );
    expect(blockedTarget).toBeDefined();
    if (blockedTarget) {
      const blockedGuard = {
        ...fresh,
        pet: { guardedPieceId: blockedTarget.id },
      };
      expect(parseAmbientSnapshot(blockedGuard)?.pet.guardedPieceId).toBe(
        blockedTarget.id,
      );
    }

    let fullGame = fresh.game;
    for (let index = 0; index < 3; index += 1) {
      const feedTarget = getSelectablePieces(fullGame.pieces)[0];
      expect(feedTarget).toBeDefined();
      if (!feedTarget) break;
      fullGame = feedPiece(
        fullGame,
        feedTarget.id,
        createSeededRandom(460 + index),
      ).state;
    }
    const fullGuard = {
      ...fresh,
      game: fullGame,
      pet: { guardedPieceId: getSelectablePieces(fullGame.pieces)[0]?.id ?? null },
    };
    expect(parseAmbientSnapshot(fullGuard)?.pet.guardedPieceId).toBeNull();

    const corruptPet = {
      ...fresh,
      pet: { guardedPieceId: 42 },
    };
    const parsed = parseAmbientSnapshot(corruptPet);
    expect(parsed?.game).toEqual(fresh.game);
    expect(parsed?.pet.guardedPieceId).toBeNull();
  });

  it("migrates four-kind and eight-kind version-two snapshots to canonical fish", () => {
    const fresh = createFreshSnapshot(createSeededRandom(50), 5_000);
    for (const [level, clearCount, seed, expectedKinds] of [
      [2, 4, 51, FISH_KINDS.slice(0, 4)],
      [6, 12, 52, FISH_KINDS],
    ] as const) {
      const storage = createMemoryStorage();
      const canonicalGame = createLevelState(
        level,
        clearCount,
        1,
        createSeededRandom(seed),
      );
      const legacyGame = toLegacyGame(canonicalGame);
      storage.values.set(AMBIENT_STORAGE_KEY, JSON.stringify({
        ...fresh,
        version: 2,
        game: legacyGame,
      }));

      const restored = loadAmbientSnapshot(storage, createSeededRandom(seed + 100));
      expect(restored.version).toBe(3);
      expect(restored.game.level).toBe(level);
      expect(restored.game.clearCount).toBe(clearCount);
      expect(new Set(restored.game.pieces.map((piece) => piece.kind))).toEqual(
        new Set(expectedKinds),
      );
      expect(restored.game.pieces.map((piece) => piece.id)).toEqual(
        legacyGame.pieces.map((piece) => piece.id),
      );
    }
  });

  it("migrates an existing version-one snapshot without losing game progress", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(13), 1_000);
    const legacy = {
      version: 1,
      game: {
        pieces: toLegacyGame(fresh.game).pieces.slice(0, 18),
        tray: fresh.game.tray,
        clearCount: 432,
        nextPieceId: fresh.game.nextPieceId,
      },
      preferences: fresh.preferences,
    };
    storage.values.set(AMBIENT_STORAGE_KEY, JSON.stringify(legacy));

    const restored = loadAmbientSnapshot(
      storage,
      createSeededRandom(14),
      86_401_000,
    );

    expect(restored.version).toBe(3);
    expect(restored.game.level).toBe(1);
    expect(restored.game.clearCount).toBe(432);
    expect(restored.plant.plantedAt).toBe(86_401_000);
  });

  it.each([
    "not-json",
    JSON.stringify({ version: 4 }),
    JSON.stringify({ version: 3 }),
    JSON.stringify({ version: 2, game: {}, preferences: { soundEnabled: false } }),
  ])("falls back for malformed or incompatible data", (raw) => {
    const storage = createMemoryStorage();
    storage.values.set(AMBIENT_STORAGE_KEY, raw);
    const snapshot = loadAmbientSnapshot(storage, createSeededRandom(20));

    expect(snapshot.version).toBe(3);
    expect(snapshot.game.pieces).toHaveLength(36);
    expect(snapshot.preferences.soundEnabled).toBe(false);
  });

  it("rejects invalid geometry, duplicate IDs, tray bounds, and counters", () => {
    const valid = createFreshSnapshot(createSeededRandom(30));
    const duplicate = {
      ...valid,
      game: {
        ...valid.game,
        pieces: valid.game.pieces.map((piece, index) =>
          index === 1 ? { ...piece, id: valid.game.pieces[0].id } : piece,
        ),
      },
    };
    expect(parseAmbientSnapshot(duplicate)).toBeNull();

    const invalidGeometry = {
      ...valid,
      game: {
        ...valid.game,
        pieces: valid.game.pieces.map((piece, index) =>
          index === 0 ? { ...piece, pile: { ...piece.pile, x: 4 } } : piece,
        ),
      },
    };
    expect(parseAmbientSnapshot(invalidGeometry)).toBeNull();

    const invalidBlockers = {
      ...valid,
      game: {
        ...valid.game,
        pieces: valid.game.pieces.map((piece, index) =>
          index === 0
            ? { ...piece, blockerIds: [piece.id, piece.id] }
            : piece,
        ),
      },
    };
    expect(parseAmbientSnapshot(invalidBlockers)).toBeNull();

    const invalidCounter = {
      ...valid,
      game: { ...valid.game, clearCount: -1 },
    };
    expect(parseAmbientSnapshot(invalidCounter)).toBeNull();

    const invalidLevel = {
      ...valid,
      game: { ...valid.game, level: 0 },
    };
    expect(parseAmbientSnapshot(invalidLevel)).toBeNull();

    const invalidInventory = {
      ...valid,
      game: {
        ...valid.game,
        pieces: valid.game.pieces.map((piece, index) =>
          index === 0 ? { ...piece, kind: "rose" as const } : piece,
        ),
      },
    };
    expect(parseAmbientSnapshot(invalidInventory)).toBeNull();

    const invalidPlantProgress = {
      ...valid,
      plant: { plantedAt: -1 },
    };
    expect(parseAmbientSnapshot(invalidPlantProgress)).toBeNull();

    const overfullTray = {
      ...valid,
      game: {
        ...valid.game,
        tray: Array.from({ length: 8 }, (_, index) => ({
          id: `tray-${index}`,
          kind: "whale" as const,
        })),
      },
    };
    expect(parseAmbientSnapshot(overfullTray)).toBeNull();
  });

  it("keeps in-memory play available when storage throws", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    const snapshot = loadAmbientSnapshot(storage, createSeededRandom(40));

    expect(snapshot.game.pieces).toHaveLength(36);
    expect(saveAmbientSnapshot(storage, snapshot)).toBe(false);
  });
});
