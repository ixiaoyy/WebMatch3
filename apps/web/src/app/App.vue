<script setup lang="ts">
const foundationChecks = [
  "Vue 3 应用入口",
  "TypeScript 严格模式",
  "SCSS 全局样式",
  "ESLint 与 Vitest 基线",
] as const;
</script>

<template>
  <main class="app-shell">
    <section class="foundation-card" aria-labelledby="page-title">
      <p class="foundation-card__eyebrow">MVP foundation</p>
      <h1 id="page-title">WebMatch3</h1>
      <p class="foundation-card__summary">
        工程骨架已就绪。三消规则与可玩界面将在后续任务中接入。
      </p>

      <ul class="foundation-card__checks" aria-label="已启用的工程能力">
        <li v-for="check in foundationChecks" :key="check">
          {{ check }}
        </li>
      </ul>
    </section>
  </main>
</template>
