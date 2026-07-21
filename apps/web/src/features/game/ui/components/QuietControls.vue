<script setup lang="ts">
defineProps<{ soundEnabled: boolean; pipSupported: boolean; pipOpen: boolean }>();
const emit = defineEmits<{
  toggleSound: [];
  togglePip: [];
}>();
</script>

<template>
  <nav class="quiet-controls" aria-label="安静设置">
    <button type="button" @click="emit('toggleSound')">
      {{ soundEnabled ? "声音开" : "静音" }}
    </button>
    <button v-if="pipSupported" type="button" @click="emit('togglePip')">
      {{ pipOpen ? "回到页面" : "小窗" }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.quiet-controls {
  position: absolute;
  z-index: 12;
  top: max(16px, env(safe-area-inset-top));
  right: max(18px, env(safe-area-inset-right));
  display: flex;
  gap: 6px;
  opacity: 0.32;
  transition: opacity 160ms ease;

  &:hover,
  &:focus-within {
    opacity: 1;
  }

  button {
    min-width: 48px;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--quiet-line);
    border-radius: 999px;
    color: var(--ink-muted);
    background: var(--quiet-surface);
    box-shadow: 0 8px 20px rgb(57 70 112 / 8%);
    font-size: 12px;
    font-weight: 680;
    cursor: pointer;
    backdrop-filter: blur(10px);
  }
}
</style>
