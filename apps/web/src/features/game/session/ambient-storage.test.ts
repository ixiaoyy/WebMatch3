import { describe, expect, it } from "vitest";

import { createSeededRandom, selectPiece } from "../engine";
import {
  AMBIENT_STORAGE_KEY,
  createFreshSnapshot,
  loadAmbientSnapshot,
  parseAmbientSnapshot,
  saveAmbientSnapshot,
  type StorageLike,
} from "./ambient-storage";

function createMemoryStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("ambient snapshot storage", () => {
  it("round-trips exact stable state and preferences", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(10));
    const target = fresh.game.pieces.find((piece) => piece.layer === 1);
    expect(target).toBeDefined();
    if (!target) return;
    const selection = selectPiece(fresh.game, target.id, createSeededRandom(11));
    const snapshot = {
      ...fresh,
      game: selection.state,
      preferences: { soundEnabled: true },
    };

    expect(saveAmbientSnapshot(storage, snapshot)).toBe(true);
    expect(loadAmbientSnapshot(storage, createSeededRandom(12))).toEqual(snapshot);
  });

  it("migrates an existing version-one snapshot without losing game progress", () => {
    const storage = createMemoryStorage();
    const fresh = createFreshSnapshot(createSeededRandom(13), 1_000);
    const legacy = {
      version: 1,
      game: {
        pieces: fresh.game.pieces,
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

    expect(restored.version).toBe(2);
    expect(restored.game.level).toBe(1);
    expect(restored.game.clearCount).toBe(432);
    expect(restored.plant.plantedAt).toBe(86_401_000);
  });

  it.each([
    "not-json",
    JSON.stringify({ version: 3 }),
    JSON.stringify({ version: 2, game: {}, preferences: { soundEnabled: false } }),
  ])("falls back for malformed or incompatible data", (raw) => {
    const storage = createMemoryStorage();
    storage.values.set(AMBIENT_STORAGE_KEY, raw);
    const snapshot = loadAmbientSnapshot(storage, createSeededRandom(20));

    expect(snapshot.version).toBe(2);
    expect(snapshot.game.pieces).toHaveLength(18);
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
          kind: "aqua" as const,
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

    expect(snapshot.game.pieces).toHaveLength(18);
    expect(saveAmbientSnapshot(storage, snapshot)).toBe(false);
  });
});
