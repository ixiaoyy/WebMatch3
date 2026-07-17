<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";

import { createGameController } from "./game-controller";
import candyRoseUrl from "./assets/candy-rose.png";
import GameBoard from "./components/GameBoard.vue";
import GameHud from "./components/GameHud.vue";
import GameInstructions from "./components/GameInstructions.vue";
import GameLeaderboard from "./components/GameLeaderboard.vue";
import GameResultDialog from "./components/GameResultDialog.vue";
import PlayerStartDialog from "./components/PlayerStartDialog.vue";
import RestartDialog from "./components/RestartDialog.vue";

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const game = createGameController({ reducedMotion });
const restartButton = ref<HTMLButtonElement | null>(null);
const startError = ref("");

const sessionLabel = computed(() => {
  switch (game.sessionPhase.value) {
    case "awaiting-player":
      return "等待玩家";
    case "playing":
      return "可以操作";
    case "resolving":
      return "糖果移动中";
    case "won":
      return "目标达成";
    case "lost":
      return "本局结束";
  }
  return "等待玩家";
});

function startGame(playerName: string): void {
  const validation = game.startGame(playerName);
  startError.value = validation.ok ? "" : validation.message;
}

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

async function startNextGame(): Promise<void> {
  game.startNextGame();
  await nextTick();
  restartButton.value?.focus();
}

function changePlayer(): void {
  startError.value = "";
  game.changePlayer();
}

onBeforeUnmount(game.dispose);
</script>

<template>
  <main class="game-page">
    <header class="topbar glass-panel">
      <div class="topbar__title">
        <span class="topbar__mark" aria-hidden="true">
          <img
            :src="candyRoseUrl"
            alt=""
            width="512"
            height="512"
            draggable="false"
          />
        </span>
        <div>
          <p>{{ game.playerName.value || "三消挑战" }}</p>
          <h1>把糖果连成一线</h1>
        </div>
      </div>
      <div class="topbar__state" :data-phase="game.sessionPhase.value">
        <span aria-hidden="true"></span>
        {{ sessionLabel }}
      </div>
      <div class="topbar__meta" aria-label="棋盘规格">
        <span>8 × 8</span>
        <strong>本地挑战</strong>
      </div>
    </header>

    <div class="game-shell">
      <aside class="hud-panel glass-panel">
        <GameHud
          :state="game.hudState.value"
          :points-per-tile="game.sessionConfig.pointsPerTile"
        />
      </aside>

      <section class="board-panel" aria-labelledby="board-title">
        <h2 id="board-title" class="visually-hidden">糖果棋盘</h2>

        <div class="board-frame">
          <GameBoard
            :board="game.visualBoard.value"
            :selected="game.selected.value"
            :focused="game.focused.value"
            :phase="game.phase.value"
            :busy="game.isBusy.value"
            :disabled="!game.canPlay.value && !game.isBusy.value"
            :matched-keys="game.matchedKeys.value"
            :invalid-keys="game.invalidKeys.value"
            :moved-keys="game.movedKeys.value"
            :spawned-keys="game.spawnedKeys.value"
            :active-swap="game.activeSwap.value"
            @activate="game.activate"
            @swap="game.swap"
            @focus-coordinate="game.setFocused"
            @cancel="game.cancelSelection"
          />
        </div>

        <div class="board-panel__feedback">
          <p class="board-panel__message">{{ game.status.value }}</p>
          <p class="board-panel__hint">8 × 8 · 轻点两颗或滑动一格</p>
        </div>
        <p class="visually-hidden" aria-live="polite" aria-atomic="true">
          {{ game.status.value }}
        </p>
      </section>

      <aside class="tools-panel glass-panel" aria-labelledby="tools-title">
        <div class="tools-panel__heading">
          <div>
            <p class="section-kicker">局内控制</p>
            <h2 id="tools-title">游戏操作</h2>
          </div>
          <span>可随时重开</span>
        </div>
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
            :disabled="!game.canPlay.value"
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
          <strong>滑动或轻点都可以</strong>
          <p>交换相邻糖果；未连成三个时，棋盘会自动复位。</p>
        </div>
        <p class="tools-panel__input-note">
          触摸滑动 · 鼠标 · 键盘
        </p>
      </aside>

      <GameLeaderboard
        class="leaderboard-panel glass-panel"
        :entries="game.leaderboard.value"
        :period="game.leaderboardPeriod.value"
        :current-player="game.playerName.value"
        @change-period="game.setLeaderboardPeriod"
      />
    </div>

    <RestartDialog
      :visible="game.restartConfirmVisible.value"
      @cancel="cancelRestart"
      @confirm="confirmRestart"
    />
    <PlayerStartDialog
      :visible="game.sessionPhase.value === 'awaiting-player'"
      :error="startError"
      @start="startGame"
    />
    <GameResultDialog
      :result="game.result.value"
      @new-game="startNextGame"
      @change-player="changePlayer"
    />
  </main>
</template>
<style scoped lang="scss">
.game-page {
  width: min(100%, 1460px);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding:
    max(16px, env(safe-area-inset-top))
    max(18px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(18px, env(safe-area-inset-left));
}

.glass-panel {
  border: 1px solid var(--glass-border);
  border-radius: var(--panel-radius);
  background: var(--glass);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(var(--glass-blur));
}

.topbar {
  display: grid;
  min-height: 88px;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 12px 18px;
  overflow: hidden;
  box-shadow:
    var(--panel-shadow),
    inset 0 1px rgb(255 255 255 / 72%);

  &__title {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 14px;

    p,
    h1 {
      margin: 0;
    }

    p {
      max-width: 20ch;
      margin-bottom: 3px;
      overflow: hidden;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    h1 {
      overflow: hidden;
      font-size: clamp(1.05rem, 1.45vw, 1.3rem);
      font-weight: 780;
      letter-spacing: -0.02em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__mark {
    display: grid;
    width: 58px;
    height: 58px;
    overflow: hidden;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid rgb(255 255 255 / 84%);
    border-radius: 17px;
    background: rgb(255 255 255 / 54%);
    box-shadow:
      inset 0 0 0 1px rgb(98 104 173 / 8%),
      0 8px 20px rgb(83 78 151 / 12%);

    img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      user-select: none;
    }
  }

  &__state {
    display: flex;
    min-height: 44px;
    align-items: center;
    justify-self: center;
    gap: 8px;
    padding: 0 20px;
    border: 1px solid rgb(255 255 255 / 78%);
    border-radius: 999px;
    color: var(--text-muted);
    background: rgb(255 255 255 / 48%);
    box-shadow: inset 0 1px rgb(255 255 255 / 72%);
    font-size: 0.8rem;
    font-weight: 720;

    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--reward);
      box-shadow: 0 0 0 4px rgb(233 149 50 / 16%);
    }

    &[data-phase="playing"] span {
      background: #55b976;
      box-shadow: 0 0 0 4px rgb(85 185 118 / 14%);
    }
  }

  &__meta {
    display: grid;
    min-width: 0;
    justify-self: end;
    text-align: right;

    span {
      color: var(--text-muted);
      font-size: 0.68rem;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    strong {
      margin-top: 2px;
      font-size: 0.86rem;
      font-weight: 760;
    }
  }
}

.game-shell {
  display: grid;
  grid-template-areas:
    "hud board tools"
    "hud board leaderboard";
  grid-template-columns:
    minmax(210px, 230px)
    minmax(520px, 700px)
    minmax(230px, 250px);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: clamp(16px, 1.7vw, 22px);
  row-gap: 14px;
  align-items: start;
  justify-content: center;
  padding: 18px 0 0;
}

.hud-panel {
  grid-area: hud;
  min-width: 0;
  align-self: stretch;
  padding: 20px;
}

.tools-panel {
  min-width: 0;
  grid-area: tools;
  display: grid;
  gap: 14px;
  padding: 16px;

  &__heading {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;

    h2 {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 760;
      letter-spacing: -0.015em;
    }

    > span {
      flex: 0 0 auto;
      padding-top: 3px;
      color: var(--text-muted);
      font-size: 0.62rem;
      font-weight: 680;
    }
  }

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

  &__input-note {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.66rem;
    font-weight: 650;
    line-height: 1.4;
    text-align: center;
  }
}

.leaderboard-panel {
  min-width: 0;
  grid-area: leaderboard;
  align-self: stretch;
}

.board-panel {
  grid-area: board;
  min-width: 0;
  width: 100%;

  &__feedback {
    display: flex;
    min-height: 42px;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin: 7px 5px 0;
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
  padding: clamp(6px, 0.8vw, 9px);
  border: 1px solid rgb(255 255 255 / 68%);
  border-radius: calc(var(--panel-radius) + 2px);
  background:
    linear-gradient(rgb(255 255 255 / 7%), transparent 18%),
    var(--board-deep);
  box-shadow:
    0 18px 34px rgb(44 52 99 / 18%),
    inset 0 0 0 1px rgb(58 72 121 / 34%),
    inset 0 1px rgb(255 255 255 / 28%);
}

@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgb(248 250 255 / 96%);
  }
}

@media (max-width: 1160px) {
  .game-shell {
    grid-template-areas:
      "hud board"
      "tools board"
      "leaderboard leaderboard";
    grid-template-columns: minmax(180px, 220px) minmax(440px, 660px);
    grid-template-rows: auto auto auto;
    align-items: start;
  }

  .hud-panel,
  .tools-panel {
    align-self: start;
  }

  .leaderboard-panel {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .game-page {
    padding-top: max(10px, env(safe-area-inset-top));
  }

  .topbar {
    min-height: 66px;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 9px 12px;

    &__mark {
      width: 48px;
      height: 48px;
      border-radius: 15px;

      img {
        width: 44px;
        height: 44px;
      }
    }

    &__meta {
      display: none;
    }

    &__state {
      justify-self: end;
      padding-inline: 13px;
    }
  }

  .game-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "hud"
      "board"
      "tools"
      "leaderboard";
    gap: 12px;
    padding-top: 12px;
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

  .board-panel__feedback {
    min-height: 44px;
    margin-top: 6px;
  }
}

@media (max-width: 420px) {
  .game-page {
    padding-inline:
      max(9px, env(safe-area-inset-left))
      max(9px, env(safe-area-inset-right));
  }

  .topbar {
    min-height: 60px;
    padding: 7px 9px;

    &__title {
      gap: 9px;

      p {
        max-width: 14ch;
        font-size: 0.68rem;
      }

      h1 {
        font-size: 0.96rem;
      }
    }

    &__mark {
      width: 44px;
      height: 44px;
      border-radius: 14px;

      img {
        width: 40px;
        height: 40px;
      }
    }

    &__state {
      min-height: 38px;
      padding: 0 9px;
      font-size: 0.68rem;

      span {
        width: 7px;
        height: 7px;
      }
    }
  }

  .board-panel__feedback {
    min-height: 44px;
    margin-inline: 3px;
  }

  .board-panel__message {
    font-size: 0.8rem;
  }

  .board-panel__hint {
    display: none;
  }

  .board-frame {
    padding: 5px;
  }
}

@media (max-height: 650px) and (orientation: landscape) {
  .game-page {
    min-height: 700px;
  }
}
</style>
