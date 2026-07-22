import { computed, ref, shallowRef } from "vue";

import {
  feedPiece,
  getSelectablePieces,
  selectPiece,
  type AmbientGameState,
  type RandomSource,
  type TrayPiece,
} from "../engine";
import {
  AMBIENT_SNAPSHOT_VERSION,
  loadAmbientSnapshot,
  resolveBrowserStorage,
  saveAmbientSnapshot,
  type AmbientSnapshotV3,
  type StorageLike,
} from "../session/ambient-storage";
import {
  getFishPresentation,
  getIntroTargetIds,
  projectGameFeedback,
  shouldStartIntro,
  type CatPose,
  type GameFeedback,
  type IntroPhase,
} from "./game-ui";
import {
  chooseCatReaction,
  type CatReaction,
  type CatReactionContext,
  type CatTravelPhase,
} from "./cat-reactions";

export interface TimerApi {
  schedule(callback: () => void, delay: number): unknown;
  cancel(handle: unknown): void;
}

export interface AmbientControllerOptions {
  readonly random?: RandomSource;
  readonly reactionRandom?: RandomSource;
  readonly storage?: StorageLike | null;
  readonly timers?: TimerApi;
  readonly onClear?: () => void;
  readonly now?: () => number;
  readonly isSearchCandidate?: (pieceId: string) => boolean;
}

const CAT_ACTIVATION_THROTTLE = 800;
const CAT_BUBBLE_DURATION = 2_400;
const CAT_AUTO_REACTION_MIN_DELAY = 45_000;
const CAT_AUTO_REACTION_JITTER = 30_000;
const DIRECT_FEEDBACK_DURATION = 220;
const INTRO_SCAN_DURATION = 520;
const INTRO_TARGET_DURATION = 620;
const INTRO_TRAY_DURATION = 620;
const LOSS_FEEDBACK_DURATION = 1_200;

const browserTimers: TimerApi = {
  schedule: (callback, delay) => globalThis.setTimeout(callback, delay),
  cancel: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createAmbientController(
  options: AmbientControllerOptions = {},
) {
  const random = options.random ?? Math.random;
  const reactionRandom = options.reactionRandom ?? Math.random;
  const storage = options.storage === undefined
    ? resolveBrowserStorage()
    : options.storage;
  const timers = options.timers ?? browserTimers;
  const now = options.now ?? Date.now;
  const currentTime = ref(now());
  const initial = loadAmbientSnapshot(storage, random, currentTime.value);
  const game = shallowRef<AmbientGameState>(initial.game);
  const soundEnabled = ref(initial.preferences.soundEnabled);
  const status = ref("小鱼藏在桌面上。移动指针、触摸或方向键寻找它们。");
  const feedback = ref<GameFeedback>("idle");
  const introPhase = ref<IntroPhase>("idle");
  const introTargetIds = shallowRef(getIntroTargetIds(initial.game.pieces));
  const catPose = ref<CatPose>(
    initial.game.fed.length === 0
      ? "idle"
      : initial.game.fed.length < 3 ? "eating" : "sleeping",
  );
  const trayPreview = shallowRef<readonly TrayPiece[] | null>(null);
  const clearingPieceIds = shallowRef<readonly string[]>([]);
  const catReaction = shallowRef<CatReaction | null>(null);
  const guardedPieceId = ref<string | null>(initial.pet.guardedPieceId);
  const catTravelPhase = ref<CatTravelPhase>(
    initial.pet.guardedPieceId ? "guarding" : "home",
  );
  const isAway = ref(false);
  let feedbackHandle: unknown = null;
  let catPoseHandle: unknown = null;
  let catReactionHandle: unknown = null;
  let catSearchHandle: unknown = null;
  let catAutoReactionHandle: unknown = null;
  let catReactionRemaining = 0;
  let catReactionStartedAt = 0;
  let lastCatReactionId: string | null = null;
  let lastCatActivationAt = Number.NEGATIVE_INFINITY;
  let reactionsStarted = false;
  let wakeAfterSleep = false;
  let generation = 0;
  let feedbackSequence = 0;

  const selectablePieces = computed(() => getSelectablePieces(game.value.pieces));
  const plantAgeDays = computed(() => Math.max(
    0,
    Math.floor((currentTime.value - initial.plant.plantedAt) / 86_400_000),
  ));
  const feedbackProjection = computed(() => projectGameFeedback(feedback.value));
  const canSelect = computed(
    () => !isAway.value && !feedbackProjection.value.locksInput,
  );
  const guardedPiece = computed(() =>
    game.value.pieces.find((piece) => piece.id === guardedPieceId.value) ?? null,
  );
  const catIsResting = computed(() =>
    catPose.value === "full" ||
    catPose.value === "lying" ||
    catPose.value === "sleeping",
  );
  const catCanEat = computed(() =>
    game.value.fed.length < 3 && !catIsResting.value && !isAway.value,
  );

  function snapshot(): AmbientSnapshotV3 {
    return {
      version: AMBIENT_SNAPSHOT_VERSION,
      game: game.value,
      preferences: { soundEnabled: soundEnabled.value },
      plant: initial.plant,
      pet: { guardedPieceId: guardedPieceId.value },
    };
  }

  function persist(): void {
    saveAmbientSnapshot(storage, snapshot());
  }

  function clearFeedbackTimer(): void {
    feedbackSequence += 1;
    if (feedbackHandle !== null) {
      timers.cancel(feedbackHandle);
      feedbackHandle = null;
    }
  }

  function takeOverIntro(): void {
    if (feedback.value !== "intro") return;
    clearFeedbackTimer();
    introPhase.value = "idle";
    feedback.value = "idle";
    status.value = "小鱼藏在桌面上。移动指针、触摸或方向键寻找它们。";
  }

  function scheduleIntroStep(delay: number, next: () => void): void {
    const token = generation;
    const sequence = feedbackSequence;
    feedbackHandle = timers.schedule(() => {
      if (sequence !== feedbackSequence) return;
      feedbackHandle = null;
      if (token !== generation || isAway.value || feedback.value !== "intro") {
        return;
      }
      next();
    }, delay);
  }

  function startIntro(): void {
    if (!shouldStartIntro(initial.game, initial.pet.guardedPieceId)) return;
    feedback.value = "intro";
    introPhase.value = "scan";
    status.value = "一道柔和的光正扫向附近的小鱼。";
    scheduleIntroStep(INTRO_SCAN_DURATION, () => {
      introPhase.value = "targets";
      status.value = "光里的三条同类小鱼轻轻抬起。";
      scheduleIntroStep(INTRO_TARGET_DURATION, () => {
        introPhase.value = "tray";
        status.value = "托盘的第一格正在等待一条小鱼。";
        scheduleIntroStep(INTRO_TRAY_DURATION, () => {
          introPhase.value = "idle";
          feedback.value = "idle";
          status.value = "小鱼藏在桌面上。移动指针、触摸或方向键寻找它们。";
        });
      });
    });
  }

  function clearCatPoseTimer(): void {
    if (catPoseHandle !== null) {
      timers.cancel(catPoseHandle);
      catPoseHandle = null;
    }
  }

  function clearCatReactionTimer(): void {
    if (catReactionHandle !== null) {
      timers.cancel(catReactionHandle);
      catReactionHandle = null;
    }
  }

  function clearCatSearchTimer(): void {
    if (catSearchHandle !== null) {
      timers.cancel(catSearchHandle);
      catSearchHandle = null;
    }
  }

  function clearCatAutoReactionTimer(): void {
    if (catAutoReactionHandle !== null) {
      timers.cancel(catAutoReactionHandle);
      catAutoReactionHandle = null;
    }
  }

  function dismissCatReaction(): void {
    clearCatReactionTimer();
    catReaction.value = null;
    catReactionRemaining = 0;
  }

  function scheduleCatReactionDismiss(delay: number): void {
    clearCatReactionTimer();
    catReactionRemaining = delay;
    catReactionStartedAt = now();
    const token = generation;
    catReactionHandle = timers.schedule(() => {
      catReactionHandle = null;
      if (token !== generation || isAway.value) return;
      catReaction.value = null;
      catReactionRemaining = 0;
    }, delay);
  }

  function showCatReaction(
    context: CatReactionContext,
    duration = CAT_BUBBLE_DURATION,
  ): void {
    const next = chooseCatReaction(context, lastCatReactionId, reactionRandom);
    lastCatReactionId = next.id;
    catReaction.value = next;
    if (!isAway.value) scheduleCatReactionDismiss(duration);
  }

  function scheduleCatAutoReaction(): void {
    clearCatAutoReactionTimer();
    if (!reactionsStarted || isAway.value) return;
    const delay = CAT_AUTO_REACTION_MIN_DELAY +
      Math.floor(reactionRandom() * CAT_AUTO_REACTION_JITTER);
    const token = generation;
    catAutoReactionHandle = timers.schedule(() => {
      catAutoReactionHandle = null;
      if (token !== generation || isAway.value) return;
      if (catTravelPhase.value === "home" && game.value.fed.length < 3) {
        showCatReaction(game.value.fed.length > 0 ? "fed" : "idle");
      }
      scheduleCatAutoReaction();
    }, delay);
  }

  function startReactions(): void {
    if (reactionsStarted) return;
    reactionsStarted = true;
    scheduleCatAutoReaction();
  }

  function scheduleCatPose(nextPose: CatPose, delay: number): void {
    clearCatPoseTimer();
    const token = generation;
    catPoseHandle = timers.schedule(() => {
      catPoseHandle = null;
      if (token !== generation || isAway.value) return;
      catPose.value = nextPose;
      if (nextPose === "lying") {
        scheduleCatPose("sleeping", 520);
      } else if (nextPose === "sleeping" && wakeAfterSleep) {
        showCatReaction("sleeping");
        scheduleCatPose("idle", 720);
        wakeAfterSleep = false;
      } else if (nextPose === "sleeping") {
        showCatReaction("sleeping");
      }
    }, delay);
  }

  function startCatFeedReaction(feedCount: number, levelAdvanced: boolean): void {
    clearCatPoseTimer();
    wakeAfterSleep = levelAdvanced;
    if (feedCount < 3) {
      catPose.value = "eating";
      if (levelAdvanced) scheduleCatPose("idle", 720);
      return;
    }
    catPose.value = "full";
    scheduleCatPose("lying", 520);
  }

  function resumeCatPoseSequence(): void {
    if (catPose.value === "full") {
      scheduleCatPose("lying", 520);
    } else if (catPose.value === "lying") {
      scheduleCatPose("sleeping", 520);
    } else if (catPose.value === "sleeping" && wakeAfterSleep) {
      scheduleCatPose("idle", 720);
      wakeAfterSleep = false;
    }
  }

  function returnCatHome(): void {
    clearCatSearchTimer();
    guardedPieceId.value = null;
    catTravelPhase.value = "home";
  }

  function resolveGuardedPiece(pieceId: string): void {
    if (guardedPieceId.value !== pieceId) return;
    returnCatHome();
    showCatReaction(game.value.fed.length > 0 ? "fed" : "idle");
  }

  function scheduleCatGuarding(delay: number): void {
    clearCatSearchTimer();
    const token = generation;
    catSearchHandle = timers.schedule(() => {
      catSearchHandle = null;
      if (token !== generation || isAway.value) return;
      if (!guardedPiece.value) {
        returnCatHome();
        showCatReaction("unavailable");
        return;
      }
      catTravelPhase.value = "guarding";
      status.value = "小猫找到了，正用光照着那条小鱼。";
      showCatReaction("guarding");
    }, delay);
  }

  function scheduleCatTravelling(delay: number): void {
    clearCatSearchTimer();
    const token = generation;
    catSearchHandle = timers.schedule(() => {
      catSearchHandle = null;
      if (token !== generation || isAway.value || !guardedPiece.value) return;
      catTravelPhase.value = "travelling";
      scheduleCatGuarding(520);
    }, delay);
  }

  function resumeCatSearchSequence(): void {
    if (!guardedPiece.value) {
      if (catTravelPhase.value !== "home") returnCatHome();
      return;
    }
    if (catTravelPhase.value === "looking") {
      scheduleCatTravelling(320);
    } else if (catTravelPhase.value === "travelling") {
      scheduleCatGuarding(520);
    }
  }

  function requestCatSearch(): void {
    takeOverIntro();
    if (isAway.value || feedback.value === "loss") return;
    const activatedAt = now();
    if (activatedAt - lastCatActivationAt < CAT_ACTIVATION_THROTTLE) return;
    lastCatActivationAt = activatedAt;

    if (game.value.fed.length >= 3 || catIsResting.value) {
      status.value = catPose.value === "sleeping"
        ? "小猫已经睡着了，现在不能帮忙寻鱼。"
        : "小猫已经吃饱，正在休息，现在不能帮忙寻鱼。";
      showCatReaction(catPose.value === "sleeping" ? "sleeping" : "full");
      return;
    }
    if (guardedPiece.value) {
      status.value = "小猫还守着刚找到的那条鱼。";
      showCatReaction("guarding");
      return;
    }
    if (!canSelect.value) {
      status.value = "桌面正在变化，请稍后再请小猫寻鱼。";
      showCatReaction("unavailable");
      return;
    }

    const candidates = selectablePieces.value.filter((piece) =>
      options.isSearchCandidate?.(piece.id) ?? true,
    );
    const target = candidates.sort((first, second) =>
      Math.hypot(first.pile.x - 0.12, first.pile.y - 0.74) -
      Math.hypot(second.pile.x - 0.12, second.pile.y - 0.74)
    )[0];
    if (!target) {
      status.value = "小猫暂时找不到可以提示的小鱼。";
      showCatReaction("unavailable");
      return;
    }

    guardedPieceId.value = target.id;
    catTravelPhase.value = "looking";
    status.value = "小猫正在寻找一条可以拿到的小鱼。";
    showCatReaction("searching");
    persist();
    scheduleCatTravelling(320);
  }

  function clearTrayFeedback(): void {
    trayPreview.value = null;
    clearingPieceIds.value = [];
  }

  function interruptFeedback(): void {
    if (feedback.value !== "idle") {
      clearFeedbackTimer();
      introPhase.value = "idle";
      feedback.value = "idle";
    }
    clearTrayFeedback();
  }

  function settleFeedback(
    kind: Exclude<GameFeedback, "idle">,
    delay: number,
  ): void {
    clearFeedbackTimer();
    introPhase.value = "idle";
    const token = generation;
    const sequence = feedbackSequence;
    feedback.value = kind;
    feedbackHandle = timers.schedule(() => {
      if (sequence !== feedbackSequence) return;
      feedbackHandle = null;
      if (token !== generation || isAway.value) return;
      feedback.value = "idle";
      clearTrayFeedback();
      if (kind === "loss") {
        catPose.value = "idle";
        status.value = "新的第一局已经排好，可以继续寻找小鱼。";
        scheduleCatAutoReaction();
      }
    }, delay);
  }

  function feedToCat(pieceId: string): void {
    takeOverIntro();
    if (!canSelect.value) return;
    interruptFeedback();
    if (!catCanEat.value) {
      status.value = "小猫正在休息，现在不能再喂。";
      showCatReaction(catPose.value === "sleeping" ? "sleeping" : "full");
      settleFeedback("feed-rejected", DIRECT_FEEDBACK_DURATION);
      return;
    }
    const previousFeedCount = game.value.fed.length;
    const result = feedPiece(game.value, pieceId, random);
    if (result.kind === "missing") return;
    if (result.kind === "full") {
      status.value = "小猫已经吃饱了，不能再喂。";
      showCatReaction(catPose.value === "sleeping" ? "sleeping" : "full");
      settleFeedback("feed-rejected", DIRECT_FEEDBACK_DURATION);
      return;
    }
    const feedCount = previousFeedCount + 1;
    if (result.settled.length > 0) {
      trayPreview.value = game.value.tray;
      clearingPieceIds.value = result.settled.map((piece) => piece.id);
    }
    game.value = result.state;
    if (
      guardedPieceId.value === pieceId ||
      feedCount === 3 ||
      result.levelAdvanced
    ) returnCatHome();
    status.value = result.settled.length > 0
      ? feedCount === 3
        ? "小猫吃饱了，这条鱼也补足了托盘里的同类小鱼。"
        : `${getFishPresentation(result.selected.kind).label}补足了托盘里的同类小鱼，它们一起消掉了。`
      : feedCount === 3
      ? "小猫吃饱了，抱着肚子趴下来，慢慢睡着了。"
      : `小猫开心地吃下第${feedCount}条鱼。`;
    startCatFeedReaction(feedCount, result.levelAdvanced);
    showCatReaction(feedCount === 3 ? "full" : "fed");
    persist();
    if (result.settled.length > 0) {
      settleFeedback(result.levelAdvanced ? "level" : "settle", 620);
    } else {
      settleFeedback("feed", DIRECT_FEEDBACK_DURATION);
    }
  }

  function activate(pieceId: string): void {
    takeOverIntro();
    if (!canSelect.value) return;
    currentTime.value = now();
    interruptFeedback();
    const result = selectPiece(game.value, pieceId, random);
    if (result.kind === "missing") return;

    if (result.kind === "cleared") {
      trayPreview.value = [...game.value.tray, result.selected];
      clearingPieceIds.value = result.cleared.map((piece) => piece.id);
      game.value = result.state;
      resolveGuardedPiece(pieceId);
      status.value = result.levelAdvanced
        ? "桌面清空了，一群更有挑战的小鱼正在展开。"
        : `三条${getFishPresentation(result.selected.kind).label}聚在一起，植物长高了一点。`;
      persist();
      if (result.levelAdvanced) {
        returnCatHome();
        catPose.value = "idle";
        clearCatPoseTimer();
      }
      options.onClear?.();
      settleFeedback(
        result.levelAdvanced ? "level" : "clear",
        620,
      );
      return;
    }
    if (result.kind === "settled") {
      trayPreview.value = [...game.value.tray, result.selected];
      clearingPieceIds.value = result.settled.map((piece) => piece.id);
      game.value = result.state;
      resolveGuardedPiece(pieceId);
      status.value = result.levelAdvanced
        ? "喂过的小鱼补足了最后一组，一群新的小鱼正在展开。"
        : `${getFishPresentation(result.selected.kind).label}借助喂过的小鱼凑满三条，一起消掉了。`;
      persist();
      if (result.levelAdvanced) {
        returnCatHome();
        catPose.value = "idle";
        clearCatPoseTimer();
      }
      settleFeedback(result.levelAdvanced ? "level" : "settle", 620);
      return;
    }
    game.value = result.state;
    resolveGuardedPiece(pieceId);
    if (result.kind === "lost") {
      trayPreview.value = result.tray;
      clearingPieceIds.value = [];
      returnCatHome();
      clearCatPoseTimer();
      clearCatAutoReactionTimer();
      dismissCatReaction();
      wakeAfterSleep = false;
      catPose.value = "lying";
      status.value = "托盘装满了，小鱼们安静地重新排好，从第一局再来。";
      persist();
      settleFeedback("loss", LOSS_FEEDBACK_DURATION);
      return;
    }

    status.value = `${getFishPresentation(result.selected.kind).label}滑进了托盘。`;
    persist();
    settleFeedback("select", DIRECT_FEEDBACK_DURATION);
  }

  function rejectFeed(): void {
    takeOverIntro();
    if (!canSelect.value) return;
    interruptFeedback();
    status.value = "没有放到小猫身上，小鱼回到了原位。";
    showCatReaction("unavailable");
    settleFeedback("feed-rejected", DIRECT_FEEDBACK_DURATION);
  }

  function setSoundEnabled(enabled: boolean): void {
    takeOverIntro();
    soundEnabled.value = enabled;
    status.value = enabled ? "清除声音已开启。" : "声音已关闭。";
    persist();
  }

  function setAway(away: boolean): void {
    if (away) takeOverIntro();
    if (isAway.value === away) return;
    isAway.value = away;
    currentTime.value = now();
    const lossInterrupted = feedback.value === "loss";
    generation += 1;
    clearFeedbackTimer();
    clearCatPoseTimer();
    clearCatSearchTimer();
    clearCatAutoReactionTimer();
    if (away) {
      if (catReaction.value && catReactionHandle !== null) {
        const elapsed = Math.max(0, currentTime.value - catReactionStartedAt);
        catReactionRemaining = Math.max(0, catReactionRemaining - elapsed);
      }
      clearCatReactionTimer();
      feedback.value = "idle";
      clearTrayFeedback();
      if (lossInterrupted) catPose.value = "idle";
      persist();
      return;
    }
    status.value = "还是刚才的样子。";
    if (catReaction.value && catReactionRemaining > 0) {
      scheduleCatReactionDismiss(catReactionRemaining);
    }
    resumeCatPoseSequence();
    resumeCatSearchSequence();
    scheduleCatAutoReaction();
  }

  function dispose(): void {
    takeOverIntro();
    generation += 1;
    clearFeedbackTimer();
    clearCatPoseTimer();
    clearCatSearchTimer();
    clearCatAutoReactionTimer();
    dismissCatReaction();
    clearTrayFeedback();
    persist();
  }

  startIntro();

  return {
    game,
    soundEnabled,
    status,
    feedback,
    feedbackProjection,
    introPhase,
    introTargetIds,
    catPose,
    catReaction,
    guardedPiece,
    catTravelPhase,
    catIsResting,
    trayPreview,
    clearingPieceIds,
    isAway,
    selectablePieces,
    plantAgeDays,
    canSelect,
    catCanEat,
    activate,
    feedToCat,
    rejectFeed,
    requestCatSearch,
    takeOverIntro,
    startReactions,
    setSoundEnabled,
    setAway,
    persist,
    dispose,
  };
}
