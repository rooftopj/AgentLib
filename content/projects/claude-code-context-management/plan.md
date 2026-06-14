# 解读 Plan: claude-code-context-management

## 读者问题
- 这篇要回答什么：Claude Code 如何决定下一轮模型能看到什么上下文；动态 attachment、工具结果预算、microcompact、session memory compact 和 legacy compact 分别在什么时机介入；状态如何在 compact 前后继续传递。
- 不回答什么：不展开长期 memory 的写入/召回策略，不展开 checkpoint/file-history 回滚，不把 subagent coordinator 的任务编排当成本篇主轴。

## 源码侦察摘要
- 关键洞察：`query.ts` 是上下文管线的编排点。请求前先处理历史消息预算和多层压缩，工具循环后再用 `getAttachmentMessages()` 把运行态变化补回消息流。
- 主代理二次核验的源码：`context.ts`、`query.ts`、`utils/attachments.ts`、`utils/toolResultStorage.ts`、`services/compact/microCompact.ts`、`services/compact/autoCompact.ts`、`services/compact/compact.ts`、`services/compact/sessionMemoryCompact.ts`、`services/SessionMemory/sessionMemory.ts`。
- 负面事实：上下文管理不是一个 summarizer；很多运行态不能让 summary 代替。snip 和 context collapse 的部分实现受 feature gate 或本地源码缺失限制，正文只讲可核验的调用顺序和边界。

## 源码证据地图
- 入口：`assets/projects/claude-code/src/query.ts` 的请求前预算、snip/microcompact/autocompact 顺序，以及工具循环后的 attachment 注入。
- 固定 context：`assets/projects/claude-code/src/context.ts` 的 `getSystemContext()`、`getUserContext()`。
- 动态注入：`assets/projects/claude-code/src/utils/attachments.ts` 的 `getAttachmentMessages()`、`getAgentListingDeltaAttachment()`、`getMcpInstructionsDeltaAttachment()`、nested memory、plan mode、task reminder。
- 工具结果预算：`assets/projects/claude-code/src/utils/toolResultStorage.ts` 的 `TOOL_RESULTS_SUBDIR`、`buildLargeToolResultMessage()`、`ContentReplacementState`、`applyToolResultBudget()`。
- 局部压缩：`assets/projects/claude-code/src/services/compact/microCompact.ts` 的 time-based 和 cached microcompact。
- 重型压缩：`assets/projects/claude-code/src/services/compact/autoCompact.ts`、`sessionMemoryCompact.ts`、`compact.ts`。
- compact 后重建：`compact.ts` 的 `createPostCompactFileAttachments()`、plan/skill/tool/MCP delta、`buildPostCompactMessages()`。

## 讲解大纲
- 先给结论：上下文管理是分层预算系统，不是单个摘要器。
- 源码证据地图：先给读者可追溯路径。
- 固定 context：解释 system/user context 只放稳定事实。
- 动态注入：解释 attachment 是运行态状态增量，不是拼大 prompt。
- Delta 与 nested memory：解释如何避免 cache 破坏和重复注入。
- 工具结果预算：解释大输出 persistence 与 aggregate replacement 为什么要冻结决策。
- microcompact：解释 snip 顺序、time-based 清理和 cached cache_edits。
- autocompact：解释阈值、circuit breaker、postCompactMessages。
- session memory compact：解释后台笔记、lastSummarizedMessageId、保留尾部和回退。
- legacy compact：解释 summary 与 post-compact attachment 的分工。
- 可复用设计与边界：总结可借鉴顺序，并标出不可确认的实现。

## 配图规划
- 架构图：`architecture.svg`，展示固定 context、消息历史、attachment、压缩管线。
- 注入图：`injection.svg`，展示固定 context 与动态 attachment 的两条路径。
- 存储图：`storage.svg`，展示 tool-results、replacement、resume 复原。
- 压缩图：`compaction.svg`，展示 tool budget -> snip -> microcompact -> autocompact -> compact。

## 默认与可选
- 默认路径：system/user context、CLAUDE.md、dynamic attachments、tool result persistence、aggregate budget、autocompact、legacy compact 后重建上下文。
- 可选路径：HISTORY_SNIP、CACHED_MICROCOMPACT、CONTEXT_COLLAPSE、session memory compact、reactive compact，以及 provider/cache-edit 能力相关路径。

## 机制讲解重点
- 每章必须写出 cause -> state -> effect：触发条件是什么，读取/写入什么状态，后续谁消费。
- 源码片段只作为证据，片段后必须解释变量、状态和分支。
- 至少用动态 attachment、aggregate budget、microcompact、session memory compact、post-compact attachment 五个具体场景解释状态变化。
