# 鱼群寻物与分波通关 — Technical Design

## State contract

`AmbientGameState` 增加当前关卡已完成组数 `levelProgress`。`clearCount` 继续代表累计喂鱼数并驱动植物；两者生命周期分离。

纯引擎提供：

- `getLevelGoal(level)`：生成 `3、5、8、13、21、34…` 目标序列；
- `getLevelConfig(level)`：第一关固定 3 种/9 条，后续逐步增加到 8 种，单波数量为 `3 + 2 × (kindCount - 1)`；
- `createLevelState(...)`：第一关生成三组三条，后续生成唯一三条加若干两条；
- `selectPiece(...)`：第一关清完三组才升级；后续每次组合重建同关下一波，达到目标后升级；
- `restartAfterLoss(...)`：重建当前波，保留 `level`、`levelProgress` 和累计进度。

## Authored school layout

使用最多 17 个经过检查的标准化点位构成三段 S 形迁徙路线。不同鱼数从对应覆盖序列取点，避免随机拒绝采样、碰撞计算和堆叠关系。鱼种调度按多轮交错分配，使同种鱼跨区域分散。

为兼容既有 UI 与旧快照，`PilePiece` 暂时保留 `layer`、`spread` 和 `blockerIds` 字段，但新生成状态统一为 `layer: 0`、`blockerIds: []`、`spread === pile`；它们不再表达玩法层级。

## Presentation transaction

引擎可立即提交新波状态，控制器使用 UI-only `fieldPreview` 暂时保留旧波未选中的鱼。第三条鱼完成落盘、聚拢并抵达小猫后，控制器清空 `fieldPreview`，让新波统一入场。第一关未完成时不建立预览，因为旧场本身只是减少一组三条。

`CombinedSelection` 增加 `fieldRefreshed`，区分“同一场继续”“同关换波”“升级换关”。控制器据此决定状态文案、鱼群入场和关卡反馈，但不把动画阶段写入持久化。

## Visibility and interaction

`FishField` 将全部合法鱼视为 revealed；探照灯只保留为轻微指针光感，不再决定可见性。移除邻鱼分离和层级滑动投影。`FishPiece` 使用单层阴影、统一生命漂移和更大的桌面视觉尺寸，旋转来自引擎的 `-8°～8°`。

## Companion interaction

小猫退出找鱼、守鱼和移动到鱼旁的辅助路径，控制器不再维护活动中的目标鱼或搜索计时器。版本 4 快照继续兼容旧 `guardedPieceId` 字段，但新会话始终将其写为 `null`。

小猫主体与毛线球改为两个直接原生按钮，分别承担抚摸和玩耍；移除需要先打开的动作菜单。组件按指针在猫身按钮内的纵向比例解析 `head / belly / paws`，键盘激活稳定映射为 `head`。控制器只接收语义化区域，不读取像素坐标。

控制器维护 UI-only 的 `catPetZone` 与 `catPlayVariant`。抚摸区域分别投影站立贴头、坐姿挠肚和兴奋碰爪；玩耍按 `pounce / bat / cuddle` 循环，复用已有 idle、eating、full、lying 与 yarn 素材。所有动作使用共享持续时间，新的互动会取消旧计时器并从当前输入重新开始，不进入 snapshot。

低频自动回应在猫处于 idle 时投影一次 `curious` 动作和气泡，随后回到待机。气泡锚定在猫画布内部而非负 top，确保桌面与 compact 视口可见。reduced motion 取消互动位移、旋转和循环，只保留对应姿态、毛线球强调与 live-region 文案。

## Storage compatibility

保持 snapshot version 4，新增 `levelProgress` 作为向后兼容字段：旧快照缺少时按 0 解析。放宽旧完整三消库存校验，因为控制器加载后仍按产品约定重建第一关；永久植物、喂鱼数和声音偏好不丢失。

## Verification

- 引擎验证每关目标、鱼种计数、位置安全、单层和刷新/升级边界。
- 控制器验证旧场保留到 feeding、新波随后显示、失败保留关卡进度。
- 存储验证旧 v4 快照可读且新字段往返。
- 浏览器以选定融合稿对照桌面构图，并验证第一关完整 3 组流程与第二关换波流程。
- 控制器验证三种抚摸区域、三种循环玩耍、自动好奇动作与中断复位均不改变 canonical game、喂鱼数或持久化数据；浏览器验证直接按钮、气泡位置、姿态差异、compact 命中区和 reduced-motion 静态状态。
