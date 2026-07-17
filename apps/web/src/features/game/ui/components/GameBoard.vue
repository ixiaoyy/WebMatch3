<script setup lang="ts">
import { nextTick, watch } from "vue";
import type { ComponentPublicInstance, StyleValue } from "vue";

import type {
  Board,
  Coordinate,
  Swap,
} from "@/features/game/engine";

import {
  coordinateKey,
  coordinatesEqual,
  getTileAriaLabel,
  moveCoordinate,
  type FocusDirection,
  type GamePhase,
} from "../game-ui";
import GameTile from "./GameTile.vue";

const props = defineProps<{
  board: Board;
  selected: Coordinate | null;
  focused: Coordinate;
  phase: GamePhase;
  busy: boolean;
  disabled: boolean;
  matchedKeys: ReadonlySet<string>;
  invalidKeys: ReadonlySet<string>;
  movedKeys: ReadonlySet<string>;
  spawnedKeys: ReadonlySet<string>;
  activeSwap: Swap | null;
}>();

const emit = defineEmits<{
  activate: [coordinate: Coordinate];
  focusCoordinate: [coordinate: Coordinate];
  cancel: [];
}>();

const cellElements = new Map<string, HTMLButtonElement>();

function setCellElement(
  coordinate: Coordinate,
  element: Element | ComponentPublicInstance | null,
): void {
  const key = coordinateKey(coordinate);
  if (element instanceof HTMLButtonElement) {
    cellElements.set(key, element);
  } else {
    cellElements.delete(key);
  }
}

function focusCell(coordinate: Coordinate): void {
  cellElements.get(coordinateKey(coordinate))?.focus();
}

function handleActivate(coordinate: Coordinate): void {
  if (props.busy || props.disabled) {
    return;
  }
  emit("focusCoordinate", coordinate);
  emit("activate", coordinate);
}

async function handleKeydown(
  event: KeyboardEvent,
  coordinate: Coordinate,
): Promise<void> {
  const directionByKey: Partial<Record<string, FocusDirection>> = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  };
  const direction = directionByKey[event.key];

  if (direction) {
    event.preventDefault();
    const next = moveCoordinate(
      coordinate,
      direction,
      props.board.rows,
      props.board.columns,
    );
    emit("focusCoordinate", next);
    await nextTick();
    focusCell(next);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleActivate(coordinate);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    emit("cancel");
  }
}

function cellClasses(coordinate: Coordinate): Record<string, boolean> {
  const key = coordinateKey(coordinate);
  return {
    "game-board__cell--selected": coordinatesEqual(props.selected, coordinate),
    "game-board__cell--matched": props.matchedKeys.has(key),
    "game-board__cell--invalid": props.invalidKeys.has(key),
    "game-board__cell--moved": props.movedKeys.has(key),
    "game-board__cell--spawned": props.spawnedKeys.has(key),
  };
}

function cellStyle(coordinate: Coordinate): StyleValue {
  if (props.phase !== "swapping" || props.activeSwap === null) {
    return undefined;
  }

  const { from, to } = props.activeSwap;
  if (coordinatesEqual(from, coordinate)) {
    return {
      "--swap-x": `${to.column - from.column}00%`,
      "--swap-y": `${to.row - from.row}00%`,
    };
  }
  if (coordinatesEqual(to, coordinate)) {
    return {
      "--swap-x": `${from.column - to.column}00%`,
      "--swap-y": `${from.row - to.row}00%`,
    };
  }
  return undefined;
}

watch(
  () => props.busy,
  async (busy, wasBusy) => {
    if (!busy && wasBusy) {
      await nextTick();
      focusCell(props.focused);
    }
  },
);
</script>

<template>
  <div
    class="game-board"
    :class="`game-board--${phase}`"
    :style="{ '--board-columns': board.columns }"
    role="grid"
    aria-label="三消棋盘，使用方向键移动，回车或空格选择"
    :aria-rowcount="board.rows"
    :aria-colcount="board.columns"
    :aria-busy="busy"
    :data-phase="phase"
  >
    <div
      v-for="(row, rowIndex) in board.cells"
      :key="rowIndex"
      class="game-board__row"
      role="row"
      :aria-rowindex="rowIndex + 1"
    >
      <button
        v-for="(tile, columnIndex) in row"
        :key="tile.id"
        :ref="(element) => setCellElement({ row: rowIndex, column: columnIndex }, element)"
        class="game-board__cell"
        :class="cellClasses({ row: rowIndex, column: columnIndex })"
        :style="cellStyle({ row: rowIndex, column: columnIndex })"
        type="button"
        role="gridcell"
        :tabindex="coordinatesEqual(focused, { row: rowIndex, column: columnIndex }) ? 0 : -1"
        :aria-colindex="columnIndex + 1"
        :aria-selected="coordinatesEqual(selected, { row: rowIndex, column: columnIndex })"
        :aria-disabled="busy || disabled"
        :aria-label="getTileAriaLabel(tile.type, { row: rowIndex, column: columnIndex }, coordinatesEqual(selected, { row: rowIndex, column: columnIndex }))"
        @click="handleActivate({ row: rowIndex, column: columnIndex })"
        @focus="emit('focusCoordinate', { row: rowIndex, column: columnIndex })"
        @keydown="handleKeydown($event, { row: rowIndex, column: columnIndex })"
      >
        <GameTile :type="tile.type" />
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss">
.game-board {
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  padding: clamp(4px, 0.9vw, 8px);
  gap: clamp(2px, 0.45vw, 5px);
  border-radius: var(--panel-radius);
  background: var(--board);
  box-shadow:
    inset 0 1px rgb(255 255 255 / 12%),
    inset 0 -10px 24px rgb(11 18 48 / 18%);
  touch-action: manipulation;

  &[aria-busy="true"] {
    cursor: progress;
  }

  &__row {
    display: grid;
    min-height: 0;
    grid-template-columns: repeat(var(--board-columns), minmax(0, 1fr));
    gap: inherit;
  }

  &__cell {
    position: relative;
    display: grid;
    min-width: 0;
    min-height: 0;
    padding: 1%;
    overflow: visible;
    place-items: center;
    border: 0;
    border-radius: var(--tile-radius);
    background: var(--board-cell);
    cursor: pointer;
    isolation: isolate;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 140ms ease,
      box-shadow 140ms ease,
      transform 140ms cubic-bezier(0.22, 1, 0.36, 1);

    &::after {
      position: absolute;
      z-index: 1;
      inset: 2px;
      border: 2px solid transparent;
      border-radius: calc(var(--tile-radius) - 2px);
      content: "";
      pointer-events: none;
      transition:
        border-color 120ms ease,
        box-shadow 120ms ease,
        transform 120ms ease;
    }

    &:hover:not([aria-disabled="true"])::after {
      border-color: rgb(255 255 255 / 44%);
    }

    &:focus-visible {
      z-index: 5;
      outline: 3px solid var(--focus);
      outline-offset: -2px;
    }

    &[aria-disabled="true"] {
      cursor: wait;
    }
  }

  &__cell--selected::after {
    border-color: #fff;
    box-shadow:
      0 0 0 2px var(--primary),
      inset 0 0 0 1px rgb(255 255 255 / 72%);
    transform: scale(0.94);
  }

  &__cell--selected :deep(.game-tile) {
    transform: translateY(-3px) scale(1.04);
  }

  &__cell--matched :deep(.game-tile) {
    animation: tile-clear 160ms ease-in forwards;
  }

  &__cell--invalid :deep(.game-tile) {
    animation: tile-invalid 260ms ease-in-out;
  }

  &__cell--invalid::after {
    border-color: #ff96a7;
    border-style: dashed;
    box-shadow: inset 0 0 0 2px rgb(182 61 82 / 40%);
  }

  &__cell--moved :deep(.game-tile) {
    animation: tile-settle 180ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
  }

  &__cell--spawned :deep(.game-tile) {
    animation: tile-spawn 180ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
  }

  &--swapping &__cell[style] :deep(.game-tile) {
    animation: tile-swap 140ms ease-out;
  }

  &--shuffling :deep(.game-tile) {
    animation: tile-shuffle 220ms ease-in-out;
  }
}

@keyframes tile-swap {
  from {
    transform: translate(var(--swap-x), var(--swap-y));
  }
}

@keyframes tile-clear {
  55% {
    opacity: 1;
    transform: scale(1.16) rotate(5deg);
  }
  to {
    opacity: 0;
    transform: scale(0.12) rotate(-12deg);
  }
}

@keyframes tile-invalid {
  20%,
  60% {
    transform: translateX(-8%);
  }
  40%,
  80% {
    transform: translateX(8%);
  }
}

@keyframes tile-settle {
  from {
    transform: translateY(-28%);
  }
  70% {
    transform: translateY(5%);
  }
}

@keyframes tile-spawn {
  from {
    opacity: 0;
    transform: translateY(-65%) scale(0.75);
  }
}

@keyframes tile-shuffle {
  45% {
    opacity: 0.35;
    transform: rotate(8deg) scale(0.82);
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-board__cell :deep(.game-tile) {
    animation-name: none !important;
  }

  .game-board__cell--matched::after,
  .game-board__cell--invalid::after,
  .game-board__cell--spawned::after {
    border-color: var(--focus);
    background: rgb(255 242 168 / 16%);
  }
}
</style>
