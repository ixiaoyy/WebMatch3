<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { createAmbientController } from "./ambient-controller";
import wallpaperUrl from "./assets/ambient/wallpaper.webp";
import JellyCluster from "./components/JellyCluster.vue";
import JellyTray from "./components/JellyTray.vue";
import GrowingPlant from "./components/GrowingPlant.vue";
import QuietControls from "./components/QuietControls.vue";
import { createDocumentPipController } from "./document-pip";
import { createClearSound } from "./sound";

const surface = ref<HTMLElement | null>(null);
const anchor = ref<HTMLElement | null>(null);
const engaged = ref(false);
const pipOpen = ref(false);
const activePipWindow = ref<Window | null>(null);
const IDLE_SCATTER_DELAY = 30_000;
let idleScatterHandle: ReturnType<typeof setTimeout> | null = null;
let lastInteractionAt = 0;
const clearSound = createClearSound();
const game = createAmbientController({
  onClear: () => {
    if (game.soundEnabled.value) clearSound.play();
  },
});

function onPipFocus(): void {
  game.setAway(false);
}

function onPipBlur(): void {
  game.setAway(true);
  setEngagement(false);
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
    setEngagement(false);
    clearSound.stop();
  }
}

function clearIdleScatterTimer(): void {
  if (idleScatterHandle !== null) {
    globalThis.clearTimeout(idleScatterHandle);
    idleScatterHandle = null;
  }
}

function checkIdleScatter(): void {
  idleScatterHandle = null;
  const remaining = IDLE_SCATTER_DELAY - (Date.now() - lastInteractionAt);
  if (remaining > 0) {
    idleScatterHandle = globalThis.setTimeout(checkIdleScatter, remaining);
    return;
  }
  engaged.value = false;
}

function markInteraction(): void {
  engaged.value = true;
  lastInteractionAt = Date.now();
  if (idleScatterHandle === null) {
    idleScatterHandle = globalThis.setTimeout(
      checkIdleScatter,
      IDLE_SCATTER_DELAY,
    );
  }
}

function setEngagement(nextEngaged: boolean): void {
  if (nextEngaged) {
    markInteraction();
    return;
  }
  engaged.value = false;
  clearIdleScatterTimer();
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
  if (!opened) game.status.value = "小窗没有打开，果冻还在这里。";
}

onMounted(() => {
  document.addEventListener("visibilitychange", updateMainAttention);
  window.addEventListener("focus", updateMainAttention);
  window.addEventListener("blur", updateMainAttention);
  updateMainAttention();
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", updateMainAttention);
  window.removeEventListener("focus", updateMainAttention);
  window.removeEventListener("blur", updateMainAttention);
  activePipWindow.value?.removeEventListener("focus", onPipFocus);
  activePipWindow.value?.removeEventListener("blur", onPipBlur);
  clearIdleScatterTimer();
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
        :style="{ '--wallpaper-url': `url(${wallpaperUrl})` }"
        aria-label="果冻桌面"
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

        <JellyCluster
          :pieces="game.game.value.pieces"
          :engaged="engaged"
          :disabled="!game.canSelect.value"
          @activate="game.activate"
          @activity="markInteraction"
          @engagement="setEngagement"
        />

        <JellyTray
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

.ambient-page[data-away="true"] .ambient-surface {
  filter: saturate(0.82) brightness(0.98);
}

.ambient-page[data-away="true"] :deep(*) {
  animation-play-state: paused !important;
  transition-duration: 0.01ms !important;
}

@media (max-width: 620px) {
  .ambient-page {
    background-position: 43% center;
  }

}

@media (max-height: 620px) and (orientation: landscape) {
  .ambient-surface {
    min-height: 620px;
  }
}
</style>
