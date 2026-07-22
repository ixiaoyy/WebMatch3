import { describe, expect, it, vi } from "vitest";

import { createSeededRandom, getSelectablePieces } from "../engine";
import {
  loadAmbientSnapshot,
  type StorageLike,
} from "../session/ambient-storage";
import { createAmbientController, type TimerApi } from "./ambient-controller";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function controlledTimers() {
  const callbacks: Array<() => void> = [];
  const delays: number[] = [];
  const timers: TimerApi = {
    schedule(callback, delay) {
      callbacks.push(callback);
      delays.push(delay);
      return callback;
    },
    cancel(handle) {
      const index = callbacks.indexOf(handle as () => void);
      if (index >= 0) {
        callbacks.splice(index, 1);
        delays.splice(index, 1);
      }
    },
  };
  return { callbacks, delays, timers };
}

describe("ambient controller", () => {
  it("selects, persists, and emits clear feedback", () => {
    const onClear = vi.fn();
    const controller = createAmbientController({
      random: createSeededRandom(50),
      storage: memoryStorage(),
      onClear,
    });
    const selectable = getSelectablePieces(controller.game.value.pieces);
    const matchingPiece = selectable.find(
      (piece) => selectable.filter((candidate) => candidate.kind === piece.kind).length >= 3,
    );
    expect(matchingPiece).toBeDefined();
    if (!matchingPiece) return;
    const triple = selectable
      .filter((piece) => piece.kind === matchingPiece.kind)
      .slice(0, 3);

    for (const piece of triple) controller.activate(piece.id);

    expect(controller.game.value.clearCount).toBe(1);
    expect(controller.game.value.tray).toHaveLength(0);
    expect(controller.feedback.value).toBe("clear");
    expect(onClear).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it("keeps the cleared trio visible until the bubble feedback settles", () => {
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(51),
      storage: null,
      timers,
    });
    const selectable = getSelectablePieces(controller.game.value.pieces);
    const matchingPiece = selectable.find(
      (piece) => selectable.filter((candidate) => candidate.kind === piece.kind).length >= 3,
    );
    expect(matchingPiece).toBeDefined();
    if (!matchingPiece) return;
    const triple = selectable
      .filter((piece) => piece.kind === matchingPiece.kind)
      .slice(0, 3);

    for (const piece of triple) controller.activate(piece.id);

    expect(controller.trayPreview.value?.map((piece) => piece.id)).toEqual(
      triple.map((piece) => piece.id),
    );
    expect(controller.clearingPieceIds.value).toEqual(
      triple.map((piece) => piece.id),
    );

    callbacks.shift()?.();

    expect(controller.trayPreview.value).toBeNull();
    expect(controller.clearingPieceIds.value).toEqual([]);
    expect(controller.feedback.value).toBe("idle");
    controller.dispose();
  });

  it("feeds different fish and plays the full-to-sleeping pose sequence", () => {
    const onClear = vi.fn();
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(52),
      storage: null,
      timers,
      onClear,
    });
    const base = controller.game.value;
    const kinds = ["whale", "koi", "sardine"] as const;
    const targets = kinds.map((kind, index) => ({
      ...base.pieces.find((piece) => piece.kind === kind)!,
      id: `feed-${index}`,
      kind,
      pile: { x: 0.15 + index * 0.25, y: 0.2 },
      layer: 0 as const,
    }));
    controller.game.value = {
      ...base,
      pieces: [
        ...targets,
        { ...base.pieces[0], id: "keep", pile: { x: 0.9, y: 0.9 }, layer: 0 },
      ],
    };
    expect(targets).toHaveLength(3);

    for (const target of targets) controller.feedToCat(target.id);

    expect(controller.game.value.fed.map((piece) => piece.kind)).toEqual(
      targets.map((piece) => piece.kind),
    );
    expect(controller.game.value.clearCount).toBe(0);
    expect(controller.catPose.value).toBe("full");
    expect(onClear).not.toHaveBeenCalled();

    const fullState = controller.game.value;
    controller.feedToCat("keep");
    expect(controller.game.value).toBe(fullState);
    expect(controller.status.value).toBe("小猫正在休息，现在不能再喂。");
    controller.requestCatSearch();
    expect(controller.guardedPiece.value).toBeNull();
    expect(controller.status.value).toBe("小猫已经吃饱，正在休息，现在不能帮忙寻鱼。");

    callbacks.shift()?.();
    expect(controller.catPose.value).toBe("lying");
    callbacks.shift()?.();
    callbacks.shift()?.();
    expect(controller.catPose.value).toBe("sleeping");
    controller.dispose();
  });

  it("settles a short tray group without emitting a plant clear", () => {
    const onClear = vi.fn();
    const controller = createAmbientController({
      random: createSeededRandom(53),
      storage: null,
      onClear,
    });
    const selectable = getSelectablePieces(controller.game.value.pieces);
    const matching = selectable.find((piece) =>
      selectable.filter((candidate) => candidate.kind === piece.kind).length >= 3
    );
    expect(matching).toBeDefined();
    if (!matching) return;
    const triple = selectable
      .filter((piece) => piece.kind === matching.kind)
      .slice(0, 3);

    controller.feedToCat(triple[0].id);
    controller.activate(triple[1].id);
    controller.activate(triple[2].id);

    expect(controller.game.value.tray).toHaveLength(0);
    expect(controller.game.value.fed[0]?.settled).toBe(true);
    expect(controller.game.value.clearCount).toBe(0);
    expect(controller.feedback.value).toBe("settle");
    expect(onClear).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("searches, guards the target, and returns home when it is selected", () => {
    const { callbacks, timers } = controlledTimers();
    let currentTime = 1_000;
    let excludedId: string | null = null;
    const controller = createAmbientController({
      random: createSeededRandom(54),
      storage: null,
      timers,
      now: () => currentTime,
      isSearchCandidate: (pieceId) => pieceId !== excludedId,
    });
    const beforeSearch = controller.game.value;
    excludedId = [...controller.selectablePieces.value].sort((first, second) =>
      Math.hypot(first.pile.x - 0.12, first.pile.y - 0.74) -
      Math.hypot(second.pile.x - 0.12, second.pile.y - 0.74)
    )[0]?.id ?? null;

    controller.requestCatSearch();
    const targetId = controller.guardedPiece.value?.id;
    expect(targetId).toBeDefined();
    expect(targetId).not.toBe(excludedId);
    expect(controller.game.value).toBe(beforeSearch);
    expect(controller.catTravelPhase.value).toBe("looking");

    callbacks.shift()?.();
    callbacks.shift()?.();
    expect(controller.catTravelPhase.value).toBe("travelling");
    callbacks.shift()?.();
    expect(controller.catTravelPhase.value).toBe("guarding");
    expect(controller.status.value).toBe("小猫找到了，正用光照着那条小鱼。");

    if (!targetId) return;
    controller.activate(targetId);
    expect(controller.catTravelPhase.value).toBe("home");
    expect(controller.guardedPiece.value).toBeNull();

    currentTime += 100;
    controller.requestCatSearch();
    expect(controller.catTravelPhase.value).toBe("home");

    currentTime += 1_000;
    controller.feedback.value = "level";
    controller.requestCatSearch();
    expect(controller.guardedPiece.value).toBeNull();
    expect(controller.status.value).toBe("桌面正在变化，请稍后再请小猫寻鱼。");
    controller.dispose();
  });

  it("feeds a guarded target through the canonical transition and returns home", () => {
    const onClear = vi.fn();
    const controller = createAmbientController({
      random: createSeededRandom(57),
      storage: null,
      onClear,
    });

    controller.requestCatSearch();
    const target = controller.guardedPiece.value;
    expect(target).not.toBeNull();
    if (!target) return;
    const clearCount = controller.game.value.clearCount;
    const tray = controller.game.value.tray;

    controller.feedToCat(target.id);

    expect(controller.guardedPiece.value).toBeNull();
    expect(controller.catTravelPhase.value).toBe("home");
    expect(controller.game.value.fed.at(-1)?.id).toBe(target.id);
    expect(controller.game.value.tray).toEqual(tray);
    expect(controller.game.value.clearCount).toBe(clearCount);
    expect(onClear).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("restarts automatic reactions with a fresh delay after away state", () => {
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(56),
      reactionRandom: () => 0,
      storage: null,
      timers,
    });

    controller.startReactions();
    expect(callbacks).toHaveLength(1);
    controller.setAway(true);
    expect(callbacks).toHaveLength(0);
    controller.setAway(false);
    expect(callbacks).toHaveLength(1);

    callbacks.shift()?.();
    expect(controller.catReaction.value?.text).toBe("喵～");
    expect(callbacks).toHaveLength(2);
    controller.dispose();
  });

  it("opens a harder level only after the current pile is completely cleared", () => {
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(55),
      storage: null,
      timers,
    });

    while (controller.game.value.level === 1) {
      const selectable = getSelectablePieces(controller.game.value.pieces);
      const highestLayer = Math.max(
        ...controller.game.value.pieces.map((piece) => piece.layer),
      );
      const exposedLayer = selectable.filter((piece) => piece.layer === highestLayer);
      const matching = exposedLayer.find(
        (piece) => exposedLayer.filter(
          (candidate) => candidate.kind === piece.kind,
        ).length >= 3,
      );
      expect(matching).toBeDefined();
      if (!matching) break;
      for (const piece of exposedLayer
        .filter((candidate) => candidate.kind === matching.kind)
        .slice(0, 3)) {
        controller.activate(piece.id);
      }
    }

    expect(controller.game.value.level).toBe(2);
    expect(controller.game.value.pieces).toHaveLength(42);
    expect(controller.feedback.value).toBe("level");
    expect(controller.canSelect.value).toBe(false);
    callbacks.shift()?.();
    expect(controller.feedback.value).toBe("idle");
    expect(controller.canSelect.value).toBe(true);
    controller.dispose();
  });

  it("persists a stable restart before non-modal loss feedback and cancels it when away", () => {
    const { callbacks, delays, timers } = controlledTimers();
    const storage = memoryStorage();
    const now = 100_000;
    const controller = createAmbientController({
      random: createSeededRandom(60),
      storage,
      timers,
      now: () => now,
    });
    controller.setSoundEnabled(true);
    const base = controller.game.value;
    const target = {
      ...base.pieces[0],
      id: "loss-target",
      kind: "pufferfish" as const,
    };
    const lossTray = [
      { id: "tray-0", kind: "whale" },
      { id: "tray-1", kind: "whale" },
      { id: "tray-2", kind: "koi" },
      { id: "tray-3", kind: "koi" },
      { id: "tray-4", kind: "sardine" },
      { id: "tray-5", kind: "sardine" },
    ] as const;
    controller.game.value = {
      ...base,
      level: 3,
      clearCount: 9,
      pieces: [target],
      tray: lossTray,
      fed: [{ id: "fed", kind: "goldfish", settled: false }],
    };
    controller.requestCatSearch();
    expect(controller.guardedPiece.value?.id).toBe(target.id);

    controller.activate(target.id);

    expect(controller.feedback.value).toBe("loss");
    expect(controller.canSelect.value).toBe(false);
    expect(controller.trayPreview.value).toEqual([
      ...lossTray,
      { id: target.id, kind: target.kind },
    ]);
    expect(controller.game.value.level).toBe(1);
    expect(controller.game.value.tray).toEqual([]);
    expect(controller.game.value.fed).toEqual([]);
    expect(controller.game.value.clearCount).toBe(9);
    expect(controller.guardedPiece.value).toBeNull();
    expect(controller.catTravelPhase.value).toBe("home");
    expect(controller.catPose.value).toBe("lying");
    expect(delays).toEqual([1_200]);

    const persisted = loadAmbientSnapshot(storage, createSeededRandom(61), now);
    expect(persisted.game).toEqual(controller.game.value);
    expect(persisted.preferences.soundEnabled).toBe(true);
    expect(persisted.plant.plantedAt).toBe(now);
    expect(persisted.pet.guardedPieceId).toBeNull();

    controller.setAway(true);
    expect(callbacks).toHaveLength(0);
    expect(controller.feedback.value).toBe("idle");
    expect(controller.trayPreview.value).toBeNull();
    expect(controller.catPose.value).toBe("idle");
    controller.setAway(false);
    expect(callbacks).toHaveLength(0);
    expect(controller.canSelect.value).toBe(true);

    controller.game.value = {
      ...controller.game.value,
      pieces: [target],
      tray: lossTray,
    };
    controller.activate(target.id);
    expect(callbacks).toHaveLength(1);
    controller.dispose();
    expect(callbacks).toHaveLength(0);
    expect(controller.trayPreview.value).toBeNull();
  });

  it("automatically finishes loss feedback without confirmation", () => {
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(62),
      storage: null,
      timers,
    });
    const target = {
      ...controller.game.value.pieces[0],
      id: "loss-target",
      kind: "pufferfish" as const,
    };
    controller.game.value = {
      ...controller.game.value,
      pieces: [target],
      tray: [
        "whale",
        "whale",
        "koi",
        "koi",
        "sardine",
        "sardine",
      ].map((kind, index) => ({
        id: `tray-${index}`,
        kind: kind as "whale" | "koi" | "sardine",
      })),
    };

    controller.activate(target.id);
    callbacks.shift()?.();

    expect(controller.feedback.value).toBe("idle");
    expect(controller.trayPreview.value).toBeNull();
    expect(controller.catPose.value).toBe("idle");
    expect(controller.canSelect.value).toBe(true);
    expect(controller.status.value).toBe("新的第一局已经排好，可以继续寻找小鱼。");
    controller.dispose();
  });

  it("persists sound preference without enabling it by default", () => {
    const storage = memoryStorage();
    const first = createAmbientController({
      random: createSeededRandom(70),
      storage,
    });
    expect(first.soundEnabled.value).toBe(false);
    first.setSoundEnabled(true);
    first.dispose();

    const restored = createAmbientController({
      random: createSeededRandom(71),
      storage,
    });
    expect(restored.soundEnabled.value).toBe(true);
    restored.dispose();
  });
});
