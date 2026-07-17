<script setup lang="ts">
import { computed, nextTick } from "vue";

import type {
  LeaderboardEntry,
  LeaderboardPeriod,
} from "@/features/game/session";

import defaultAvatarUrl from "../assets/candy-lime.png";

const props = defineProps<{
  entries: readonly LeaderboardEntry[];
  period: LeaderboardPeriod;
  currentPlayer: string;
}>();

const emit = defineEmits<{
  changePeriod: [period: LeaderboardPeriod];
}>();

const periodOptions: readonly {
  value: LeaderboardPeriod;
  label: string;
}[] = [
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "all", label: "总排行" },
];

const podiumEntries = computed(() => props.entries.slice(0, 3));
const listEntries = computed(() => props.entries.slice(3));

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function isCurrentPlayer(entry: LeaderboardEntry): boolean {
  return (
    props.currentPlayer.length > 0 &&
    entry.playerName === props.currentPlayer
  );
}

function changePeriod(period: LeaderboardPeriod): void {
  emit("changePeriod", period);
}

async function movePeriod(
  offset: number,
  event: KeyboardEvent,
): Promise<void> {
  const tablist = event.currentTarget as HTMLElement;
  const currentIndex = periodOptions.findIndex(
    ({ value }) => value === props.period,
  );
  const nextIndex =
    (currentIndex + offset + periodOptions.length) % periodOptions.length;
  const next = periodOptions[nextIndex];
  if (next) {
    changePeriod(next.value);
    await nextTick();
    tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')[
      nextIndex
    ]?.focus();
  }
}
</script>

<template>
  <section class="leaderboard" aria-labelledby="leaderboard-title">
    <div class="leaderboard__heading">
      <div>
        <p class="section-kicker">本机记录</p>
        <h2 id="leaderboard-title">排行榜</h2>
      </div>
      <span>TOP 10</span>
    </div>

    <div
      class="leaderboard__tabs"
      role="tablist"
      aria-label="排行榜时间范围"
      @keydown.left.prevent="movePeriod(-1, $event)"
      @keydown.right.prevent="movePeriod(1, $event)"
    >
      <button
        v-for="option in periodOptions"
        :id="`leaderboard-tab-${option.value}`"
        :key="option.value"
        type="button"
        role="tab"
        aria-controls="leaderboard-panel"
        :aria-selected="period === option.value"
        :tabindex="period === option.value ? 0 : -1"
        @click="changePeriod(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div
      id="leaderboard-panel"
      class="leaderboard__content"
      role="tabpanel"
      :aria-labelledby="`leaderboard-tab-${period}`"
    >
      <p v-if="entries.length === 0" class="leaderboard__empty">
        这个时间段还没有成绩。完成一局后，你的名字会出现在这里。
      </p>

      <template v-else>
        <ol
          class="leaderboard__podium"
          :data-count="podiumEntries.length"
          aria-label="排行榜前三名"
        >
          <li
            v-for="(entry, index) in podiumEntries"
            :key="`${entry.completedAt}-${entry.playerName}-${entry.score}-${index}`"
            :data-rank="index + 1"
            :data-current="isCurrentPlayer(entry) || undefined"
          >
            <span class="leaderboard__medal" aria-hidden="true">
              {{ index + 1 }}
            </span>
            <span class="leaderboard__avatar">
              <img
                :src="defaultAvatarUrl"
                alt=""
                width="512"
                height="512"
                draggable="false"
              />
            </span>
            <strong class="leaderboard__podium-name">
              {{ entry.playerName }}
            </strong>
            <span v-if="isCurrentPlayer(entry)" class="leaderboard__you">
              当前
            </span>
            <strong class="leaderboard__podium-score">
              {{ entry.score.toLocaleString("zh-CN") }}
            </strong>
          </li>
        </ol>

        <ol
          v-if="listEntries.length > 0"
          class="leaderboard__list"
          start="4"
        >
          <li
            v-for="(entry, index) in listEntries"
            :key="`${entry.completedAt}-${entry.playerName}-${entry.score}-${index + 3}`"
            :data-current="isCurrentPlayer(entry) || undefined"
          >
            <span class="leaderboard__rank">{{ index + 4 }}</span>
            <span class="leaderboard__list-avatar">
              <img
                :src="defaultAvatarUrl"
                alt=""
                width="512"
                height="512"
                draggable="false"
              />
            </span>
            <div class="leaderboard__player">
              <strong>{{ entry.playerName }}</strong>
              <span>
                {{ formatDate(entry.completedAt) }}
                <template v-if="isCurrentPlayer(entry)"> · 当前玩家</template>
              </span>
            </div>
            <div class="leaderboard__score">
              <strong>{{ entry.score.toLocaleString("zh-CN") }}</strong>
              <span>连锁 ×{{ entry.bestCombo }}</span>
            </div>
          </li>
        </ol>
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
.leaderboard {
  overflow: hidden;
  padding: 16px;

  &__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 760;
      letter-spacing: -0.015em;
    }

    > span {
      padding: 5px 8px;
      border-radius: 999px;
      color: var(--primary-strong);
      background: rgb(102 91 233 / 10%);
      font-size: 0.64rem;
      font-weight: 760;
    }
  }

  &__tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3px;
    margin-top: 13px;
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: rgb(255 255 255 / 34%);

    button {
      min-width: 0;
      min-height: 30px;
      padding: 0 5px;
      border: 0;
      border-radius: 9px;
      color: var(--text-muted);
      background: transparent;
      font: inherit;
      font-size: 0.68rem;
      font-weight: 720;
      cursor: pointer;
      transition:
        color 150ms ease,
        background 150ms ease,
        box-shadow 150ms ease;

      &:hover {
        color: var(--text);
        background: rgb(255 255 255 / 52%);
      }

      &[aria-selected="true"] {
        color: var(--primary-strong);
        background: rgb(255 255 255 / 88%);
        box-shadow: 0 4px 12px rgb(57 52 122 / 10%);
      }

      &:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
      }
    }
  }

  &__content {
    min-height: 112px;
  }

  &__empty {
    display: grid;
    min-height: 92px;
    place-items: center;
    margin: 12px 0 0;
    padding: 16px;
    border: 1px dashed rgb(102 91 233 / 22%);
    border-radius: 14px;
    color: var(--text-muted);
    background: rgb(255 255 255 / 28%);
    font-size: 0.76rem;
    line-height: 1.6;
    text-align: center;
    text-wrap: pretty;
  }

  &__podium {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 5px;
    margin: 19px 0 0;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      display: grid;
      min-width: 0;
      min-height: 116px;
      align-content: start;
      justify-items: center;
      gap: 3px;
      padding: 11px 4px 9px;
      border: 1px solid rgb(255 255 255 / 62%);
      border-radius: 15px 15px 11px 11px;
      background: rgb(255 255 255 / 44%);
      box-shadow:
        inset 0 0 0 1px rgb(102 91 233 / 7%),
        0 8px 18px rgb(64 57 121 / 7%);
    }

    li[data-rank="1"] {
      order: 2;
      min-height: 127px;
      border-color: rgb(233 165 54 / 36%);
      background: rgb(255 245 213 / 72%);
      transform: translateY(-5px);
    }

    li[data-rank="2"] {
      order: 1;
    }

    li[data-rank="3"] {
      order: 3;
      background: rgb(255 238 226 / 58%);
    }

    li[data-current="true"] {
      border-color: rgb(233 149 50 / 74%);
      box-shadow:
        inset 0 0 0 1px rgb(255 255 255 / 72%),
        0 0 0 2px rgb(233 149 50 / 16%);
    }

    &[data-count="1"] li {
      grid-column: 2;
    }
  }

  &__medal {
    position: absolute;
    top: -10px;
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    border: 2px solid rgb(255 255 255 / 84%);
    border-radius: 50%;
    color: #6d4818;
    background: #ffd36f;
    box-shadow: 0 4px 9px rgb(116 77 21 / 18%);
    font-size: 0.68rem;
    font-weight: 820;
  }

  li[data-rank="2"] &__medal {
    color: #505674;
    background: #dfe5f6;
  }

  li[data-rank="3"] &__medal {
    color: #7f4931;
    background: #efb08e;
  }

  &__avatar,
  &__list-avatar {
    display: grid;
    overflow: hidden;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid rgb(255 255 255 / 78%);
    border-radius: 50%;
    background: rgb(255 255 255 / 60%);
    box-shadow:
      inset 0 0 0 2px rgb(134 199 84 / 11%),
      0 5px 12px rgb(52 97 36 / 10%);

    img {
      width: 82%;
      height: 82%;
      object-fit: contain;
      user-select: none;
    }
  }

  &__avatar {
    width: 43px;
    height: 43px;
    margin-top: 2px;
  }

  li[data-rank="1"] &__avatar {
    width: 50px;
    height: 50px;
  }

  &__podium-name,
  &__podium-score {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__podium-name {
    font-size: 0.67rem;
  }

  &__podium-score {
    color: var(--text);
    font-size: 0.73rem;
    font-variant-numeric: tabular-nums;
  }

  &__you {
    padding: 2px 5px;
    border-radius: 999px;
    color: #8f5017;
    background: rgb(255 220 153 / 68%);
    font-size: 0.55rem;
    font-weight: 760;
    line-height: 1.2;
  }

  &__list {
    display: grid;
    gap: 2px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 22px 28px minmax(0, 1fr) auto;
      gap: 7px;
      align-items: center;
      min-height: 45px;
      margin: 0 -5px;
      padding: 6px 5px;
      border-top: 1px solid var(--line);
      border-radius: 10px;
    }

    li[data-current="true"] {
      border-color: transparent;
      color: #7d4515;
      background: rgb(255 224 164 / 52%);
      box-shadow: inset 0 0 0 1px rgb(233 149 50 / 35%);
    }
  }

  &__rank {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 50%;
    color: var(--text-muted);
    background: rgb(255 255 255 / 48%);
    font-size: 0.68rem;
    font-weight: 740;
  }

  &__list-avatar {
    width: 28px;
    height: 28px;
  }

  &__player,
  &__score {
    display: grid;
    min-width: 0;
    gap: 2px;

    strong {
      overflow: hidden;
      font-size: 0.76rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--text-muted);
      overflow: hidden;
      font-size: 0.59rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__score {
    text-align: right;

    strong {
      font-variant-numeric: tabular-nums;
    }
  }
}

@media (max-width: 760px) {
  .leaderboard {
    &__podium {
      gap: 8px;
    }

    &__podium-name {
      font-size: 0.72rem;
    }
  }
}
</style>
