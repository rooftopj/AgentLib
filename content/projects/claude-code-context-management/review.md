# Project Explainer Review: claude-code-context-management

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: Claude Code 上下文管理如何通过动态注入、工具结果预算、microcompact、session memory compact 和 legacy compact 控制长会话。
- Plan path: `content/projects/claude-code-context-management/plan.md`
- Explainer path: `content/projects/claude-code-context-management/explainer.mdx`

## Coverage Review
- Covered: 固定 system/user context、动态 attachment 注入时机、agent/MCP/tools delta、nested memory 去重、工具结果 persistence、aggregate replacement 决策冻结、snip 在 microcompact 前的可核验顺序、time-based microcompact、cached microcompact、autocompact 阈值和 circuit breaker、session memory compact、legacy compact 后的 post-compact attachment 重建。
- Missing or weak: `HISTORY_SNIP` 的内部选择算法和 `CONTEXT_COLLAPSE` 的完整数据结构没有展开。原因是当前本地源码只提供可核验的调用顺序和边界，正文已在边界章节说明不伪装确认。
- Decision: 覆盖通过。当前正文直接回答了“下一轮模型看到什么上下文、状态怎样进入或退出上下文、compact 后如何恢复运行态”这三个核心问题。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: `动态注入不是拼大 prompt` 解释 queued/runtime state 如何经 `getAttachmentMessages()` 进入消息历史；`第一层压缩：工具结果预算` 解释大输出写入 `tool-results` 与 `seenIds/replacements` 如何稳定历史；`第二层压缩：microcompact` 区分 time-based 本地清理和 cached cache_edits；`Session memory compact 是优先尝试` 解释后台 session memory 文件、`lastSummarizedMessageId` 和尾部保留；`legacy compact 会补回必要上下文` 解释 summary 与 post-compact attachment 的分工。
- Sections that only list files/functions: 已消除。原先“先看证据地图”和若干章节偏像源码目录导览，这次改为先讲读者问题、触发入口、状态流，再用源码片段证明。
- Reader questions still unanswered: snip 内部如何挑选具体中间历史仍不可完整回答，正文已标为本地源码不可确认部分；不会把推断写成事实。
- Revisions needed: 已完成本轮重写，无需追加修订。

## Source Evidence Review
- Strong evidence: `context.ts` 支撑固定上下文；`query.ts` 支撑请求前预算顺序和工具后 attachment 注入；`attachments.ts` 支撑动态 attachment、delta、nested memory；`toolResultStorage.ts` 支撑工具结果 persistence 和 replacement 状态；`microCompact.ts` 支撑 time-based/cached 两条路径；`autoCompact.ts` 支撑阈值和失败熔断；`sessionMemoryCompact.ts` 与 `SessionMemory/sessionMemory.ts` 支撑 session memory compact；`compact.ts` 支撑 post-compact attachment 重建。
- Weak or unsupported claims: 没有发现新的 unsupported claim。对 feature-gated 能力和源码缺失部分已用边界语气处理。
- Revisions needed: 保留所有现有批注锚点句，避免学习批注在重写后丢失；后续通过 annotations validate 检查。

## Reader Experience Review
- Over-abstract parts: 初稿的“多层预算系统”“动态注入”“microcompact”偏抽象。新版每节加入 cause -> state -> effect 解释，并用具体例子说明状态变化。
- Long prose / fatigue points: 正文穿插 4 张 FigureBlock、多个 SplitBlock、StepFlow、CalloutBlock 和短源码片段，没有依赖长段纯文本堆叠深度。
- Visual or structured component opportunities: 现有 4 张图分别覆盖全景、注入、存储、压缩，足够支撑本主题。新增图不是必要项，重点放在机制文本重写。

## Revision Actions
- Applied: 重写 `explainer.mdx`，把章节改成机制讲解闭环：读者问题、触发入口、状态流、源码证据、例子和边界。
- Applied: 保留已有 9 条 annotation 的 quote 原文，包括动态 attachment、大工具输出、aggregate budget、snip/microcompact、session memory compact、post-compact attachment 等锚点。
- Applied: 更新 `plan.md`，明确新版目标是解释下一轮模型看到什么，以及状态在 compact 前后如何传递。
- Applied: 在边界章节标明 snip/context-collapse 等不可完全确认的实现，避免把工程推断写成源码事实。
- Deferred with reason: 未新增 SVG。现有架构、注入、存储、压缩四图能覆盖重写后的结构，新增图会重复。

## Final Verdict
PASS。新版正文不再只是列文件和贴源码片段，而是围绕上下文生命周期解释每层机制的触发、状态读写、分支、后续消费和边界；现有批注锚点也已配合保留。
