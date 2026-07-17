# Fresh Glass 视觉验收设计

## Evidence flow

```text
downscaled reference copy (once)
  + one browser viewport screenshot
  -> immediate findings in design-qa.md
  -> scoped fix when required
  -> recapture only affected viewport
```

视觉检查按视口串行，不创建四图拼接后一次性加载。截图和结论使用稳定文件名，
中断后从 `design-qa.md` 第一个未完成视口继续。

## Severity

- P0：无法操作、内容不可达、明显崩坏或关键资源缺失。
- P1：主要构图/响应式/可访问性不符合要求。
- P2：明显视觉偏差、状态不清或跨组件不一致。
- P3：不影响验收的细节优化。

## Rollback

QA 修复必须局限于已记录缺陷的相关 UI 文件；若需要重新设计或重做素材，回退到
对应上游子任务更新计划，不在本任务扩大范围。
