# Project Explainer Review: soul-protocol-memory

## Review Scope
- Source repo/path: `assets/projects/soul-protocol`
- Focus question: 讲清楚 soul-protocol 的记忆设计，尤其是写入触发、写入内容、存储形态、冲突更新、召回触发、检索/排序，以及默认路径和向量/LLM 增强的边界。
- Plan path: `content/projects/soul-protocol-memory/plan.md`
- Explainer path: `content/projects/soul-protocol-memory/explainer.mdx`

## Coverage Review
- Covered: 正文覆盖 `Soul.observe()`、`MemoryManager.observe()`、episodic/semantic 分流、低显著事实晋升、运行时 store、`MemoryManager.to_dict()`、文件持久化布局、dedup、prefix conflict、raw-text contradiction fallback、`Soul.recall()`、`Soul.smart_recall()`、BM25 默认策略、activation 排序、VectorSearchStrategy 边界。
- Covered: 明确区分 vector storage、vector search、lexical/BM25 search、LLM rerank 和文件持久化，避免把项目误读成“默认向量库记忆”。
- Covered: 保留了已有四条批注的 exact quote，并把它们放在对应章节中，保证 annotation export 可以继续匹配。
- Missing or weak: `dream` 和 archive 只作为边界说明，没有展开离线 consolidation。该主题聚焦 observe/recall lifecycle，未展开是有意取舍。
- Decision: 覆盖通过。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: “写入什么时候触发”解释 Interaction 如何进入 observe；“写入什么东西”解释显著性、episodic 与 semantic 的分流；“冲突怎么更新”解释 `superseded_by` 如何让旧事实退出默认召回；“怎么检索和排序”解释候选生成与 activation 排序分层。
- Sections that only list files/functions: 无。证据地图只是开头定位，后续章节都按触发、状态、分支、例子和边界解释。
- Reader questions still unanswered: 大规模外部数据库接入、复杂 temporal fact schema 没有展开；正文已在边界中说明这些不是默认实现。
- Revisions needed: 已补 `plan.md`，并新增 recall 流程图以满足至少三张项目图的要求。

## Source Evidence Review
- Strong evidence: 写入入口来自 `runtime/soul.py` 的 `Soul.observe()`；数据模型来自 `runtime/types.py` 的 `MemoryType` 和 `MemoryEntry`；写入编排来自 `runtime/memory/manager.py`。
- Strong evidence: 存储证据来自 `MemoryManager.to_dict()`、`Soul._build_storage_memory_data()` 和 `runtime/storage/file.py` 的 nested layout。
- Strong evidence: 冲突证据来自 `runtime/memory/dedup.py`、`MemoryManager._find_conflict()` 和 raw-text contradiction fallback。
- Strong evidence: 召回证据来自 `runtime/memory/recall.py` 默认 `BM25SearchStrategy`、`semantic.py` 对 `superseded_by` 的过滤、`activation.py` 的综合排序和 `embeddings/vector_strategy.py` 的可选向量策略。
- Weak or unsupported claims: 无发现。默认/可选边界均有源码支撑。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: 已把“不是向量库”拆成默认存储、默认检索、可选向量策略、可选 LLM rerank 四个概念，避免一句话结论过抽象。
- Long prose / fatigue points: 已使用 `FigureBlock`、`SplitBlock`、`StepFlow`、`CalloutBlock` 和源码短片段打断长文本。
- Visual or structured component opportunities: 已有架构图、observe 流程图、recall 流程图三张图，覆盖宏观结构和两条生命周期。

## Revision Actions
- Applied: 新增 `content/projects/soul-protocol-memory/plan.md`。
- Applied: 重写 `content/projects/soul-protocol-memory/explainer.mdx`，按机制讲解协议组织写入、存储、冲突、召回和向量边界。
- Applied: 保留并校对四条 annotation quote。
- Applied: 新增 `/generated/soul-protocol-memory/recall-flow.svg`。
- Deferred with reason: 未展开 dream/offline consolidation，因为会偏离本篇“observe 到 recall”的主轴。

## Final Verdict
PASS
