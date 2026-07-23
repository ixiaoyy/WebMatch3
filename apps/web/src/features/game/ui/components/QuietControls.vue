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
  top: max(var(--quiet-controls-top, 16px), env(safe-area-inset-top));
  right: max(var(--quiet-controls-right, 18px), env(safe-area-inset-right));
  display: flex;
  gap: var(--quiet-controls-gap, 8px);
  opacity: 0.56;
  transition: opacity 160ms ease;

  &:hover,
  &:focus-within {
    opacity: 1;
  }

  button {
    min-width: var(--quiet-control-min-width, 64px);
    min-height: var(--quiet-control-min-height, 48px);
    padding: var(--quiet-control-padding, 9px 15px);
    border: 1px solid var(--quiet-line);
    border-radius: 999px;
    color: var(--ink-muted);
    background: var(--quiet-surface-strong);
    box-shadow: 0 6px 8px rgb(57 70 112 / 8%);
    font-size: var(--quiet-control-font-size, 14px);
    font-weight: 680;
    cursor: pointer;
    backdrop-filter: blur(10px);
  }
}

@media (hover: none) {
  .quiet-controls {
    opacity: 0.58;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiet-controls {
    transition: none;
  }
}
</style>
