<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import type { GameResultState } from "../game-ui";

const props = defineProps<{
  result: GameResultState | null;
}>();

defineEmits<{
  newGame: [];
  changePlayer: [];
}>();

const newGameButton = ref<HTMLButtonElement | null>(null);
const changePlayerButton = ref<HTMLButtonElement | null>(null);

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== "Tab") {
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && active === changePlayerButton.value) {
    event.preventDefault();
    newGameButton.value?.focus();
  } else if (!event.shiftKey && active === newGameButton.value) {
    event.preventDefault();
    changePlayerButton.value?.focus();
  }
}

watch(
  () => props.result,
  async (result) => {
    if (result) {
      await nextTick();
      newGameButton.value?.focus();
    }
  },
);
</script>

<template>
  <div
    v-if="result"
    class="dialog-backdrop"
    @keydown="trapFocus"
  >
    <section
      class="dialog-card dialog-card--result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-dialog-title"
    >
      <p class="section-kicker">{{ result.playerName }} 的本局成绩</p>
      <h2 id="result-dialog-title">
        {{ result.outcome === "won" ? "目标达成！" : "挑战完成" }}
      </h2>
      <p>
        {{
          result.outcome === "won"
            ? `还剩 ${result.remainingMoves} 步，漂亮收官。`
            : `距离目标还差 ${Math.max(0, result.targetScore - result.score).toLocaleString("zh-CN")} 分。`
        }}
      </p>

      <dl class="result-metrics">
        <div>
          <dt>本局分数</dt>
          <dd>{{ result.score.toLocaleString("zh-CN") }}</dd>
        </div>
        <div>
          <dt>最高连击</dt>
          <dd>×{{ result.bestCombo }}</dd>
        </div>
        <div>
          <dt>总榜名次</dt>
          <dd>{{ result.rank === null ? "榜外" : `#${result.rank}` }}</dd>
        </div>
      </dl>

      <p v-if="result.isNewBest" class="dialog-card__best">
        新的本机最高分：{{ result.bestScore.toLocaleString("zh-CN") }}
      </p>

      <div class="dialog-card__actions">
        <button
          ref="changePlayerButton"
          class="button button--quiet"
          type="button"
          @click="$emit('changePlayer')"
        >
          换玩家
        </button>
        <button
          ref="newGameButton"
          class="button button--primary"
          type="button"
          @click="$emit('newGame')"
        >
          再来一局
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dialog-card--result {
  text-align: center;
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 22px 0 0;

  div {
    padding: 12px 8px;
    border-radius: 11px;
    background: rgb(255 255 255 / 54%);
  }

  dt {
    color: var(--text-muted);
    font-size: 0.68rem;
  }

  dd {
    margin: 5px 0 0;
    font-size: 1.25rem;
    font-weight: 780;
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 390px) {
  .result-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
