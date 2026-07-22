<script setup lang="ts">
import { computed, ref } from "vue";

import type { PilePiece, Point } from "../../engine";
import { getFishPresentation } from "../game-ui";

const props = defineProps<{
  piece: PilePiece;
  position: Point;
  revealed: boolean;
  feedable: boolean;
  tabIndex: number;
  disabled: boolean;
  separation: Point;
  slipDirection: -1 | 0 | 1;
}>();

const emit = defineEmits<{
  activate: [pieceId: string];
  feed: [pieceId: string];
  focus: [pieceId: string];
  navigate: [pieceId: string, event: KeyboardEvent];
  dragStart: [pieceId: string];
  dragMove: [pieceId: string, clientX: number, clientY: number];
  dragEnd: [pieceId: string, clientX: number, clientY: number];
}>();

const dragging = ref(false);
const dragX = ref(0);
const dragY = ref(0);
let pointerId: number | null = null;
let pointerStart = { x: 0, y: 0 };
let suppressClick = false;

const presentation = computed(() => getFishPresentation(props.piece.kind));
const label = computed(() =>
  props.feedable
    ? `${presentation.value.label}，Enter或空格放入托盘，按F喂给小猫`
    : `${presentation.value.label}，Enter或空格放入托盘；小猫正在休息，按F可听取提示`,
);

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  pointerId = event.pointerId;
  pointerStart = { x: event.clientX, y: event.clientY };
  dragX.value = 0;
  dragY.value = 0;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
  if (pointerId !== event.pointerId) return;
  const nextX = event.clientX - pointerStart.x;
  const nextY = event.clientY - pointerStart.y;
  if (!dragging.value && Math.hypot(nextX, nextY) < 7) return;
  if (!dragging.value) {
    dragging.value = true;
    emit("dragStart", props.piece.id);
  }
  event.preventDefault();
  dragX.value = nextX;
  dragY.value = nextY;
  emit("dragMove", props.piece.id, event.clientX, event.clientY);
}

function finishDrag(event: PointerEvent): void {
  if (pointerId !== event.pointerId) return;
  const wasDragging = dragging.value;
  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }
  pointerId = null;
  dragging.value = false;
  dragX.value = 0;
  dragY.value = 0;
  if (!wasDragging) return;
  suppressClick = true;
  emit("dragEnd", props.piece.id, event.clientX, event.clientY);
}

function cancelDrag(event: PointerEvent): void {
  if (pointerId !== event.pointerId) return;
  const wasDragging = dragging.value;
  pointerId = null;
  dragging.value = false;
  dragX.value = 0;
  dragY.value = 0;
  if (wasDragging) emit("dragEnd", props.piece.id, Number.NaN, Number.NaN);
}

function onClick(): void {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  emit("activate", props.piece.id);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    emit("feed", props.piece.id);
    return;
  }
  emit("navigate", props.piece.id, event);
}
</script>

<template>
  <button
    class="fish-piece"
    type="button"
    :data-piece-id="piece.id"
    :data-kind="piece.kind"
    :data-revealed="revealed"
    :data-dragging="dragging"
    :data-slipping="slipDirection !== 0"
    :disabled="disabled"
    :tabindex="tabIndex"
    :aria-label="label"
    aria-keyshortcuts="F"
    :style="{
      '--pile-x': position.x,
      '--pile-y': position.y,
      '--piece-rotation': `${piece.rotation}deg`,
      '--piece-scale': piece.scale,
      '--piece-layer': piece.layer,
      '--separation-x': `${separation.x}px`,
      '--separation-y': `${separation.y}px`,
      '--drag-x': `${dragX}px`,
      '--drag-y': `${dragY}px`,
      '--slip-x': `${slipDirection * 9}px`,
      '--slip-rotation': `${slipDirection * 3}deg`,
    }"
    @click="onClick"
    @focus="emit('focus', piece.id)"
    @keydown="onKeydown"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="finishDrag"
    @pointercancel="cancelDrag"
  >
    <img
      :src="presentation.assetUrl"
      alt=""
      width="512"
      height="512"
      draggable="false"
    />
  </button>
</template>

<style scoped lang="scss">
.fish-piece {
  --active-x: var(--pile-x);
  --active-y: var(--pile-y);
  position: absolute;
  z-index: calc(2 + var(--piece-layer));
  width: clamp(68px, 6.4vw, 88px);
  height: clamp(68px, 6.4vw, 88px);
  padding: 0;
  border: 0;
  border-radius: 44%;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  touch-action: none;
  left: calc(var(--active-x) * 100%);
  top: calc(var(--active-y) * 100%);
  transform:
    translate(
      calc(-50% + var(--separation-x)),
      calc(-50% + var(--separation-y))
    )
    rotate(var(--piece-rotation))
    scale(var(--piece-scale));
  transform-origin: 50% 72%;
  transition:
    left 520ms var(--ease-out),
    top 520ms var(--ease-out),
    transform 220ms var(--ease-out),
    filter 220ms ease,
    opacity 220ms ease;

  &[data-revealed="true"],
  &[data-dragging="true"] {
    opacity: 1;
  }

  &[data-revealed="true"]:not(:disabled),
  &[data-dragging="true"]:not(:disabled) {
    pointer-events: auto;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  &:hover:not(:disabled):not([data-dragging="true"]) {
    z-index: 8;
    transform:
      translate(
        calc(-50% + var(--separation-x)),
        calc(-54% + var(--separation-y))
      )
      rotate(var(--piece-rotation))
      scale(calc(var(--piece-scale) * 1.06));
    filter: drop-shadow(0 10px 12px rgb(78 87 126 / 19%));
  }

  &:focus-visible {
    z-index: 9;
    border-radius: 36%;
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  &[data-slipping="true"]:not([data-dragging="true"]) {
    animation: fish-nearby-slip 380ms var(--ease-out);
  }

  &[data-dragging="true"] {
    z-index: 20;
    cursor: grabbing;
    transform:
      translate(
        calc(-50% + var(--separation-x) + var(--drag-x)),
        calc(-50% + var(--separation-y) + var(--drag-y))
      )
      rotate(var(--piece-rotation))
      scale(calc(var(--piece-scale) * 1.06));
    filter: drop-shadow(0 13px 14px rgb(57 70 112 / 24%));
    transition: none;
  }
}

@keyframes fish-nearby-slip {
  0%,
  100% {
    transform:
      translate(
        calc(-50% + var(--separation-x)),
        calc(-50% + var(--separation-y))
      )
      rotate(var(--piece-rotation))
      scale(var(--piece-scale));
  }

  52% {
    transform:
      translate(
        calc(-50% + var(--separation-x) + var(--slip-x)),
        calc(-50% + var(--separation-y) + 10px)
      )
      rotate(calc(var(--piece-rotation) + var(--slip-rotation)))
      scale(calc(var(--piece-scale) * 0.98));
    filter: drop-shadow(0 6px 7px rgb(57 70 112 / 16%));
  }
}

@media (max-width: 620px) {
  .fish-piece {
    width: clamp(62px, 20vw, 78px);
    height: clamp(62px, 20vw, 78px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fish-piece {
    transition: none;
    animation: none !important;
  }
}
</style>
