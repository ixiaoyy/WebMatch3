<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
  error: string;
}>();

const emit = defineEmits<{
  start: [playerName: string];
}>();

const playerName = ref("");
const nameInput = ref<HTMLInputElement | null>(null);
const startButton = ref<HTMLButtonElement | null>(null);

function submit(): void {
  emit("start", playerName.value);
}

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== "Tab") {
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && active === nameInput.value) {
    event.preventDefault();
    startButton.value?.focus();
  } else if (!event.shiftKey && active === startButton.value) {
    event.preventDefault();
    nameInput.value?.focus();
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      playerName.value = "";
      await nextTick();
      nameInput.value?.focus();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="visible"
    class="dialog-backdrop"
    @keydown="trapFocus"
  >
    <form
      class="dialog-card player-start"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-start-title"
      aria-describedby="player-start-description"
      @submit.prevent="submit"
    >
      <p class="section-kicker">准备开始</p>
      <h2 id="player-start-title">先告诉我你的姓名</h2>
      <p id="player-start-description">
        完成一局后，成绩会留在这台设备的排行榜里。
      </p>
      <label for="player-name">玩家姓名</label>
      <input
        id="player-name"
        ref="nameInput"
        v-model="playerName"
        name="playerName"
        type="text"
        inputmode="text"
        autocomplete="nickname"
        aria-describedby="player-name-help player-name-error"
        :aria-invalid="error.length > 0"
      />
      <div class="player-start__meta">
        <span id="player-name-help">1–12 个字符，仅保存在本机</span>
        <span>{{ [...playerName.trim()].length }}/12</span>
      </div>
      <p
        v-if="error"
        id="player-name-error"
        class="player-start__error"
        role="alert"
      >
        {{ error }}
      </p>
      <button
        ref="startButton"
        class="button button--primary"
        type="submit"
      >
        开始游戏
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.player-start {
  width: min(100%, 430px);

  label {
    display: block;
    margin: 24px 0 8px;
    font-size: 0.8rem;
    font-weight: 720;
  }

  input {
    width: 100%;
    height: 48px;
    padding: 0 13px;
    border: 0;
    border-radius: 11px;
    outline: 1px solid var(--line);
    background: rgb(255 255 255 / 72%);
    color: var(--text);
    font-size: 1rem;
    transition:
      outline-color 140ms ease,
      box-shadow 140ms ease;

    &:focus {
      outline: 2px solid var(--primary);
      box-shadow: 0 0 0 4px rgb(102 91 233 / 12%);
    }

    &[aria-invalid="true"] {
      outline-color: var(--danger);
    }
  }

  .button {
    width: 100%;
    margin-top: 20px;
  }

  .button--primary {
    background: var(--reward);
    box-shadow: 0 8px 20px rgb(169 96 22 / 20%);

    &:hover {
      background: #d98221;
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 7px;
    color: var(--text-muted);
    font-size: 0.7rem;
  }

  &__error {
    margin: 9px 0 0 !important;
    color: var(--danger) !important;
    font-size: 0.78rem;
    font-weight: 680;
  }
}
</style>
