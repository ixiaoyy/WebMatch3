<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import {
  getBlockerIds,
  getSelectablePieces,
  INITIAL_DISCOVERY_POINT,
  type PilePiece,
  type Point,
} from "../../engine";
import {
  getHigherOverlapCounts,
  type FocusDirection,
  type GameFeedback,
  type IntroPhase,
} from "../game-ui";
import {
  findNearestRevealedPiece,
  getRevealedPieceIds,
  isPointerTap,
  moveSpotlight,
  projectFieldPoint,
  unprojectFieldPoint,
  type FieldProjection,
  type SpotlightDirection,
  type SpotlightMode,
} from "../spotlight";
import FishPiece from "./FishPiece.vue";

const props = defineProps<{
  pieces: readonly PilePiece[];
  feedable: boolean;
  disabled: boolean;
  transitioning: boolean;
  loss: boolean;
  away: boolean;
  projection: FieldProjection;
  guidedPieceId: string | null;
  feedback: GameFeedback;
  introPhase: IntroPhase;
  introTargetIds: readonly string[];
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
const activeFocusedId = ref<string | null>(null);
const light = ref<Point | null>(null);
const spotlightMode = ref<SpotlightMode>("inactive");
const draggedPieceId = ref<string | null>(null);
const pointerInside = ref(false);
const focusInside = ref(false);
const slipDirections = ref<ReadonlyMap<string, -1 | 1>>(new Map());
let searchPointerId: number | null = null;
let searchPointerStart: Point | null = null;
let searchPointerMoved = false;
let afterglowHandle: ReturnType<typeof setTimeout> | null = null;
let slipHandle: ReturnType<typeof setTimeout> | null = null;

const selectable = computed(() => getSelectablePieces(props.pieces));
const higherOverlapCounts = computed(() => getHigherOverlapCounts(props.pieces));
const guidedPiece = computed(() =>
  props.away || !props.guidedPieceId
    ? null
    : props.pieces.find((piece) => piece.id === props.guidedPieceId) ?? null,
);
const guidedLight = computed(() => guidedPiece.value?.pile ?? null);
const revealedPieceIds = computed(() => {
  if (props.away) return new Set<string>();
  if (props.transitioning) return new Set(props.pieces.map((piece) => piece.id));

  const revealed = new Set(getRevealedPieceIds(
    props.pieces,
    props.introPhase === "idle" ? light.value : INITIAL_DISCOVERY_POINT,
    [
      activeFocusedId.value,
      draggedPieceId.value,
      guidedPiece.value?.id ?? null,
    ],
  ));
  return revealed;
});
const separationOffsets = computed(() => {
  const offsets = new Map<string, { x: number; y: number }>();
  for (const lowerPiece of props.pieces) {
    if (!revealedPieceIds.value.has(lowerPiece.id)) continue;
    for (const upperId of getBlockerIds(props.pieces, lowerPiece.id)) {
      if (!revealedPieceIds.value.has(upperId)) continue;
      const upperPiece = props.pieces.find((piece) => piece.id === upperId);
      if (!upperPiece) continue;
      let directionX = upperPiece.pile.x - lowerPiece.pile.x;
      let directionY = upperPiece.pile.y - lowerPiece.pile.y;
      const distance = Math.hypot(directionX, directionY);
      if (distance < 0.001) {
        directionX = upperPiece.id.length % 2 === 0 ? -1 : 1;
        directionY = 0.6;
      } else {
        directionX /= distance;
        directionY /= distance;
      }

      const lowerOffset = offsets.get(lowerPiece.id) ?? { x: 0, y: 0 };
      const upperOffset = offsets.get(upperPiece.id) ?? { x: 0, y: 0 };
      offsets.set(lowerPiece.id, {
        x: lowerOffset.x - directionX * 10,
        y: lowerOffset.y - directionY * 10,
      });
      offsets.set(upperPiece.id, {
        x: upperOffset.x + directionX * 22,
        y: upperOffset.y + directionY * 22,
      });
    }
  }

  for (const [pieceId, offset] of offsets) {
    const distance = Math.hypot(offset.x, offset.y);
    if (distance > 32) {
      offsets.set(pieceId, {
        x: offset.x / distance * 32,
        y: offset.y / distance * 32,
      });
    }
  }
  return offsets;
});
const projectedLight = computed(() => projectFieldPoint(
  props.introPhase === "idle"
    ? light.value ?? INITIAL_DISCOVERY_POINT
    : INITIAL_DISCOVERY_POINT,
  props.projection,
));
const guidedSpotlightStyle = computed(() => {
  if (!guidedLight.value) return null;
  const projected = projectFieldPoint(guidedLight.value, props.projection);
  return {
    "--active-light-x": projected.x,
    "--active-light-y": projected.y,
  };
});

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
  if (!away) {
    const activeElement = cluster.value?.ownerDocument.activeElement ?? null;
    const focusedPiece = findPieceElement(activeElement);
    const pieceId = focusedPiece?.dataset.pieceId;
    if (pieceId && cluster.value?.contains(focusedPiece)) {
      revealFocusedPiece(pieceId);
    }
    return;
  }
  clearAfterglow();
  clearNearbySlip();
  releaseSearchPointerCapture();
  light.value = null;
  spotlightMode.value = "inactive";
  draggedPieceId.value = null;
  activeFocusedId.value = null;
  pointerInside.value = false;
  focusInside.value = false;
});

function clearAfterglow(): void {
  if (afterglowHandle !== null) {
    globalThis.clearTimeout(afterglowHandle);
    afterglowHandle = null;
  }
}

function clearNearbySlip(): void {
  if (slipHandle !== null) {
    globalThis.clearTimeout(slipHandle);
    slipHandle = null;
  }
  slipDirections.value = new Map();
}

function showNearbySlip(pieceId: string): void {
  const selectedPiece = props.pieces.find((piece) => piece.id === pieceId);
  if (!selectedPiece) return;
  const upperIds = new Set(getBlockerIds(props.pieces, pieceId));
  const relatedPieces = props.pieces.filter((piece) =>
    piece.id !== pieceId &&
    (
      upperIds.has(piece.id) ||
      getBlockerIds(props.pieces, piece.id).includes(pieceId)
    )
  );
  if (relatedPieces.length === 0) return;

  clearNearbySlip();
  slipDirections.value = new Map(relatedPieces.map((piece, index) => {
    const horizontalDelta = piece.pile.x - selectedPiece.pile.x;
    const direction: -1 | 1 = Math.abs(horizontalDelta) < 0.008
      ? index % 2 === 0 ? -1 : 1
      : horizontalDelta < 0 ? -1 : 1;
    return [piece.id, direction];
  }));
  slipHandle = globalThis.setTimeout(() => {
    slipHandle = null;
    slipDirections.value = new Map();
  }, 380);
}

function onActivate(pieceId: string): void {
  showNearbySlip(pieceId);
  emit("activate", pieceId);
}

function onFeed(pieceId: string): void {
  showNearbySlip(pieceId);
  emit("feed", pieceId);
}

function releaseSearchPointerCapture(): void {
  if (
    searchPointerId !== null &&
    cluster.value?.hasPointerCapture(searchPointerId)
  ) {
    cluster.value.releasePointerCapture(searchPointerId);
  }
  searchPointerId = null;
  searchPointerStart = null;
  searchPointerMoved = false;
}

function findPieceElement(target: EventTarget | null): HTMLElement | null {
  const candidate = target as HTMLElement | null;
  if (!candidate || typeof candidate.closest !== "function") return null;
  return candidate.closest<HTMLElement>("[data-piece-id]");
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
  return unprojectFieldPoint({
    x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
  }, props.projection);
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
  if (props.away) return;
  focusedId.value = pieceId;
  activeFocusedId.value = pieceId;
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
  if (props.away || props.disabled) return;
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
  searchPointerStart = { x: event.clientX, y: event.clientY };
  searchPointerMoved = false;
  cluster.value?.setPointerCapture(event.pointerId);
  moveLight(event.clientX, event.clientY);
}

function onPointerMove(event: PointerEvent): void {
  if (props.away || props.disabled) return;
  if (event.pointerType === "mouse" || searchPointerId === event.pointerId) {
    if (
      searchPointerId === event.pointerId &&
      searchPointerStart &&
      !isPointerTap(searchPointerStart, {
        x: event.clientX,
        y: event.clientY,
      })
    ) {
      searchPointerMoved = true;
    }
    pointerInside.value = true;
    moveLight(event.clientX, event.clientY);
  }
}

function onPointerEnd(event: PointerEvent): void {
  if (searchPointerId !== event.pointerId) return;
  const shouldActivate = !searchPointerMoved && light.value !== null;
  const localLight = light.value;
  releaseSearchPointerCapture();
  pointerInside.value = false;
  if (shouldActivate && localLight) {
    const target = findNearestRevealedPiece(
      selectable.value,
      getRevealedPieceIds(selectable.value, localLight),
      localLight,
    );
    if (target) onActivate(target.id);
  }
  startAfterglow();
}

function onPointerCancel(event: PointerEvent): void {
  if (searchPointerId !== event.pointerId) return;
  releaseSearchPointerCapture();
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
    light.value = INITIAL_DISCOVERY_POINT;
    spotlightMode.value = "searching";
  }
}

function onFocusOut(event: FocusEvent): void {
  const nextPiece = findPieceElement(event.relatedTarget);
  activeFocusedId.value = nextPiece && cluster.value?.contains(nextPiece)
    ? nextPiece.dataset.pieceId ?? null
    : null;
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

onBeforeUnmount(() => {
  clearAfterglow();
  clearNearbySlip();
  releaseSearchPointerCapture();
});
</script>

<template>
  <section
    ref="cluster"
    class="fish-field"
    :data-spotlight="spotlightMode"
    :data-transitioning="transitioning"
    :data-loss="loss"
    :data-feedback="feedback"
    :data-intro="introPhase"
    :style="{
      '--light-x': projectedLight.x,
      '--light-y': projectedLight.y,
    }"
    tabindex="0"
    aria-label="小鱼搜索桌面。移动指针或用方向键移动探照灯，Enter选择显影小鱼。"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onSurfaceKeydown"
  >
    <div
      class="fish-field__spotlight fish-field__spotlight--pointer"
      aria-hidden="true"
    >
      <span class="fish-field__spotlight-lens" />
    </div>

    <div
      v-if="guidedSpotlightStyle"
      class="fish-field__spotlight fish-field__spotlight--guided"
      :style="guidedSpotlightStyle"
      aria-hidden="true"
    >
      <span class="fish-field__spotlight-lens" />
    </div>

    <TransitionGroup name="fish-field-piece">
      <FishPiece
        v-for="piece in pieces"
        :key="piece.id"
        :piece="piece"
        :position="projectFieldPoint(piece.pile, projection)"
        :revealed="revealedPieceIds.has(piece.id)"
        :feedable="feedable"
        :higher-overlap-count="higherOverlapCounts.get(piece.id) ?? 0"
        :disabled="disabled"
        :separation="separationOffsets.get(piece.id) ?? { x: 0, y: 0 }"
        :slip-direction="slipDirections.get(piece.id) ?? 0"
        :intro-target="
          introPhase === 'targets' && introTargetIds.includes(piece.id)
        "
        :arriving="transitioning"
        :tab-index="piece.id === focusedId ? 0 : -1"
        @activate="onActivate"
        @feed="onFeed"
        @focus="revealFocusedPiece"
        @navigate="navigate"
        @drag-start="onDragStart"
        @drag-move="onDragMove"
        @drag-end="onDragEnd"
      />
    </TransitionGroup>
  </section>
</template>

<style scoped lang="scss">
.fish-field {
  --spotlight-radius-x: 12%;
  --spotlight-radius-y: 17%;
  --spotlight-width: 24%;
  --spotlight-height: 34%;

  position: absolute;
  z-index: 3;
  inset: 0;
  isolation: isolate;
  outline: none;
  touch-action: none;

  &:focus-visible {
    outline: 2px solid rgb(60 85 126 / 38%);
    outline-offset: -5px;
  }

  &[data-loss="true"] {
    animation: fish-field-loss 1.2s var(--ease-out) both;
  }

  &__spotlight {
    --active-light-x: var(--light-x);
    --active-light-y: var(--light-y);

    position: absolute;
    z-index: 1;
    inset: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;

    &::before,
    &::after {
      position: absolute;
      inset: 0;
      content: "";
    }

    &::before {
      display: none;
    }

    &::after {
      background: radial-gradient(
        ellipse var(--spotlight-radius-x) var(--spotlight-radius-y)
          at calc(var(--active-light-x) * 100%) calc(var(--active-light-y) * 100%),
        rgb(255 251 230 / 32%) 0%,
        rgb(244 247 255 / 12%) 58%,
        transparent 100%
      );
    }

    &--guided {
      opacity: 1;

      &::before {
        display: none;
      }

      &::after {
        background: radial-gradient(
          ellipse var(--spotlight-radius-x) var(--spotlight-radius-y)
            at calc(var(--active-light-x) * 100%) calc(var(--active-light-y) * 100%),
          rgb(255 247 194 / 46%) 0%,
          rgb(255 238 170 / 20%) 58%,
          transparent 100%
        );
      }

      .fish-field__spotlight-lens {
        border-color: rgb(255 245 198 / 58%);
        box-shadow:
          inset 0 0 30px rgb(255 245 196 / 25%),
          0 0 24px rgb(255 225 145 / 24%);
      }
    }
  }

  &__spotlight-lens {
    position: absolute;
    z-index: 1;
    left: calc(var(--active-light-x) * 100%);
    top: calc(var(--active-light-y) * 100%);
    width: var(--spotlight-width);
    height: var(--spotlight-height);
    border: 1px solid rgb(255 252 231 / 10%);
    border-radius: 50%;
    box-shadow:
      inset 0 0 38px rgb(255 250 220 / 8%),
      0 0 12px rgb(216 229 255 / 7%);
    transform: translate(-50%, -50%);
  }

  &[data-spotlight="searching"] &__spotlight--pointer,
  &[data-spotlight="dragging"] &__spotlight--pointer,
  &[data-spotlight="afterglow"] &__spotlight--pointer {
    opacity: 1;
  }

  &[data-intro="scan"] &__spotlight--pointer,
  &[data-intro="targets"] &__spotlight--pointer,
  &[data-intro="tray"] &__spotlight--pointer {
    opacity: 1;
  }

  &[data-intro="scan"] &__spotlight--pointer {
    animation: intro-spotlight-arrive 520ms var(--ease-out) both;
  }

  &[data-spotlight="afterglow"] &__spotlight--pointer {
    opacity: 0.72;
    transition-duration: 420ms;
  }

  &[data-spotlight="dragging"] &__spotlight--pointer &__spotlight-lens {
    border-color: rgb(255 244 197 / 46%);
    box-shadow:
      inset 0 0 28px rgb(255 238 176 / 22%),
      0 0 20px rgb(255 223 148 / 18%);
  }
}

.fish-field[data-feedback="select"] :deep(.fish-field-piece-leave-active),
.fish-field[data-feedback="feed"] :deep(.fish-field-piece-leave-active) {
  pointer-events: none;
  animation: fish-origin-tuck 220ms var(--ease-out) both;
}

.fish-field[data-feedback="feed"] :deep(.fish-field-piece-leave-active) {
  filter: brightness(1.1) drop-shadow(0 8px 10px rgb(255 207 132 / 28%));
}

@media (max-width: 620px) {
  .fish-field {
    --spotlight-radius-x: 18%;
    --spotlight-radius-y: 12.5%;
    --spotlight-width: 36%;
    --spotlight-height: 25%;
  }
}

@media (orientation: portrait) and (min-width: 621px) {
  .fish-field {
    --spotlight-radius-x: 24%;
    --spotlight-radius-y: 11%;
    --spotlight-width: 52%;
    --spotlight-height: 22%;
  }
}

@media (max-height: 620px) and (orientation: landscape) {
  .fish-field {
    --spotlight-radius-y: 12.5%;
    --spotlight-height: 25%;
  }
}

@keyframes intro-spotlight-arrive {
  0% { opacity: 0; transform: translate(-7%, 5%); }
  100% { opacity: 1; transform: none; }
}

@keyframes fish-origin-tuck {
  0% {
    opacity: 1;
    transform:
      translate(
        calc(-50% + var(--separation-x)),
        calc(-50% + var(--separation-y) + var(--layer-lift))
      )
      rotate(var(--piece-rotation))
      scale(var(--piece-scale));
  }

  100% {
    opacity: 0;
    transform:
      translate(
        calc(-50% + var(--separation-x)),
        calc(-50% + var(--separation-y) + var(--layer-lift) + 6px)
      )
      rotate(var(--piece-rotation))
      scale(var(--piece-scale-tuck));
  }
}

@media (prefers-reduced-motion: reduce) {
  .fish-field[data-loss="true"] {
    animation: none;
  }

  .fish-field[data-loss="true"] {
    filter: brightness(0.88) saturate(0.68);
  }

  .fish-field__spotlight {
    transition: none;
    animation: none !important;
  }

  .fish-field :deep(.fish-field-piece-leave-active) {
    animation: none !important;
    opacity: 0;
  }
}

@keyframes fish-field-loss {
  0% { filter: none; }
  24%, 70% { filter: brightness(0.82) saturate(0.62); }
  100% { filter: none; }
}
</style>
