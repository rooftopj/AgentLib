# 解读 Plan: claude-code-context-management

## 读者问题
- 这篇要回答什么：Claude Code 如何在长会话里控制上下文，哪些内容会动态注入，哪些内容会被替换、裁剪或压缩。
- 不回答什么：不展开 memory 第一讲的长期记忆写入，也不展开 checkpoint 第二讲的 file-history restore。

## 源码侦察摘要
- 关键洞察：`query.ts` 是上下文编排核心，先处理历史消息视图，再做多层压缩，最后在工具循环后追加动态 attachment。
- 主代理二次核验的源码：`context.ts`、`query.ts`、`utils/attachments.ts`、`utils/toolResultStorage.ts`、`services/compact/*`、`services/compact/sessionMemoryCompact.ts`。
- 负面事实：不是所有动态信息都写入 system prompt；很多信息是 attachment delta。压缩也不是只有 auto compact，还有工具结果替换、microcompact、session memory compact、context-collapse 等多层策略。

## 源码证据地图
- 入口：`assets/projects/claude-code/src/query.ts`。
- 静态 context：`assets/projects/claude-code/src/context.ts` 的 `getSystemContext()`、`getUserContext()`。
- 动态注入：`assets/projects/claude-code/src/utils/attachments.ts` 的 `getAttachmentMessages()`、delta attachment、nested memory、dynamic skill。
- 存储：`assets/projects/claude-code/src/utils/toolResultStorage.ts` 的 tool-results 目录和 `content-replacement` 记录。
- 压缩：`services/compact/microCompact.ts`、`autoCompact.ts`、`compact.ts`、`sessionMemoryCompact.ts`。
- 边界：`query.ts` 的 blocking limit、reactive compact、context-collapse gate。

## 讲解大纲
- 先给结论：上下文管理是多层预算系统，不是单个摘要器。
- 宏观架构：静态 context、message history、dynamic attachments、compaction pipeline。
- 动态注入：git/CLAUDE.md、queued commands、tool delta、agent listing、MCP instructions、nested memory、skills。
- 轻量压缩：tool result persistence、aggregate budget、microcompact。
- 重型压缩：session memory compact 优先，失败再 legacy compact。
- 恢复与边界：post-compact attachments、hooks、hard blocking、不是向量检索。

## 配图规划
- 架构图：上下文输入层到 query loop。
- 注入图：固定 context 与动态 attachment 的两条路线。
- 压缩图：content replacement -> snip/microcompact -> context collapse -> autocompact。
- 存储图：tool result blob、content replacement entry、post-compact restore。

## 默认与可选
- 默认路径：system/user context、CLAUDE.md、attachment delta、tool result persistence、auto compact。
- 可选路径：HISTORY_SNIP、CACHED_MICROCOMPACT、CONTEXT_COLLAPSE、session memory compact、reactive compact 和 SDK/headless 特定路径。
