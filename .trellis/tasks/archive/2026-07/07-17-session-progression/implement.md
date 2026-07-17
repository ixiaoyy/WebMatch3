# 局内进度与本机排行榜实施计划

## Ordered checkpoints

1. 新增 session 类型、姓名校验、计分纯函数及定向单元测试。
2. 新增版本化本地存储、本周/本月/总排行筛选、按玩家最佳成绩去重、
   排序/截断/迁移/损坏回退及定向单元测试。
3. 将 session 状态接入 `createGameController`，覆盖扣步、计分、胜负、单次落盘、
   同名新局和换玩家。
4. 新增姓名开始弹窗和排行榜组件，排行榜使用默认头像、前三名层级、当前玩家
   高亮与三个周期切换，并接入 HUD、结果层和 Fresh Glass 响应式布局。
5. 用固定种子模拟校准步数/目标分，将结果写回 `design.md`。
6. 运行 focused tests、lint、typecheck、全量测试、production build 和浏览器流程。

## Validation

```powershell
pnpm --dir apps/web test -- session
pnpm --dir apps/web test -- game-ui
pnpm ci:web
```

浏览器验证：

- 姓名错误与有效开始。
- 有效/无效交换对步数的不同影响。
- 胜利或失败只出现一次结果、只写入一次排行。
- 同名再来一局与换玩家。
- 本周/本月/总排行切换、按玩家最佳成绩去重、前三名/列表/当前玩家高亮、
  空态与移动端布局。

## Rollback points

- Checkpoint 1–2 均为纯模块，可独立回退。
- Checkpoint 3 若破坏动画时序，恢复控制器并保留已验证纯模块。
- Checkpoint 4 若焦点或响应式失败，恢复组件接线，不改 session/引擎。
- 不修改引擎公共类型、交换算法或随机源。
