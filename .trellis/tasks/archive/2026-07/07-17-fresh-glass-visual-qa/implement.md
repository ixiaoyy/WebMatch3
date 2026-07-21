# Fresh Glass 视觉验收实施计划

## Checkpoints

1. 创建一次性 <=1024px 参考副本，建立 `design-qa.md` 视口表；本轮停止。
2. 检查 320×568，立即记录并只修复该视口的 P0/P1/P2。
3. 检查 390×844，立即记录并只修复该视口的 P0/P1/P2。
4. 检查 768×1024，立即记录并只修复该视口的 P0/P1/P2。
5. 检查 1440×900，并与缩小参考副本对比，立即记录并修复 P0/P1/P2。
6. 逐项检查交互、控制台、reduced-motion 和 blur fallback。
7. 只重拍受修复影响的视口，关闭缺陷并写 `final result: passed`。

## Stop rules

- 一次只查看一张参考或截图。
- 不使用 `detail: original` 查看图片。
- 每个视口的发现先落盘，再进入下一个视口。
- 不重新生成、重新切分或批量扫描糖果素材。

## Final validation

只在最终 UI 修复后重跑受影响的定向测试；如果改动跨越共享样式，再补跑 lint、
typecheck、单元测试和 build。
