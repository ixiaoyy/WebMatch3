<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
}>();

defineEmits<{
  cancel: [];
  confirm: [];
}>();

const cancelButton = ref<HTMLButtonElement | null>(null);
const confirmButton = ref<HTMLButtonElement | null>(null);

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== "Tab") {
    return;
  }

  const active = document.activeElement;
  if (event.shiftKey && active === cancelButton.value) {
    event.preventDefault();
    confirmButton.value?.focus();
  } else if (!event.shiftKey && active === confirmButton.value) {
    event.preventDefault();
    cancelButton.value?.focus();
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      cancelButton.value?.focus();
    }
  },
);
</script>

<template>
  <div
    v-if="visible"
    class="dialog-backdrop"
    role="presentation"
    @keydown="trapFocus"
    @keydown.esc.prevent="$emit('cancel')"
  >
    <section
      class="dialog-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-dialog-title"
      aria-describedby="restart-dialog-description"
    >
      <p class="section-kicker">重新开始</p>
      <h2 id="restart-dialog-title">换一盘新糖果？</h2>
      <p id="restart-dialog-description">
        当前进度会被清空，刚才完成的交换无法恢复。
      </p>
      <div class="dialog-card__actions">
        <button
          ref="cancelButton"
          class="button button--quiet"
          type="button"
          @click="$emit('cancel')"
        >
          继续这一局
        </button>
        <button
          ref="confirmButton"
          class="button button--danger"
          type="button"
          @click="$emit('confirm')"
        >
          重新开始
        </button>
      </div>
    </section>
  </div>
</template>
