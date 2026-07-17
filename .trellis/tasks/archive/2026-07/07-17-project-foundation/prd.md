# 工程骨架与开发基线

## Goal

建立一个沿用 ParallelLines 工程组织习惯、但仅包含消消乐 MVP 必要能力的最小 Web 工程，为后续规则、界面和测试任务提供稳定基线。

## Background

- 实施前仓库只有 Trellis 元数据与 `AGENTS.md`，尚未初始化 Git，也没有应用代码或既有工程配置。
- 本机开发基线为 Node.js 22.14.0、pnpm 11.1.1。
- 已检查同级 `D:\work\ParallelLines`：可复用其 pnpm workspace、Vue/Vite/TypeScript、扁平 ESLint 和 `app/features/shared` 分层约定；论坛业务、品牌、后端和大型依赖不在复用范围内。

## Requirements

### R1. 仓库与工作区

- 项目根目录为 `D:\work\WebMatch3`，不得在当前 Codex 临时工作空间生成项目文件。
- 使用 pnpm workspace，首版只声明 `apps/web` 包；为未来 `apps/api` 保留扩展可能，但不提前创建后端。
- 根脚本至少提供 Web 的 `dev`、`build`、`typecheck`、`lint` 和统一 CI 检查入口。
- 固定并记录 package manager 版本，生成可复现的 lockfile。

### R2. Web 技术栈

- 使用 Vue 3、Vite、TypeScript 严格模式和 SCSS。
- 依赖遵循最小化原则；没有明确使用场景时不引入 UI 框架、全局状态库、请求库或动画库。
- Vite 配置提供 `@` 到 `src` 的路径别名，并使用不与 ParallelLines 的 5174 冲突的固定本地开发端口 5175。

### R3. 前端分层

- 参考 ParallelLines 的职责分层：
  - `src/app`：应用入口、全局样式和顶层装配。
  - `src/features/game`：棋盘规则、局内状态和游戏组件。
  - `src/shared`：无业务归属的通用工具、类型或 UI 原语。
- 不为“看起来架构完整”而提前创建空的 `entities`、`pages`、`api` 或 `router` 层。
- 核心规则与 Vue 组件分离，避免业务逻辑直接堆在根组件中。

### R4. 质量基线

- 配置 ESLint、Vue TypeScript 检查和生产构建。
- 使用 Vitest 为核心规则测试预留无浏览器测试运行器；具体规则用例由后续任务补齐。
- `.gitignore` 覆盖依赖、构建产物、测试报告、日志和 TypeScript 临时文件。
- README 说明工程名含义、运行命令、验证命令和项目阶段。

### R5. 范围约束

- 不复制 ParallelLines 的品牌资产、论坛组件、Ant Design 配置、API 客户端、PWA、Docker、Nginx 或 CI 工作流。
- 不实现棋盘逻辑或产品视觉，仅创建后续任务所需的最小可启动壳。
- 不建立后端、数据库、鉴权或环境变量体系。

## Acceptance Criteria

- [x] AC1：从仓库根目录执行一次依赖安装后，开发服务器可启动并显示最小应用壳。
- [x] AC2：根目录存在可用的 `dev:web`、`build:web`、`typecheck:web`、`lint:web` 和 `ci:web` 脚本。
- [x] AC3：`apps/web/src` 的目录职责与本 PRD 一致，没有复制 ParallelLines 的业务或品牌代码。
- [x] AC4：TypeScript 严格模式、路径别名、ESLint 和 SCSS 可正常工作。
- [x] AC5：lint、typecheck 和 production build 在空壳阶段全部通过。
- [x] AC6：仓库中没有后端、UI 大型依赖或未被使用的脚手架模块。

## Dependencies

- 无。此任务是父任务树中的首个实现任务。

## Out of Scope

- 游戏规则、游戏状态、视觉设计、响应式棋盘和浏览器流程测试。
- 部署、域名、HTTPS、容器和远程 CI。
