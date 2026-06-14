# 解读 Plan: claude-code-memory

## 读者问题

- 这篇要回答什么：Claude Code 的 Memory 由哪些状态线组成，长期记忆什么时候写入、写入什么、存在哪、如何处理重复/冲突、查询时如何召回、当前会话如何压缩、autoDream 如何整理，以及默认路径和可选扩展分别是什么。
- 不回答什么：不完整展开 CLAUDE.md/rules 全规则系统，不把 checkpoint/file-history、tool lifecycle、permission sandbox 和 team sync 后端协议作为主轴。

## 源码侦察摘要

- 关键洞察：Claude Code Memory 不是单一数据库，而是 auto-memory、relevant memory prefetch、session memory、autoDream、team memory、agent memory 多条生命周期。默认不是向量库，没有结构化 `supersede` 表，也没有默认 BM25/embedding 检索。
- 主代理二次核验的源码：`context.ts`、`memdir/paths.ts`、`memdir/memdir.ts`、`memdir/memoryTypes.ts`、`query/stopHooks.ts`、`services/extractMemories/extractMemories.ts`、`memdir/findRelevantMemories.ts`、`utils/attachments.ts`、`services/SessionMemory/sessionMemory.ts`、`services/autoDream/autoDream.ts`、`services/autoDream/consolidationPrompt.ts`、`tools/AgentTool/agentMemory.ts`。
- 负面事实：`MEMORY.md` 是短索引，不是正文库；相关召回是 manifest + sideQuery selector + attachment 注入，不是默认 vector search；冲突更新是文件级改写，不是 fact graph。

## 源码证据地图

- 启动上下文：`assets/projects/claude-code/src/context.ts#getUserContext`、`utils/claudemd.ts#getMemoryFiles`。
- auto-memory gate 与路径：`assets/projects/claude-code/src/memdir/paths.ts#isAutoMemoryEnabled`、`getAutoMemPath`。
- 索引与正文协议：`assets/projects/claude-code/src/memdir/memdir.ts#ENTRYPOINT_NAME`、`MAX_ENTRYPOINT_LINES`、`MAX_ENTRYPOINT_BYTES`，以及 `memoryTypes.ts#MEMORY_TYPES`、`MEMORY_FRONTMATTER_EXAMPLE`。
- 写入触发：`assets/projects/claude-code/src/query/stopHooks.ts#handleStopHooks`、`services/extractMemories/extractMemories.ts#executeExtractMemories`。
- 冲突与互斥：`services/extractMemories/extractMemories.ts#hasMemoryWritesSince`、extractor prompt、autoDream consolidation prompt。
- 召回检索：`assets/projects/claude-code/src/memdir/findRelevantMemories.ts#findRelevantMemories`、`utils/attachments.ts#startRelevantMemoryPrefetch`、`readMemoriesForSurfacing`、`filterDuplicateMemoryAttachments`。
- 会话压缩：`assets/projects/claude-code/src/services/SessionMemory/sessionMemory.ts#shouldExtractMemory`、`utils/permissions/filesystem.ts#getSessionMemoryPath`。
- 后台整理：`assets/projects/claude-code/src/services/autoDream/autoDream.ts#DEFAULTS`、`listSessionsTouchedSince`、`runForkedAgent`，以及 `consolidationPrompt.ts#buildConsolidationPrompt`。
- 可选扩展：`assets/projects/claude-code/src/tools/AgentTool/agentMemory.ts#getAgentMemoryDir`、team memory prompts/paths。

## 讲解大纲

- 先给结论：Memory 是文件化长期记忆、相关召回、会话压缩、后台整理和可选扩展的组合。
- 源码证据地图：按生命周期给出本地源码路径。
- Memory 家族：拆开 CLAUDE.md/rules、auto-memory、relevant_memories、session memory、agent/team memory。
- auto-memory 主轴：默认开启条件、`MEMORY.md` 短索引和上限。
- 写入什么时候触发：显式写入、/memory、人手维护、stop hook 后台 extractor。
- 写入什么内容：四类 memory 是 topic frontmatter type，不是四个索引文件。
- 存储形态：`MEMORY.md` + topic `.md`，session memory 单独 `summary.md`。
- 冲突与更新：文件级改写、主 agent 与 extractor 互斥、autoDream 整理。
- 召回与检索：`MEMORY.md` 索引 + sideQuery 选 topic + 截断 attachment + 去重。
- Session Memory：当前会话压缩材料，不是长期偏好库。
- autoDream：24h/5 sessions/lock gate、输入材料、daily logs、整理目标。
- Team/Agent Memory：可选作用域扩展。
- 可复用设计与边界：索引/正文分离、默认无 vector/embedding/BM25、文件协议的可审查性。

## 配图规划

- 架构图：`architecture.svg`，展示 auto-memory、session memory、autoDream、team/agent memory 的分层。
- 生命周期图：`lifecycle.svg`，展示写入、持久化、召回、会话压缩、整理。
- 存储布局图：`storage-layout.svg`，展示 auto/team/agent/session memory 的文件位置。
- 召回图：`recall-prefetch.svg`，展示 `MEMORY.md` 索引和 relevant memory prefetch 双通道。

## 默认与可选

- 默认路径：auto-memory 默认开启；`MEMORY.md` 作为索引进入上下文；topic Markdown 保存正文；主 agent 或 extractMemories 写入；relevant memory prefetch 按需注入 topic；session memory 为当前长会话 compact 服务。
- 可选路径：team memory、agent memory、autoDream、KAIROS daily logs、remote/team sync、feature-gated relevant memory prefetch 和 session memory compact。

## 机制讲解重点

- 每个章节都要解释 cause -> state -> effect：触发入口是什么，读取/写入哪个文件或状态，后续谁消费。
- 必须保留已有批注锚点，包括 `MEMORY.md` 上限、四类 memory、文件级冲突、主 agent 写入互斥、召回去重、autoDream gate 和 autoDream 输入。
- 源码片段后必须解释变量和行为，不允许只贴代码。
