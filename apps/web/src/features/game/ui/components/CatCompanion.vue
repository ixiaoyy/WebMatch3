<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";

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
  if (props.full) {
    return `${presentation.value.label}，已经吃饱，正在休息；点击打开互动选项`;
  }
  if (props.travelPhase === "guarding") {
    return `${presentation.value.label}，正守着找到的小鱼；也可以把小鱼拖到这里喂食`;
  }
  return `${presentation.value.label}，点击打开互动选项；也可以把小鱼拖到这里喂食`;
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
    :data-reaction="reaction?.motion"
    :data-travel-phase="travelPhase"
    :data-drop-hover="dropHover"
    :data-loss="loss"
    :data-feed-response="feedResponse"
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

    <Transition name="cat-menu">
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

  &__trigger {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    margin: 0;
    border-radius: 42%;
    background: transparent;
    cursor: pointer;
  }

  &__trigger:focus-visible {
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

.cat-menu-enter-active,
.cat-menu-leave-active {
  transition: opacity 150ms ease, transform 180ms var(--ease-out);
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

  .cat-companion__menu-action {
    transition: none;
  }

  .cat-companion[data-feed-response="accepted"] {
    filter: drop-shadow(0 0 10px rgb(255 208 136 / 42%));
  }
}
</style>
