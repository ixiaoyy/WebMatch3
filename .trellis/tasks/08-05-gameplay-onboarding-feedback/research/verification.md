# 验证记录

验证日期：2026-08-05。

## 自动化检查

- 聚焦测试：`spotlight.test.ts`、`ambient-controller.test.ts`、`game-ui.test.ts`，共 `45/45` 通过。
- 最终 `pnpm ci:web`：lint、typecheck、`7` 个测试文件共 `83/83`、生产构建和 PWA 构建全部通过。
- Impeccable detector：变更 UI 文件返回 `[]`，未发现规则命中。
- React Doctor：仓库为 Vue 项目，React 专属规则不适用；工具评分 `94`，唯一提示是 `spotlight.ts` 既有布局代码中的 `.filter().map()`，不属于本任务新增路径，未扩大修改范围。

## `1280×720` 浏览器实玩

- 初始画面显示“移动光圈找鱼，凑齐 3 条同类”；首次成功选鱼后提示消失，单纯移动光圈不会提前移除。
- 键盘光圈能区分正式 revealed 与外圈 hinted；外圈鱼保持不可选。
- 修复前猫素材透明区域会命中猫容器；修复后同一区域命中下方鱼，猫身体上的姿态触发区仍能正常打开菜单。
- 猫菜单可操作；“帮我抓鱼”到达后只有一个 guarded ID，目标出现“这里”，选中后标记移除且猫回家。
- 普通三消显示“植物 +1 成长”；最终状态没有残留鱼或猫的整块矩形焦点框。
- 清空第一群后进入 `42` 条、`4` 种鱼的新群，显示“新鱼群 · 4 种鱼 · 更深堆叠”，约一秒后自动消失并解除输入锁。
- 控制台只有 Vite 开发日志与热更新记录，没有 warning/error。

## 截图证据

- `qa/01-initial-desktop.jpg`：开局可见提示与顶部控制。
- `qa/02-spotlight-desktop.jpg`：搜索光圈、正式显影与外圈预告。
- `qa/03-cat-guide-desktop.jpg`：猫协助目标的“这里”标记。
- `qa/04-cat-focus-desktop.jpg`：猫的局部焦点反馈。
- `qa/05-level-cue-desktop.jpg`：第二群的动态品种数提示。
- `qa/07-growth-cue-focus-fixed.jpg`：植物成长提示与焦点残留修复。

`qa/06-growth-cue-desktop.jpg` 记录了修复焦点残留前的中间状态，仅作为问题对照。

## 环境限制

内置浏览器不提供 viewport 调整，且浏览器安全策略拒绝用 data URL 外层页面模拟窄屏，因此未完成 `430×560`、`320×568`、`320×240`、真实触摸和 `prefers-reduced-motion` 的运行时重放。对应 compact/reduced-motion 分支已通过源码检查、类型检查与生产构建；本记录不将受限项标记为已实玩通过。

本任务未连接数据库，未修改引擎规则、持久化结构、图片资产或迁移。
