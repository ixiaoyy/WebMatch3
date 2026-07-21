import { computed, ref, shallowRef } from "vue";

import {
  getSelectablePieces,
  recoverFullTray,
  selectPiece,
  type AmbientGameState,
  type JellyKind,
  type RandomSource,
  type TrayPiece,
} from "../engine";
import {
  AMBIENT_SNAPSHOT_VERSION,
  loadAmbientSnapshot,
  resolveBrowserStorage,
  saveAmbientSnapshot,
  type AmbientSnapshotV2,
  type StorageLike,
} from "../session/ambient-storage";

export interface TimerApi {
  schedule(callback: () => void, delay: number): unknown;
  cancel(handle: unknown): void;
}

export interface AmbientControllerOptions {
  readonly random?: RandomSource;
  readonly storage?: StorageLike | null;
  readonly timers?: TimerApi;
  readonly onClear?: () => void;
  readonly now?: () => number;
}

const browserTimers: TimerApi = {
  schedule: (callback, delay) => globalThis.setTimeout(callback, delay),
  cancel: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const KIND_NAMES: Readonly<Record<JellyKind, string>> = {
  aqua: "水蓝果冻",
  amber: "琥珀果冻",
  lime: "青柠果冻",
  rose: "玫瑰果冻",
};

export function createAmbientController(
  options: AmbientControllerOptions = {},
) {
  const random = options.random ?? Math.random;
  const storage = options.storage === undefined
    ? resolveBrowserStorage()
    : options.storage;
  const timers = options.timers ?? browserTimers;
  const now = options.now ?? Date.now;
  const currentTime = ref(now());
  const initial = loadAmbientSnapshot(storage, random, currentTime.value);
  const game = shallowRef<AmbientGameState>(initial.game);
  const soundEnabled = ref(initial.preferences.soundEnabled);
  const status = ref("果冻散在桌面上。移近一点，它们会聚拢。");
  const feedback = ref<"idle" | "clear" | "recovery" | "level">("idle");
  const trayPreview = shallowRef<readonly TrayPiece[] | null>(null);
  const clearingPieceIds = shallowRef<readonly string[]>([]);
  const isAway = ref(false);
  let recoveryHandle: unknown = null;
  let feedbackHandle: unknown = null;
  let generation = 0;

  const selectablePieces = computed(() => getSelectablePieces(game.value.pieces));
  const plantAgeDays = computed(() => Math.max(
    0,
    Math.floor((currentTime.value - initial.plant.plantedAt) / 86_400_000),
  ));
  const canSelect = computed(
    () => !isAway.value &&
      feedback.value !== "recovery" &&
      feedback.value !== "level",
  );

  function snapshot(): AmbientSnapshotV2 {
    return {
      version: AMBIENT_SNAPSHOT_VERSION,
      game: game.value,
      preferences: { soundEnabled: soundEnabled.value },
      plant: initial.plant,
    };
  }

  function persist(): void {
    saveAmbientSnapshot(storage, snapshot());
  }

  function clearFeedbackTimer(): void {
    if (feedbackHandle !== null) {
      timers.cancel(feedbackHandle);
      feedbackHandle = null;
    }
  }

  function clearRecoveryTimer(): void {
    if (recoveryHandle !== null) {
      timers.cancel(recoveryHandle);
      recoveryHandle = null;
    }
  }

  function clearTrayFeedback(): void {
    trayPreview.value = null;
    clearingPieceIds.value = [];
  }

  function settleFeedback(
    kind: "clear" | "recovery" | "level",
    delay: number,
  ): void {
    clearFeedbackTimer();
    const token = generation;
    feedback.value = kind;
    feedbackHandle = timers.schedule(() => {
      if (token === generation && !isAway.value) {
        feedback.value = "idle";
        if (kind === "clear" || kind === "level") clearTrayFeedback();
      }
      feedbackHandle = null;
    }, delay);
  }

  function runRecovery(): void {
    recoveryHandle = null;
    if (isAway.value || game.value.tray.length < 7) return;
    const result = recoverFullTray(game.value, random);
    game.value = result.state;
    status.value = "托盘松开了两颗果冻，桌面上又有空间了。";
    persist();
    settleFeedback("recovery", 420);
  }

  function scheduleRecovery(): void {
    clearRecoveryTimer();
    const token = generation;
    feedback.value = "recovery";
    status.value = "托盘有点挤，果冻正在自己调整。";
    recoveryHandle = timers.schedule(() => {
      if (token === generation) runRecovery();
    }, 700);
  }

  function activate(pieceId: string): void {
    if (!canSelect.value) return;
    currentTime.value = now();
    if (feedback.value === "clear") {
      clearFeedbackTimer();
      clearTrayFeedback();
      feedback.value = "idle";
    }
    const result = selectPiece(game.value, pieceId, random);
    if (result.kind === "missing") return;
    if (result.kind === "blocked") {
      status.value = "这颗果冻还被上面的果冻轻轻压着。";
      return;
    }

    if (result.kind === "cleared") {
      trayPreview.value = [...game.value.tray, result.selected];
      clearingPieceIds.value = result.cleared.map((piece) => piece.id);
      game.value = result.state;
      status.value = result.levelAdvanced
        ? "桌面清空了，一簇更有挑战的果冻正在展开。"
        : `三颗${KIND_NAMES[result.selected.kind]}融在一起，植物长高了一点。`;
      persist();
      options.onClear?.();
      settleFeedback(
        result.levelAdvanced ? "level" : "clear",
        620,
      );
      return;
    }
    game.value = result.state;
    if (result.kind === "recovery-needed") {
      persist();
      scheduleRecovery();
      return;
    }

    status.value = `${KIND_NAMES[result.selected.kind]}滑进了托盘。`;
    persist();
  }

  function setSoundEnabled(enabled: boolean): void {
    soundEnabled.value = enabled;
    status.value = enabled ? "清除声音已开启。" : "声音已关闭。";
    persist();
  }

  function setAway(away: boolean): void {
    if (isAway.value === away) return;
    isAway.value = away;
    currentTime.value = now();
    generation += 1;
    clearFeedbackTimer();
    clearRecoveryTimer();
    if (away) {
      feedback.value = "idle";
      clearTrayFeedback();
      persist();
      return;
    }
    status.value = "还是刚才的样子。";
    if (game.value.tray.length === 7) scheduleRecovery();
  }

  function dispose(): void {
    generation += 1;
    clearFeedbackTimer();
    clearRecoveryTimer();
    clearTrayFeedback();
    persist();
  }

  return {
    game,
    soundEnabled,
    status,
    feedback,
    trayPreview,
    clearingPieceIds,
    isAway,
    selectablePieces,
    plantAgeDays,
    canSelect,
    activate,
    setSoundEnabled,
    setAway,
    persist,
    dispose,
  };
}
