# 彻底移除果冻遗留命名

## Goal

完成一次可审计的全领域语义迁移：将当前产品代码、文件、测试、样式、文案和活跃产品文档中的果冻领域概念统一改造成小鱼领域概念，避免“小鱼产品、果冻内部模型”长期并存。

## Confirmed Facts

- 面向用户的产品素材已经确定为八种毛毡小鱼；当前已有 `fish-whale.png`、`fish-koi.png`、`fish-sardine.png`，其余鱼素材由独立任务继续交付。
- 当前运行代码仍以 `JELLY_KINDS`、`JellyKind`、`JellyPresentation`、`getJellyPresentation`、`JellyCluster.vue`、`JellyPiece.vue`、`JellyTray.vue` 和 `jelly-*` CSS/动画名表达核心领域。
- 当前生成器创建 `jelly-<id>`，存档校验通过 `isJellyKind` 和 `JELLY_KINDS` 验证已有快照。
- 当前状态播报、ARIA、页面标题、README、`PRODUCT.md` 和 `design-qa.md` 仍含果冻文案。
- 当前产品代码与活跃根文档至少有 16 个文件包含 `jelly/果冻`；另有 3 个 `Jelly*.vue` 文件和 4 个 `jelly-*.webp` 旧素材文件。
- 现有工作区包含用户正在进行的小猫与鱼素材改动；本任务实现时必须保留并与其对齐，不能覆盖或还原。
- 已归档任务和历史素材生成记录是事实记录，不应仅为词汇统一而改写历史。

## Requirements

### R1 — TypeScript domain language

- 将 `JELLY_KINDS`、`JellyKind`、`JellyPresentation`、`getJellyPresentation`、`isJellyKind` 等运行时与类型符号统一为 Fish 语义。
- 复核所有导入、导出、映射、集合类型、测试夹具和错误/状态路径，禁止通过兼容别名继续暴露 Jelly API。
- 保留 `ambient`、`pile`、`tray`、`piece` 等仍准确的中性词；不做与领域迁移无关的机械改名。

### R2 — Components, files, and styles

- 将 `JellyCluster.vue`、`JellyPiece.vue`、`JellyTray.vue` 重命名为能准确描述新产品的 Fish 组件，并更新所有引用。
- 将 `.jelly-*` CSS 类、`jelly-*` 动画名、DOM 标记和测试选择器统一迁移为 `.fish-*` / `fish-*`。
- 混合散落与局部聚拢布局落地后，容器名不得继续暗示所有小鱼属于单一果冻簇。

### R3 — Presentation and copy

- 将所有可见状态、无障碍标签、屏幕阅读器播报、测试期望、页面标题和产品说明统一为小鱼语义。
- 公开浏览器标签页标题固定为 `小鱼`，不再使用 `果冻` 或其他临时名称。
- 八种鱼必须使用具体物种名称和可区分的轮廓描述，不再使用水蓝、琥珀、青柠、玫瑰等果冻展示名。
- 更新活跃的 `PRODUCT.md`、`design-qa.md`、feature README 和相关未归档 Trellis 规划；归档任务及原始研究记录保持历史原貌。

### R4 — Assets and identifiers

- 完成八种鱼素材接入后，删除不再引用的四个 `jelly-*.webp` 旧运行素材；不得在鱼素材尚未齐备时提前删除可运行依赖。
- 新生成实体 ID 使用 `fish-<id>`；既有快照中的 ID 视为不透明标识，不允许因前缀迁移破坏引用一致性。
- 复核 favicon、资源导入名、目录组织和构建输出，确保新代码不再依赖果冻资产。

### R5 — Persistence compatibility

- 新的规范模型与 API 只使用 Fish 语义。
- 旧快照必须能够安全加载；兼容逻辑集中在明确的旧快照边界，不得把 Jelly 类型重新扩散到引擎和 UI。仅该隔离迁移模块及其兼容测试允许保留必要的旧 `jelly` 字面量。
- 迁移后保存的快照使用新的规范值；损坏或无法映射的旧数据按现有安全恢复策略处理。

### R6 — Full audit

- 最终使用大小写不敏感扫描复核当前产品源码、测试、活跃产品文档和未归档相关任务。
- 每一个剩余的 `jelly/果冻` 命中都必须被删除，或被记录为必要的兼容/历史例外并说明原因。
- 验证选择、遮挡、三同类消除、托盘恢复、关卡生成、存档恢复、小猫投喂和探照灯后续接入契约没有因重命名改变。

## Acceptance Criteria

- [ ] 当前产品源码和测试不再导出或引用 Jelly 命名的类型、函数、组件、CSS 类或动画。
- [ ] 三个 `Jelly*.vue` 文件已迁移为 Fish 语义文件，所有构建引用和测试同步更新。
- [ ] 用户可见文案、ARIA、页面标题和活跃产品文档全部使用小鱼语义。
- [ ] 浏览器标签页标题为 `小鱼`，对应测试与文档同步更新。
- [ ] 八种鱼的物种键、素材、展示名和可访问名称存在一一对应的规范注册表。
- [ ] 新生成 ID 使用 `fish-`；升级前的有效快照仍能恢复成可玩的规范鱼状态。
- [ ] 鱼素材齐备并接入后，旧 `jelly-*.webp` 无引用且已移除。
- [ ] 最终审计对每个剩余 `jelly/果冻` 命中都有明确的兼容或历史理由，当前运行路径无遗漏。
- [ ] 定向引擎、存档、控制器和组件测试，以及前端 type-check/lint 通过。

## Out of Scope

- 改写已归档任务、旧对话、原始图片生成提示或 Git 历史。
- 借领域改名重写匹配算法、植物成长规则或小猫投喂规则。
- 在尚未完成的鱼素材任务中补画或替换剩余资产。

## Dependencies

- 依赖 `07-21-felt-fish-assets` 给出最终八种物种键、文件名和展示映射。
- 应在 `07-21-cat-fish-feeding` 与 `07-21-spotlight-hide-and-seek` 大规模实现前完成，避免新功能继续建立在 Jelly API 上。
