# Candy 素材整理设计

## Pipeline

```text
fixed source PNG
  -> metadata inventory
  -> <=512px preview when needed
  -> one-candy extraction/background removal
  -> square normalization
  -> alpha/bounds validation
  -> final candy-{type}.png + inventory checkpoint
```

处理必须是本地、确定性且可重复的。预览仅用于选择裁切区域，最终处理始终基于
原文件。任何临时文件放在本任务 `research/previews/` 或仓库 `.tmp/` 中。

## Validation contract

- 验证 PNG 色彩模式和 alpha 通道。
- 计算非透明像素边界，拒绝触边或主体过小。
- 六张输出使用相同画布尺寸，并记录主体边界比例。
- 只在自动检查不能判断光晕、文字或内容身份时查看单张缩略预览。

## Rollback

删除本任务新产出的六张素材和临时预览即可；不触及应用代码或依赖。
