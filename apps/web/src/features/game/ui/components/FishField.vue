<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import {
  getBlockerIds,
  getSelectablePieces,
  type PilePiece,
  type Point,
} from "../../engine";
import type { FocusDirection } from "../game-ui";
import {
  findNearestRevealedPiece,
  getRevealedPieceIds,
  moveSpotlight,
  type SpotlightDirection,
  type SpotlightMode,
} from "../spotlight";
import FishPiece from "./FishPiece.vue";

const props = defineProps<{
  pieces: readonly PilePiece[];
  feedable: boolean;
  disabled: boolean;
  transitioning: boolean;
  away: boolean;
}>();

const emit = defineEmits<{
  activate: [pieceId: string];
  feed: [pieceId: string];
  revealedChange: [pieceIds: readonly string[]];
  dragStart: [pieceId: string];
  dragMove: [pieceId: string, clientX: number, clientY: number];
  dragEnd: [pieceId: string, clientX: number, clientY: number];
}>();

const cluster = ref<HTMLElement | null>(null);
const focusedId = ref<string | null>(null);
const light = ref<Point | null>(null);
const spotlightMode = ref<SpotlightMode>("inactive");
const draggedPieceId = ref<string | null>(null);
const pointerInside = ref(false);
const focusInside = ref(false);
let searchPointerId: number | null = null;
let afterglowHandle: ReturnType<typeof setTimeout> | null = null;

const selectable = computed(() => getSelectablePieces(props.pieces));
const revealedPieceIds = computed(() => getRevealedPieceIds(
  props.pieces,
  light.value,
  draggedPieceId.value,
));

watch(
  selectable,
  (pieces) => {
    if (!pieces.some((piece) => piece.id === focusedId.value)) {
      focusedId.value = pieces[0]?.id ?? null;
    }
  },
  { immediate: true },
);

watch(
  revealedPieceIds,
  (ids) => emit("revealedChange", [...ids]),
  { immediate: true },
);

watch(() => props.away, (away) => {
  if (!away) return;
  clearAfterglow();
  light.value = null;
  spotlightMode.value = "inactive";
  draggedPieceId.value = null;
  searchPointerId = null;
});

function clearAfterglow(): void {
  if (afterglowHandle !== null) {
    globalThis.clearTimeout(afterglowHandle);
    afterglowHandle = null;
  }
}

function startAfterglow(): void {
  clearAfterglow();
  spotlightMode.value = "afterglow";
  afterglowHandle = globalThis.setTimeout(() => {
    afterglowHandle = null;
    if (!draggedPieceId.value) {
      light.value = null;
      spotlightMode.value = "inactive";
    }
  }, 680);
}

function pointFromClient(clientX: number, clientY: number): Point | null {
  const bounds = cluster.value?.getBoundingClientRect();
  if (!bounds || bounds.width === 0 || bounds.height === 0) return null;
  return {
    x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
  };
}

function moveLight(clientX: number, clientY: number): void {
  const point = pointFromClient(clientX, clientY);
  if (!point) return;
  clearAfterglow();
  light.value = point;
  if (!draggedPieceId.value) spotlightMode.value = "searching";
}

function focusPiece(pieceId: string): void {
  focusedId.value = pieceId;
  void nextTick(() => {
    cluster.value
      ?.querySelector<HTMLButtonElement>(`[data-piece-id="${pieceId}"]`)
      ?.focus();
  });
}

function revealFocusedPiece(pieceId: string): void {
  focusedId.value = pieceId;
  const piece = props.pieces.find((candidate) => candidate.id === pieceId);
  if (piece) {
    light.value = piece.pile;
    spotlightMode.value = "searching";
  }
}

function navigate(pieceId: string, event: KeyboardEvent): void {
  const directionByKey: Readonly<Record<string, FocusDirection | undefined>> = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  };
  const direction = directionByKey[event.key];
  if (!direction) return;
  event.preventDefault();
  const current = selectable.value.find((piece) => piece.id === pieceId);
  if (!current) return;
  const candidates = selectable.value.filter((piece) => piece.id !== pieceId);
  const directional = candidates.filter((piece) => {
    if (direction === "left") return piece.pile.x < current.pile.x;
    if (direction === "right") return piece.pile.x > current.pile.x;
    if (direction === "up") return piece.pile.y < current.pile.y;
    return piece.pile.y > current.pile.y;
  });
  const target = directional.sort((first, second) =>
    Math.hypot(first.pile.x - current.pile.x, first.pile.y - current.pile.y) -
    Math.hypot(second.pile.x - current.pile.x, second.pile.y - current.pile.y)
  )[0];
  if (target) focusPiece(target.id);
}

function onSurfaceKeydown(event: KeyboardEvent): void {
  if (event.target !== cluster.value) return;
  const directionByKey: Readonly<Record<string, SpotlightDirection | undefined>> = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  };
  const direction = directionByKey[event.key];
  if (direction) {
    event.preventDefault();
    light.value = moveSpotlight(light.value, direction, event.shiftKey);
    spotlightMode.value = "searching";
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && light.value) {
    event.preventDefault();
    const target = findNearestRevealedPiece(
      selectable.value,
      revealedPieceIds.value,
      light.value,
    );
    if (target) emit("activate", target.id);
  }
}

function onPointerDown(event: PointerEvent): void {
  if (props.away || props.disabled) return;
  if (event.target !== cluster.value || event.pointerType === "mouse") return;
  searchPointerId = event.pointerId;
  cluster.value?.setPointerCapture(event.pointerId);
  moveLight(event.clientX, event.clientY);
}

function onPointerMove(event: PointerEvent): void {
  if (props.away || props.disabled) return;
  if (event.pointerType === "mouse" || searchPointerId === event.pointerId) {
    pointerInside.value = true;
    moveLight(event.clientX, event.clientY);
  }
}

function onPointerEnd(event: PointerEvent): void {
  if (searchPointerId !== event.pointerId) return;
  if (cluster.value?.hasPointerCapture(event.pointerId)) {
    cluster.value.releasePointerCapture(event.pointerId);
  }
  searchPointerId = null;
  pointerInside.value = false;
  startAfterglow();
}

function onPointerLeave(): void {
  pointerInside.value = false;
  if (!focusInside.value && !draggedPieceId.value) {
    light.value = null;
    spotlightMode.value = "inactive";
  }
}

function onFocusIn(): void {
  focusInside.value = true;
  if (!light.value) {
    light.value = { x: 0.5, y: 0.45 };
    spotlightMode.value = "searching";
  }
}

function onFocusOut(event: FocusEvent): void {
  if (!cluster.value?.contains(event.relatedTarget as Node | null)) {
    focusInside.value = false;
    if (!pointerInside.value && !draggedPieceId.value) {
      light.value = null;
      spotlightMode.value = "inactive";
    }
  }
}

function onDragStart(pieceId: string): void {
  draggedPieceId.value = pieceId;
  spotlightMode.value = "dragging";
  emit("dragStart", pieceId);
}

function onDragMove(pieceId: string, clientX: number, clientY: number): void {
  moveLight(clientX, clientY);
  spotlightMode.value = "dragging";
  emit("dragMove", pieceId, clientX, clientY);
}

function onDragEnd(pieceId: string, clientX: number, clientY: number): void {
  draggedPieceId.value = null;
  startAfterglow();
  emit("dragEnd", pieceId, clientX, clientY);
}

onBeforeUnmount(clearAfterglow);
</script>

<template>
  <section
    ref="cluster"
    class="fish-field"
    :data-spotlight="spotlightMode"
    :data-transitioning="transitioning"
    :style="{
      '--light-x': light?.x ?? 0.5,
      '--light-y': light?.y ?? 0.45,
    }"
    tabindex="0"
    aria-label="小鱼搜索桌面。移动指针或用方向键移动探照灯，Enter选择显影小鱼。"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onSurfaceKeydown"
  >
    <FishPiece
      v-for="piece in pieces"
      :key="piece.id"
      :piece="piece"
      :blocked="getBlockerIds(pieces, piece.id).length > 0"
      :revealed="revealedPieceIds.has(piece.id)"
      :feedable="feedable"
      :disabled="disabled"
      :tab-index="piece.id === focusedId ? 0 : -1"
      @activate="emit('activate', $event)"
      @feed="emit('feed', $event)"
      @focus="revealFocusedPiece"
      @navigate="navigate"
      @drag-start="onDragStart"
      @drag-move="onDragMove"
      @drag-end="onDragEnd"
    />
  </section>
</template>

<style scoped lang="scss">
.fish-field {
  position: absolute;
  z-index: 3;
  inset: 0;
  outline: none;
  touch-action: none;

  &:focus-visible {
    outline: 2px solid rgb(60 85 126 / 38%);
    outline-offset: -5px;
  }

  &[data-transitioning="true"] {
    animation: fish-level-arrive 620ms var(--ease-out) both;
  }
}

@keyframes fish-level-arrive {
  0% {
    opacity: 0.48;
    filter: blur(2px) saturate(0.82);
  }

  100% {
    opacity: 1;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fish-field[data-transitioning="true"] {
    animation: none;
  }
}
</style>
