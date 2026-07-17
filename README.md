# WebMatch3

WebMatch3 是“网页版三消游戏（Web Match-3）”的暂定工程名，不是正式产品名。当前仓库处于 MVP 开发阶段，首版采用 Vue 3、Vite、TypeScript 和 pnpm workspace。

## 环境要求

- Node.js 22 或更高版本
- pnpm 11.1.1

## 安装

```powershell
pnpm install
```

## 本地开发

```powershell
pnpm dev:web
```

开发服务器固定运行在 <http://localhost:5175>。

## 验证

```powershell
pnpm lint:web
pnpm typecheck:web
pnpm test:web
pnpm build:web
pnpm ci:web
```

`ci:web` 会依次运行 lint、类型检查、单元测试和生产构建。

## 目录

```text
apps/web/src/
├─ app/             应用入口、顶层装配和全局样式
├─ features/game/   棋盘规则、局内状态和游戏组件
└─ shared/          无业务归属的通用类型、工具和 UI 原语
```

项目暂不包含后端、账号、远程数据、UI 框架或全局状态库。
