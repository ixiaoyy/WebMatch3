import { describe, expect, it, vi } from "vitest";

import { createSeededRandom, getSelectablePieces } from "../engine";
import type { StorageLike } from "../session/ambient-storage";
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
  const timers: TimerApi = {
    schedule(callback) {
      callbacks.push(callback);
      return callback;
    },
    cancel(handle) {
      const index = callbacks.indexOf(handle as () => void);
      if (index >= 0) callbacks.splice(index, 1);
    },
  };
  return { callbacks, timers };
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
    expect(controller.game.value.pieces).toHaveLength(21);
    expect(controller.feedback.value).toBe("level");
    expect(controller.canSelect.value).toBe(false);
    callbacks.shift()?.();
    expect(controller.feedback.value).toBe("idle");
    expect(controller.canSelect.value).toBe(true);
    controller.dispose();
  });

  it("cancels and restarts full-tray recovery around away state", () => {
    const { callbacks, timers } = controlledTimers();
    const controller = createAmbientController({
      random: createSeededRandom(60),
      storage: null,
      timers,
    });
    const kinds = ["aqua", "amber", "lime", "rose", "aqua", "amber", "lime"] as const;
    controller.game.value = {
      ...controller.game.value,
      pieces: controller.game.value.pieces.slice(7),
      tray: kinds.map((kind, index) => ({ id: `tray-${index}`, kind })),
    };

    controller.setAway(true);
    controller.setAway(false);
    expect(callbacks).toHaveLength(1);
    controller.setAway(true);
    expect(callbacks).toHaveLength(0);
    controller.setAway(false);
    callbacks.shift()?.();
    expect(controller.game.value.tray).toHaveLength(5);
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
