# Fresh Glass Candy 父任务编排计划

## Execution order

1. 完成并归档 `07-17-fresh-glass-candy-assets`。
2. 确认六张最终透明素材与 manifest 存在，再启动
   `07-17-fresh-glass-ui-restyle`。
3. UI 定向测试、lint、typecheck 与 build 通过后，再启动
   `07-17-fresh-glass-visual-qa`。
4. 三个子任务完成后，父任务只做 AC 映射检查和最终集成确认。

## Anti-stall contract

- 一轮只执行一个子任务中的一个检查点。
- 图片任务只处理一张源图或一个最终素材，然后落盘并记录。
- UI 任务禁止打开生成源图和原尺寸参考图。
- QA 任务一次只检查一个视口，发现立即写入 `design-qa.md`。
- 任何中断都从已写入的 manifest、测试结果或 QA 表继续，不重新扫描全部资源。
- `violet` 与 `rose` 已各生成并选定一张源图，不得再生成变体。

## Parent validation

```powershell
python ./.trellis/scripts/task.py validate 07-17-fresh-glass-candy-assets
python ./.trellis/scripts/task.py validate 07-17-fresh-glass-ui-restyle
python ./.trellis/scripts/task.py validate 07-17-fresh-glass-visual-qa
```

父任务不直接修改应用代码，也不执行额外图片生成或批量图片查看。
