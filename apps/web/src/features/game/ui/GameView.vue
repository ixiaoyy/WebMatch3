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
  getFieldProjection,
  projectFieldPoint,
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
const catAwayFromHome = computed(() =>
  game.catTravelPhase.value === "travelling" ||
  game.catTravelPhase.value === "guarding",
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
    game.status.value = "没有放到小猫身上，小鱼回到了原位。";
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
  if (surface.value && typeof ResizeObserver !== "undefined") {
    surfaceObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      fieldProjection.value = getFieldProjection(
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
        :style="{ '--wallpaper-url': `url(${wallpaperUrl})` }"
        aria-label="毛毡小鱼桌面"
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
          :celebrating="game.feedback.value === 'clear'"
        />

        <div
          ref="catDropTarget"
          class="cat-companion-slot"
          :data-away-from-home="catAwayFromHome"
          :style="catGuardStyle"
        >
          <CatCompanion
            :pose="game.catPose.value"
            :reaction="game.catReaction.value"
            :travel-phase="game.catTravelPhase.value"
            :full="game.game.value.fed.length >= 3 || game.catIsResting.value"
            :drop-hover="catDropHover"
            @activate="game.requestCatSearch"
          />
        </div>

        <FishField
          :key="game.game.value.level"
          :pieces="game.game.value.pieces"
          :feedable="game.catCanEat.value"
          :disabled="!game.canSelect.value"
          :transitioning="game.feedback.value === 'level'"
          :away="game.isAway.value"
          :projection="fieldProjection"
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
  overflow: hidden;
  transition: filter 240ms ease;

  &--in-pip {
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 430px;
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
  --cat-companion-width: clamp(132px, 13vw, 184px);

  position: absolute;
  z-index: 7;
  left: clamp(22px, 5vw, 84px);
  bottom: clamp(72px, 10vh, 118px);
  transition:
    left 520ms var(--ease-out),
    bottom 520ms var(--ease-out),
    transform 520ms var(--ease-out);

  &[data-away-from-home="true"] {
    left: clamp(
      var(--cat-companion-width),
      var(--cat-guard-left),
      calc(100% - 24px)
    );
    bottom: var(--cat-guard-bottom);
    transform: translate(-92%, 45%);
  }
}

@media (max-width: 620px) {
  .ambient-page {
    background-position: 43% center;
  }

  .cat-companion-slot {
    --cat-companion-width: 118px;

    left: 10px;
    bottom: 74px;

    &[data-away-from-home="true"] {
      left: clamp(
        var(--cat-companion-width),
        var(--cat-guard-left),
        calc(100% - 24px)
      );
      bottom: var(--cat-guard-bottom);
      transform: translate(-82%, 48%);
    }
  }

}

@media (max-height: 620px) and (orientation: landscape) {
  .ambient-surface {
    min-height: 620px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-companion-slot {
    transition: none;
  }
}
</style>
