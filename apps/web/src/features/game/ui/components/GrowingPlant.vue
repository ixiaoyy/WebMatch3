<script setup lang="ts">
import { computed } from "vue";

import foliageUrl from "../assets/ambient/plant-foliage.webp";
import floweringUrl from "../assets/ambient/plant-flowering.webp";
import fruitingUrl from "../assets/ambient/plant-fruiting.webp";
import matureUrl from "../assets/ambient/plant-mature.webp";
import potUrl from "../assets/ambient/plant-pot.webp";
import { getGrowthPercent, getPlantStage, type PlantStage } from "../game-ui";

const props = defineProps<{
  clearCount: number;
  ageDays: number;
  celebrating: boolean;
}>();
const growth = computed(() => getGrowthPercent(props.clearCount));
const plantScale = computed(() => 0.82 + growth.value * 0.0018);
const stage = computed(() => getPlantStage(props.clearCount, props.ageDays));
const stageAssets: Readonly<Record<PlantStage, string>> = {
  growing: foliageUrl,
  flowering: floweringUrl,
  fruiting: fruitingUrl,
  mature: matureUrl,
};
const stageLabels: Readonly<Record<PlantStage, string>> = {
  growing: "正在慢慢长大的小植物",
  flowering: "已经开出淡紫色花朵的植物",
  fruiting: "已经结出青绿色果实的植物",
  mature: "结着成熟果实的植物",
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
    :aria-label="stageLabels[stage]"
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

  &--empty &__foliage {
    opacity: 0;
  }

  &--celebrating {
    animation: plant-reward 460ms var(--ease-out);
  }
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
  }
}
</style>
