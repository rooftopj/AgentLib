# 解读 Plan: soul-protocol-memory

## 读者问题
- 这篇要回答什么：soul-protocol 的记忆系统到底什么时候写入、写入什么、存在哪、如何处理冲突、什么时候召回、默认检索和可选向量/LLM rerank 如何区分。
- 不回答什么：不展开 dream、importer、evaluation、evolution 的完整机制；只在它们影响 memory lifecycle 时点到边界。

## 源码侦察摘要
- 关键洞察：默认路径不是向量库；`observe()` 是交互后的学习 hook；`MemoryManager.observe()` 负责显著性、情节保存、事实抽取、去重、冲突、图谱和 self-model；`recall()` 是显式入口；`smart_recall()` 才可选 LLM rerank。
- 主代理二次核验的源码：`runtime/soul.py`、`runtime/types.py`、`runtime/memory/manager.py`、`episodic.py`、`semantic.py`、`dedup.py`、`recall.py`、`activation.py`、`strategy.py`、`embeddings/vector_strategy.py`、`storage/file.py`。

## 源码证据地图
- 入口：`Soul.observe()`、`Soul.remember()`、`Soul.recall()`、`Soul.smart_recall()`。
- 写入：`MemoryManager.observe()`、`EpisodicStore.add_with_psychology()`、cognitive fact extraction。
- 存储：运行时多个 store；`MemoryManager.to_dict()`；`Soul._build_storage_memory_data()`；`storage/file.py` 本地布局。
- 更新/冲突：`dedup.reconcile_fact()`、`MemoryManager._find_conflict()`、contradiction detector raw-text fallback、`superseded_by`。
- 召回/检索：`RecallEngine`、`BM25SearchStrategy`、`SemanticStore.search()`、`activation.py`、`VectorSearchStrategy`、`rerank_memories()`。
- 权限/边界：`visibility`、`scope`、`user_id`、`layer`、`domain`、bond strength、smart recall opt-in。

## 讲解大纲
- 先给结论：默认是分层认知管线，不是向量数据库。
- 宏观架构：MemoryType 和 MemoryEntry 字段如何对应生命周期。
- 写入链路：observe 的触发、显著性门控、semantic fact 晋升。
- 存储形态：运行时 store 与文件持久化分离。
- 冲突更新：dedup、prefix conflict、contradiction detector、raw-text fallback。
- 召回链路：显式 recall、BM25/text candidates、activation、domain/user 过滤、smart_recall opt-in。
- 向量边界：vector search strategy 与 vector storage 区分。
- 可复用设计和边界：生命周期优先，检索技术其次。

## 配图规划
- 架构图：复用 `/generated/soul-protocol-memory/architecture.svg`。
- 写入流程图：复用 `/generated/soul-protocol-memory/observe-flow.svg`。
- 召回流程图：新增 `/generated/soul-protocol-memory/recall-flow.svg`。

## 默认与可选
- 默认路径：observe 后处理，内存 store + 本地文件持久化，BM25/text candidates + ACT-R activation。
- 可选路径：VectorSearchStrategy、smart_recall LLM rerank、custom layer/domain、外部归档能力。
