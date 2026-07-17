<script setup lang="ts">
import type { GameHudState } from "../game-ui";

const props = defineProps<{
  state: GameHudState;
}>();

function displayValue(
  key: keyof GameHudState,
  value: number | null,
): string {
  if (value !== null) {
    return key === "combo" ? `×${value}` : value.toLocaleString("zh-CN");
  }

  if (key === "targetScore") {
    return "练习";
  }
  if (key === "remainingMoves") {
    return "∞";
  }
  return "—";
}

const metrics: ReadonlyArray<{
  readonly key: keyof GameHudState;
  readonly label: string;
}> = [
  { key: "score", label: "当前分数" },
  { key: "targetScore", label: "目标分数" },
  { key: "remainingMoves", label: "剩余步数" },
  { key: "combo", label: "当前连击" },
];
</script>

<template>
  <section class="game-hud" aria-labelledby="hud-title">
    <div class="game-hud__heading">
      <p class="section-kicker">Round notes</p>
      <h2 id="hud-title">本局记录</h2>
    </div>
    <dl class="game-hud__metrics">
      <div v-for="metric in metrics" :key="metric.key" class="game-hud__metric">
        <dt>{{ metric.label }}</dt>
        <dd>{{ displayValue(metric.key, props.state[metric.key]) }}</dd>
      </div>
    </dl>
    <p v-if="state.score === null" class="game-hud__mode-note">
      当前为可玩练习模式，目标与计分将在局内挑战中接入。
    </p>
  </section>
</template>
<style scoped lang="scss">
.game-hud {
  padding-bottom: 28px;
  border-bottom: 1px solid var(--rule);

  &__heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;

    h2 {
      margin: 0;
      font-family: "Bodoni 72", Didot, Georgia, serif;
      font-size: 2rem;
      font-weight: 500;
      letter-spacing: -0.04em;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin: 0;
    border-top: 1px solid var(--ink);
    border-left: 1px solid var(--ink);
  }

  &__metric {
    min-width: 0;
    padding: 12px;
    border-right: 1px solid var(--ink);
    border-bottom: 1px solid var(--ink);

    dt {
      color: var(--ink-soft);
      font-size: 0.65rem;
      font-weight: 750;
      letter-spacing: 0.06em;
    }

    dd {
      margin: 6px 0 0;
      font-family: "Bodoni 72", Didot, Georgia, serif;
      font-size: clamp(1.6rem, 4vw, 2.3rem);
      line-height: 1;
    }
  }

  &__metric:nth-child(2) {
    background: var(--acid);
  }

  &__mode-note {
    margin: 14px 0 0;
    color: var(--ink-soft);
    font-size: 0.75rem;
    line-height: 1.55;
  }
}
</style>
