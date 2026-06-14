# Project Explainer Review: claude-code-memory

## Review Scope

- Source repo/path: `assets/projects/claude-code`
- Focus question: Claude Code Memory 的文件化长期记忆、相关召回、会话压缩、后台整理和可选扩展如何协同工作。
- Plan path: `content/projects/claude-code-memory/plan.md`
- Explainer path: `content/projects/claude-code-memory/explainer.mdx`

## Coverage Review

- Covered: Memory 家族分层、auto-memory gate、`MEMORY.md` 短索引和上限、四类 topic type、frontmatter 文件协议、显式写入和 stop hook 后台抽取、文件级冲突更新、主 agent 与 extractor 互斥、`startRelevantMemoryPrefetch`、`findRelevantMemories`、sideQuery selector、`readMemoriesForSurfacing`、召回去重、session memory、autoDream、daily logs、team memory、agent memory。
- Covered: 明确区分长期 auto-memory 和当前 session memory；明确默认不是 vector storage、不是 embedding search、不是 BM25 ranking，也没有结构化 `supersede` 表或 `to_dict` 事实数据库。
- Missing or weak: team memory 同步协议、secret scanner、删除传播语义只作为边界说明，没有展开成完整同步状态机。该部分不是本篇 Memory 主轴。
- Decision: 覆盖通过。正文回答了写入、存储、冲突、召回、压缩、整理、默认与可选路径。

## Mechanism Teaching Review

- Sections that explain cause -> state -> effect well: `写入什么时候触发` 讲清 stop hook -> extractor -> memory files -> cursor；`冲突与更新` 讲清 index/topic/relevant recall/Edit/Write/extractor skip；`怎么检索` 讲清 manifest -> sideQuery -> readMemoriesForSurfacing -> attachment -> readFileState；`Session Memory` 讲清当前会话 summary 的触发和 compact 消费；`autoDream` 讲清 24h/5 sessions/lock gate、forked agent 输入和整理输出。
- Sections that only list files/functions: 已消除。新版保留源码证据地图，但正文机制章节都围绕触发、状态读写和后续消费展开。
- Reader questions still unanswered: team sync 的冲突细节未展开；正文已将其标为可选扩展边界，不把同步协议伪装成默认 memory 机制。
- Revisions needed: 已完成本轮重写，无需追加修订。

## Source Evidence Review

- Strong evidence: `context.ts` 证明 `MEMORY.md`/memory files 进入 user context；`paths.ts#isAutoMemoryEnabled` 证明 auto-memory gate；`memdir.ts` 证明 `MEMORY.md` 上限和索引语义；`memoryTypes.ts` 证明四类 memory 和 frontmatter；`stopHooks.ts` 与 `extractMemories.ts` 证明后台写入触发和互斥；`findRelevantMemories.ts` 与 `attachments.ts` 证明召回选择、截断读取和去重；`SessionMemory/sessionMemory.ts` 证明会话摘要门槛；`autoDream.ts` 与 `consolidationPrompt.ts` 证明后台整理 gate 和输入；`agentMemory.ts` 证明 agent scope。
- Weak or unsupported claims: “默认不是向量库/BM25”是源码负面结论，正文用 Markdown scan、sideQuery selector、attachment 注入的正向路径支撑，并未声称项目完全不能扩展到向量检索。
- Revisions needed: 保留现有 7 条批注 quote 原文，并通过 annotation dry-run 验证锚点。

## Reader Experience Review

- Over-abstract parts: 原文“Memory 不是一个单独模块”容易抽象。新版通过 StepFlow、SplitBlock、CalloutBlock 和具体例子，把长期写入、相关召回、会话压缩、autoDream 整理拆成可跟随路径。
- Long prose / fatigue points: 正文使用 4 张 FigureBlock、多个 SplitBlock、StepFlow、CalloutBlock 和短源码片段；StepFlow descriptions 与 steps 一一对应，避免空卡片。
- Visual or structured component opportunities: 现有四张图足够覆盖架构、生命周期、存储、召回，不新增 SVG。

## Revision Actions

- Applied: 重写 `explainer.mdx`，按新版 skill 机制讲解协议重组章节。
- Applied: 更新 `plan.md`，把主问题收敛为写入、存储、冲突、召回、session compact、autoDream 和可选扩展。
- Applied: 保留并复用所有现有批注锚点句，避免右侧批注丢失。
- Applied: 更新 `review.md`，加入 Mechanism Teaching Review，检查是否只列文件/函数。
- Deferred with reason: 未展开 team memory 同步状态机，因为会偏离本篇默认 Memory 主线。

## Final Verdict

PASS。新版正文把 Memory 讲成多条可追踪生命周期，而不是模块清单；读者可以沿着“触发 -> 文件/状态 -> 召回/整理/压缩消费”理解每个机制，同时现有批注锚点得到保留。
