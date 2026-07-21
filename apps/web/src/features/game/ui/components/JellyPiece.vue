<script setup lang="ts">
import { computed } from "vue";

import type { PilePiece } from "../../engine";
import { getJellyPresentation } from "../game-ui";

const props = defineProps<{
  piece: PilePiece;
  blocked: boolean;
  tabIndex: number;
  disabled: boolean;
}>();

const emit = defineEmits<{
  activate: [pieceId: string];
  focus: [pieceId: string];
  navigate: [pieceId: string, event: KeyboardEvent];
}>();

const presentation = computed(() => getJellyPresentation(props.piece.kind));
const label = computed(() =>
  props.blocked
    ? `${presentation.value.label}，被上层果冻压住，暂不可选择`
    : `${presentation.value.label}，可以选择`,
);
</script>

<template>
  <button
    class="jelly-piece"
    type="button"
    :data-piece-id="piece.id"
    :data-kind="piece.kind"
    :data-blocked="blocked"
    :disabled="blocked || disabled"
    :tabindex="blocked ? -1 : tabIndex"
    :aria-label="label"
    :style="{
      '--pile-x': piece.pile.x,
      '--pile-y': piece.pile.y,
      '--spread-x': piece.spread.x,
      '--spread-y': piece.spread.y,
      '--piece-rotation': `${piece.rotation}deg`,
      '--piece-scale': piece.scale,
      '--piece-layer': piece.layer,
    }"
    @click="emit('activate', piece.id)"
    @focus="emit('focus', piece.id)"
    @keydown="emit('navigate', piece.id, $event)"
  >
    <img
      :src="presentation.assetUrl"
      alt=""
      width="512"
      height="512"
      draggable="false"
    />
    <span v-if="blocked" class="jelly-piece__blocked" aria-hidden="true" />
  </button>
</template>

<style scoped lang="scss">
.jelly-piece {
  --active-x: var(--spread-x);
  --active-y: var(--spread-y);
  position: absolute;
  z-index: calc(2 + var(--piece-layer));
  width: clamp(68px, 6.4vw, 88px);
  height: clamp(68px, 6.4vw, 88px);
  padding: 0;
  border: 0;
  border-radius: 44%;
  background: transparent;
  cursor: pointer;
  left: calc(var(--active-x) * 100%);
  top: calc(var(--active-y) * 100%);
  transform: translate(-50%, -50%) rotate(var(--piece-rotation)) scale(var(--piece-scale));
  transform-origin: 50% 72%;
  transition:
    left 520ms var(--ease-out),
    top 520ms var(--ease-out),
    transform 220ms var(--ease-out),
    filter 220ms ease,
    opacity 220ms ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  &:hover:not(:disabled) {
    z-index: 8;
    transform: translate(-50%, -54%) rotate(var(--piece-rotation)) scale(calc(var(--piece-scale) * 1.06));
    filter: drop-shadow(0 10px 12px rgb(78 87 126 / 19%));
  }

  &:focus-visible {
    z-index: 9;
    border-radius: 36%;
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  &[data-blocked="true"] {
    cursor: default;
    filter: saturate(0.58) brightness(0.9);
    opacity: 0.68;
  }

  &__blocked {
    position: absolute;
    right: 8px;
    bottom: 9px;
    display: grid;
    width: 18px;
    height: 18px;
    padding: 0;
    place-items: center;
    border: 1px solid rgb(255 255 255 / 72%);
    border-radius: 999px;
    color: #46516b;
    background: rgb(245 247 253 / 86%);
    box-shadow: 0 2px 7px rgb(41 52 77 / 12%);

    &::before,
    &::after {
      position: absolute;
      width: 7px;
      height: 9px;
      border: 1.5px solid #59647d;
      border-radius: 50%;
      content: "";
    }

    &::before {
      top: 3px;
      left: 4px;
      transform: rotate(-28deg);
    }

    &::after {
      right: 4px;
      bottom: 3px;
      border-color: #7d87a0;
      transform: rotate(28deg);
    }
  }
}

@media (max-width: 620px) {
  .jelly-piece {
    width: clamp(62px, 20vw, 78px);
    height: clamp(62px, 20vw, 78px);
  }
}
</style>
