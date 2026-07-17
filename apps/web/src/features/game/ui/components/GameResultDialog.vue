<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import type { GameResultState } from "../game-ui";

const props = defineProps<{
  result: GameResultState | null;
}>();

defineEmits<{
  newGame: [];
}>();

const newGameButton = ref<HTMLButtonElement | null>(null);

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
    @keydown.tab.prevent="newGameButton?.focus()"
  >
    <section
      class="dialog-card dialog-card--result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-dialog-title"
    >
      <p class="section-kicker">本局结果</p>
      <h2 id="result-dialog-title">
        {{ result.outcome === "won" ? "目标达成" : "本局结束" }}
      </h2>
      <p>
        本局 {{ result.score.toLocaleString("zh-CN") }} 分，目标
        {{ result.targetScore.toLocaleString("zh-CN") }} 分。
      </p>
      <p v-if="result.isNewBest" class="dialog-card__best">新的本地最佳成绩</p>
      <button
        ref="newGameButton"
        class="button button--primary"
        type="button"
        @click="$emit('newGame')"
      >
        再来一局
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dialog-card--result {
  text-align: center;

  .button {
    margin-top: 12px;
  }
}
</style>
