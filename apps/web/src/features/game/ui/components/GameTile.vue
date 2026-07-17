<script setup lang="ts">
import { computed } from "vue";

import { getTilePresentation } from "../game-ui";

const props = defineProps<{
  type: string;
}>();

const presentation = computed(() => getTilePresentation(props.type));
</script>

<template>
  <span
    class="game-tile"
    :class="`game-tile--${type}`"
    aria-hidden="true"
  >
    <span class="game-tile__shape">
      <span class="game-tile__glyph">{{ presentation.glyph }}</span>
    </span>
  </span>
</template>
<style scoped lang="scss">
.game-tile {
  display: grid;
  width: 86%;
  aspect-ratio: 1;
  place-items: center;
  filter: drop-shadow(0 4px 0 rgb(0 0 0 / 28%));
  transform-origin: center;

  &__shape {
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    border: clamp(1px, 0.35vw, 3px) solid rgb(23 24 19 / 82%);
    background: var(--tile-color);
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 18%);
  }

  &__glyph {
    color: rgb(23 24 19 / 68%);
    font-family: Georgia, serif;
    font-size: clamp(0.65rem, 3.2vw, 1.7rem);
    line-height: 1;
    text-shadow: 0 1px rgb(255 255 255 / 22%);
  }

  &--coral {
    --tile-color: var(--coral);

    .game-tile__shape {
      border-radius: 50%;
      background-image: radial-gradient(rgb(33 31 26 / 18%) 1px, transparent 1.5px);
      background-size: 7px 7px;
    }
  }

  &--amber {
    --tile-color: var(--amber);

    .game-tile__shape {
      border-radius: 12%;
      background-image: repeating-linear-gradient(45deg, transparent 0 5px, rgb(33 31 26 / 13%) 5px 8px);
    }
  }

  &--lime {
    --tile-color: var(--lime);
    width: 73%;

    .game-tile__shape {
      border-radius: 9%;
      background-image: linear-gradient(90deg, transparent 44%, rgb(33 31 26 / 16%) 45% 55%, transparent 56%);
      transform: rotate(45deg);
    }

    .game-tile__glyph {
      transform: rotate(-45deg);
    }
  }

  &--aqua {
    --tile-color: var(--aqua);

    .game-tile__shape {
      clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%);
      background-image: repeating-radial-gradient(circle at center, transparent 0 6px, rgb(33 31 26 / 14%) 7px 9px);
    }
  }

  &--violet {
    --tile-color: var(--violet);

    .game-tile__shape {
      clip-path: polygon(50% 0, 61% 34%, 98% 34%, 68% 55%, 80% 92%, 50% 70%, 20% 92%, 32% 55%, 2% 34%, 39% 34%);
      background-image: linear-gradient(90deg, transparent 48%, rgb(33 31 26 / 20%) 49% 53%, transparent 54%);
    }
  }

  &--rose {
    --tile-color: var(--rose);

    .game-tile__shape {
      clip-path: polygon(50% 8%, 65% 26%, 90% 25%, 86% 50%, 98% 68%, 74% 78%, 64% 98%, 44% 83%, 20% 94%, 17% 69%, 0 55%, 19% 38%, 18% 14%, 42% 20%);
      background-image: radial-gradient(circle, rgb(246 241 227 / 38%) 0 12%, transparent 13%);
    }
  }
}
</style>
