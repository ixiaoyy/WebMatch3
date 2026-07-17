# 工程骨架与开发基线：实施计划

## 实施顺序

- [x] 初始化 `main` 分支 Git 仓库，并创建根 `.gitignore`、`.editorconfig`。
- [x] 创建根 `package.json` 与 `pnpm-workspace.yaml`，固定 pnpm 版本并暴露统一 Web 命令。
- [x] 创建 `apps/web` 包及 Vue、Vite、TypeScript、SCSS、ESLint、Vitest 最小配置。
- [x] 创建 `src/app` 最小启动壳，并为 `features/game`、`shared` 记录职责边界。
- [x] 安装依赖并生成 `pnpm-lock.yaml`。
- [x] 更新根 README，记录工程含义、目录结构、运行与验证命令。

## 验证命令

```powershell
pnpm install --frozen-lockfile
pnpm lint:web
pnpm typecheck:web
pnpm test:web
pnpm build:web
pnpm ci:web
```

开发服务器只做定向启动检查，确认 5175 端口可访问后立即停止。

## 风险与回滚点

- 依赖版本必须在 Node.js 22 下可安装；若最新兼容版本不满足，收窄到 pnpm lockfile 实际验证通过的版本。
- `vue-tsc`、Vite 与 TypeScript 的版本需要作为一组验证，不能只以安装成功判断兼容。
- 任何为了通过空壳检查而加入的业务占位代码都应删除，不带入后续任务。

## 完成门禁

- [x] PRD、设计与本实施计划通过 Trellis 校验。
- [x] 所有根脚本可从 `D:\work\WebMatch3` 执行。
- [x] lint、typecheck、test、build 和统一 CI 命令全部通过。
- [x] 依赖树中没有 UI 框架、状态库、请求库或动画库。
