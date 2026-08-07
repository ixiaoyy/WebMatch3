# 猫咪轻养成与小鱼合成 — 技术设计

## 1. 设计边界

本任务保持当前单页、无棋盘、无常驻 HUD 的桌面体验，重写以下完整数据流：

```text
隐藏小鱼 → 托盘 → 三条同种判定 → 大尺寸鱼合成
  → 自动送达猫咪 → 永久亲密进度 → 短暂猫咪动作 / 环境变化
```

- `engine` 只拥有完整小鱼、生成、托盘判定、失败与换群，不依赖 Vue、DOM、计时器或存储。
- `session` 只负责版本化本地快照、校验和旧版本迁移。
- `ambient-controller` 编排自动喂食、猫咪动作优先级、状态文案与持久化。
- Vue 组件只渲染投影状态、测量飞行动画端点并发出输入意图。
- 不新增后端、数据库、路由、依赖或第二套游戏状态。

## 2. 小鱼模型与可解生成

`PilePiece` 和 `TrayPiece` 继续只携带稳定 `id` 与 `kind`；场上和托盘均显示轮廓完整的小尺寸毛毡鱼，不再增加身体部位字段。

删除 `FedFish`、`AmbientGameState.fed`、`feedPiece` 和喂鱼抵扣合成规则。生成器继续先为每个鱼种分配可被 3 整除的数量，再把每个逻辑三元组分散到空间组中。因此每种鱼始终可以全部合法消除，首屏发现区仍放置同种三条并跨至少两个图层。

`hasQuickMatch`、`hasDiscoverableMatch` 和开场目标都使用“同种数量至少 3”的规则。猫咪寻鱼按托盘已有同种数量排序：能补齐第三条的鱼优先，其次已有一条的鱼，尚未成组的鱼最后。

## 3. 托盘判定与自动喂食事件

`selectPiece` 仍是唯一生产级选择入口。小鱼进入七格托盘后，只要同种数量达到三条，就取最早进入的三条并返回 `kind: "combined"`：

```ts
interface CombinedSelection {
  readonly kind: "combined";
  readonly state: AmbientGameState;
  readonly selected: TrayPiece;
  readonly combined: readonly [TrayPiece, TrayPiece, TrayPiece];
  readonly fishKind: FishKind;
  readonly levelAdvanced: boolean;
}
```

混合鱼种或不足三条不会误触发。合法合成优先于七格失败；第七格没有形成同种三条时才触发原有无惩罚重排。每次合成同时增加植物使用的 `clearCount`。

controller 立即持久化已完成的游戏状态和猫咪进度，再发布只存在于内存的 `CompletedFishEvent`。表现动画不得反向修改 canonical state；动画结束后玩家继续选择，猫咪短暂休息也不构成喂食上限。

## 4. 小鱼聚拢、大鱼形成与送达

场上小鱼视觉尺寸下调，同时保留不小于 44px 的交互命中区；托盘同样显示较小的完整鱼。合成反馈分三拍：

1. 托盘中的三条合法小鱼向中心靠拢；
2. 小鱼淡出，一条约两倍视觉尺寸的大鱼清晰显现；
3. 大鱼沿轻微弧线飞向猫咪当前位置，猫咪同步切换到进食动作。

`GameView` 只测量托盘和猫咪可见容器中心，换算成 surface-local CSS 变量交给 `FishDelivery.vue`；坐标不写回引擎或存档。若猫咪正在找鱼，送达目标使用其当前实际位置。reduced-motion 下省略聚拢和飞行，只在猫咪旁静态显示大鱼并切换进食姿态。

## 5. 无限喂食与亲密阶段

快照中的 `pet` 扩展为：

```ts
interface AmbientPetProgress {
  readonly guardedPieceId: string | null;
  readonly fishFedCount: number;
}
```

`fishFedCount` 是非负安全整数，每条自动送达的大鱼加一，不设上限。亲密阶段由计数派生而不重复持久化：

- `newcomer`: 0–2 条，基础互动；
- `familiar`: 3–8 条，猫咪身边出现毛毡线团并解锁呼噜回应；
- `bonded`: 9 条及以上，出现毛毡软垫并解锁更放松的表现。

线团和软垫是经过透明背景检查的正式位图，保持 `pointer-events: none`。阶段只前进；不读取离线时间、不衰减、不显示经验条。

每当 `fishFedCount % 3 === 0`，表现队列在进食后追加 `full → lying → sleeping → idle`。下一条大鱼可以直接打断休息进入进食，永远不会返回“吃饱拒绝”。刷新页面只恢复永久计数与阶段，不重播未完成的瞬时动作。

## 6. 猫咪动作状态机

controller 输出单一主动作投影，优先级为：

```text
loss > feeding > search travel / guarding > petting > milestone rest > idle
```

- 反应气泡只负责文字，不再抢占图片的 `animation`。
- 待机使用低频、底部为原点的轻呼吸。
- 进食使用 `cat-eating.webp` 和独立咀嚼节奏。
- 抚摸使用靠近动作与呼噜环。
- 找鱼使用抬起—落地行程和地面阴影变化。
- 吃饱、趴卧、睡眠继续使用已有明确姿态图。

姿态切换使用重叠交叉淡化，不使用 `mode="out-in"`，避免完全透明空档。主动作落在独立 motion wrapper，气泡、焦点和姿态切换不争用同一动画属性。

## 7. 输入、文案与可访问性

- 点击、触摸轻点、Enter、Space 与 `F` 都执行同一个 `selectPiece`；`F` 不再直接喂猫。
- 删除拖单条小鱼到猫身上的成功喂食路径；拖到猫咪时只提示“先凑齐三条同种小鱼”，canonical state 不变。
- 小鱼可访问名称包含鱼种、小尺寸、层级、上方重叠数量和“放入托盘”动作。
- 首次提示为“找到三条同种小鱼，合成大鱼喂猫”；首次合法合成由 polite live region 播报大鱼已自动喂猫。
- 阶段变化、自动喂食和 reduced-motion 均有等价文案；猫咪菜单继续保持焦点恢复、方向键、Escape 和 44px 命中区。

## 8. 本地快照 v4 与兼容

快照升级到 v4，游戏状态校验每个鱼种在 `pieces + tray` 中的数量可被 3 整除；`pet.fishFedCount` 必须是非负安全整数，guard ID 仍须指向当前场上小鱼。

v3 及更早快照含已废弃的直接喂食额度。迁移时：

- 保留 `soundEnabled`、`plantedAt`、`clearCount`、level 与单调递增的 `nextPieceId`；
- 用对应 level 重建一群可解的小鱼，清空旧托盘和 guard；
- 将旧 v3 `fed.length` 作为初始 `fishFedCount`，不把旧抵扣记录带入新谜题；
- malformed 或不满足旧版本约束的存档继续回退到全新状态。

这是浏览器本地数据迁移，不创建数据库迁移文件，也不更换 localStorage key。

## 9. 回滚边界

功能按“引擎与快照 → controller → UI 组件与素材”三层定位问题。若合成表现失败但规则正确，可降级为静态大鱼出现在猫咪旁并切换进食姿态。没有服务端数据或数据库回滚。
