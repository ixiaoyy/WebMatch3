# 技术设计

## 1. 边界与原则

本任务只增强现有 UI 投影和反馈编排：

```text
pointer / touch / keyboard
  → FishField transient light
  → existing controller actions
  → existing pure engine transition
  → controller feedback enum
  → GameView / FishPiece / Plant / Cat / Controls presentation
```

- canonical 鱼坐标、发现半径、阻挡关系、三消与持久化结构保持不变。
- 视觉提示使用既有 controller/session，不新增教程状态或第二个 Vue mount。
- 反馈以现有 `GameFeedback` 和组件 `data-*` 状态为主，避免每个组件重复建立业务计时器。

## 2. 开局提示

`GameView.vue` 增加 session-local `playHintDismissed`。提示在第一群、未成功选鱼且非 loss/level feedback 时显示；`FishField` 的有效 `activate` 事件先关闭提示，再调用 controller。指针移动只接管原有 intro，不关闭可见提示。

提示位于托盘上方的开放区域，使用短句和半透明材质，不截获指针。它不进入 live region，避免和现有 controller status 重复播报。

## 3. 搜索边界与淡轮廓

在 `spotlight.ts` 中抽取一个带方法级契约的椭圆距离 helper，使正式显影和外圈预告共用同一距离公式：

- `distance <= 1`：沿用现有 revealed 行为；
- `1 < distance <= 1.35`：只返回 hinted ID；
- 其他：完全隐藏。

`FishField.vue` 仅在有真实 pointer/keyboard light 或 intro light 时计算 hinted IDs，并将 `hinted` 传给 `FishPiece.vue`。hinted button 保持 `pointer-events: none`、不进入 revealed set、不参与目标分离。光圈 lens 提高边界对比，并用克制呼吸而非“等待进度”表达活动状态。

## 4. 三消和换群反馈

`GrowingPlant.vue` 在 `celebrating` 时渲染短暂的“植物 +1 成长”视觉标记，并增强当前 plant reward animation。无障碍播报继续由 `GameView` 的现有 polite live region 提供。

`GameView.vue` 从当前 pieces 计算实际品种数；`feedback === "level"` 时显示 transient level cue。controller 把 level feedback 时长集中为常量并延长到约 `960ms`，普通 clear/settle 时长保持不变。提示不展示内部 level number。

## 5. 小猫命中与协助目标

`CatCompanion.vue` 将视觉图片、睡眠标记和气泡移出按钮节点。透明按钮成为独立覆盖层，并按姿态使用两组尺寸：

- 站立/进食/吃饱：覆盖身体和头部主体；
- 趴卧/睡眠：覆盖横向身体主体。

图片保持 `pointer-events: none`。focus-visible 通过图片 alpha 的 drop-shadow 呈现轮廓，不使用完整容器 outline。菜单仍是 root 的独立兄弟节点，因此命中区变化不影响 menu lifecycle。

`FishPiece.vue` 增加 `guided` 表现状态：暖色轮廓和视觉-only“这里”标签。ID 来源仍是 controller 的 guarded piece；解决目标后现有 return-home 流程自然撤销标记。

## 6. 顶部控制

`QuietControls.vue` 提高静止透明度、边框和文字对比，保留 hover/focus 的进一步增强。触摸设备直接使用可读状态，不依赖 hover。

## 7. 验证与回滚

- `spotlight.test.ts`：椭圆正式半径与 `1.35` 外圈、空 light、边界排除。
- `ambient-controller.test.ts`：level feedback 延长且最终恢复 idle；现有 intro、clear、loss 时序不回归。
- lint/typecheck/test/build 由最终一次 `pnpm ci:web` 覆盖。
- 浏览器验证 desktop、narrow、short、reduced-motion；重点检查猫命中、提示退场、目标标记和完整换群。
- 所有更改均为 UI-only，可按组件独立回滚；没有快照迁移或数据库回滚。
