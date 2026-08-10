<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";

import { getCatPresentation, type CatPose } from "../game-ui";
import catCushionUrl from "../assets/cat/cat-cushion.webp";
import catYarnBallUrl from "../assets/cat/cat-yarn-ball.webp";
import type {
  CatBondStage,
  CatMotion,
  CatReaction,
  CatTravelPhase,
} from "../cat-reactions";

const props = defineProps<{
  pose: CatPose;
  motion: CatMotion;
  bondStage: CatBondStage;
  reaction: CatReaction | null;
  travelPhase: CatTravelPhase;
  loss: boolean;
}>();
const emit = defineEmits<{ pet: []; search: [] }>();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const petAction = ref<HTMLButtonElement | null>(null);
const searchAction = ref<HTMLButtonElement | null>(null);
const interactionOpen = ref(false);
const keyboardInteraction = ref(false);
let interactionDocument: Document | null = null;
let focusRestoreWindow: Window | null = null;
let focusRestoreFrame: number | null = null;

const presentation = computed(() => getCatPresentation(props.pose));
const actionLabel = computed(() => {
  if (props.loss) {
    return `${presentation.value.label}，托盘已经装满，小鱼正在重新布置`;
  }
  if (props.travelPhase === "looking" || props.travelPhase === "travelling") {
    return `${presentation.value.label}，正在帮你寻找小鱼`;
  }
  if (props.motion === "feeding") {
    return `${presentation.value.label}，正在吃三条小鱼合成的大鱼`;
  }
  if (props.motion === "resting" || props.motion === "sleeping") {
    return `${presentation.value.label}，吃饱后正在短暂休息；点击打开互动选项`;
  }
  if (props.travelPhase === "guarding") {
    return `${presentation.value.label}，正守着找到的小鱼`;
  }
  return `${presentation.value.label}，点击打开互动选项`;
});

function detachInteractionListeners(): void {
  interactionDocument?.removeEventListener(
    "pointerdown",
    onDocumentPointerDown,
  );
  interactionDocument?.removeEventListener("keydown", onDocumentKeyDown);
  interactionDocument = null;
}

function cancelScheduledFocus(): void {
  if (focusRestoreWindow && focusRestoreFrame !== null) {
    focusRestoreWindow.cancelAnimationFrame(focusRestoreFrame);
  }
  focusRestoreWindow = null;
  focusRestoreFrame = null;
}

function scheduleTriggerFocus(): void {
  cancelScheduledFocus();
  void nextTick(() => {
    const frameWindow = trigger.value?.ownerDocument.defaultView;
    if (!frameWindow) {
      trigger.value?.focus();
      return;
    }
    focusRestoreWindow = frameWindow;
    focusRestoreFrame = frameWindow.requestAnimationFrame(() => {
      focusRestoreWindow = null;
      focusRestoreFrame = null;
      trigger.value?.focus();
    });
  });
}

function closeInteraction(restoreFocus: boolean): void {
  if (!interactionOpen.value) return;
  interactionOpen.value = false;
  keyboardInteraction.value = false;
  detachInteractionListeners();
  if (restoreFocus) scheduleTriggerFocus();
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (root.value?.contains(event.target as Node)) return;
  closeInteraction(true);
}

function onDocumentKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !interactionOpen.value) return;
  event.preventDefault();
  event.stopPropagation();
  closeInteraction(true);
}

function openInteraction(focusFirstAction: boolean): void {
  if (props.travelPhase !== "home" || props.loss) return;
  cancelScheduledFocus();
  keyboardInteraction.value = focusFirstAction;
  interactionOpen.value = true;
  void nextTick(() => {
    const nextDocument = root.value?.ownerDocument ?? null;
    if (interactionDocument !== nextDocument) {
      detachInteractionListeners();
      interactionDocument = nextDocument;
      interactionDocument?.addEventListener(
        "pointerdown",
        onDocumentPointerDown,
      );
      interactionDocument?.addEventListener("keydown", onDocumentKeyDown);
    }
    petAction.value?.focus();
  });
}

function toggleInteraction(event: MouseEvent): void {
  if (props.travelPhase !== "home") return;
  if (interactionOpen.value) {
    closeInteraction(true);
  } else {
    openInteraction(keyboardInteraction.value || event.detail === 0);
  }
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter" || event.key === " ") {
    keyboardInteraction.value = true;
  }
}

function choosePet(): void {
  closeInteraction(true);
  emit("pet");
}

function chooseSearch(): void {
  closeInteraction(true);
  emit("search");
}

function onFocusOut(event: FocusEvent): void {
  if (!interactionOpen.value) return;
  const nextTarget = event.relatedTarget as Node | null;
  if (nextTarget && root.value?.contains(nextTarget)) return;
  closeInteraction(false);
}

function onMenuKeyDown(event: KeyboardEvent): void {
  keyboardInteraction.value = true;
  const actions = [petAction.value, searchAction.value].filter(
    (action): action is HTMLButtonElement => action !== null,
  );
  if (actions.length === 0) return;
  const currentIndex = actions.indexOf(
    event.target as HTMLButtonElement,
  );
  let nextIndex: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % actions.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + actions.length) % actions.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = actions.length - 1;
  }
  if (nextIndex === null) return;
  event.preventDefault();
  actions[nextIndex]?.focus();
}

/**
 * Makes the transition-retained menu inert before its visual exit completes.
 * @param element Menu element retained by Vue during the leave transition.
 * @returns Nothing; the element is deactivated in place.
 */
function deactivateLeavingMenu(element: Element): void {
  const menu = element as HTMLElement;
  menu.inert = true;
  menu.setAttribute("inert", "");
  menu.setAttribute("aria-hidden", "true");
}

watch(
  () => [props.travelPhase, props.loss] as const,
  ([travelPhase, loss]) => {
    if (travelPhase !== "home" || loss) closeInteraction(false);
  },
);

onBeforeUnmount(() => {
  detachInteractionListeners();
  cancelScheduledFocus();
});
</script>

<template>
  <div
    ref="root"
    class="cat-companion"
    :data-pose="pose"
    :data-motion="motion"
    :data-bond-stage="bondStage"
    :data-travel-phase="travelPhase"
    :data-loss="loss"
    :data-interaction-open="interactionOpen"
    :data-keyboard-interaction="keyboardInteraction"
    @focusout="onFocusOut"
  >
    <button
      ref="trigger"
      class="cat-companion__trigger"
      type="button"
      :aria-label="actionLabel"
      :aria-haspopup="travelPhase === 'home' ? 'menu' : undefined"
      :aria-expanded="travelPhase === 'home' ? interactionOpen : undefined"
      :aria-controls="travelPhase === 'home' ? 'cat-interaction-menu' : undefined"
      :aria-disabled="travelPhase !== 'home' || loss"
      :disabled="loss"
      @click="toggleInteraction"
      @keydown="onTriggerKeydown"
    />

    <img
      v-if="bondStage === 'bonded'"
      class="cat-companion__keepsake cat-companion__keepsake--cushion"
      :src="catCushionUrl"
      alt=""
      width="1254"
      height="1254"
      draggable="false"
    />

    <img
      v-else-if="bondStage === 'familiar'"
      class="cat-companion__keepsake cat-companion__keepsake--yarn"
      :src="catYarnBallUrl"
      alt=""
      width="1254"
      height="1254"
      draggable="false"
    />

    <span class="cat-companion__ground-shadow" aria-hidden="true" />

    <div class="cat-companion__motion" aria-hidden="true">
      <Transition name="cat-pose">
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
      <span class="cat-companion__purr-ring cat-companion__purr-ring--one" />
      <span class="cat-companion__purr-ring cat-companion__purr-ring--two" />
    </div>

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

    <Transition name="cat-menu" @before-leave="deactivateLeavingMenu">
      <div
        v-if="interactionOpen"
        id="cat-interaction-menu"
        class="cat-companion__menu"
        role="menu"
        aria-label="和小猫互动"
        @keydown="onMenuKeyDown"
      >
        <button
          ref="petAction"
          class="cat-companion__menu-action"
          type="button"
          role="menuitem"
          @click="choosePet"
        >
          摸一下
        </button>
        <button
          ref="searchAction"
          class="cat-companion__menu-action"
          type="button"
          role="menuitem"
          @click="chooseSearch"
        >
          帮我抓鱼
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.cat-companion {
  position: relative;
  width: var(--cat-companion-width, clamp(320px, 35vw, 500px));
  height: var(--cat-companion-height, clamp(370px, 40vw, 560px));
  isolation: isolate;
  pointer-events: none;

  &__trigger {
    position: absolute;
    z-index: 2;
    bottom: 2%;
    left: 50%;
    display: block;
    width: 68%;
    min-width: 44px;
    height: 84%;
    min-height: 44px;
    padding: 0;
    border: 0;
    margin: 0;
    border-radius: 46% 46% 40% 40%;
    background: transparent;
    cursor: pointer;
    pointer-events: auto;
    transform: translateX(-50%);
  }

  &__trigger:focus-visible {
    outline: none;
  }

  &[data-pose="lying"] &__trigger,
  &[data-pose="sleeping"] &__trigger {
    bottom: 8%;
    width: 92%;
    height: 62%;
    border-radius: 46% 48% 42% 40%;
  }

  &__keepsake {
    position: absolute;
    z-index: 0;
    display: block;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  &__keepsake--yarn {
    bottom: 2%;
    left: 2%;
    width: 28%;
    height: 28%;
    filter: drop-shadow(0 7px 6px rgb(57 70 112 / 15%));
  }

  &__keepsake--cushion {
    right: -1%;
    bottom: -3%;
    width: 98%;
    height: 35%;
    filter: drop-shadow(0 7px 6px rgb(57 70 112 / 13%));
    transform: scaleX(1.65);
  }

  &__ground-shadow {
    position: absolute;
    z-index: 0;
    right: 14%;
    bottom: 2%;
    width: 66%;
    height: 8%;
    border-radius: 50%;
    background: rgb(63 72 107 / 12%);
    filter: blur(6px);
    pointer-events: none;
    transform-origin: center;
  }

  &__motion {
    position: absolute;
    z-index: 1;
    inset: 0;
    pointer-events: none;
    transform-origin: 50% 92%;
  }

  &[data-motion="idle"] &__motion {
    animation: cat-idle-breathe 3.8s ease-in-out infinite;
  }

  &[data-motion="feeding"] &__motion {
    animation: cat-catch-and-chew 520ms var(--ease-out) both;
  }

  &[data-motion="feeding"] &__ground-shadow {
    animation: cat-feed-shadow 520ms var(--ease-out) both;
  }

  &[data-motion="petting"] &__motion {
    animation: cat-nuzzle 560ms var(--ease-out) both;
  }

  &[data-motion="searching"] &__motion {
    animation: cat-search-hop 520ms var(--ease-out) infinite;
  }

  &[data-motion="searching"] &__ground-shadow {
    animation: cat-search-shadow 520ms var(--ease-out) infinite;
  }

  &[data-motion="guarding"] &__motion {
    filter: drop-shadow(0 0 15px rgb(255 224 153 / 32%));
  }

  &[data-motion="loss"] &__motion {
    animation: cat-loss-reaction 1.2s var(--ease-out) both;
  }

  &__image {
    position: absolute;
    z-index: 1;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: 50% 100%;
    filter: drop-shadow(0 9px 8px rgb(57 70 112 / 16%));
    pointer-events: none;
    user-select: none;
  }

  &__trigger:hover ~ &__motion &__image {
    filter:
      drop-shadow(0 10px 10px rgb(57 70 112 / 18%))
      brightness(1.025);
  }

  &__trigger:focus-visible ~ &__motion &__image {
    filter:
      drop-shadow(0 0 2px rgb(60 85 126 / 92%))
      drop-shadow(0 0 6px rgb(247 250 255 / 88%))
      drop-shadow(0 10px 10px rgb(57 70 112 / 18%));
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

  &__purr-ring {
    position: absolute;
    z-index: 2;
    top: 35%;
    right: 19%;
    display: block;
    width: 13%;
    aspect-ratio: 1;
    border: 2px solid rgb(208 173 226 / 62%);
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
  }

  &[data-motion="petting"] &__purr-ring {
    animation: cat-purr-ring 560ms ease-out both;
  }

  &[data-motion="petting"] &__purr-ring--two {
    animation-delay: 90ms;
  }

  &[data-motion="feeding"] &__purr-ring {
    top: 32%;
    right: 16%;
    border-color: rgb(244 183 103 / 72%);
    animation: cat-bite-ring 430ms ease-out both;
  }

  &[data-motion="feeding"] &__purr-ring--two {
    animation-delay: 70ms;
  }

  &__menu {
    position: absolute;
    z-index: 5;
    top: 16%;
    left: 71%;
    display: flex;
    flex-direction: column;
    width: 136px;
    max-width: calc(100vw - 24px);
    padding: 8px 11px 7px;
    border: 0;
    background: url("../assets/cat/cat-menu-bubble.webp") center / 100% 100%
      no-repeat;
    box-shadow: 0 12px 30px rgb(70 77 125 / 12%);
    backdrop-filter: blur(12px) saturate(1.08);
    pointer-events: auto;
  }

  &__menu-action {
    width: 100%;
    min-height: 46px;
    padding: 8px 4px;
    border: 0;
    border-bottom: 1px dashed rgb(106 116 157 / 28%);
    border-radius: 0;
    color: #48516d;
    background: transparent;
    font: inherit;
    font-size: 14px;
    font-weight: 650;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      color 150ms ease,
      background-color 150ms ease,
      transform 150ms var(--ease-out);

    &:last-child {
      border-bottom: 0;
      font-size: 15px;
      font-weight: 760;
    }

    &:hover {
      color: #394461;
      background: rgb(255 255 255 / 38%);
    }

    &:active {
      transform: translateY(1px);
    }

    &:focus-visible {
      outline: 0;
      box-shadow: inset 3px 0 0 rgb(105 116 163 / 46%);
    }
  }

  &[data-keyboard-interaction="false"] &__menu-action:focus-visible {
    box-shadow: none;
  }

}

@keyframes cat-idle-breathe {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(-1px) scaleY(1.012); }
}

@keyframes cat-catch-and-chew {
  0%, 100% { transform: translate(0) scale(1) rotate(0); }
  14% { transform: translate(-2px, 4px) scale(1.035, 0.965) rotate(-0.8deg); }
  29% { transform: translate(-8px, -6px) scale(0.985, 1.045) rotate(-1.4deg); }
  45% { transform: translate(-1px, 1px) scale(1.025, 0.98) rotate(0.5deg); }
  62% { transform: translateY(-3px) scale(0.995, 1.018); }
  76% { transform: translateY(2px) scale(1.014, 0.986); }
  88% { transform: translateY(-1px) scale(0.998, 1.008); }
}

@keyframes cat-feed-shadow {
  0%, 100% { opacity: 1; transform: scaleX(1); }
  16% { opacity: 0.88; transform: scaleX(1.08); }
  31% { opacity: 0.58; transform: translateX(-5px) scaleX(0.82); }
  48% { opacity: 0.92; transform: scaleX(1.05); }
}

@keyframes cat-bite-ring {
  0% { opacity: 0; transform: scale(0.35); }
  28% { opacity: 0; transform: scale(0.35); }
  44% { opacity: 0.86; }
  100% { opacity: 0; transform: scale(1.28); }
}

@keyframes cat-nuzzle {
  0%, 100% { transform: translateX(0); }
  46% { transform: translateX(-5px) translateY(1px); }
}

@keyframes cat-search-hop {
  0%, 100% { transform: translateY(0) scaleY(1); }
  45% { transform: translateY(-7px) scaleY(1.01); }
}

@keyframes cat-search-shadow {
  0%, 100% { opacity: 1; transform: scaleX(1); }
  45% { opacity: 0.55; transform: scaleX(0.82); }
}

@keyframes cat-purr-ring {
  0% { opacity: 0; transform: scale(0.45); }
  28% { opacity: 0.72; }
  100% { opacity: 0; transform: scale(1.45); }
}

@keyframes cat-loss-reaction {
  0%, 100% { transform: none; filter: none; }
  20% { transform: translateY(3px) rotate(-2deg); filter: saturate(0.72); }
  42% { transform: translateY(2px) rotate(1deg); filter: saturate(0.72); }
  72% { transform: translateY(2px); filter: saturate(0.78); }
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

.cat-menu-enter-active,
.cat-menu-leave-active {
  transition: opacity 150ms ease, transform 180ms var(--ease-out);
}

.cat-menu-leave-active {
  pointer-events: none;
}

.cat-menu-enter-from,
.cat-menu-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.97);
}

@media (max-width: 620px) {
  .cat-companion {
    width: var(--cat-companion-width, 118px);
    height: var(--cat-companion-height, 142px);

    &__menu {
      top: -24px;
      bottom: auto;
      left: 68%;
      width: 124px;
      padding: 7px 9px 6px;
    }

    &__menu-action {
      min-height: 44px;
      padding-inline: 3px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-pose-enter-active,
  .cat-pose-leave-active,
  .cat-sleep-mark-enter-active,
  .cat-sleep-mark-leave-active,
  .cat-bubble-enter-active,
  .cat-bubble-leave-active,
  .cat-menu-enter-active,
  .cat-menu-leave-active {
    transition: none;
  }

  .cat-companion__image {
    animation: none !important;
  }

  .cat-companion__motion,
  .cat-companion__ground-shadow,
  .cat-companion__purr-ring {
    animation: none !important;
  }

  .cat-companion[data-motion="feeding"] .cat-companion__motion {
    filter: brightness(1.06);
  }

  .cat-companion[data-motion="feeding"] .cat-companion__purr-ring--one {
    opacity: 0.58;
    transform: scale(0.76);
  }

  .cat-companion[data-motion="petting"] .cat-companion__purr-ring--one {
    opacity: 0.55;
    transform: scale(0.82);
  }

  .cat-companion[data-motion="searching"] .cat-companion__ground-shadow {
    opacity: 0.62;
    transform: scaleX(0.86);
  }

  .cat-companion__menu-action {
    transition: none;
  }

}
</style>
