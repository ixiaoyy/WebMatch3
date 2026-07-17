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
    <img
      class="game-tile__image"
      :src="presentation.assetUrl"
      alt=""
      width="512"
      height="512"
      draggable="false"
    />
  </span>
</template>
<style scoped lang="scss">
.game-tile {
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  place-items: center;
  filter: drop-shadow(0 5px 5px rgb(20 27 59 / 38%));
  transform-origin: center;
  user-select: none;

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
}
</style>
