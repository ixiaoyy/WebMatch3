<script setup lang="ts">
import type { TrayPiece } from "../../engine";
import { getJellyPresentation } from "../game-ui";

const props = defineProps<{
  pieces: readonly TrayPiece[];
  feedback: "idle" | "clear" | "recovery";
  clearingPieceIds: readonly string[];
}>();

function isClearing(piece: TrayPiece | undefined): boolean {
  return piece ? props.clearingPieceIds.includes(piece.id) : false;
}
</script>

<template>
  <ol class="jelly-tray" :data-feedback="feedback" aria-label="果冻托盘">
    <li
      v-for="index in 7"
      :key="index"
      class="jelly-tray__slot"
      :data-clearing="isClearing(pieces[index - 1])"
    >
      <img
        v-if="pieces[index - 1]"
        :src="getJellyPresentation(pieces[index - 1].kind).assetUrl"
        :alt="getJellyPresentation(pieces[index - 1].kind).label"
        width="512"
        height="512"
      />
      <span
        v-if="isClearing(pieces[index - 1])"
        class="jelly-tray__bubble jelly-tray__bubble--one"
        aria-hidden="true"
      />
      <span
        v-if="isClearing(pieces[index - 1])"
        class="jelly-tray__bubble jelly-tray__bubble--two"
        aria-hidden="true"
      />
      <span
        v-if="isClearing(pieces[index - 1])"
        class="jelly-tray__bubble jelly-tray__bubble--three"
        aria-hidden="true"
      />
      <span v-if="!pieces[index - 1]" class="visually-hidden">空位</span>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.jelly-tray {
  position: absolute;
  z-index: 8;
  right: clamp(42px, 4vw, 72px);
  bottom: 24px;
  display: grid;
  width: min(390px, calc(100vw - 28px));
  min-height: 58px;
  padding: 7px 9px;
  margin: 0;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  border: 1px solid rgb(255 255 255 / 52%);
  border-radius: 22px;
  background: rgb(241 244 253 / 38%);
  box-shadow:
    inset 0 1px rgb(255 255 255 / 62%),
    0 14px 30px rgb(58 69 105 / 11%);
  list-style: none;
  backdrop-filter: blur(9px);
  transition: box-shadow 200ms ease, transform 200ms var(--ease-out);

  &[data-feedback="clear"] {
    box-shadow:
      0 0 0 6px rgb(180 148 241 / 12%),
      0 16px 34px rgb(91 74 141 / 15%);
  }

  &[data-feedback="recovery"] {
    transform: translateY(-2px);
  }

  &__slot {
    position: relative;
    display: grid;
    min-width: 0;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(92 105 143 / 10%);
    border-radius: 14px;
    background: rgb(255 255 255 / 25%);
    box-shadow: inset 0 2px 5px rgb(71 82 119 / 5%);

    img {
      position: relative;
      z-index: 1;
      width: 112%;
      height: 112%;
      object-fit: contain;
    }

    &[data-clearing="true"] {
      background: rgb(255 255 255 / 44%);

      img {
        animation: jelly-tray-melt 460ms var(--ease-out) both;
      }
    }
  }

  &__bubble {
    position: absolute;
    z-index: 2;
    width: 12px;
    height: 12px;
    border: 1.5px solid rgb(255 255 255 / 90%);
    border-radius: 50%;
    background: rgb(197 216 255 / 22%);
    box-shadow:
      inset 2px 2px 3px rgb(255 255 255 / 48%),
      0 2px 6px rgb(96 109 158 / 12%);
    pointer-events: none;
    animation: jelly-tray-bubble 420ms var(--ease-out) both;

    &--one {
      left: 16%;
      bottom: 18%;
    }

    &--two {
      right: 13%;
      bottom: 22%;
      width: 9px;
      height: 9px;
      animation-delay: 35ms;
    }

    &--three {
      left: 49%;
      bottom: 6%;
      width: 7px;
      height: 7px;
      animation-delay: 70ms;
    }
  }
}

@keyframes jelly-tray-melt {
  0% {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1);
  }

  34% {
    opacity: 1;
    transform: scale(1.08);
    filter: brightness(1.14) saturate(1.06);
  }

  100% {
    opacity: 0;
    transform: translateY(-7px) scale(0.72);
    filter: brightness(1.2) saturate(0.78);
  }
}

@keyframes jelly-tray-bubble {
  0% {
    opacity: 0;
    transform: translateY(2px) scale(0.45);
  }

  24% {
    opacity: 0.9;
  }

  100% {
    opacity: 0;
    transform: translateY(-24px) scale(1.35);
  }
}

@media (max-width: 620px) {
  .jelly-tray {
    right: 50%;
    bottom: 12px;
    min-height: 52px;
    transform: translateX(50%);

    &[data-feedback="recovery"] {
      transform: translateX(50%) translateY(-2px);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .jelly-tray__slot[data-clearing="true"] img {
    animation: none !important;
    opacity: 0.58;
    filter: brightness(1.1) saturate(0.82);
  }

  .jelly-tray__bubble {
    display: none;
  }
}
</style>
