<script setup lang="ts">
import type { GameHudState } from "../game-ui";

const props = defineProps<{
  state: GameHudState;
  pointsPerTile: number;
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
      <div>
        <p class="section-kicker">本局状态</p>
        <h2 id="hud-title">挑战进度</h2>
      </div>
      <span aria-hidden="true">★</span>
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
    <p v-else class="game-hud__mode-note">
      每颗糖果 {{ pointsPerTile }} 分，长连、多组与连续消除有额外奖励。
    </p>
  </section>
</template>
<style scoped lang="scss">
.game-hud {
  &__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 760;
      letter-spacing: -0.015em;
    }

    > span {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      border-radius: 50%;
      color: var(--primary-strong);
      background: rgb(102 91 233 / 10%);
      font-size: 1.15rem;
      font-weight: 760;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }

  &__metric {
    min-width: 0;
    padding: 11px;
    border-radius: 11px;
    background: rgb(255 255 255 / 42%);

    dt {
      color: var(--text-muted);
      font-size: 0.68rem;
      font-weight: 650;
    }

    dd {
      margin: 5px 0 0;
      color: var(--text);
      font-size: 1.45rem;
      font-weight: 780;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
  }

  &__metric:nth-child(2) {
    background: rgb(255 217 157 / 38%);
  }

  &__mode-note {
    margin: 13px 0 0;
    color: var(--text-muted);
    font-size: 0.76rem;
    line-height: 1.6;
    text-wrap: pretty;
  }
}

@media (max-width: 760px) {
  .game-hud {
    display: grid;
    grid-template-columns: minmax(130px, 0.7fr) minmax(0, 1.3fr);
    gap: 12px;
    align-items: center;

    &__heading,
    &__mode-note {
      margin: 0;
    }

    &__mode-note {
      grid-column: 1 / -1;
    }
  }
}
</style>
