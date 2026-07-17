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
    <header class="topbar">
      <div class="topbar__title">
        <span class="topbar__mark" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <div>
          <p>三消练习场</p>
          <h1>把糖果连成一线</h1>
        </div>
      </div>
      <div class="topbar__state" :data-phase="game.phase.value">
        <span aria-hidden="true"></span>
        {{ game.isBusy.value ? "糖果移动中" : "可以操作" }}
      </div>
    </header>

    <div class="game-shell">
      <aside class="hud-panel glass-panel">
        <GameHud :state="practiceHud" />
      </aside>

      <section class="board-panel" aria-labelledby="board-title">
        <div class="board-panel__heading">
          <div>
            <p class="section-kicker">练习模式</p>
            <h2 id="board-title">糖果棋盘</h2>
          </div>
          <span class="board-panel__count">8 × 8</span>
        </div>

        <div class="board-frame">
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
        </div>

        <div class="board-panel__feedback">
          <p class="board-panel__message">{{ game.status.value }}</p>
          <p class="board-panel__hint">选择相邻糖果完成交换</p>
        </div>
        <p class="visually-hidden" aria-live="polite" aria-atomic="true">
          {{ game.status.value }}
        </p>
      </section>

      <aside class="tools-panel glass-panel">
        <div class="tools-panel__actions" aria-label="游戏操作">
          <button
            v-if="!game.instructionsVisible.value"
            class="button button--quiet"
            type="button"
            @click="game.showInstructions"
          >
            查看玩法
          </button>
          <button
            ref="restartButton"
            class="button button--primary"
            type="button"
            :disabled="game.isBusy.value"
            @click="game.requestRestart"
          >
            重新开始
          </button>
        </div>
        <GameInstructions
          v-if="game.instructionsVisible.value"
          @dismiss="game.dismissInstructions"
        />
        <div v-else class="tools-panel__note">
          <strong>小提示</strong>
          <p>只交换相邻糖果；没有连成三个时，交换会自动复位。</p>
        </div>
      </aside>
    </div>

    <footer class="game-footer">
      <span>支持鼠标、触控与键盘</span>
      <span>颜色与轮廓双重识别</span>
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
    max(16px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
}

.glass-panel {
  border: 1px solid var(--glass-border);
  border-radius: var(--panel-radius);
  background: var(--glass);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(var(--glass-blur));
}

.topbar {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 12px 18px;

  &__title {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;

    p,
    h1 {
      margin: 0;
    }

    p {
      margin-bottom: 2px;
      color: var(--text-muted);
      font-size: 0.74rem;
      font-weight: 650;
    }

    h1 {
      overflow: hidden;
      font-size: 1.08rem;
      font-weight: 760;
      letter-spacing: -0.015em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__mark {
    display: flex;
    width: 42px;
    height: 42px;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 0 0 auto;
    border-radius: 13px;
    background: rgb(255 255 255 / 68%);
    box-shadow: inset 0 0 0 1px var(--glass-border);

    i {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #ff6b82;
      box-shadow: inset 0 2px rgb(255 255 255 / 44%);
    }

    i:nth-child(2) {
      background: #6ccbf0;
      transform: translateY(-4px);
    }

    i:nth-child(3) {
      background: #8ed55f;
    }
  }

  &__state {
    display: flex;
    min-height: 36px;
    align-items: center;
    gap: 8px;
    padding: 0 13px;
    border-radius: 999px;
    color: var(--text-muted);
    background: rgb(255 255 255 / 52%);
    font-size: 0.76rem;
    font-weight: 680;

    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #55b976;
      box-shadow: 0 0 0 4px rgb(85 185 118 / 14%);
    }

    &:not([data-phase="idle"]) span {
      background: var(--reward);
      box-shadow: 0 0 0 4px rgb(233 149 50 / 16%);
    }
  }
}

.game-shell {
  display: grid;
  grid-template-areas: "hud board tools";
  grid-template-columns:
    minmax(190px, 230px)
    minmax(480px, 680px)
    minmax(190px, 230px);
  gap: clamp(14px, 2.2vw, 28px);
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 2vw, 24px) 0;
}

.hud-panel {
  grid-area: hud;
  padding: 18px;
}

.tools-panel {
  display: grid;
  grid-area: tools;
  gap: 20px;
  padding: 18px;

  &__actions {
    display: grid;
    gap: 9px;

    .button {
      width: 100%;
    }
  }

  &__note {
    padding-top: 16px;
    border-top: 1px solid var(--line);

    strong {
      font-size: 0.88rem;
    }

    p {
      margin: 7px 0 0;
      color: var(--text-muted);
      font-size: 0.8rem;
      line-height: 1.6;
    }
  }
}

.board-panel {
  grid-area: board;
  min-width: 0;
  width: 100%;

  &__heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    padding: 0 6px;

    h2 {
      margin: 0;
      font-size: 1.34rem;
      font-weight: 760;
      letter-spacing: -0.02em;
      line-height: 1;
    }
  }

  &__count {
    color: var(--text-muted);
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
  }

  &__feedback {
    display: flex;
    min-height: 48px;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin: 10px 6px 0;
  }

  &__message,
  &__hint {
    margin: 0;
  }

  &__message {
    color: var(--text);
    font-size: 0.86rem;
    font-weight: 680;
    line-height: 1.5;
  }

  &__hint {
    flex: 0 0 auto;
    color: var(--text-muted);
    font-size: 0.72rem;
  }
}

.board-frame {
  width: 100%;
  padding: clamp(7px, 1.1vw, 12px);
  border-radius: calc(var(--panel-radius) + 4px);
  background: var(--board-deep);
  box-shadow:
    0 8px 8px rgb(39 45 88 / 20%),
    inset 0 1px rgb(255 255 255 / 10%);
}

.game-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 12px 4px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 620;
}

@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgb(248 250 255 / 96%);
  }
}

@media (max-width: 1040px) {
  .game-shell {
    grid-template-areas:
      "hud board"
      "tools board";
    grid-template-columns: minmax(180px, 220px) minmax(440px, 660px);
    align-items: start;
  }

  .hud-panel,
  .tools-panel {
    align-self: start;
  }
}

@media (max-width: 760px) {
  .game-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "hud"
      "board"
      "tools";
    gap: 14px;
    padding-top: 6px;
  }

  .hud-panel,
  .tools-panel {
    padding: 14px;
  }

  .tools-panel__actions {
    display: flex;
    flex-wrap: wrap;

    .button {
      width: auto;
      flex: 1 1 130px;
    }
  }

  .game-footer {
    display: grid;
    gap: 4px;
  }
}

@media (max-width: 420px) {
  .game-page {
    padding-inline:
      max(9px, env(safe-area-inset-left))
      max(9px, env(safe-area-inset-right));
  }

  .topbar {
    padding-inline: 4px;

    &__state {
      padding: 0 10px;
      font-size: 0.7rem;
    }
  }

  .board-panel__feedback {
    display: grid;
    gap: 3px;
  }
}

@media (max-height: 650px) and (orientation: landscape) {
  .game-page {
    min-height: 700px;
  }
}
</style>
