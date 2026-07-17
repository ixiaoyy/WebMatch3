# Fresh Glass UI 重构设计

## Boundary

```text
validated candy PNGs
  -> tile presentation mapping
  -> GameTile <img>
  -> existing phase/state classes

global tokens
  -> GameView responsive shell
  -> HUD / board / actions / dialogs

engine + createGameController
  -> unchanged
```

组件只接收展示数据和现有事件，不推断交换或消除规则。图片固有尺寸由 CSS
统一约束，状态样式继续落在 tile 根节点，避免破坏既有动画选择器。

## Execution slices

1. 展示类型、素材映射与相关测试。
2. 全局 token、按钮、焦点、弹窗和 motion fallback。
3. GameView 桌面/平板/移动布局。
4. HUD、棋盘、棋子、说明和状态样式。
5. 定向测试与构建修复。

每个 slice 可独立验证；本任务不做参考图逐像素比较。

## Rollback

按 slice 回退对应展示契约、样式或组件文件；六张素材属于上游任务，不随本任务
回退删除。
