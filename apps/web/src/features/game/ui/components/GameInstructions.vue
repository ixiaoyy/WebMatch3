<script setup lang="ts">
defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <aside class="instructions" aria-labelledby="instructions-title">
    <div class="instructions__heading">
      <div>
        <p class="section-kicker">玩法说明</p>
        <h2 id="instructions-title">三步上手</h2>
      </div>
      <button
        class="button button--quiet instructions__dismiss"
        type="button"
        aria-label="收起玩法说明"
        @click="$emit('dismiss')"
      >
        收起
      </button>
    </div>
    <ol class="instructions__steps">
      <li>
        <span>01</span>
        <p><strong>轻点或滑动</strong>，与上下左右的相邻糖果交换。</p>
      </li>
      <li>
        <span>02</span>
        <p><strong>连成三枚或更多</strong>，棋盘会自动消除和补位。</p>
      </li>
      <li>
        <span>03</span>
        <p><strong>在步数用完前达到目标分</strong>，连续消除得分更高。</p>
      </li>
    </ol>
    <p class="instructions__keyboard">
      键盘：方向键移动 · Enter / 空格选择 · Esc 取消
    </p>
  </aside>
</template>
<style scoped lang="scss">
.instructions {
  padding-top: 14px;
  border-top: 1px solid var(--line);

  &__heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 10px;

    h2 {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 760;
      letter-spacing: -0.015em;
    }
  }

  &__dismiss {
    min-width: 58px;
    padding-inline: 13px;
    font-size: 0.74rem;
  }

  &__steps {
    display: grid;
    gap: 0;
    margin: 10px 0 0;
    padding: 0;
    border-top: 1px solid var(--line);
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }

    span {
      color: var(--primary-strong);
      font-size: 0.7rem;
      font-weight: 780;
    }

    p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.82rem;
      line-height: 1.45;
    }

    strong {
      color: var(--text);
    }
  }

  &__keyboard {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 0.68rem;
    line-height: 1.45;
  }
}
</style>
