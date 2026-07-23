<script setup lang="ts">
import { computed } from "vue";

import { getCatPresentation, type CatPose } from "../game-ui";
import type { CatReaction, CatTravelPhase } from "../cat-reactions";

const props = defineProps<{
  pose: CatPose;
  reaction: CatReaction | null;
  travelPhase: CatTravelPhase;
  full: boolean;
  dropHover: boolean;
  loss: boolean;
  feedResponse: "idle" | "accepted" | "rejected";
}>();
const emit = defineEmits<{ activate: [] }>();
const presentation = computed(() => getCatPresentation(props.pose));
const actionLabel = computed(() => {
  if (props.loss) {
    return `${presentation.value.label}，托盘已经装满，小鱼正在重新布置`;
  }
  if (props.full) {
    return `${presentation.value.label}，已经吃饱，正在休息，暂时不能寻鱼或喂食`;
  }
  if (props.travelPhase === "guarding") {
    return `${presentation.value.label}，正守着找到的小鱼；也可以把小鱼拖到这里喂食`;
  }
  return `${presentation.value.label}，点击请它寻找小鱼；也可以把小鱼拖到这里喂食`;
});
</script>

<template>
  <button
    class="cat-companion"
    type="button"
    :data-pose="pose"
    :data-reaction="reaction?.motion"
    :data-travel-phase="travelPhase"
    :data-drop-hover="dropHover"
    :data-loss="loss"
    :data-feed-response="feedResponse"
    :aria-label="actionLabel"
    :aria-disabled="full || loss"
    :disabled="loss"
    @click="emit('activate')"
  >
    <Transition name="cat-pose" mode="out-in">
      <img
        :key="pose"
        class="cat-companion__image"
        :src="presentation.assetUrl"
        alt=""
        width="1402"
        height="1254"
        draggable="false"
      />
    </Transition>

    <Transition name="cat-sleep-mark">
      <span
        v-if="pose === 'sleeping'"
        class="cat-companion__sleep-mark"
        aria-hidden="true"
      >
        ZZZ
      </span>
    </Transition>

    <Transition name="cat-bubble" mode="out-in">
      <span
        v-if="reaction"
        :key="reaction.id"
        class="cat-companion__bubble"
        role="status"
        aria-live="polite"
      >
        {{ reaction.text }}
      </span>
    </Transition>
  </button>
</template>

<style scoped lang="scss">
.cat-companion {
  position: relative;
  width: var(--cat-companion-width, clamp(320px, 35vw, 500px));
  height: var(--cat-companion-height, clamp(370px, 40vw, 560px));
  padding: 0;
  border: 0;
  margin: 0;
  border-radius: 42%;
  background: transparent;
  cursor: pointer;
  isolation: isolate;

  &:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 4px;
  }

  &[data-drop-hover="true"] {
    filter: drop-shadow(0 0 13px rgb(255 208 136 / 64%));
    transform: scale(1.035);
  }

  &[data-travel-phase="looking"] &__image {
    filter: drop-shadow(0 9px 8px rgb(57 70 112 / 16%)) brightness(1.04);
    transform: translateY(-2px);
  }

  &[data-travel-phase="guarding"] &__image {
    filter: drop-shadow(0 0 15px rgb(255 224 153 / 32%));
  }

  &[data-feed-response="accepted"] &__image {
    animation: cat-feed-accepted 220ms var(--ease-out) both;
  }

  &[data-feed-response="rejected"] {
    outline: 2px solid rgb(161 105 112 / 30%);
    outline-offset: -8px;
  }

  &[data-feed-response="rejected"] &__image {
    animation: cat-feed-rejected 220ms var(--ease-out) both;
  }

  &[data-loss="true"] &__image {
    animation: cat-loss-reaction 1.2s var(--ease-out) both;
  }

  &__image {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: 50% 100%;
    filter: drop-shadow(0 9px 8px rgb(57 70 112 / 16%));
    user-select: none;
  }

  &__sleep-mark {
    position: absolute;
    z-index: 1;
    top: 12%;
    right: 2%;
    color: rgb(69 79 111 / 76%);
    font-size: clamp(11px, 1vw, 14px);
    font-weight: 760;
    letter-spacing: 0.08em;
    text-shadow: 0 2px 5px rgb(255 255 255 / 54%);
  }

  &__bubble {
    position: absolute;
    z-index: 3;
    top: -8px;
    left: 50%;
    width: max-content;
    max-width: 112px;
    padding: 6px 9px;
    border: 1px solid rgb(255 255 255 / 70%);
    border-radius: 14px 14px 14px 4px;
    color: #4b536d;
    background: rgb(250 248 247 / 88%);
    box-shadow: 0 7px 18px rgb(57 70 112 / 13%);
    font-size: 12px;
    font-weight: 650;
    line-height: 1.25;
    pointer-events: none;
    transform: translateX(-50%);
    backdrop-filter: blur(7px);
  }

  &[data-reaction="look"] &__image {
    animation: cat-look 560ms var(--ease-out) both;
  }

  &[data-reaction="tail"] &__image,
  &[data-reaction="purr"] &__image {
    animation: cat-soft-wiggle 520ms var(--ease-out) both;
  }

  &[data-reaction="paw"] &__image,
  &[data-reaction="belly"] &__image,
  &[data-reaction="yawn"] &__image {
    animation: cat-soft-pat 560ms var(--ease-out) both;
  }
}

@keyframes cat-look {
  50% { transform: translateX(-3px) rotate(-1.5deg); }
}

@keyframes cat-soft-wiggle {
  35% { transform: rotate(1.5deg); }
  70% { transform: rotate(-1deg); }
}

@keyframes cat-soft-pat {
  45% { transform: translateY(2px) scale(0.99); }
}

@keyframes cat-loss-reaction {
  0%, 100% { transform: none; filter: none; }
  20% { transform: translateY(3px) rotate(-2deg); filter: saturate(0.72); }
  42% { transform: translateY(2px) rotate(1deg); filter: saturate(0.72); }
  72% { transform: translateY(2px); filter: saturate(0.78); }
}

@keyframes cat-feed-accepted {
  0%, 100% { transform: none; }
  52% { transform: translateY(3px) scale(0.985); filter: brightness(1.08); }
}

@keyframes cat-feed-rejected {
  0%, 100% { transform: none; }
  50% { transform: translateX(-3px) rotate(-1deg); filter: saturate(0.78); }
}

.cat-pose-enter-active,
.cat-pose-leave-active,
.cat-sleep-mark-enter-active,
.cat-sleep-mark-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms var(--ease-out);
}

.cat-pose-enter-from {
  opacity: 0;
  transform: translateY(3px) scale(0.985);
}

.cat-pose-leave-to,
.cat-sleep-mark-enter-from,
.cat-sleep-mark-leave-to {
  opacity: 0;
}

.cat-sleep-mark-enter-from {
  transform: translate(-2px, 2px);
}

.cat-bubble-enter-active,
.cat-bubble-leave-active {
  transition: opacity 150ms ease, transform 180ms var(--ease-out);
}

.cat-bubble-enter-from,
.cat-bubble-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(3px) scale(0.96);
}

@media (max-width: 620px) {
  .cat-companion {
    width: var(--cat-companion-width, 118px);
    height: var(--cat-companion-height, 142px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-pose-enter-active,
  .cat-pose-leave-active,
  .cat-sleep-mark-enter-active,
  .cat-sleep-mark-leave-active,
  .cat-bubble-enter-active,
  .cat-bubble-leave-active {
    transition: none;
  }

  .cat-companion__image {
    animation: none !important;
  }

  .cat-companion[data-feed-response="accepted"] {
    filter: drop-shadow(0 0 10px rgb(255 208 136 / 42%));
  }
}
</style>
