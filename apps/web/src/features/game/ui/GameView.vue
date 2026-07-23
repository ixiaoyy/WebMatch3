<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { createAmbientController } from "./ambient-controller";
import wallpaperUrl from "./assets/ambient/wallpaper.webp";
import CatCompanion from "./components/CatCompanion.vue";
import FishField from "./components/FishField.vue";
import FishTray from "./components/FishTray.vue";
import GrowingPlant from "./components/GrowingPlant.vue";
import QuietControls from "./components/QuietControls.vue";
import { createDocumentPipController } from "./document-pip";
import { createClearSound } from "./sound";
import {
  FULL_FIELD_PROJECTION,
  createFieldProjectionScheduler,
  getFieldProjection,
  projectFieldPoint,
  type FieldProjectionScheduler,
} from "./spotlight";

const surface = ref<HTMLElement | null>(null);
const anchor = ref<HTMLElement | null>(null);
const catDropTarget = ref<HTMLElement | null>(null);
const draggingPieceId = ref<string | null>(null);
const catDropHover = ref(false);
const revealedPieceIds = ref<ReadonlySet<string>>(new Set());
const pipOpen = ref(false);
const activePipWindow = ref<Window | null>(null);
const fieldProjection = ref(
  typeof window === "undefined"
    ? FULL_FIELD_PROJECTION
    : getFieldProjection(window.innerWidth, window.innerHeight),
);
const clearSound = createClearSound();
let surfaceObserver: ResizeObserver | null = null;
let projectionScheduler: FieldProjectionScheduler | null = null;
const game = createAmbientController({
  onClear: () => {
    if (game.soundEnabled.value) clearSound.play();
  },
  isSearchCandidate: (pieceId) => !revealedPieceIds.value.has(pieceId),
});
const catGuardStyle = computed(() => {
  const target = game.guardedPiece.value;
  if (!target) return {};
  const projectedTarget = projectFieldPoint(target.pile, fieldProjection.value);
  return {
    "--cat-guard-left": `${projectedTarget.x * 100}%`,
    "--cat-guard-bottom": `${(1 - projectedTarget.y) * 100}%`,
  };
});
const catGuardSide = computed(() => {
  const target = game.guardedPiece.value;
  if (!target) return "left";
  return projectFieldPoint(target.pile, fieldProjection.value).x < 0.5
    ? "right"
    : "left";
});
const catAwayFromHome = computed(() =>
  game.catTravelPhase.value === "travelling" ||
  game.catTravelPhase.value === "guarding",
);
const catGuidedPieceId = computed(() =>
  game.catTravelPhase.value === "guarding"
    ? game.guardedPiece.value?.id ?? null
    : null,
);

function isInsideCat(clientX: number, clientY: number): boolean {
  const bounds = catDropTarget.value?.getBoundingClientRect();
  return Boolean(
    bounds &&
    clientX >= bounds.left &&
    clientX <= bounds.right &&
    clientY >= bounds.top &&
    clientY <= bounds.bottom,
  );
}

function onFishDragStart(pieceId: string): void {
  draggingPieceId.value = pieceId;
  catDropHover.value = false;
  game.status.value = "把小鱼拖到小猫身上即可喂食。";
}

function onFishDragMove(
  pieceId: string,
  clientX: number,
  clientY: number,
): void {
  if (draggingPieceId.value !== pieceId) return;
  catDropHover.value = isInsideCat(clientX, clientY);
}

function onFishDragEnd(
  pieceId: string,
  clientX: number,
  clientY: number,
): void {
  const accepted = draggingPieceId.value === pieceId &&
    isInsideCat(clientX, clientY);
  draggingPieceId.value = null;
  catDropHover.value = false;
  if (accepted) {
    game.feedToCat(pieceId);
  } else {
    game.rejectFeed();
  }
}

function onRevealedChange(pieceIds: readonly string[]): void {
  revealedPieceIds.value = new Set(pieceIds);
}

function onPipFocus(): void {
  game.setAway(false);
}

function onPipBlur(): void {
  game.setAway(true);
  clearSound.stop();
}

const pip = createDocumentPipController((nextWindow) => {
  activePipWindow.value?.removeEventListener("focus", onPipFocus);
  activePipWindow.value?.removeEventListener("blur", onPipBlur);
  activePipWindow.value = nextWindow;
  pipOpen.value = nextWindow !== null;
  if (nextWindow) {
    nextWindow.addEventListener("focus", onPipFocus);
    nextWindow.addEventListener("blur", onPipBlur);
    game.setAway(false);
  } else {
    game.setAway(document.hidden || !document.hasFocus());
  }
});

function updateMainAttention(): void {
  if (pipOpen.value) return;
  const away = document.hidden || !document.hasFocus();
  game.setAway(away);
  if (away) {
    clearSound.stop();
  }
}

function toggleSound(): void {
  const next = !game.soundEnabled.value;
  game.setSoundEnabled(next);
  if (!next) clearSound.stop();
}

async function togglePip(): Promise<void> {
  game.takeOverIntro();
  if (pip.opened) {
    pip.close();
    return;
  }
  if (!surface.value || !anchor.value) return;
  const opened = await pip.open(surface.value, anchor.value);
  if (!opened) game.status.value = "小窗没有打开，小鱼还在这里。";
}

onMounted(() => {
  document.addEventListener("visibilitychange", updateMainAttention);
  window.addEventListener("focus", updateMainAttention);
  window.addEventListener("blur", updateMainAttention);
  updateMainAttention();
  game.startReactions();
  projectionScheduler = createFieldProjectionScheduler(
    (projection) => {
      fieldProjection.value = projection;
    },
    (callback) => {
      const frameWindow = surface.value?.ownerDocument.defaultView ?? window;
      const frameId = frameWindow.requestAnimationFrame(() => callback());
      return () => frameWindow.cancelAnimationFrame(frameId);
    },
  );
  if (surface.value && typeof ResizeObserver !== "undefined") {
    surfaceObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      projectionScheduler?.schedule(
        entry.contentRect.width,
        entry.contentRect.height,
      );
    });
    surfaceObserver.observe(surface.value);
    const bounds = surface.value.getBoundingClientRect();
    fieldProjection.value = getFieldProjection(bounds.width, bounds.height);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", updateMainAttention);
  window.removeEventListener("focus", updateMainAttention);
  window.removeEventListener("blur", updateMainAttention);
  activePipWindow.value?.removeEventListener("focus", onPipFocus);
  activePipWindow.value?.removeEventListener("blur", onPipBlur);
  surfaceObserver?.disconnect();
  surfaceObserver = null;
  projectionScheduler?.cancel();
  projectionScheduler = null;
  pip.close();
  clearSound.dispose();
  game.dispose();
});
</script>

<template>
  <main
    class="ambient-page"
    :style="{ '--wallpaper-url': `url(${wallpaperUrl})` }"
    :data-away="game.isAway.value"
  >
    <div ref="anchor" class="ambient-anchor">
      <section
        ref="surface"
        class="ambient-surface"
        :class="{ 'ambient-surface--in-pip': pipOpen }"
        :data-away="game.isAway.value"
        :data-feedback="game.feedback.value"
        :data-intro="game.introPhase.value"
        :style="{ '--wallpaper-url': `url(${wallpaperUrl})` }"
        aria-label="毛毡小鱼桌面"
        @pointerdown.capture="game.takeOverIntro"
        @pointermove.capture="game.takeOverIntro"
        @focusin.capture="game.takeOverIntro"
        @keydown.capture="game.takeOverIntro"
      >
        <QuietControls
          :sound-enabled="game.soundEnabled.value"
          :pip-supported="pip.supported"
          :pip-open="pipOpen"
          @toggle-sound="toggleSound"
          @toggle-pip="togglePip"
        />

        <GrowingPlant
          :clear-count="game.game.value.clearCount"
          :age-days="game.plantAgeDays.value"
          :celebrating="game.feedbackProjection.value.celebratesPlant"
        />

        <div
          ref="catDropTarget"
          class="cat-companion-slot"
          :data-away-from-home="catAwayFromHome"
          :data-guard-side="catGuardSide"
          :style="catGuardStyle"
        >
          <CatCompanion
            :pose="game.catPose.value"
            :reaction="game.catReaction.value"
            :travel-phase="game.catTravelPhase.value"
            :full="game.game.value.fed.length >= 3 || game.catIsResting.value"
            :drop-hover="catDropHover"
            :loss="game.feedbackProjection.value.loss"
            :feed-response="game.feedbackProjection.value.catFeedResponse"
            @pet="game.petCat"
            @search="game.requestCatSearch"
          />
        </div>

        <FishField
          :key="game.game.value.level"
          :pieces="game.game.value.pieces"
          :feedable="game.catCanEat.value"
          :disabled="!game.canSelect.value"
          :transitioning="game.feedbackProjection.value.levelArriving"
          :loss="game.feedbackProjection.value.loss"
          :away="game.isAway.value"
          :projection="fieldProjection"
          :guided-piece-id="catGuidedPieceId"
          :feedback="game.feedback.value"
          :intro-phase="game.introPhase.value"
          :intro-target-ids="game.introTargetIds.value"
          @activate="game.activate"
          @feed="game.feedToCat"
          @revealed-change="onRevealedChange"
          @drag-start="onFishDragStart"
          @drag-move="onFishDragMove"
          @drag-end="onFishDragEnd"
        />

        <FishTray
          :pieces="game.trayPreview.value ?? game.game.value.tray"
          :feedback="game.feedback.value"
          :clearing-piece-ids="game.clearingPieceIds.value"
          :intro-tray="game.introPhase.value === 'tray'"
        />

        <p class="visually-hidden" aria-live="polite" aria-atomic="true">
          {{ game.status.value }}
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.ambient-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgb(210 218 241 / 8%), rgb(190 202 238 / 12%)),
    var(--wallpaper-url) center / cover no-repeat;
}

.ambient-anchor,
.ambient-surface {
  position: absolute;
  inset: 0;
}

.ambient-surface {
  --scene-tray-bottom: clamp(32px, 3.2vh, 50px);
  --scene-tray-height: clamp(76px, 7vw, 100px);
  --scene-vignette-gap: clamp(112px, 11vh, 160px);
  --scene-companion-base: calc(
    var(--scene-tray-bottom) + var(--scene-tray-height) +
      var(--scene-vignette-gap)
  );
  --scene-plant-base: calc(
    var(--scene-companion-base) + clamp(60px, 6vh, 88px)
  );
  --plant-right: clamp(24px, 5vw, 76px);
  --plant-width: clamp(196px, 20vw, 286px);
  --cat-plant-overlap: clamp(24px, 3vw, 42px);

  overflow: hidden;
  transition: filter 240ms ease;

  &--in-pip {
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 0;
    background:
      linear-gradient(90deg, rgb(210 218 241 / 8%), rgb(190 202 238 / 12%)),
      var(--wallpaper-url) center / cover no-repeat;
  }
}

.ambient-surface[data-away="true"] {
  filter: saturate(0.82) brightness(0.98);
}

.ambient-surface[data-away="true"] :deep(*) {
  animation-play-state: paused !important;
  transition-duration: 0.01ms !important;
}

.cat-companion-slot {
  --cat-companion-width: clamp(320px, 35vw, 500px);

  position: absolute;
  z-index: 7;
  left: calc(
    100% - var(--plant-right) - var(--plant-width) -
      var(--cat-companion-width) + var(--cat-plant-overlap)
  );
  bottom: var(--scene-companion-base);
  transition:
    left 520ms var(--ease-out),
    bottom 520ms var(--ease-out),
    transform 520ms var(--ease-out);

  &[data-away-from-home="true"] {
    left: clamp(24px, var(--cat-guard-left), calc(100% - 24px));
    bottom: var(--cat-guard-bottom);
    transform: translate(calc(-100% - 64px), 45%);
  }

  &[data-away-from-home="true"][data-guard-side="right"] {
    transform: translate(64px, 45%);
  }
}

@media (max-width: 620px) {
  .ambient-page {
    background-position: 43% center;
  }

  .ambient-surface {
    --scene-tray-bottom: 12px;
    --scene-tray-height: 52px;
    --scene-vignette-gap: 12px;
    --scene-plant-base: calc(var(--scene-companion-base) + 34px);
    --plant-right: 4px;
    --plant-width: 108px;
    --cat-plant-overlap: 8px;
  }

  .cat-companion-slot {
    --cat-companion-width: 118px;

    left: calc(
      100% - var(--plant-right) - var(--plant-width) -
        var(--cat-companion-width) + var(--cat-plant-overlap)
    );
    bottom: var(--scene-companion-base);

    &[data-away-from-home="true"] {
      left: clamp(16px, var(--cat-guard-left), calc(100% - 16px));
      bottom: var(--cat-guard-bottom);
      transform: translate(calc(-100% - 64px), 48%);
    }

    &[data-away-from-home="true"][data-guard-side="right"] {
      transform: translate(64px, 48%);
    }
  }

}

@media (min-width: 621px) and (max-height: 620px) and (orientation: landscape) {
  .ambient-surface:not(.ambient-surface--in-pip) {
    min-height: 620px;
  }
}

@media (max-width: 620px) and (max-height: 430px) {
  .ambient-surface {
    --scene-tray-bottom: 6px;
    --scene-tray-height: 48px;
    --scene-vignette-gap: 2px;
    --scene-plant-base: var(--scene-companion-base);
    --cat-companion-height: 88px;
    --plant-right: 84px;
    --plant-width: 56px;
    --plant-height: 86px;
    --cat-plant-overlap: 4px;
    --fish-tray-side-inset: 16px;
    --fish-tray-padding: 6px 4px;
    --quiet-controls-top: 8px;
    --quiet-controls-right: 8px;
    --quiet-controls-gap: 6px;
    --quiet-control-min-width: 64px;
    --quiet-control-min-height: 44px;
    --quiet-control-padding: 7px 10px;
    --quiet-control-font-size: 14px;

    min-height: 0;
  }

  .ambient-surface .cat-companion-slot {
    --cat-companion-width: 76px;

    bottom: var(--scene-companion-base);
    left: calc(
      100% - var(--plant-right) - var(--plant-width) -
        var(--cat-companion-width) + var(--cat-plant-overlap)
    );

    &[data-away-from-home="true"] {
      right: auto;
      left: clamp(16px, var(--cat-guard-left), calc(100% - 16px));
      bottom: var(--cat-guard-bottom);
      transform: translate(calc(-100% - 12px), 45%);
    }

    &[data-away-from-home="true"][data-guard-side="right"] {
      transform: translate(12px, 45%);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-companion-slot {
    transition: none;
  }
}
</style>
