<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import {
  getBlockerIds,
  getSelectablePieces,
  type PilePiece,
} from "../../engine";
import type { FocusDirection } from "../game-ui";
import JellyPiece from "./JellyPiece.vue";

const props = defineProps<{
  pieces: readonly PilePiece[];
  engaged: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  activate: [pieceId: string];
  engagement: [engaged: boolean];
}>();

const cluster = ref<HTMLElement | null>(null);
const focusedId = ref<string | null>(null);
const selectable = computed(() => getSelectablePieces(props.pieces));

watch(
  selectable,
  (pieces) => {
    if (!pieces.some((piece) => piece.id === focusedId.value)) {
      focusedId.value = pieces[0]?.id ?? null;
    }
  },
  { immediate: true },
);

function focusPiece(pieceId: string): void {
  focusedId.value = pieceId;
  void nextTick(() => {
    cluster.value
      ?.querySelector<HTMLButtonElement>(`[data-piece-id="${pieceId}"]`)
      ?.focus();
  });
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
  const target = directional.sort((first, second) => {
    const firstDistance = Math.hypot(
      first.pile.x - current.pile.x,
      first.pile.y - current.pile.y,
    );
    const secondDistance = Math.hypot(
      second.pile.x - current.pile.x,
      second.pile.y - current.pile.y,
    );
    return firstDistance - secondDistance;
  })[0];
  if (target) focusPiece(target.id);
}

function onFocusOut(event: FocusEvent): void {
  if (!cluster.value?.contains(event.relatedTarget as Node | null)) {
    emit("engagement", false);
  }
}
</script>

<template>
  <section
    ref="cluster"
    class="jelly-cluster"
    :data-engaged="engaged"
    aria-label="桌面上的果冻"
    @pointerenter="emit('engagement', true)"
    @pointerleave="emit('engagement', false)"
    @focusin="emit('engagement', true)"
    @focusout="onFocusOut"
  >
    <JellyPiece
      v-for="piece in pieces"
      :key="piece.id"
      :piece="piece"
      :blocked="getBlockerIds(pieces, piece.id).length > 0"
      :disabled="disabled"
      :tab-index="piece.id === focusedId ? 0 : -1"
      @activate="emit('activate', $event)"
      @focus="focusedId = $event"
      @navigate="navigate"
    />
  </section>
</template>

<style scoped lang="scss">
.jelly-cluster {
  position: absolute;
  z-index: 3;
  width: min(54vw, 520px);
  height: 300px;
  right: clamp(24px, 3vw, 54px);
  bottom: 122px;
  border-radius: 38% 44% 28% 36%;
  outline: none;

  &:hover :deep(.jelly-piece),
  &[data-engaged="true"] :deep(.jelly-piece) {
    --active-x: var(--pile-x);
    --active-y: var(--pile-y);
  }
}

@media (hover: none), (pointer: coarse) {
  .jelly-cluster :deep(.jelly-piece) {
    --active-x: var(--pile-x);
    --active-y: var(--pile-y);
  }
}

@media (max-width: 620px) {
  .jelly-cluster {
    width: min(96vw, 390px);
    height: 270px;
    right: 50%;
    bottom: 70px;
    transform: translateX(50%);

    :deep(.jelly-piece) {
      --active-x: var(--pile-x);
      --active-y: var(--pile-y);
    }
  }
}
</style>
