# Project Explainer Review: claude-code-memory

## Review Scope

- Source repo/path: `assets/projects/claude-code`
- Focus question: 完整剖析 Claude Code 的 Memory 设计，讲清楚写入触发、写入内容、存储位置、冲突更新、召回触发、检索方式、默认路径和可选扩展。
- Plan path: `content/projects/claude-code-memory/plan.md`
- Explainer path: `content/projects/claude-code-memory/explainer.mdx`

## Coverage Review

- Covered: 正文按 plan 先拆开 Memory 家族，再讲 auto-memory 主轴、写入、内容、存储、冲突更新、召回、检索、session memory、autoDream、team/agent memory、可复用设计和边界。
- Covered: 新版补上第一版遗漏的 query 侧召回机制：`startRelevantMemoryPrefetch`、`findRelevantMemories`、`sideQuery` selector、`readMemoriesForSurfacing`、`filterDuplicateMemoryAttachments`。这让“怎么检索”不再停留在 Grep/search 的粗略描述。
- Covered: 明确写出默认不是 vector storage，也不是 embedding 相似度检索；没有结构化 `supersede` 表或 `to_dict` 事实数据库；默认冲突更新依赖文件改写、prompt 规则、extractor 互斥和 autoDream 整理。
- Missing or weak: team memory 同步协议、secret scanner、删除不传播、server wins/local wins 语义只做边界说明，没有展开到状态机级别。按 plan 决定留到后续团队协作篇。
- Decision: 机制覆盖通过。当前正文覆盖了用户要求的 Memory 主问题，并保留了合理边界。

## Source Evidence Review

- Strong evidence: `src/context.ts#getUserContext` 支撑启动上下文读取 memory files；`src/memdir/paths.ts#isAutoMemoryEnabled` 支撑默认启用和 gate；`src/memdir/memdir.ts#ENTRYPOINT_NAME`、`MAX_ENTRYPOINT_LINES`、`MAX_ENTRYPOINT_BYTES` 支撑索引上限；`src/memdir/memoryTypes.ts#MEMORY_TYPES` 和 `MEMORY_FRONTMATTER_EXAMPLE` 支撑写入内容和格式。
- Strong evidence: `src/query/stopHooks.ts#handleStopHooks` 支撑 turn 结束后触发 `executeExtractMemories` 与 `executeAutoDream`；`src/services/extractMemories/extractMemories.ts#hasMemoryWritesSince` 支撑主 agent 与后台 extractor 互斥；`src/memdir/findRelevantMemories.ts#selectRelevantMemories` 支撑 sideQuery 选择相关 memory；`src/utils/attachments.ts#RELEVANT_MEMORIES_CONFIG` 支撑读取和注入预算。
- Strong evidence: `src/services/SessionMemory/sessionMemory.ts#shouldExtractMemory` 和 `src/services/compact/sessionMemoryCompact.ts` 支撑 session memory 与 compact；`src/services/autoDream/autoDream.ts#DEFAULTS` 支撑 24h/5 sessions；`src/tools/AgentTool/agentMemory.ts#getAgentMemoryDir` 支撑 agent memory scope。
- Weak or unsupported claims: “默认不是向量库”属于负面结论，源码不会用一个函数声明“不是”。正文用 Markdown 文件布局、sideQuery selector 和 attachment 注入的正向源码证据支撑该判断。
- Revisions needed: 已根据侦察报告把“召回靠 Grep/search”修订为更准确的“MEMORY.md 索引 + sideQuery manifest selector + attachment 注入”。不再把 Grep/search 作为唯一召回解释。

## Reader Experience Review

- Over-abstract parts: “Memory 不是一个东西”容易抽象，已加入全景图、存储布局图和分栏，把 CLAUDE.md/rules、auto-memory、relevant memories、session memory、agent memory 拆开。
- Long prose / fatigue points: 正文没有连续大段纯文本。主要机制章节穿插 FigureBlock、SplitBlock、CalloutBlock、StepFlow 和源码片段。
- Visual or structured component opportunities: 已从 2 张图扩展为 4 张图：架构全景、生命周期、存储布局、召回 prefetch。图的数量和覆盖面符合新的 skill 配图门控。

## Revision Actions

- Applied: 将 `content/projects/claude-code-memory/plan.md` 作为源码侦察后的解读计划落盘。
- Applied: 重写正文结构，先讲 Memory 家族边界，再讲 auto-memory 主轴，避免一开始就把所有机制混成“记忆系统”。
- Applied: 新增 `storage-layout.svg` 和 `recall-prefetch.svg`，并在正文加入 4 个 FigureBlock。
- Applied: 补充 `startRelevantMemoryPrefetch`、`findRelevantMemories`、`readMemoriesForSurfacing`、`RELEVANT_MEMORIES_CONFIG` 等源码证据。
- Applied: 修改 skill 为中文流程，并加入源码侦察阶段、plan 门控、更多配图要求和 review 中的 plan path。
- Deferred with reason: team memory 同步协议没有深入展开，因为它会把第一篇 Memory 主线拉向团队协作协议；当前只保留足够说明它是可选扩展。

## Final Verdict

PASS。新版正文遵循基于源码侦察生成的 plan，覆盖用户要求的核心机制；相比第一版，主要修复了召回链路不够准确、配图偏少、缺少 plan 产物的问题。
