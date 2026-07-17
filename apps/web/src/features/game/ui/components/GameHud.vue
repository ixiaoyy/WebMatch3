<script setup lang="ts">
import { computed } from "vue";

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

const scoreProgress = computed<number | null>(() => {
  const { score, targetScore } = props.state;
  if (score === null || targetScore === null || targetScore <= 0) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round((score / targetScore) * 100)));
});

const hudBadge = computed(() => {
  if (props.state.combo !== null && props.state.combo > 1) {
    return `连击 ×${props.state.combo}`;
  }

  return scoreProgress.value === null ? "练习模式" : "计分挑战";
});
</script>

<template>
  <section class="game-hud" aria-labelledby="hud-title">
    <div class="game-hud__heading">
      <div>
        <p class="section-kicker">本局状态</p>
        <h2 id="hud-title">本局目标</h2>
      </div>
      <span class="game-hud__mode-pill">{{ hudBadge }}</span>
    </div>

    <div class="game-hud__progress-card">
      <div class="game-hud__score-row">
        <div class="game-hud__current-score">
          <span>当前分数</span>
          <strong>{{ displayValue("score", state.score) }}</strong>
        </div>
        <p class="game-hud__target-score">
          <span>目标</span>
          <strong>{{ displayValue("targetScore", state.targetScore) }}</strong>
        </p>
      </div>

      <template v-if="scoreProgress !== null">
        <progress
          :value="scoreProgress"
          max="100"
          :aria-label="`目标进度 ${scoreProgress}%`"
        >
          {{ scoreProgress }}%
        </progress>
        <p class="game-hud__progress-meta">
          <span>目标进度</span>
          <strong>{{ scoreProgress }}%</strong>
        </p>
      </template>
      <p v-else class="game-hud__practice-state">
        练习模式不设分数目标
      </p>
    </div>

    <dl class="game-hud__stats">
      <div class="game-hud__stat game-hud__stat--moves">
        <dt>剩余步数</dt>
        <dd>{{ displayValue("remainingMoves", state.remainingMoves) }}</dd>
        <span>
          {{
            state.remainingMoves === null
              ? "练习不设步数限制"
              : "有效消除才会扣除"
          }}
        </span>
      </div>
      <div class="game-hud__stat game-hud__stat--combo">
        <div>
          <dt>当前连击</dt>
          <span>连锁越长，得分越高</span>
        </div>
        <dd>{{ displayValue("combo", state.combo) }}</dd>
      </div>
    </dl>

    <p v-if="state.score === null" class="game-hud__mode-note">
      当前为可玩练习模式，不记录目标进度。
    </p>
    <p v-else class="game-hud__mode-note">
      每颗糖果 {{ pointsPerTile }} 分；长连、多组和连锁会加分。
    </p>
  </section>
</template>
<style scoped lang="scss">
.game-hud {
  display: flex;
  min-height: 100%;
  flex-direction: column;

  &__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 15px;

    h2 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 780;
      letter-spacing: -0.02em;
    }
  }

  &__mode-pill {
    min-width: 0;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--primary-strong);
    background: rgb(102 91 233 / 10%);
    font-size: 0.66rem;
    font-weight: 760;
    line-height: 1;
    white-space: nowrap;
  }

  &__progress-card {
    padding: 14px;
    border-radius: 13px;
    background: rgb(255 255 255 / 46%);
    box-shadow: inset 0 0 0 1px var(--line);

    progress {
      width: 100%;
      height: 9px;
      margin: 13px 0 7px;
      overflow: hidden;
      appearance: none;
      border: 0;
      border-radius: 999px;
      background: rgb(79 69 201 / 13%);
    }

    progress::-webkit-progress-bar {
      border-radius: inherit;
      background: rgb(79 69 201 / 13%);
    }

    progress::-webkit-progress-value {
      border-radius: inherit;
      background: linear-gradient(90deg, var(--primary), var(--reward));
    }

    progress::-moz-progress-bar {
      border-radius: inherit;
      background: linear-gradient(90deg, var(--primary), var(--reward));
    }
  }

  &__score-row {
    display: grid;
    gap: 10px;
  }

  &__current-score {
    display: grid;
    gap: 4px;

    span {
      color: var(--text-muted);
      font-size: 0.7rem;
      font-weight: 680;
    }

    strong {
      overflow: hidden;
      color: var(--text);
      font-size: clamp(1.7rem, 2.8vw, 2rem);
      font-weight: 800;
      letter-spacing: -0.045em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      text-overflow: ellipsis;
    }
  }

  &__target-score {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.68rem;
    font-weight: 660;

    strong {
      color: var(--text);
      font-size: 0.8rem;
      font-weight: 760;
      font-variant-numeric: tabular-nums;
    }
  }

  &__progress-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.66rem;
    font-weight: 650;

    strong {
      color: var(--primary-strong);
      font-size: 0.72rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
  }

  &__practice-state {
    margin: 13px 0 0;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--text-muted);
    font-size: 0.68rem;
    font-weight: 650;
    line-height: 1.4;
  }

  &__stats {
    display: grid;
    gap: 9px;
    margin: 10px 0 0;
  }

  &__stat {
    min-width: 0;

    dt {
      color: var(--text-muted);
      font-size: 0.7rem;
      font-weight: 700;
    }

    dd {
      margin: 0;
      color: var(--text);
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    span {
      color: var(--text-muted);
      font-size: 0.65rem;
      line-height: 1.35;
    }
  }

  &__stat--moves {
    display: grid;
    min-height: 112px;
    padding: 14px;
    place-content: center;
    border-radius: 13px;
    text-align: center;
    background:
      linear-gradient(145deg, rgb(255 255 255 / 72%), rgb(211 211 255 / 56%));
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 72%),
      0 5px 12px rgb(79 69 201 / 10%);

    dd {
      margin: 6px 0 4px;
      color: var(--primary-strong);
      font-size: clamp(2.7rem, 5vw, 3.25rem);
      letter-spacing: -0.055em;
      line-height: 0.88;
    }
  }

  &__stat--combo {
    display: flex;
    min-height: 62px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 12px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);

    > div {
      display: grid;
      min-width: 0;
      gap: 3px;
    }

    dd {
      flex: 0 0 auto;
      color: var(--reward);
      font-size: 1.45rem;
      letter-spacing: -0.03em;
    }
  }

  &__mode-note {
    margin: auto 2px 0;
    padding-top: 16px;
    color: var(--text-muted);
    font-size: 0.72rem;
    line-height: 1.55;
    text-wrap: pretty;
  }
}

@media (max-width: 760px) {
  .game-hud {
    display: grid;
    min-height: 0;
    grid-template-areas:
      "heading heading"
      "progress stats"
      "note note";
    grid-template-columns: minmax(0, 1.5fr) minmax(116px, 0.7fr);
    gap: 10px 12px;
    align-items: stretch;

    &__heading {
      grid-area: heading;
      margin: 0;
    }

    &__progress-card {
      display: grid;
      grid-area: progress;
      align-content: center;
    }

    &__stats {
      grid-area: stats;
      margin: 0;
    }

    &__mode-note {
      grid-area: note;
      margin: 0 2px;
      padding-top: 0;
      font-size: 0.7rem;
      line-height: 1.45;
    }

    &__stat--moves {
      min-height: 96px;
    }

    &__stat--combo {
      min-height: 56px;
      padding-block: 8px;

      span {
        display: none;
      }
    }
  }
}

@media (max-width: 420px) {
  .game-hud {
    grid-template-columns: minmax(0, 1fr) minmax(84px, 0.44fr);
    grid-template-areas:
      "heading heading"
      "progress stats";
    gap: 8px;

    &__heading {
      h2 {
        font-size: 0.96rem;
      }

      .section-kicker {
        display: none;
      }
    }

    &__mode-pill {
      padding: 5px 8px;
      font-size: 0.62rem;
    }

    &__progress-card {
      min-height: 94px;
      padding: 9px 10px;

      progress {
        height: 7px;
        margin: 8px 0 5px;
      }
    }

    &__score-row {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 8px;
    }

    &__current-score {
      gap: 2px;

      span {
        font-size: 0.63rem;
      }

      strong {
        font-size: 1.4rem;
      }
    }

    &__target-score {
      display: grid;
      justify-items: end;
      gap: 2px;
      font-size: 0.6rem;

      strong {
        font-size: 0.7rem;
      }
    }

    &__progress-meta {
      font-size: 0.6rem;

      strong {
        font-size: 0.66rem;
      }
    }

    &__practice-state {
      margin-top: 8px;
      padding-top: 7px;
      font-size: 0.62rem;
    }

    &__stats {
      display: block;
    }

    &__stat--moves {
      min-height: 94px;
      height: 100%;
      padding: 8px 5px;

      dt {
        font-size: 0.64rem;
      }

      dd {
        margin-block: 5px 3px;
        font-size: 2.1rem;
      }

      span {
        display: none;
      }
    }

    &__stat--combo,
    &__mode-note {
      display: none;
    }
  }
}
</style>
