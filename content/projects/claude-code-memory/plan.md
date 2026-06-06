# 解读 Plan: claude-code-memory

## 读者问题

- 这篇要回答什么：Claude Code 的 Memory 到底由哪些机制组成，什么时候触发写入，写入什么，存在哪，如何避免重复或处理冲突，什么时候触发召回，怎么检索，哪些是默认路径，哪些是可选扩展。
- 不回答什么：不完整展开 Claude Code 的所有 `CLAUDE.md`/rules 规则系统，不完整展开 hooks、permissions、compact、插件系统和 team sync 后端协议。

## 源码侦察摘要

- 子代理侦察关键洞察：Claude Code Memory 不是一个单一模块，而是 auto-memory、relevant memory attachment、session memory、team memory、agent memory、KAIROS daily log 等多条线；默认不是向量库，也没有结构化事实 supersede。
- 主代理二次核验的源码：重点核验了 `context.ts` 的 `getUserContext`、`query.ts` 的 `startRelevantMemoryPrefetch` 消费点、`findRelevantMemories.ts` 的 sideQuery selector、`attachments.ts` 的读取/截断/去重逻辑、`stopHooks.ts` 的后台触发、`agentMemory.ts` 的 scope 目录。

## 源码证据地图

- 入口：`src/context.ts#getUserContext`、`src/utils/claudemd.ts#getMemoryFiles`、`src/query.ts#startRelevantMemoryPrefetch`、`src/query/stopHooks.ts#handleStopHooks`。
- 写入：`src/memdir/memdir.ts#buildMemoryLines`、`src/services/extractMemories/extractMemories.ts#runExtraction`、`src/commands/memory/memory.tsx#MemoryCommand`。
- 存储：`src/memdir/paths.ts#getAutoMemPath`、`src/memdir/memdir.ts#ENTRYPOINT_NAME`、`src/utils/permissions/filesystem.ts#getSessionMemoryPath`、`src/tools/AgentTool/agentMemory.ts#getAgentMemoryDir`。
- 更新/冲突：`src/services/extractMemories/extractMemories.ts#hasMemoryWritesSince`、`src/memdir/memdir.ts` 的 duplicate/update prompt、`src/services/autoDream/autoDream.ts#initAutoDream`。
- 召回/检索：`src/memdir/findRelevantMemories.ts#findRelevantMemories`、`src/memdir/findRelevantMemories.ts#selectRelevantMemories`、`src/utils/attachments.ts#readMemoriesForSurfacing`。
- 权限/边界：`src/services/extractMemories/extractMemories.ts#createAutoMemCanUseTool`、`src/services/SessionMemory/sessionMemory.ts#createMemoryFileCanUseTool`、`src/utils/permissions/filesystem.ts#checkEditableInternalPath`。

## 讲解大纲

- 先给结论：Memory 是文件化长期记忆 + query 侧相关记忆注入 + session compact notes + team/agent 扩展，不是默认 vector DB。
- 宏观架构：先拆开 auto-memory、session memory、team memory、agent memory、CLAUDE.md/rules 的边界。
- 生命周期：讲写入、存储、整理、召回四段闭环。
- 源码细读：用短代码片段串起 path、prompt、extractor、selector、attachments、session compact、agent/team memory。
- 可复用设计：索引/正文分离、后台抽取互斥、召回后验证、权限边界、session memory 和长期 memory 分离。
- 边界：无结构化冲突 resolver、默认无向量召回、提示词治理成本、team sync 删除不传播等留到后续。

## 配图规划

- 架构图：`architecture.svg`，展示 auto-memory、extractMemories、session memory、autoDream、team/agent memory。
- 流程图：`lifecycle.svg`，展示 trigger -> gate -> store -> recall，并补 session/autoDream。
- 存储图：`storage-layout.svg`，展示 auto/team/agent/session memory 的文件布局。
- 召回图：`recall-prefetch.svg`，展示 `MEMORY.md` 注入和 relevant memory prefetch 双通道。

## 默认与可选

- 默认路径：auto-memory 默认开启，`MEMORY.md` 索引进入上下文；topic Markdown 保存正文；显式 remember/forget 和后台 extractMemories 写入；相关 topic files 通过 feature-gated prefetch 注入。
- 可选路径：team memory、agent memory、session memory compaction、autoDream、KAIROS daily log 都受 feature gate、settings、环境变量或 agent frontmatter 控制。

