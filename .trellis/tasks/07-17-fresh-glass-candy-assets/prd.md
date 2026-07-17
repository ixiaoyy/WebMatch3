# Candy 素材整理

## Goal

使用已经确定的 6 张本地 PNG 源图，提取并整理六类可直接由游戏 UI 使用的
透明糖果素材；不再生成变体，不修改 UI 代码。

## Confirmed Evidence

- 固定源目录：
  `C:\Users\phpxi\.codex\generated_images\019f6edd-116b-7331-bf97-afb671a655f6`。
- 源目录有 4 张 PNG，均为 1254×1254、24-bit RGB、当前无 alpha。
- 用户明确批准仅补生成缺失的 `violet` 与 `rose` 各一张；选定源图位于
  `research/sources/violet-source.png` 和 `research/sources/rose-source.png`，
  均为 1254×1254、24-bit RGB、当前无 alpha。
- 最终类型为 `coral`、`amber`、`lime`、`aqua`、`violet`、`rose`。
- 详细文件清单与处理结果记录在 `research/asset-inventory.md`。

## Requirements

- `violet` 与 `rose` 已按用户明确要求各生成一次；六张来源现已固定，禁止
  再次生成变体或替换已选源图。
- 先做元数据与自动化像素检查。确需人工查看时，先生成最长边不超过 512px
  的预览，一次只查看一张，结论立即写入 inventory。
- 每个执行检查点只处理一张源图或一个最终素材，不得同时进入 UI 实现。
- 最终输出到 `apps/web/src/features/game/ui/assets/`，使用稳定文件名
  `candy-{type}.png`。
- 六张素材须有透明背景、无文字、无明显背景残留或裁切，画布和视觉尺寸一致。
- 写出源图到最终素材的映射、处理参数与自动检查结果，恢复任务时不得重新
  扫描已经确认的源图。

## Acceptance Criteria

- [x] 六个 `candy-{type}.png` 均存在于 Vite 源码资产目录且为有效 PNG。
- [x] 六张 PNG 均包含有效 alpha，背景透明，主体未裁切且无明显色边。
- [x] 六张素材画布尺寸一致，主体边界与视觉比例在约定容差内。
- [x] `research/asset-inventory.md` 记录每张源图状态、输出映射和验证结果。
- [x] 除用户明确批准的 `violet`、`rose` 各一次外没有再次生成图片，也没有
  修改游戏组件、样式或引擎代码。

## Out of Scope

- 展示类型迁移、组件改造、页面布局、动画和浏览器视觉验收。

## Resolved Product Decision

- 用户先确认不存在 `violet`、`rose` 源素材，随后明确要求生成紫花和粉心。
- 两类均只生成并选择了一张，无额外变体；任务恢复为六素材范围。
