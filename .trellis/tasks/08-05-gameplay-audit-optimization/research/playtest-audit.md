# 2026-08-05 试玩证据与代码映射

## Tested environment

- Codex 内置浏览器。
- 桌面视口：`1280×720`。
- 窄屏视口：`320×568`。
- 核心路径已实际触发：探照灯搜索、入托盘、三条同类消除、植物反馈、小猫寻鱼、方向键与 Enter、`F` 喂猫、喂食补齐、刷新新局、声音偏好保留。
- 试玩期间未观察到页面 console warning/error，320px 未出现横向滚动。

原始报告：

`C:\Users\phpxi\.codex\visualizations\2026\08\05\019fcfa0-b406-7300-9ff4-91c0aa8a2e2a\ambient-fish-audit\audit-report.md`

## Finding 1 — wrong fish can be selected

- 桌面与窄屏各复现一次；稳定展开后一条锦鲤的可达宽度约 `23.6px`，中心仍被邻鱼覆盖。
- 截图：`13-unintended-selection.png`、`14-overlap-target.png`。
- `FishField.vue` 当前把每对显影 blocker 以固定像素推开，最终偏移限制为 `32px`；没有验证所有命中核心互不重叠。
- `FishPiece.vue` 的 felt 图和按钮共享 `62–88px` 透明矩形，浏览器按顶层矩形分发 pointer event，透明区域可能截获下层可见鱼。
- 产品契约要求至少 44px 有效目标，并要求显影鱼群轻微展开以暴露独立 pointer target。

## Finding 2 — narrow cat menu remains visible

- `320×568` 选择“帮我抓鱼”后，小猫进入守鱼路径，但菜单仍覆盖猫/植物区域；选中守护鱼后消失。
- 截图：`11-narrow-cat-search.png`；桌面正常对照为 `05-cat-search.png`。
- 当前 `CatCompanion.vue` 的 `chooseSearch()` 先执行 `closeInteraction(true)` 再 emit，且 travel phase 离开 `home` 时也会关闭。因此需要验证是离场过渡节点、事件时序、运行旧产物还是其他窄屏条件，不能直接假定缺少 close 调用。

## Finding 3 — keyboard miss has no feedback

- 移动探照灯到空区域后按 Enter 多次，live region 仍显示上一次三消成功结果。
- 截图：`15-keyboard-empty-search.png`。
- `FishField.vue:onSurfaceKeydown` 只有找到 `findNearestRevealedPiece` 时才 emit `activate`，无目标分支没有事件；`GameView.vue` 的 live region 只展示 controller `status`。

## Finding 4 — unsupported PiP control remains visible

- 试玩环境中查询不到可用的 Document Picture-in-Picture，但页面仍显示“小窗”；点击无可感知结果。
- 截图：`17-unsupported-small-window.png`。
- 当前 `document-pip.ts` 使用 `Boolean(api)`，`QuietControls.vue` 又以 `v-if="pipSupported"` 控制按钮。源码与运行态冲突，需核对 API namespace 是否存在但方法不可调用，以及 PWA `autoUpdate`/缓存与实际加载构建。
- 产品契约明确：API 不可用时不显示按钮或警告；请求被拒绝时保留同一 surface 和状态。

## Opportunity — cat match awareness

- 当前 `ambient-controller.ts` 在已过滤的隐藏合法候选中，选择最接近猫起点 `(0.12, 0.74)` 的鱼。
- 试玩时托盘已有两条鲸鱼，小猫找到沙丁鱼，增加了一个可避免的托盘槽位。
- `PRODUCT.md` 只承诺找到“一条隐藏合法鱼”，没有承诺补齐对子。因此配对优先属于待确认产品增强，不应伪装成缺陷修复。

## Initial evidence gaps (resolved or qualified below)

- 初始试玩尚未清空首片鱼场；本轮实现验证已补齐。
- 初始试玩尚未构造七条不匹配满托盘；本轮实现验证已补齐。
- 尚未在真实触屏、支持 Document PiP 的 Chromium 环境和真实屏幕阅读器中验证。
- 截图和 DOM 检查不能代表完整 WCAG 认证。

## 2026-08-05 implementation verification

### Runtime alignment

- 干净当前源码开发服务实际绑定 `0.0.0.0:5175` 后，Codex 内置浏览器可稳定加载；最初仅绑定 `::1` 时，内置浏览器刷新进入离线壳，属于测试服务监听地址差异，不是 Vue 空白页。
- 当前源码在 `320×568` 中选择“帮我抓鱼”后没有复现旧截图的持久菜单；menu/menuitem 同步离开可访问树。为覆盖 Vue 离场节点窗口，离场 hook 仍把保留节点设为 inert、`aria-hidden`、`pointer-events:none`。
- PiP 隔离 evaluator 报告 API 不存在，但临时主应用 world 探针证明 `documentPictureInPicture` 为对象且 `requestWindow` 可调用；临时探针已删除。内置浏览器的原生请求会挂起 Promise 和 document timers，因此只能确认同步“正在打开小窗”反馈，不能把该 harness 当作成功或拒绝结果。缺失、不可调用、拒绝、永久 pending、成功和恢复由控制器单测覆盖。
- 最终 `pnpm ci:web` 只运行一次并通过；生产 preview `127.0.0.1:4175` 的 `index.html`、`manifest.webmanifest`、`sw.js` 均返回 HTTP 200，入口包含 `#app`。

### Fixed-path browser evidence

- `320×568` 初始显影的两个鱼按钮实测均为 `44×44px`，中心命中自身，矩形互不重叠；鼠标点击锦鲤后只向托盘增加一条锦鲤。
- 托盘已有一条锦鲤时请求小猫寻鱼，新增守护目标为 `kind=koi`；两条/一条/零条的完整优先矩阵由确定性 controller 测试覆盖。
- 键盘把光移到左上空区后 Enter 显示“这里还没有照到小鱼，继续移动探照灯。”；鱼场仍为 36 条、托盘仍为 0。
- 通过真实 UI/controller 交互清空首片 36 条鱼，下一片立即为 42 条；随后按四种鱼 `2/2/2/1` 装满七格，loss preview 时新稳定场为 36 条，1.2 秒后托盘清空并显示新的第一局提示。
- `320×568`、`430×560`、`1280×720` 的 body `scrollWidth/scrollHeight` 均等于 viewport；桌面显影组的七个按钮仍全部为 `44×44px`。三个视口截图中猫、植物、托盘和静音/小窗控制保持可见。
- 聚焦回归：`38/38`；最终全量：`7` 个测试文件、`82/82` 用例通过，ESLint、Vue typecheck、Vite/PWA production build 通过。

### Remaining environment limits

- 本轮没有真实触屏设备、真实屏幕阅读器或可由自动化完整控制的 Document PiP Chromium；这些不能由 DOM/单测冒充。
- 当前修复后未重新截取 `320×240`，其安全边界由纯投影 compact fixture 和既有 compact CSS 契约覆盖；本轮实际截图覆盖 `320×568` 与 `430×560`。
