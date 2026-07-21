<script setup lang="ts">
import { computed } from "vue";

import foliageUrl from "../assets/ambient/plant-foliage.webp";
import floweringUrl from "../assets/ambient/plant-flowering.webp";
import fruitingUrl from "../assets/ambient/plant-fruiting.webp";
import matureUrl from "../assets/ambient/plant-mature.webp";
import potUrl from "../assets/ambient/plant-pot.webp";
import {
  getGrowthPercent,
  getPlantStage,
  getPlantStagePresentation,
  type PlantStage,
} from "../game-ui";

const props = defineProps<{
  clearCount: number;
  ageDays: number;
  celebrating: boolean;
}>();
const growth = computed(() => getGrowthPercent(props.clearCount));
const plantScale = computed(() => 0.82 + growth.value * 0.0018);
const stage = computed(() => getPlantStage(props.clearCount, props.ageDays));
const stagePresentation = computed(() => getPlantStagePresentation(stage.value));
const stageAssets: Readonly<Record<PlantStage, string>> = {
  growing: foliageUrl,
  flowering: floweringUrl,
  fruiting: fruitingUrl,
  mature: matureUrl,
};
</script>

<template>
  <figure
    class="growing-plant"
    :class="{
      'growing-plant--celebrating': celebrating,
      'growing-plant--empty': clearCount === 0,
    }"
    :data-stage="stage"
    :style="{ '--growth': `${growth}%`, '--plant-scale': plantScale }"
    :aria-label="stagePresentation.label"
  >
    <img
      :key="stage"
      class="growing-plant__foliage"
      :src="stageAssets[stage]"
      alt=""
      width="512"
      height="512"
    />
    <img class="growing-plant__pot" :src="potUrl" alt="" width="512" height="512" />
    <span class="growing-plant__stage-mark" aria-hidden="true">
      <Transition name="stage-flower" mode="out-in">
        <img
          :key="stage"
          class="growing-plant__stage-flower"
          :src="stagePresentation.assetUrl"
          alt=""
          width="512"
          height="512"
        />
      </Transition>
    </span>
  </figure>
</template>

<style scoped lang="scss">
.growing-plant {
  position: absolute;
  z-index: 2;
  right: clamp(26px, 3.6vw, 66px);
  bottom: 300px;
  width: clamp(132px, 13vw, 184px);
  height: clamp(190px, 22vw, 284px);
  margin: 0;
  pointer-events: none;
  transform-origin: 50% 100%;

  &__foliage,
  &__pot {
    position: absolute;
    width: 100%;
    height: auto;
    object-fit: contain;
    user-select: none;
  }

  &__foliage {
    z-index: 1;
    right: 0;
    bottom: 48px;
    opacity: 1;
    transform: scale(var(--plant-scale));
    transform-origin: 50% 100%;
    transition:
      clip-path 620ms var(--ease-out),
      opacity 420ms ease,
      transform 620ms var(--ease-out);
  }

  &[data-stage="growing"] &__foliage {
    clip-path: inset(calc(100% - var(--growth)) 0 0 0);
  }

  &__pot {
    z-index: 2;
    right: 3%;
    bottom: 0;
    width: 94%;
  }

  &__stage-mark {
    position: absolute;
    z-index: 3;
    top: 18px;
    left: -10px;
    width: clamp(54px, 5.2vw, 68px);
    aspect-ratio: 1;
    filter: drop-shadow(0 4px 5px rgb(59 70 88 / 20%));
  }

  &__stage-flower {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: block;
    width: 48%;
    height: auto;
    margin: auto;
    object-fit: contain;
    transform-origin: 50% 82%;
    user-select: none;
  }

  &[data-stage="flowering"] &__stage-flower {
    width: 66%;
  }

  &[data-stage="fruiting"] &__stage-flower {
    width: 82%;
  }

  &[data-stage="mature"] &__stage-flower {
    width: 100%;
  }

  &--empty &__foliage {
    opacity: 0;
  }

  &--celebrating {
    animation: plant-reward 460ms var(--ease-out);
  }
}

.stage-flower-enter-active,
.stage-flower-leave-active {
  transition:
    opacity 220ms ease,
    transform 280ms var(--ease-out);
}

.stage-flower-enter-from {
  opacity: 0;
  transform: translateY(4px) scale(0.84);
}

.stage-flower-leave-to {
  opacity: 0;
  transform: translateY(-2px) scale(0.94);
}

@keyframes plant-reward {
  50% { transform: translateY(-3px) scale(1.018); }
}

@media (max-width: 620px) {
  .growing-plant {
    right: 10px;
    bottom: 286px;
    width: 118px;
    height: 184px;
    opacity: 0.92;

    &__stage-mark {
      top: 14px;
      left: -4px;
      width: 54px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-flower-enter-active,
  .stage-flower-leave-active {
    transition: none;
  }
}
</style>
