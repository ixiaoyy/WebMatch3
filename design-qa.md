# WebMatch3 Fresh Glass 页面 Design QA

## 对照目标与证据

- 视觉源：
  `.trellis/spec/frontend/assets/fresh-glass-candy-reference.png`
- 桌面实现：
  `.trellis/tasks/07-17-fresh-glass-candy-visual-redesign/research/final-1440x900.jpg`
- 移动端实现：
  `.trellis/tasks/07-17-fresh-glass-candy-visual-redesign/research/final-320x568.jpg`
- 其余响应式捕获：
  - `.trellis/tasks/07-17-fresh-glass-candy-visual-redesign/research/final-390x844.jpg`
  - `.trellis/tasks/07-17-fresh-glass-candy-visual-redesign/research/final-768x1024.jpg`
- 同一对照输入（上排全景、下排棋盘重点区域，左侧参考、右侧实现）：
  `.trellis/tasks/07-17-fresh-glass-candy-visual-redesign/research/reference-vs-final.png`

实现截图使用玩家“设计对照”、0 分、18 步、玩法折叠的可操作初始局面。
参考图为固定的 1491×1055 视觉源；实现按项目验收视口 1440×900
捕获后，在同一画布内等比缩放进行全景和重点区域比较。

## 最终视觉判断

未发现剩余的 P0、P1 或 P2 视觉问题。

- 构图：实现已经形成与参考一致的“横向玻璃顶栏 + 左侧目标进度 +
  中央高对比棋盘 + 右侧操作栏”主结构。真实排行榜继续保留在右栏，
  没有伪造关卡号、糖果收集目标、音效设置或道具库存。
- 顶栏：从原先无承载的 68px 标题行改为 88px 全宽玻璃状态栏，并使用
  现有玫瑰糖果 PNG 作为产品标记；标题、玩家、会话状态和棋盘规格均来自
  当前产品信息。
- HUD：分数与目标形成真实进度层，剩余步数成为主视觉，连击降为次级；
  桌面 HUD 与棋盘等高，320px 下压缩为两行状态条。
- 棋盘：8×8 棋盘保持正方形；蓝灰底色、亮色玻璃边和内高光更接近参考，
  六类糖果继续使用既有合规 PNG，没有重新生成或替换已验收素材。
- 右栏：源码顺序改为“操作 → 排行榜”，与移动端视觉、读屏和 Tab 顺序
  一致。玩法默认折叠，展开后仍保留三步说明和键盘提示。
- 玻璃层级：共享 token 统一为 24px 面板圆角、20px 模糊和柔和长阴影；
  页面背景使用低饱和天蓝到淡紫渐变，棋盘仍是最高对比的大面积表面。

## 响应式实测

| 视口 | 文档 client / scroll 宽度 | 棋盘 | 结果 |
|---|---:|---:|---|
| 320×568 | 305 / 305 | 275×275 | 无横向溢出，首屏显示完整棋盘 |
| 390×844 | 375 / 375 | 345×345 | 无横向溢出，操作区紧随棋盘 |
| 768×1024 | 753 / 753 | 467×467 | 双栏布局稳定，排行榜置于主区域下方 |
| 1440×900 | 1440 / 1440 | 680×680 | `scrollHeight = 900`，首屏无纵向滚动 |

所有视口均保留 safe-area 内边距，棋盘宽高相等。320 和 390 使用单栏
`HUD → 棋盘 → 操作 → 排行榜`；768 使用左侧 HUD/操作与右侧棋盘，
排行榜作为次级内容横跨下方。

## 交互与可访问性证据

- “查看玩法”可展开“三步上手”，“收起玩法说明”可恢复折叠状态。
- “重新开始”打开确认弹窗，“继续这一局”关闭弹窗且不重置当前局。
- 键盘在首格按 Enter 后 `aria-selected` 变为 `true`，按 Escape 后恢复
  `false`。
- 排行榜标签在粗指针和移动端至少 44px 高；按钮、主操作继续使用全局
  44px 最小触摸目标。
- 排行榜焦点轮廓使用现有 `--primary-strong` token，不再引用不存在的
  `--focus-ring`。
- 浏览器桌面与移动验证页均无 console error 或 warning。
- `prefers-reduced-motion` 的全局和棋盘分支保留，未改变游戏结算时序。

## 比较历史

### 基线

- 1440×900 页面 `scrollHeight = 951`，出现纵向滚动。
- 顶栏 68px 且无玻璃承载。
- HUD 为 220×287 的等权 2×2 指标卡，棋盘为 636×636，右栏宽 310px。
- 默认展开玩法，加上排行榜后右栏文字密度高；移动端用 CSS `order`
  修补视觉顺序，导致视觉和键盘顺序不一致。

### 修正后

- 1440×900 页面高度收敛为 900，棋盘扩大到 680×680。
- 桌面三栏调整为 230 / 700 / 250，右栏不再挤占棋盘。
- HUD、操作、排行榜改为真实信息主次与真实 DOM 顺序。
- 320、390、768 和 1440 均通过正方形棋盘与横向溢出检查。

## 工程门禁

- `pnpm ci:web`：通过。
- ESLint：通过。
- Vue/TypeScript typecheck：通过。
- Vitest：6 个文件、51 个测试全部通过。
- Vite production build：通过。

final result: passed
