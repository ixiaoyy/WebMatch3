<script setup lang="ts">
defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <aside class="instructions" aria-labelledby="instructions-title">
    <div class="instructions__heading">
      <div>
        <p class="section-kicker">How to play</p>
        <h2 id="instructions-title">两步就会</h2>
      </div>
      <button
        class="icon-button"
        type="button"
        aria-label="关闭玩法说明"
        @click="$emit('dismiss')"
      >
        ×
      </button>
    </div>
    <ol class="instructions__steps">
      <li>
        <span>01</span>
        <p><strong>选一枚印记</strong>，再点它上下左右的邻居。</p>
      </li>
      <li>
        <span>02</span>
        <p><strong>连成三枚或更多</strong>，棋盘会自动消除和补位。</p>
      </li>
    </ol>
    <p class="instructions__keyboard">
      键盘：方向键移动 · Enter / 空格选择 · Esc 取消
    </p>
  </aside>
</template>
<style scoped lang="scss">
.instructions {
  &__heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 16px;

    h2 {
      margin: 0;
      font-family: "Bodoni 72", Didot, Georgia, serif;
      font-size: 2rem;
      font-weight: 500;
      letter-spacing: -0.04em;
    }
  }

  &__steps {
    display: grid;
    gap: 0;
    margin: 20px 0 0;
    padding: 0;
    border-top: 1px solid var(--rule);
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 12px;
      padding: 13px 0;
      border-bottom: 1px solid var(--rule);
    }

    span {
      color: #a93229;
      font-family: ui-monospace, "Cascadia Mono", monospace;
      font-size: 0.7rem;
      font-weight: 850;
    }

    p {
      margin: 0;
      color: var(--ink-soft);
      font-size: 0.86rem;
      line-height: 1.55;
    }

    strong {
      color: var(--ink);
    }
  }

  &__keyboard {
    margin: 14px 0 0;
    color: var(--ink-soft);
    font-size: 0.68rem;
    line-height: 1.55;
  }
}
</style>
