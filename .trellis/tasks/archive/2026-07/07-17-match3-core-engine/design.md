# 三消核心规则引擎：技术设计

## 模块边界

```text
apps/web/src/features/game/engine/
├── types.ts       # 公共棋盘、匹配、变化与结果联合类型
├── errors.ts      # 可诊断引擎错误
├── random.ts      # 随机源契约、固定种子实现和安全取样
├── board.ts       # 配置校验、棋盘创建、复制与坐标工具
├── matches.ts     # 匹配扫描和合法移动枚举
├── generate.ts    # 随机初始生成与确定性兜底
├── settle.ts      # 消除、稳定坠落、补充与连锁
├── shuffle.ts     # 可走性保证、保量洗牌与重建兜底
├── swap.ts        # 交换验证和完整交换结算
└── index.ts       # 稳定公共导出
```

模块不得导入 Vue、DOM、计时器或浏览器存储。

## 公共模型

```ts
interface Tile {
  readonly id: string;
  readonly type: string;
}

interface Coordinate {
  readonly row: number;
  readonly column: number;
}

interface Board {
  readonly rows: number;
  readonly columns: number;
  readonly cells: readonly (readonly Tile[])[];
}

type RandomSource = () => number;
```

公开 `Board` 只表示每格均有棋子的稳定棋盘。所有公开变更返回新棋盘；输入棋盘、行数组和棋子对象均不原地修改。

## 配置

默认配置：

- 8 行、8 列；
- 6 种普通棋子；
- 100 次初始生成尝试；
- 100 次洗牌尝试；
- 100 轮最大连锁。

行列至少为 3，棋子类型至少 3 种且不得重复；生成和洗牌尝试上限必须为非负整数（`0` 用于直接进入可测试的兜底路径），最大连锁必须为正整数。

## 匹配契约

`findMatches(board)` 返回：

- `groups`：每个横向或纵向连续组，包含方向和有序坐标；
- `coordinates`：全部组坐标的去重集合。

交叉匹配保留多个组，但公共坐标只在 `coordinates` 中出现一次。

`listLegalMoves(board)` 只返回相邻交换坐标对。`hasLegalMove(board)` 是其短路判断版本。

## 生成契约

```ts
generateBoard(config, random): {
  board: Board;
  fallbackUsed: boolean;
}
```

常规路径按随机源生成无初始匹配棋盘，并验证可走性。达到尝试上限时使用确定性模板兜底；兜底也必须通过同一不变量检查，否则抛出 `generation-failed`。

## 结算契约

```ts
settleBoard(board, random, options?): {
  board: Board;
  cascades: readonly CascadeRound[];
}
```

每轮 `CascadeRound` 包含：

- 本轮起始棋盘及匹配信息；
- 被移除的棋子和原坐标；
- 下落棋子的起点与终点；
- 新棋子的负行起点与终点；
- 本轮完成后的棋盘。

若入口没有匹配，返回零轮且保持棋盘引用语义上的不可变结果。达到最大连锁后仍有匹配则抛出 `cascade-limit-exceeded`。

## 洗牌契约

```ts
ensurePlayableBoard(board, config, random):
  | { kind: "unchanged"; board: Board }
  | { kind: "shuffled"; board: Board }
  | { kind: "rebuilt"; board: Board };
```

`shuffled` 保留全部棋子 ID 和类型数量；`rebuilt` 表示有限洗牌失败后生成了新棋盘。重建棋盘从原棋盘最大可识别 ID 之后继续分配，保证新旧棋盘 ID 集合不重叠，避免 UI 复用旧棋子身份。

## 交换结果

```ts
type SwapResult =
  | { kind: "invalid"; reason: "out-of-bounds" | "same-cell" | "not-adjacent"; board: Board }
  | { kind: "no-match"; board: Board; swap: Swap }
  | { kind: "resolved"; board: Board; swap: Swap; cascades: readonly CascadeRound[]; playability: PlayabilityResult };
```

非法和无匹配交换均返回原棋盘，不扣步语义由后续局内状态任务消费 `kind` 决定。有效交换先结算到稳定，再保证棋盘可走。

## 错误与兼容

`Match3EngineError` 携带稳定错误码：

- `invalid-config`
- `invalid-board`
- `invalid-random-value`
- `generation-failed`
- `cascade-limit-exceeded`

首版不承诺序列化类实例；跨存储或网络边界不在本任务范围。公共联合类型和错误码视为后续 UI、计分与测试的稳定契约。

## 验证策略

- 用固定类型矩阵覆盖横纵、长连、交叉和多组匹配。
- 用固定种子/序列覆盖生成、补充、连锁和洗牌。
- 对所有失败结果断言输入棋盘深层内容未改变。
- 对洗牌断言 ID/类型多重集保持；对重建断言显式 `kind`。
- 所有测试运行在 Vitest Node 环境，不挂载 Vue。
