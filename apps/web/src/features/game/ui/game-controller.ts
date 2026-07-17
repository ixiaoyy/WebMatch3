import { computed, ref, shallowRef } from "vue";

import {
  areAdjacent,
  DEFAULT_ENGINE_CONFIG,
  executeSwap,
  generateBoard,
  isInBounds,
  type Board,
  type Coordinate,
  type RandomSource,
  type Swap,
} from "@/features/game/engine";
import {
  DEFAULT_SESSION_CONFIG,
  getDefaultProgressStorage,
  loadLocalProgress,
  recordCompletedGame,
  safeAdd,
  saveLocalProgress,
  scoreCascadeRound,
  selectLeaderboard,
  validatePlayerName,
  type GameOutcome,
  type LeaderboardPeriod,
  type ProgressStorage,
  type SessionConfig,
  type SessionPhase,
} from "@/features/game/session";

import {
  coordinateKey,
  coordinatesEqual,
  type GameHudState,
  type GamePhase,
  type GameResultState,
} from "./game-ui";

export type Wait = (duration: number) => Promise<void>;

export interface GameControllerOptions {
  readonly random?: RandomSource;
  readonly wait?: Wait;
  readonly reducedMotion?: boolean;
  readonly storage?: ProgressStorage | null;
  readonly now?: () => Date;
  readonly sessionConfig?: Partial<SessionConfig>;
}

const waitFor: Wait = (duration) =>
  new Promise((resolve) => window.setTimeout(resolve, duration));

export function createGameController(options: GameControllerOptions = {}) {
  const random = options.random ?? Math.random;
  const wait = options.wait ?? waitFor;
  const reducedMotion = options.reducedMotion ?? false;
  const now = options.now ?? (() => new Date());
  const sessionConfig: SessionConfig = Object.freeze({
    ...DEFAULT_SESSION_CONFIG,
    ...options.sessionConfig,
  });
  const storage =
    options.storage === undefined
      ? getDefaultProgressStorage()
      : options.storage;
  const initial = generateBoard(DEFAULT_ENGINE_CONFIG, random).board;
  const storedProgress = loadLocalProgress(storage, sessionConfig);

  const board = shallowRef<Board>(initial);
  const visualBoard = shallowRef<Board>(initial);
  const selected = shallowRef<Coordinate | null>(null);
  const focused = shallowRef<Coordinate>({ row: 0, column: 0 });
  const phase = ref<GamePhase>("idle");
  const sessionPhase = ref<SessionPhase>("awaiting-player");
  const playerName = ref("");
  const status = ref("请输入姓名后开始游戏。");
  const isBusy = ref(false);
  const matchedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const invalidKeys = shallowRef<ReadonlySet<string>>(new Set());
  const movedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const spawnedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const activeSwap = shallowRef<Swap | null>(null);
  const instructionsVisible = ref(false);
  const restartConfirmVisible = ref(false);
  const resolvedMoves = ref(0);
  const score = ref(0);
  const remainingMoves = ref(sessionConfig.initialMoves);
  const combo = ref(0);
  const bestCombo = ref(0);
  const progress = shallowRef(storedProgress);
  const leaderboardPeriod = ref<LeaderboardPeriod>("week");
  const result = shallowRef<GameResultState | null>(null);
  let animationGeneration = 0;

  const hasProgress = computed(() => resolvedMoves.value > 0);
  const canPlay = computed(
    () => sessionPhase.value === "playing" && !isBusy.value,
  );
  const leaderboard = computed(() =>
    selectLeaderboard(
      progress.value,
      leaderboardPeriod.value,
      now(),
      sessionConfig,
    ),
  );
  const bestScore = computed(() => progress.value.bestScore);
  const hudState = computed<GameHudState>(() => ({
    score: score.value,
    targetScore: sessionConfig.targetScore,
    remainingMoves: remainingMoves.value,
    combo: combo.value,
  }));

  function duration(normal: number): number {
    return reducedMotion ? Math.min(16, normal) : normal;
  }

  async function waitForPhase(
    milliseconds: number,
    generation: number,
  ): Promise<boolean> {
    await wait(duration(milliseconds));
    return generation === animationGeneration;
  }

  function clearAnimationMarkers(): void {
    matchedKeys.value = new Set();
    invalidKeys.value = new Set();
    movedKeys.value = new Set();
    spawnedKeys.value = new Set();
    activeSwap.value = null;
  }

  function setFocused(coordinate: Coordinate): void {
    focused.value = coordinate;
  }

  function cancelSelection(): void {
    if (!canPlay.value || selected.value === null) {
      return;
    }
    selected.value = null;
    status.value = "已取消选择。";
  }

  async function activate(coordinate: Coordinate): Promise<void> {
    if (!canPlay.value) {
      return;
    }

    focused.value = coordinate;
    if (selected.value === null) {
      selected.value = coordinate;
      status.value = `已选择第 ${coordinate.row + 1} 行，第 ${coordinate.column + 1} 列。请选择相邻糖果。`;
      return;
    }

    if (coordinatesEqual(selected.value, coordinate)) {
      selected.value = null;
      status.value = "已取消选择。";
      return;
    }

    if (!areAdjacent(selected.value, coordinate)) {
      selected.value = coordinate;
      status.value = `选择已移到第 ${coordinate.row + 1} 行，第 ${coordinate.column + 1} 列。`;
      return;
    }

    const from = selected.value;
    selected.value = null;
    await performSwap(from, coordinate);
  }

  async function swap(from: Coordinate, to: Coordinate): Promise<void> {
    if (
      !canPlay.value ||
      !isInBounds(board.value, from) ||
      !isInBounds(board.value, to) ||
      !areAdjacent(from, to)
    ) {
      return;
    }

    selected.value = null;
    focused.value = to;
    await performSwap(from, to);
  }

  async function performSwap(
    from: Coordinate,
    to: Coordinate,
  ): Promise<void> {
    const generation = ++animationGeneration;
    isBusy.value = true;
    sessionPhase.value = "resolving";
    activeSwap.value = { from, to };
    combo.value = 0;

    try {
      const swapResult = executeSwap(board.value, from, to, random);

      if (swapResult.kind === "invalid") {
        status.value = "这两颗糖果不能交换。";
        return;
      }

      if (swapResult.kind === "no-match") {
        phase.value = "invalid";
        invalidKeys.value = new Set([
          coordinateKey(swapResult.swap.from),
          coordinateKey(swapResult.swap.to),
        ]);
        status.value = "没有连成三个，交换已复位。";
        await waitForPhase(260, generation);
        return;
      }

      remainingMoves.value = Math.max(0, remainingMoves.value - 1);
      const firstRound = swapResult.cascades[0];
      if (!firstRound) {
        status.value = "棋盘没有可展示的结算轮次，请重新开始。";
        return;
      }

      visualBoard.value = firstRound.before;
      phase.value = "swapping";
      status.value = "交换成功，正在检查连线。";
      if (!(await waitForPhase(140, generation))) {
        return;
      }

      for (const round of swapResult.cascades) {
        visualBoard.value = round.before;
        matchedKeys.value = new Set(
          round.matches.coordinates.map(coordinateKey),
        );
        movedKeys.value = new Set();
        spawnedKeys.value = new Set();
        phase.value = "clearing";

        const roundScore = scoreCascadeRound(round, sessionConfig);
        score.value = safeAdd(score.value, roundScore.total);
        combo.value = round.index;
        bestCombo.value = Math.max(bestCombo.value, round.index);
        status.value =
          round.index === 1
            ? `连成 ${round.matches.coordinates.length} 枚，获得 ${roundScore.total} 分。`
            : `第 ${round.index} 轮连锁，获得 ${roundScore.total} 分。`;
        if (!(await waitForPhase(160, generation))) {
          return;
        }

        matchedKeys.value = new Set();
        movedKeys.value = new Set(
          round.moved.map((movement) => coordinateKey(movement.to)),
        );
        spawnedKeys.value = new Set(
          round.spawned.map((spawn) => coordinateKey(spawn.to)),
        );
        visualBoard.value = round.after;
        phase.value = "settling";
        status.value = "糖果下落并补充中。";
        if (!(await waitForPhase(180, generation))) {
          return;
        }
      }

      if (swapResult.playability.kind !== "unchanged") {
        clearAnimationMarkers();
        visualBoard.value = swapResult.board;
        phase.value = "shuffling";
        status.value =
          swapResult.playability.kind === "shuffled"
            ? "没有可用交换，棋盘已重新排列。"
            : "没有可用交换，棋盘已重新生成。";
        if (!(await waitForPhase(220, generation))) {
          return;
        }
      }

      board.value = swapResult.board;
      visualBoard.value = swapResult.board;
      resolvedMoves.value += 1;

      if (score.value >= sessionConfig.targetScore) {
        finishSession("won");
      } else if (remainingMoves.value === 0) {
        finishSession("lost");
      } else {
        status.value =
          swapResult.cascades.length > 1
            ? `${swapResult.cascades.length} 轮连锁完成，当前 ${score.value} 分。`
            : `消除完成，当前 ${score.value} 分。`;
      }
    } catch {
      visualBoard.value = board.value;
      status.value = "棋盘暂时无法继续，请重新开始一局。";
    } finally {
      if (generation === animationGeneration) {
        clearAnimationMarkers();
        phase.value = "idle";
        isBusy.value = false;
        if (sessionPhase.value === "resolving") {
          sessionPhase.value = "playing";
        }
      }
    }
  }

  function finishSession(outcome: GameOutcome): void {
    if (
      sessionPhase.value === "won" ||
      sessionPhase.value === "lost"
    ) {
      return;
    }

    const completedAt = now().toISOString();
    const recorded = recordCompletedGame(
      progress.value,
      {
        playerName: playerName.value,
        score: score.value,
        bestCombo: bestCombo.value,
        completedAt,
        outcome,
      },
      sessionConfig,
    );
    progress.value = recorded.progress;
    saveLocalProgress(storage, recorded.progress);
    sessionPhase.value = outcome;
    result.value = {
      outcome,
      playerName: playerName.value,
      score: score.value,
      targetScore: sessionConfig.targetScore,
      remainingMoves: remainingMoves.value,
      bestCombo: bestCombo.value,
      bestScore: recorded.progress.bestScore,
      isNewBest: recorded.isNewBest,
      rank: recorded.rank,
    };
    status.value =
      outcome === "won"
        ? `${playerName.value} 达成目标，本局完成！`
        : `${playerName.value} 的步数已用完，本局完成。`;
  }

  function resetSessionState(): void {
    score.value = 0;
    remainingMoves.value = sessionConfig.initialMoves;
    combo.value = 0;
    bestCombo.value = 0;
    resolvedMoves.value = 0;
    result.value = null;
  }

  function prepareBoard(): void {
    animationGeneration += 1;
    const next = generateBoard(DEFAULT_ENGINE_CONFIG, random).board;
    board.value = next;
    visualBoard.value = next;
    selected.value = null;
    focused.value = { row: 0, column: 0 };
    restartConfirmVisible.value = false;
    isBusy.value = false;
    phase.value = "idle";
    clearAnimationMarkers();
    resetSessionState();
  }

  function startGame(input: string) {
    const validation = validatePlayerName(input);
    if (!validation.ok) {
      return validation;
    }

    playerName.value = validation.playerName;
    prepareBoard();
    sessionPhase.value = "playing";
    status.value = `${playerName.value}，选择相邻糖果开始。`;
    return validation;
  }

  function startNextGame(): void {
    if (playerName.value.length === 0) {
      return;
    }
    prepareBoard();
    sessionPhase.value = "playing";
    status.value = `${playerName.value}，新棋盘已准备好。`;
  }

  function changePlayer(): void {
    prepareBoard();
    playerName.value = "";
    sessionPhase.value = "awaiting-player";
    status.value = "请输入姓名后开始游戏。";
  }

  function requestRestart(): void {
    if (!canPlay.value) {
      return;
    }
    restartConfirmVisible.value = true;
  }

  function cancelRestart(): void {
    restartConfirmVisible.value = false;
  }

  function confirmRestart(): void {
    startNextGame();
  }

  function showInstructions(): void {
    instructionsVisible.value = true;
  }

  function dismissInstructions(): void {
    instructionsVisible.value = false;
  }

  function setLeaderboardPeriod(period: LeaderboardPeriod): void {
    leaderboardPeriod.value = period;
  }

  function dispose(): void {
    animationGeneration += 1;
  }

  return {
    board,
    visualBoard,
    selected,
    focused,
    phase,
    sessionPhase,
    playerName,
    status,
    isBusy,
    canPlay,
    matchedKeys,
    invalidKeys,
    movedKeys,
    spawnedKeys,
    activeSwap,
    instructionsVisible,
    restartConfirmVisible,
    resolvedMoves,
    hasProgress,
    score,
    remainingMoves,
    combo,
    bestCombo,
    bestScore,
    hudState,
    leaderboard,
    leaderboardPeriod,
    result,
    sessionConfig,
    activate,
    swap,
    setFocused,
    cancelSelection,
    startGame,
    startNextGame,
    changePlayer,
    requestRestart,
    cancelRestart,
    confirmRestart,
    showInstructions,
    dismissInstructions,
    setLeaderboardPeriod,
    dispose,
  };
}
