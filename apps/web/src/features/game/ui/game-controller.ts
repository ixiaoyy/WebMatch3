import { computed, ref, shallowRef } from "vue";

import {
  areAdjacent,
  DEFAULT_ENGINE_CONFIG,
  executeSwap,
  generateBoard,
  type Board,
  type Coordinate,
  type RandomSource,
  type Swap,
} from "@/features/game/engine";

import { coordinateKey, coordinatesEqual, type GamePhase } from "./game-ui";

export type Wait = (duration: number) => Promise<void>;

export interface GameControllerOptions {
  readonly random?: RandomSource;
  readonly wait?: Wait;
  readonly reducedMotion?: boolean;
}

const waitFor: Wait = (duration) =>
  new Promise((resolve) => window.setTimeout(resolve, duration));

export function createGameController(options: GameControllerOptions = {}) {
  const random = options.random ?? Math.random;
  const wait = options.wait ?? waitFor;
  const reducedMotion = options.reducedMotion ?? false;
  const initial = generateBoard(DEFAULT_ENGINE_CONFIG, random).board;

  const board = shallowRef<Board>(initial);
  const visualBoard = shallowRef<Board>(initial);
  const selected = shallowRef<Coordinate | null>(null);
  const focused = shallowRef<Coordinate>({ row: 0, column: 0 });
  const phase = ref<GamePhase>("idle");
  const status = ref("选择一枚印记，再选择它旁边的一枚完成交换。");
  const isBusy = ref(false);
  const matchedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const invalidKeys = shallowRef<ReadonlySet<string>>(new Set());
  const movedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const spawnedKeys = shallowRef<ReadonlySet<string>>(new Set());
  const activeSwap = shallowRef<Swap | null>(null);
  const instructionsVisible = ref(true);
  const restartConfirmVisible = ref(false);
  const resolvedMoves = ref(0);
  let animationGeneration = 0;

  const hasProgress = computed(() => resolvedMoves.value > 0);

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
    if (isBusy.value || selected.value === null) {
      return;
    }
    selected.value = null;
    status.value = "已取消选择。";
  }

  async function activate(coordinate: Coordinate): Promise<void> {
    focused.value = coordinate;
    if (isBusy.value) {
      return;
    }

    if (selected.value === null) {
      selected.value = coordinate;
      status.value = `已选择第 ${coordinate.row + 1} 行，第 ${coordinate.column + 1} 列。请选择相邻印记。`;
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

  async function performSwap(
    from: Coordinate,
    to: Coordinate,
  ): Promise<void> {
    const generation = ++animationGeneration;
    isBusy.value = true;
    activeSwap.value = { from, to };

    try {
      const result = executeSwap(board.value, from, to, random);

      if (result.kind === "invalid") {
        status.value = "这两枚印记不能交换。";
        return;
      }

      if (result.kind === "no-match") {
        phase.value = "invalid";
        invalidKeys.value = new Set([
          coordinateKey(result.swap.from),
          coordinateKey(result.swap.to),
        ]);
        status.value = "没有连成三个，交换已复位。";
        await waitForPhase(260, generation);
        return;
      }

      const firstRound = result.cascades[0];
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

      for (const round of result.cascades) {
        visualBoard.value = round.before;
        matchedKeys.value = new Set(
          round.matches.coordinates.map(coordinateKey),
        );
        movedKeys.value = new Set();
        spawnedKeys.value = new Set();
        phase.value = "clearing";
        status.value =
          round.index === 0
            ? `连成 ${round.matches.coordinates.length} 枚，正在消除。`
            : `第 ${round.index + 1} 轮连锁，正在消除。`;
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
        status.value = "印记下落并补充中。";
        if (!(await waitForPhase(180, generation))) {
          return;
        }
      }

      if (result.playability.kind !== "unchanged") {
        clearAnimationMarkers();
        visualBoard.value = result.board;
        phase.value = "shuffling";
        status.value =
          result.playability.kind === "shuffled"
            ? "没有可用交换，棋盘已重新排列。"
            : "没有可用交换，棋盘已重新生成。";
        if (!(await waitForPhase(220, generation))) {
          return;
        }
      }

      board.value = result.board;
      visualBoard.value = result.board;
      resolvedMoves.value += 1;
      status.value =
        result.cascades.length > 1
          ? `${result.cascades.length} 轮连锁完成，继续寻找连线。`
          : "消除完成，继续寻找连线。";
    } catch {
      visualBoard.value = board.value;
      status.value = "棋盘暂时无法继续，请重新开始一局。";
    } finally {
      if (generation === animationGeneration) {
        clearAnimationMarkers();
        phase.value = "idle";
        isBusy.value = false;
      }
    }
  }

  function resetBoard(): void {
    animationGeneration += 1;
    const next = generateBoard(DEFAULT_ENGINE_CONFIG, random).board;
    board.value = next;
    visualBoard.value = next;
    selected.value = null;
    focused.value = { row: 0, column: 0 };
    resolvedMoves.value = 0;
    restartConfirmVisible.value = false;
    isBusy.value = false;
    phase.value = "idle";
    clearAnimationMarkers();
    status.value = "新棋盘已准备好。选择相邻印记开始。";
  }

  function requestRestart(): void {
    if (isBusy.value) {
      return;
    }
    if (hasProgress.value) {
      restartConfirmVisible.value = true;
      return;
    }
    resetBoard();
  }

  function cancelRestart(): void {
    restartConfirmVisible.value = false;
  }

  function confirmRestart(): void {
    resetBoard();
  }

  function showInstructions(): void {
    instructionsVisible.value = true;
  }

  function dismissInstructions(): void {
    instructionsVisible.value = false;
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
    status,
    isBusy,
    matchedKeys,
    invalidKeys,
    movedKeys,
    spawnedKeys,
    activeSwap,
    instructionsVisible,
    restartConfirmVisible,
    resolvedMoves,
    hasProgress,
    activate,
    setFocused,
    cancelSelection,
    requestRestart,
    cancelRestart,
    confirmRestart,
    showInstructions,
    dismissInstructions,
    dispose,
  };
}