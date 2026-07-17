# Fresh Glass UI 重构实施计划

## Ordered checkpoints

1. 确认六张最终素材及 inventory 验证均完成，只读取最终资产文件名。
2. 修改 tile presentation 类型、素材 URL 和定向测试；通过后落盘停止。
3. 重构全局 token、按钮、焦点、弹窗、blur fallback 和 reduced motion；定向检查。
4. 重构 GameView 响应式 shell；只做 DOM/CSS 尺寸 smoke check，不截全套图片。
5. 重构 HUD、board、tile、instructions、restart 和 result 样式；定向检查。
6. 运行最小相关测试、lint、typecheck、全量单测和 production build。

## Stop rules

- 不打开 `generated_images` 下的任何源图。
- 不打开原尺寸参考图；视觉精调属于后续 QA 子任务。
- 一轮不跨越两个 checkpoint；失败结果写入当前 checkpoint 后再修复。
- 不修改引擎规则、随机源或控制器阶段顺序。

## Validation

```powershell
pnpm --dir apps/web test -- game-ui
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```
