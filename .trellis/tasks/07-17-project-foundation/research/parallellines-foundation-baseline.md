# ParallelLines 工程基线调研

## 检查范围

- `D:\work\ParallelLines\package.json`
- `D:\work\ParallelLines\pnpm-workspace.yaml`
- `D:\work\ParallelLines\apps\web\package.json`
- `D:\work\ParallelLines\apps\web\vite.config.ts`
- `D:\work\ParallelLines\apps\web\tsconfig.json`
- `D:\work\ParallelLines\apps\web\eslint.config.mjs`
- `D:\work\ParallelLines\.gitignore`
- `D:\work\ParallelLines\README.md`

## 可复用约定

- 根目录使用 pnpm workspace，并通过 `pnpm --dir apps/web <script>` 暴露 Web 命令。
- package manager 固定为 `pnpm@11.1.1`。
- Web 包使用 ESM、Vue 3、Vite、TypeScript 严格模式、SCSS。
- `@` 映射到 `apps/web/src`。
- ESLint 使用 `eslint-plugin-vue` 与 `@vue/eslint-config-typescript` 的 flat config。
- 前端按 `app`、`features`、`shared` 职责分层。

## 明确不复用

- Ant Design Vue、Pinia、Vue Router、TanStack Query、ECharts、Markdown 编辑器等论坛业务依赖。
- API 代理、OpenAPI 生成、Playwright 论坛流程、Docker、Nginx、后端与部署配置。
- ParallelLines 的名称、文案、色板和品牌资产。

## WebMatch3 落地决策

- Node.js 目标为当前可用的 22.x，pnpm 固定为 11.1.1。
- 本地开发端口使用 5175，避免和 ParallelLines 的 5174 冲突。
- 保留 `app/features/game/shared` 三层；不提前创建 `entities/pages/api/router`。
- 加入 Vitest 作为后续纯 TypeScript 规则测试运行器，不在本任务编写游戏规则测试。
