import { computed, ref, shallowRef } from "vue";

import {
  createLevelState,
  getSelectablePieces,
  selectPiece,
  type AmbientGameState,
  type FishKind,
  type PilePiece,
  type RandomSource,
  type SelectionResult,
  type TrayPiece,
} from "../engine";
import {
  AMBIENT_SNAPSHOT_VERSION,
  loadAmbientSnapshotResult,
  resolveBrowserStorage,
  saveAmbientSnapshot,
  type AmbientSnapshotV4,
  type StorageLike,
} from "../session/ambient-storage";
import {
  getFishPresentation,
  getIntroTargetIds,
  FISH_CATCH_FLIGHT_DURATION,
  FISH_FEED_SETTLE_DURATION,
  FISH_MERGE_CONTACT_DURATION,
  projectGameFeedback,
  shouldStartIntro,
  type CatPose,
  type GameFeedback,
  type IntroPhase,
} from "./game-ui";
import {
  chooseCatReaction,
  type CatBondStage,
  type CatMotion,
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

export interface CompletedFishEvent {
  readonly id: number;
  readonly kind: FishKind;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly feedCount: number;
  readonly phase: "catching" | "merging" | "feeding";
}

const CAT_ACTIVATION_THROTTLE = 800;
const CAT_BUBBLE_DURATION = 2_400;
const CAT_AUTO_REACTION_MIN_DELAY = 45_000;
const CAT_AUTO_REACTION_JITTER = 30_000;
const DIRECT_FEEDBACK_DURATION = 220;
const INTRO_SCAN_DURATION = 520;
const INTRO_TARGET_DURATION = 620;
const INTRO_TRAY_DURATION = 620;
const LEVEL_FEEDBACK_DURATION = 960;
const LOSS_FEEDBACK_DURATION = 1_200;

const browserTimers: TimerApi = {
  schedule: (callback, delay) => globalThis.setTimeout(callback, delay),
  cancel: (handle) => globalThis.clearTimeout(
    handle as ReturnType<typeof setTimeout>,
  ),
};

/**
 * Projects an unlimited completed-fish count into the three visible bond stages.
 * @param fishFedCount Number of complete fish automatically fed to the cat.
 * @returns The stable newcomer, familiar, or bonded stage.
 */
export function getCatBondStage(fishFedCount: number): CatBondStage {
  if (fishFedCount >= 9) return "bonded";
  if (fishFedCount >= 3) return "familiar";
  return "newcomer";
}

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
  const loaded = loadAmbientSnapshotResult(storage, random, currentTime.value);
  const stored = loaded.snapshot;
  const introEligible = shouldStartIntro(
    stored.game,
    stored.pet.guardedPieceId,
  );
  // A controller owns one active play session. Durable pet, plant, and sound
  // progress survive while the transient board and guard start clean.
  const initial: AmbientSnapshotV4 = loaded.loadedFromStorage
    ? {
      ...stored,
      game: createLevelState(1, stored.game.clearCount, 1, random),
      pet: { ...stored.pet, guardedPieceId: null },
    }
    : stored;
  const game = shallowRef<AmbientGameState>(initial.game);
  const presentedClearCount = ref(initial.game.clearCount);
  const soundEnabled = ref(initial.preferences.soundEnabled);
  const fishFedCount = ref(initial.pet.fishFedCount);
  const status = ref("小鱼藏在桌面上。移动指针、触摸或方向键寻找它们。");
  const feedback = ref<GameFeedback>("idle");
  const introPhase = ref<IntroPhase>("idle");
  const introTargetIds = shallowRef(getIntroTargetIds(initial.game.pieces));
  const catPose = ref<CatPose>("idle");
  const catMotion = ref<CatMotion>("idle");
  const trayPreview = shallowRef<readonly TrayPiece[] | null>(null);
  const clearingPieceIds = shallowRef<readonly string[]>([]);
  const completedFish = shallowRef<CompletedFishEvent | null>(null);
  const lossPending = ref(false);
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
  let petReactionSequence = 0;
  let lastCatActivationAt = Number.NEGATIVE_INFINITY;
  let reactionsStarted = false;
  let pendingRestAfterFeed = false;
  let completedFishSequence = 0;
  let generation = 0;
  let feedbackSequence = 0;

  const selectablePieces = computed(() => getSelectablePieces(game.value.pieces));
  const plantAgeDays = computed(() => Math.max(
    0,
    Math.floor((currentTime.value - initial.plant.plantedAt) / 86_400_000),
  ));
  const bondStage = computed(() => getCatBondStage(fishFedCount.value));
  const feedbackProjection = computed(() => projectGameFeedback(feedback.value));
  const canSelect = computed(() =>
    !isAway.value &&
    !lossPending.value &&
    completedFish.value === null &&
    !feedbackProjection.value.locksInput
  );
  const guardedPiece = computed(() =>
    game.value.pieces.find((piece) => piece.id === guardedPieceId.value) ?? null
  );
  const catIsResting = computed(() =>
    catPose.value === "full" ||
    catPose.value === "lying" ||
    catPose.value === "sleeping"
  );

  function snapshot(): AmbientSnapshotV4 {
    return {
      version: AMBIENT_SNAPSHOT_VERSION,
      game: game.value,
      preferences: { soundEnabled: soundEnabled.value },
      plant: initial.plant,
      pet: {
        guardedPieceId: guardedPieceId.value,
        fishFedCount: fishFedCount.value,
      },
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

  /**
   * Schedules one guarded presentation step on the current feedback sequence.
   * @param delay Milliseconds to wait before advancing the presentation.
   * @param next Callback that owns the next phase or final cleanup.
   * @returns Nothing; stale, away, or disposed controller callbacks are ignored.
   */
  function scheduleFeedbackStep(delay: number, next: () => void): void {
    const token = generation;
    const sequence = feedbackSequence;
    feedbackHandle = timers.schedule(() => {
      if (sequence !== feedbackSequence) return;
      feedbackHandle = null;
      if (token !== generation || isAway.value) return;
      next();
    }, delay);
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
    if (!introEligible) return;
    feedback.value = "intro";
    introPhase.value = "scan";
    status.value = "一道柔和的光正扫向附近的小鱼。";
    scheduleIntroStep(INTRO_SCAN_DURATION, () => {
      introPhase.value = "targets";
      status.value = "三条同种小鱼轻轻抬起。";
      scheduleIntroStep(INTRO_TARGET_DURATION, () => {
        introPhase.value = "tray";
        status.value = "托盘正等着三条同种小鱼聚在一起。";
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
      if (catTravelPhase.value === "home") {
        showCatReaction(fishFedCount.value > 0 ? "fed" : "idle");
      }
      scheduleCatAutoReaction();
    }, delay);
  }

  function startReactions(): void {
    if (reactionsStarted) return;
    reactionsStarted = true;
    scheduleCatAutoReaction();
  }

  /**
   * Synchronizes the main motion channel after a transient pose returns idle.
   * @returns Nothing; the motion ref is updated from the current travel phase.
   */
  function syncCatMotionWithTravel(): void {
    if (catPose.value !== "idle") return;
    if (
      catTravelPhase.value === "looking" ||
      catTravelPhase.value === "travelling"
    ) {
      catMotion.value = "searching";
    } else if (catTravelPhase.value === "guarding") {
      catMotion.value = "guarding";
    } else {
      catMotion.value = "idle";
    }
  }

  function scheduleCatPose(nextPose: CatPose, delay: number): void {
    clearCatPoseTimer();
    const token = generation;
    catPoseHandle = timers.schedule(() => {
      catPoseHandle = null;
      if (token !== generation || isAway.value) return;
      catPose.value = nextPose;
      if (nextPose === "full") {
        catMotion.value = "resting";
        scheduleCatPose("lying", 520);
      } else if (nextPose === "lying") {
        catMotion.value = "resting";
        scheduleCatPose("sleeping", 520);
      } else if (nextPose === "sleeping") {
        catMotion.value = "sleeping";
        showCatReaction("sleeping");
        scheduleCatPose("idle", 720);
      } else if (nextPose === "idle") {
        pendingRestAfterFeed = false;
        syncCatMotionWithTravel();
      }
    }, delay);
  }

  function startCatFeedReaction(feedCount: number): void {
    clearCatPoseTimer();
    pendingRestAfterFeed = feedCount % 3 === 0;
    catPose.value = "eating";
    catMotion.value = "feeding";
    scheduleCatPose(pendingRestAfterFeed ? "full" : "idle", 520);
  }

  function resumeCatPoseSequence(): void {
    if (catPose.value === "eating") {
      scheduleCatPose(pendingRestAfterFeed ? "full" : "idle", 520);
    } else if (catPose.value === "full") {
      scheduleCatPose("lying", 520);
    } else if (catPose.value === "lying") {
      scheduleCatPose("sleeping", 520);
    } else if (catPose.value === "sleeping") {
      scheduleCatPose("idle", 720);
    } else {
      syncCatMotionWithTravel();
    }
  }

  function returnCatHome(): void {
    clearCatSearchTimer();
    guardedPieceId.value = null;
    catTravelPhase.value = "home";
    syncCatMotionWithTravel();
  }

  function resolveGuardedPiece(pieceId: string): void {
    if (guardedPieceId.value !== pieceId) return;
    returnCatHome();
    showCatReaction(fishFedCount.value > 0 ? "fed" : "idle");
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
      catMotion.value = "guarding";
      status.value = "小猫找到了，正用光照着需要的小鱼。";
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
      catMotion.value = "searching";
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
    } else if (catTravelPhase.value === "guarding") {
      catMotion.value = "guarding";
    }
  }

  /**
   * Scores a hidden small fish by how close its species is to combining.
   * @param candidate Candidate pile fish considered for cat search.
   * @returns Priority from one for a new species to three for a completing fish.
   */
  function getSearchPriority(candidate: PilePiece): number {
    const sameKindCount = game.value.tray.filter((piece) =>
      piece.kind === candidate.kind
    ).length;
    return Math.min(3, sameKindCount + 1);
  }

  function requestCatSearch(): void {
    takeOverIntro();
    if (isAway.value || feedback.value === "loss") return;
    const activatedAt = now();
    if (activatedAt - lastCatActivationAt < CAT_ACTIVATION_THROTTLE) return;
    lastCatActivationAt = activatedAt;

    if (guardedPiece.value) {
      status.value = "小猫还守着刚找到的小鱼。";
      showCatReaction("guarding");
      return;
    }
    if (!canSelect.value) {
      status.value = "完整鱼正在送给小猫，请稍等一下。";
      showCatReaction("unavailable");
      return;
    }

    clearCatPoseTimer();
    pendingRestAfterFeed = false;
    catPose.value = "idle";
    const candidates = selectablePieces.value.filter((piece) =>
      options.isSearchCandidate?.(piece.id) ?? true
    );
    const target = candidates.sort((first, second) => {
      const matchPriority = getSearchPriority(second) - getSearchPriority(first);
      if (matchPriority !== 0) return matchPriority;
      const distancePriority =
        Math.hypot(first.pile.x - 0.12, first.pile.y - 0.74) -
        Math.hypot(second.pile.x - 0.12, second.pile.y - 0.74);
      return distancePriority || first.id.localeCompare(second.id);
    })[0];
    if (!target) {
      status.value = "小猫暂时找不到可以提示的小鱼。";
      showCatReaction("unavailable");
      syncCatMotionWithTravel();
      return;
    }

    guardedPieceId.value = target.id;
    catTravelPhase.value = "looking";
    catMotion.value = "searching";
    status.value = "小猫正在寻找最接近凑齐三条的同种小鱼。";
    showCatReaction("searching");
    persist();
    scheduleCatTravelling(320);
  }

  /**
   * Announces that keyboard activation found no fish under the spotlight.
   * @returns Nothing; only transient live-region status is updated.
   */
  function announceSearchMiss(): void {
    takeOverIntro();
    if (isAway.value || !canSelect.value) return;
    status.value = "这里还没有照到小鱼，继续移动探照灯。";
  }

  function petCat(): void {
    takeOverIntro();
    if (
      isAway.value ||
      feedback.value === "loss" ||
      catTravelPhase.value !== "home"
    ) {
      return;
    }
    clearCatPoseTimer();
    pendingRestAfterFeed = false;
    catPose.value = "idle";
    catMotion.value = "petting";
    petReactionSequence += 1;
    const familiar = bondStage.value !== "newcomer";
    const next: CatReaction = {
      id: `pet-${familiar ? "purr" : "hello"}-${petReactionSequence}`,
      text: familiar ? "呼噜～" : "喵～",
    };
    lastCatReactionId = next.id;
    catReaction.value = next;
    status.value = familiar
      ? "小猫主动贴近你的手，发出轻轻的呼噜声。"
      : "小猫试探着靠近你的手。";
    scheduleCatPose("idle", 560);
    scheduleCatReactionDismiss(CAT_BUBBLE_DURATION);
  }

  function clearTrayFeedback(): void {
    trayPreview.value = null;
    clearingPieceIds.value = [];
    completedFish.value = null;
    lossPending.value = false;
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
    feedback.value = kind;
    scheduleFeedbackStep(delay, () => {
      feedback.value = "idle";
      clearTrayFeedback();
      if (kind === "loss") {
        catPose.value = "idle";
        catMotion.value = "idle";
        status.value = "新的第一局已经排好，可以继续寻找小鱼。";
        scheduleCatAutoReaction();
      }
    });
  }

  /**
   * Runs the ordered catch, merge, and feed phases for one completed fish.
   * @param event Completed-fish payload beginning in the catching phase.
   * @param levelAdvanced Whether feeding should reveal the next fish field.
   * @param previousStage Bond stage before this completed fish was recorded.
   * @param nextStage Bond stage after this completed fish was recorded.
   * @param fishLabel Human-readable species label used by visible status feedback.
   * @returns Nothing; controller refs advance through timed UI-only phases.
   */
  function startCompletedFishPresentation(
    event: CompletedFishEvent,
    levelAdvanced: boolean,
    previousStage: CatBondStage,
    nextStage: CatBondStage,
    fishLabel: string,
  ): void {
    clearFeedbackTimer();
    introPhase.value = "idle";
    completedFish.value = event;
    feedback.value = "select";
    status.value = `第三条${fishLabel}正在滑进托盘。`;
    scheduleFeedbackStep(FISH_CATCH_FLIGHT_DURATION, () => {
      if (completedFish.value?.id !== event.id) return;
      completedFish.value = { ...event, phase: "merging" };
      status.value = `三条${fishLabel}正在聚拢成一条大鱼。`;
      scheduleFeedbackStep(FISH_MERGE_CONTACT_DURATION, () => {
        if (completedFish.value?.id !== event.id) return;
        completedFish.value = { ...event, phase: "feeding" };
        presentedClearCount.value = game.value.clearCount;
        feedback.value = levelAdvanced ? "level" : "clear";
        status.value = previousStage !== nextStage
          ? `大${fishLabel}被小猫接住了。你们变得更亲近了。`
          : `大${fishLabel}被小猫接住了。`;
        startCatFeedReaction(event.feedCount);
        showCatReaction(event.feedCount % 3 === 0 ? "full" : "fed");
        options.onClear?.();
        const settleDuration = levelAdvanced
          ? LEVEL_FEEDBACK_DURATION
          : FISH_FEED_SETTLE_DURATION;
        scheduleFeedbackStep(settleDuration, () => {
          feedback.value = "idle";
          clearTrayFeedback();
          if (levelAdvanced) {
            status.value = "新的鱼群已经展开，可以继续寻找小鱼。";
          }
        });
      });
    });
  }

  /**
   * Lets the seventh incoming fish land before the tray loss response begins.
   * @returns Nothing; the restarted canonical field remains locked until cleanup.
   */
  function startLossPresentation(): void {
    clearFeedbackTimer();
    introPhase.value = "idle";
    lossPending.value = true;
    feedback.value = "select";
    status.value = "最后一条小鱼正在落入托盘。";
    scheduleFeedbackStep(FISH_CATCH_FLIGHT_DURATION, () => {
      lossPending.value = false;
      catPose.value = "lying";
      catMotion.value = "loss";
      feedback.value = "loss";
      status.value = "托盘装满了，小鱼们安静地重新排好，从第一局再来。";
      scheduleFeedbackStep(LOSS_FEEDBACK_DURATION, () => {
        feedback.value = "idle";
        clearTrayFeedback();
        catPose.value = "idle";
        catMotion.value = "idle";
        status.value = "新的第一局已经排好，可以继续寻找小鱼。";
        scheduleCatAutoReaction();
      });
    });
  }

  /**
   * Applies one legal fish selection and returns its pure engine outcome.
   * @param pieceId Canonical fish ID chosen by pointer, touch, or keyboard input.
   * @returns The applied engine result, or null while transient input is locked.
   */
  function activate(pieceId: string): SelectionResult | null {
    takeOverIntro();
    if (!canSelect.value) return null;
    currentTime.value = now();
    interruptFeedback();
    const result = selectPiece(game.value, pieceId, random);
    if (result.kind === "missing") return result;

    if (result.kind === "combined") {
      const previousStage = bondStage.value;
      trayPreview.value = [...game.value.tray, result.selected];
      clearingPieceIds.value = result.combined.map((piece) => piece.id);
      game.value = result.state;
      resolveGuardedPiece(pieceId);
      fishFedCount.value = Math.min(
        Number.MAX_SAFE_INTEGER,
        fishFedCount.value + 1,
      );
      completedFishSequence += 1;
      const completedEvent: CompletedFishEvent = {
        id: completedFishSequence,
        kind: result.fishKind,
        combined: result.combined,
        feedCount: fishFedCount.value,
        phase: "catching",
      };
      if (result.levelAdvanced) returnCatHome();
      const nextStage = bondStage.value;
      const fishLabel = getFishPresentation(result.fishKind).label;
      persist();
      startCompletedFishPresentation(
        completedEvent,
        result.levelAdvanced,
        previousStage,
        nextStage,
        fishLabel,
      );
      return result;
    }

    game.value = result.state;
    resolveGuardedPiece(pieceId);
    if (result.kind === "lost") {
      trayPreview.value = result.tray;
      clearingPieceIds.value = [];
      completedFish.value = null;
      returnCatHome();
      clearCatPoseTimer();
      clearCatAutoReactionTimer();
      dismissCatReaction();
      pendingRestAfterFeed = false;
      persist();
      startLossPresentation();
      return result;
    }

    status.value = `一条${
      getFishPresentation(result.selected.kind).label
    }滑进了托盘。`;
    persist();
    settleFeedback("select", DIRECT_FEEDBACK_DURATION);
    return result;
  }

  /**
   * Explains why a single small fish cannot be fed directly to the cat.
   * @returns Nothing; canonical game and durable pet progress remain unchanged.
   */
  function rejectDirectFeed(): void {
    takeOverIntro();
    if (!canSelect.value) return;
    interruptFeedback();
    status.value = "先凑齐三条同种小鱼，它们会变成大鱼自动喂给小猫。";
    showCatReaction("unavailable");
    settleFeedback("select", DIRECT_FEEDBACK_DURATION);
  }

  function setSoundEnabled(enabled: boolean): void {
    takeOverIntro();
    soundEnabled.value = enabled;
    status.value = enabled ? "小鱼合成音效已开启。" : "声音已关闭。";
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
      presentedClearCount.value = game.value.clearCount;
      if (lossInterrupted) {
        catPose.value = "idle";
        catMotion.value = "idle";
      }
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
    presentedClearCount,
    soundEnabled,
    fishFedCount,
    bondStage,
    status,
    feedback,
    feedbackProjection,
    introPhase,
    introTargetIds,
    catPose,
    catMotion,
    catReaction,
    guardedPiece,
    catTravelPhase,
    catIsResting,
    trayPreview,
    clearingPieceIds,
    completedFish,
    isAway,
    selectablePieces,
    plantAgeDays,
    canSelect,
    activate,
    rejectDirectFeed,
    petCat,
    requestCatSearch,
    announceSearchMiss,
    takeOverIntro,
    startReactions,
    setSoundEnabled,
    setAway,
    persist,
    dispose,
  };
}
