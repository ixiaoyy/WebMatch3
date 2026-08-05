# 实现计划

## Phase 1 — 反馈状态与纯函数保护

- [x] 为 spotlight 外圈预告补充失败测试，并复用正式显影的椭圆距离公式。
- [x] 为 level feedback 时长补充 controller 回归断言。
- [x] 确认现有 intro、selection、clear、level 和 guarded-piece 事件边界不需要新增引擎状态。

## Phase 2 — 开局、搜索与换群提示

- [x] 在 `GameView.vue` 增加首次成功选鱼前的非阻断提示与实际品种数换群提示。
- [x] 在 `spotlight.ts`、`FishField.vue` 和 `FishPiece.vue` 增加不可点击的外圈淡轮廓。
- [x] 提高 pointer/guided spotlight 边界可见度，保留 reduced-motion 等价状态。
- [x] 将 level feedback 延长到约 `960ms`，普通三消和选择时长不变。

## Phase 3 — 植物、小猫与控制细节

- [x] 增强 `GrowingPlant.vue` 的三消回应并加入“植物 +1 成长”瞬时标记。
- [x] 重构 `CatCompanion.vue` 的视觉层和姿态命中覆盖层，使用 alpha 轮廓焦点反馈。
- [x] 为 guarded fish 增加暖色轮廓与“这里”标记。
- [x] 提高 `QuietControls.vue` 静止、触摸和键盘状态对比度。

## Phase 4 — 聚焦验证

- [x] 运行 `pnpm --dir apps/web test -- spotlight.test.ts ambient-controller.test.ts game-ui.test.ts`。
- [x] 运行最小 lint/typecheck；修复后在最终代码状态运行一次 `pnpm ci:web`。
- [x] 运行 Impeccable detector；运行 React Doctor 并记录它对 Vue-only diff 的适用结果。

## Phase 5 — 实玩与收尾

- [x] 在 `1280×720` 完成首次显影、首次选择、首次三消、小猫协助和第一群清空到第二群。
- [ ] 在 `430×560`、`320×568`、`320×240` 检查提示、菜单、控制和 overflow；检查 reduced-motion。
- [x] 核对控制台、可访问名称、44px 目标和猫透明区域命中。
- [x] 按 AC 更新 PRD/清单，核对完整 diff，只暂存本任务生产代码与任务产物，保留既有未跟踪文件。

窄屏、触摸与 reduced-motion 的真实浏览器重放受内置浏览器固定 viewport 与 data URL 安全策略限制；未伪造通过，详细证据见 `research/verification.md`。

## Validation commands

```powershell
pnpm --dir apps/web test -- spotlight.test.ts ambient-controller.test.ts game-ui.test.ts
pnpm ci:web
node C:\Users\phpxi\.codex\skills\impeccable\scripts\detect.mjs --json <changed-ui-files>
npx -y react-doctor@latest . --verbose --diff
```

## Rollback points

- hinted silhouette helper 与 FishPiece 表现可一起回滚，不影响正式 revealed set。
- GameView 提示和 level duration 可独立回滚，不影响 engine progression。
- CatCompanion 命中层重构可独立回滚，drag-to-cat drop target 不在该组件内。
