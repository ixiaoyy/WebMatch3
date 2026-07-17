<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";

import { createGameController } from "./game-controller";
import type { GameHudState, GameResultState } from "./game-ui";
import GameBoard from "./components/GameBoard.vue";
import GameHud from "./components/GameHud.vue";
import GameInstructions from "./components/GameInstructions.vue";
import GameResultDialog from "./components/GameResultDialog.vue";
import RestartDialog from "./components/RestartDialog.vue";

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const game = createGameController({ reducedMotion });
const restartButton = ref<HTMLButtonElement | null>(null);
const result = ref<GameResultState | null>(null);

const practiceHud: GameHudState = {
  score: null,
  targetScore: null,
  remainingMoves: null,
  combo: null,
};

async function cancelRestart(): Promise<void> {
  game.cancelRestart();
  await nextTick();
  restartButton.value?.focus();
}

async function confirmRestart(): Promise<void> {
  game.confirmRestart();
  await nextTick();
  restartButton.value?.focus();
}

onBeforeUnmount(game.dispose);
</script>

<template>
  <main class="game-page">
    <header class="game-header">
      <div class="game-header__copy">
        <p class="game-header__eyebrow">MATCH / 03 · PLAYGROUND</p>
        <h1>把三个相同印记，<em>连成一线。</em></h1>
        <p class="game-header__lede">
          一张不计时的练习棋盘。观察、交换，然后看连锁自然发生。
        </p>
      </div>
      <div class="game-header__actions" aria-label="游戏操作">
        <button
          v-if="!game.instructionsVisible.value"
          class="button button--quiet"
          type="button"
          @click="game.showInstructions"
        >
          玩法
        </button>
        <button
          ref="restartButton"
          class="button button--ink"
          type="button"
          :disabled="game.isBusy.value"
          @click="game.requestRestart"
        >
          重新开始
        </button>
      </div>
    </header>

    <div class="game-layout">
      <aside class="game-rail">
        <GameHud :state="practiceHud" />
        <GameInstructions
          v-if="game.instructionsVisible.value"
          @dismiss="game.dismissInstructions"
        />
        <div v-else class="game-rail__note">
          <p class="section-kicker">Small reminder</p>
          <p>只交换相邻印记；没有连成三个时，交换会自动复位。</p>
        </div>
      </aside>

      <section class="board-panel" aria-labelledby="board-title">
        <div class="board-panel__heading">
          <div>
            <p class="section-kicker">Practice board</p>
            <h2 id="board-title">练习棋盘</h2>
          </div>
          <div class="board-panel__status" :data-phase="game.phase.value">
            <span class="board-panel__status-dot" aria-hidden="true"></span>
            <span>{{ game.isBusy.value ? "结算中" : "可以操作" }}</span>
          </div>
        </div>

        <div class="board-frame">
          <span class="board-frame__marker board-frame__marker--top" aria-hidden="true">A—H</span>
          <GameBoard
            :board="game.visualBoard.value"
            :selected="game.selected.value"
            :focused="game.focused.value"
            :phase="game.phase.value"
            :busy="game.isBusy.value"
            :matched-keys="game.matchedKeys.value"
            :invalid-keys="game.invalidKeys.value"
            :moved-keys="game.movedKeys.value"
            :spawned-keys="game.spawnedKeys.value"
            :active-swap="game.activeSwap.value"
            @activate="game.activate"
            @focus-coordinate="game.setFocused"
            @cancel="game.cancelSelection"
          />
          <span class="board-frame__marker board-frame__marker--side" aria-hidden="true">01—08</span>
        </div>

        <div class="board-panel__feedback">
          <p class="board-panel__message">{{ game.status.value }}</p>
          <p class="board-panel__hint">先选一枚，再选相邻一枚</p>
        </div>
        <p class="visually-hidden" aria-live="polite" aria-atomic="true">
          {{ game.status.value }}
        </p>
      </section>
    </div>

    <footer class="game-footer">
      <span>练习模式 / 本地运行</span>
      <span>颜色 + 形状双重识别</span>
    </footer>

    <RestartDialog
      :visible="game.restartConfirmVisible.value"
      @cancel="cancelRestart"
      @confirm="confirmRestart"
    />
    <GameResultDialog :result="result" @new-game="game.confirmRestart" />
  </main>
</template>
<style scoped lang="scss">
.game-page {
  width: min(100%, 1320px);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding:
    max(18px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right))
    max(18px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
}

.game-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: start;
  padding: clamp(10px, 3vw, 28px) 0 clamp(24px, 5vw, 54px);
  border-bottom: 1px solid var(--rule);

  &__copy {
    max-width: 850px;
  }

  &__eyebrow {
    margin: 0 0 14px;
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.22em;
  }

  h1 {
    max-width: 13ch;
    margin: 0;
    font-family: "Bodoni 72", Didot, Georgia, serif;
    font-size: clamp(3rem, 7.5vw, 7.2rem);
    font-weight: 500;
    letter-spacing: -0.062em;
    line-height: 0.82;

    em {
      color: #a93229;
      font-weight: inherit;
    }
  }

  &__lede {
    max-width: 47ch;
    margin: 24px 0 0;
    color: var(--ink-soft);
    font-size: clamp(0.95rem, 1.5vw, 1.08rem);
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(240px, 0.72fr) minmax(0, 1.55fr);
  gap: clamp(28px, 6vw, 90px);
  align-items: start;
  padding: clamp(28px, 6vw, 74px) 0 42px;
}

.game-rail {
  display: grid;
  gap: 28px;
  position: sticky;
  top: 20px;

  &__note {
    padding: 18px 0 0;
    border-top: 1px solid var(--rule);

    p:last-child {
      max-width: 32ch;
      margin: 0;
      color: var(--ink-soft);
      line-height: 1.65;
    }
  }
}

.board-panel {
  min-width: 0;

  &__heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-family: "Bodoni 72", Didot, Georgia, serif;
      font-size: clamp(2rem, 4vw, 3.4rem);
      font-weight: 500;
      letter-spacing: -0.045em;
      line-height: 1;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 3px;
    color: var(--ink-soft);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__status-dot {
    width: 9px;
    height: 9px;
    border: 1px solid var(--ink);
    border-radius: 50%;
    background: var(--acid);
  }

  &__status:not([data-phase="idle"]) &__status-dot {
    background: var(--coral);
  }

  &__feedback {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 18px;
    align-items: baseline;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid var(--rule);
  }

  &__message,
  &__hint {
    margin: 0;
  }

  &__message {
    font-weight: 700;
    line-height: 1.5;
  }

  &__hint {
    color: var(--ink-soft);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }
}

.board-frame {
  position: relative;
  padding: clamp(7px, 1.5vw, 13px);
  border: 1px solid var(--ink);
  background: var(--paper-deep);
  box-shadow: var(--shadow);

  &::before,
  &::after {
    position: absolute;
    z-index: -1;
    width: 34%;
    height: 34%;
    background: var(--acid);
    content: "";
  }

  &::before {
    top: -8px;
    right: -8px;
  }

  &::after {
    bottom: -8px;
    left: -8px;
    background: var(--coral);
  }

  &__marker {
    position: absolute;
    z-index: 2;
    color: rgb(246 241 227 / 52%);
    font-family: ui-monospace, "Cascadia Mono", monospace;
    font-size: 0.5rem;
    letter-spacing: 0.16em;
    pointer-events: none;
  }

  &__marker--top {
    top: 18px;
    right: 22px;
  }

  &__marker--side {
    right: 16px;
    bottom: 24px;
    writing-mode: vertical-rl;
  }
}

.game-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0 6px;
  border-top: 1px solid var(--rule);
  color: var(--ink-soft);
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 759px) {
  .game-page {
    padding-inline: max(9px, env(safe-area-inset-left));
  }

  .game-header {
    grid-template-columns: 1fr;
    gap: 20px;

    h1 {
      font-size: clamp(3.15rem, 16vw, 5rem);
    }

    &__actions {
      justify-content: flex-start;
    }
  }

  .game-layout {
    grid-template-columns: 1fr;
    gap: 30px;
    padding-top: 28px;
  }

  .game-rail {
    position: static;
    order: 2;
  }

  .board-panel {
    order: 1;

    &__feedback {
      grid-template-columns: 1fr;
      gap: 5px;
    }
  }

  .board-frame {
    padding: 6px;
  }
}

@media (max-width: 420px) {
  .board-panel__heading {
    align-items: start;
  }

  .board-panel__status {
    padding-top: 7px;
    font-size: 0.62rem;
  }

  .game-footer {
    display: grid;
  }
}

@media (max-height: 650px) and (orientation: landscape) {
  .game-page {
    min-height: 760px;
  }

  .game-header h1 {
    font-size: clamp(3rem, 9vw, 5rem);
  }
}
</style>
