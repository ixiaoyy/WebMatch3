# 工程骨架与开发基线：技术设计

## 架构边界

仓库采用单包 pnpm workspace。根目录只负责统一命令和工作区元数据；所有浏览器运行时代码位于 `apps/web`。

```text
WebMatch3/
├─ package.json
├─ pnpm-workspace.yaml
├─ pnpm-lock.yaml
└─ apps/web/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.ts
   ├─ tsconfig.json
   ├─ eslint.config.mjs
   └─ src/
      ├─ app/             # 入口、顶层装配、全局样式
      ├─ features/game/   # 后续棋盘规则、局内状态和组件
      └─ shared/          # 后续无业务归属的类型、工具和 UI 原语
```

本任务只实现 `app` 中的最小启动壳；`features/game` 与 `shared` 只记录职责，不加入虚假抽象或占位业务代码。

## 工具链契约

- 根命令：`dev:web`、`build:web`、`typecheck:web`、`lint:web`、`test:web`、`ci:web`。
- `ci:web` 顺序执行 lint、typecheck、测试和 production build。
- Vitest 允许本任务阶段没有测试文件；核心引擎任务加入用例后沿用同一命令。
- TypeScript 使用严格模式、Bundler 模块解析和 `@/* → src/*`。
- Vite 开发服务器固定使用 5175；生产输出保持默认静态 `dist/`。
- ESLint 检查 TypeScript 与 Vue 文件，警告视为失败。

## 应用数据流

`index.html` 加载 `src/app/main.ts`，入口挂载 `src/app/App.vue` 并导入全局 SCSS。当前壳不创建路由、全局 store、网络层或游戏状态。后续任务通过 `features/game` 接入，不改变根工具链契约。

## 兼容性

- Node.js 22.x。
- pnpm 11.1.1，由根 `packageManager` 固定。
- 浏览器目标由 Vite 默认现代浏览器基线承担；本任务不引入兼容性 polyfill。

## 取舍

- 使用手写最小配置而不是完整脚手架输出，避免示例组件、测试资产和无关依赖。
- 现在加入 Vitest，因为核心引擎立即依赖确定性单元测试；不加入 DOM 测试库，因为本任务和下一核心任务都不需要。
- 不复制 ParallelLines 的 manual chunk、API proxy 或业务依赖，因为当前应用没有对应运行时需求。

## 回滚

本任务没有数据迁移或外部资源。若某项工具链配置失败，可按文件回退；删除 `node_modules` 与 `pnpm-lock.yaml` 后重新安装即可验证依赖解析，不影响业务数据。
