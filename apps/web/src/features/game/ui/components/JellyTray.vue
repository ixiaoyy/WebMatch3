<script setup lang="ts">
import type { TrayPiece } from "../../engine";
import { getJellyPresentation } from "../game-ui";

defineProps<{ pieces: readonly TrayPiece[]; feedback: "idle" | "clear" | "recovery" }>();
</script>

<template>
  <ol class="jelly-tray" :data-feedback="feedback" aria-label="果冻托盘">
    <li v-for="index in 7" :key="index" class="jelly-tray__slot">
      <img
        v-if="pieces[index - 1]"
        :src="getJellyPresentation(pieces[index - 1].kind).assetUrl"
        :alt="getJellyPresentation(pieces[index - 1].kind).label"
        width="512"
        height="512"
      />
      <span v-else class="visually-hidden">空位</span>
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
    display: grid;
    min-width: 0;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(92 105 143 / 10%);
    border-radius: 14px;
    background: rgb(255 255 255 / 25%);
    box-shadow: inset 0 2px 5px rgb(71 82 119 / 5%);

    img {
      width: 112%;
      height: 112%;
      object-fit: contain;
    }
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
</style>
