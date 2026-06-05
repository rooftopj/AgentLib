# Project Explainer Review: soul-protocol-memory

## Review Scope
- Source repo/path: `assets/projects/soul-protocol`
- Focus question: 讲清楚 soul-protocol 的记忆设计，尤其是记忆什么时候触发写入、写入什么、存在哪、是否向量存储、冲突怎么更新、什么时候触发召回、怎么检索，以及默认路径和可选扩展的边界。
- Explainer path: `content/projects/soul-protocol-memory/explainer.mdx`
- Review method: 对照源码证据图和最终文章逐段检查，而不是只看目录是否完整。重点检查读者能否从文章复原实现链路。

## Coverage Review
- Covered: 文章已经覆盖 `Soul.observe` 写入入口、`MemoryManager.process_event` 管理层、episodic 与 semantic 的写入分流、`FileMemoryStore` 默认文件持久化、dedup 与 contradiction 两类冲突处理、`Soul.recall` 与 `Soul.smart_recall` 召回入口、lexical / vector / hybrid 三种检索策略、LLM rerank 的可选路径，以及 archive / export / reset 的边界。
- Covered: 文章明确说明默认不是“接上一个向量数据库”。默认存储是文件系统 JSON，向量只是在配置 embedder 和向量策略后参与候选生成；这回答了“存在哪，是向量存储还是什么存储”的关键问题。
- Covered: 文章没有把所有文件平铺成目录导览，而是围绕写入链路、存储形态、冲突更新、召回链路和源码细读组织内容，符合 reduction gate。
- Missing or weak: 初稿对端到端生命周期讲得偏分散，读者需要在写入、存储、召回章节之间来回拼路径。已补入 `StepFlow`，把 event -> extract -> store -> retrieve -> rank 的流程压成一个可扫描路径。
- Missing or weak: 初稿在“宏观架构”后对默认路径和可选路径的区分仍然偏抽象。已补入 `SplitBlock`，把默认文件存储与可选向量/LLM 能力分栏说明。
- Missing or weak: “可复用设计”原先连续纯文本较多，容易疲惫。已改成短列表，让读者以设计原则方式带走结论。
- Decision: Coverage Review 通过。当前内容已经回答用户提出的记忆机制问题，没有发现必须补讲的核心链路。

## Source Evidence Review
- Strong evidence: 写入入口来自 `assets/projects/soul-protocol/src/soul_protocol/runtime/soul.py` 中的 `Soul.observe`，它把外部事件交给 memory manager，并把结果同步到 soul 的状态视图。
- Strong evidence: 编排层来自 `assets/projects/soul-protocol/src/soul_protocol/runtime/memory/manager.py`，其中 `process_event`、semantic extraction、episodic append、store 持久化、archive 与 reset 共同定义运行期边界。
- Strong evidence: 写入什么东西由 `assets/projects/soul-protocol/src/soul_protocol/runtime/memory/types.py`、`episodic.py`、`semantic.py` 共同支撑；文章区分了事件记忆和语义事实，避免把 memory 简化成一张 embedding 表。
- Strong evidence: 存储位置和默认行为来自 `assets/projects/soul-protocol/src/soul_protocol/runtime/memory/storage/file.py`。文章据此说明默认是文件系统持久化，不是默认向量数据库。
- Strong evidence: 冲突处理来自 `assets/projects/soul-protocol/src/soul_protocol/runtime/memory/dedup.py` 与 `contradiction.py`；文章解释的是近似重复、矛盾、supersede / merge 这类更新语义，而不是泛泛说“会自动解决冲突”。
- Strong evidence: 召回与检索来自 `assets/projects/soul-protocol/src/soul_protocol/runtime/memory/recall.py`、`activation.py`、`vector_strategy.py`，以及 `Soul.recall` / `Soul.smart_recall` 的入口关系。文章把关键词检索、向量候选和 LLM rerank 分清楚了。
- Weak or unsupported claims: “智能召回”容易被误读为默认总是 LLM 驱动。文章已改为默认路径与可选 rerank 分开描述，并提醒向量和 LLM 能力取决于配置。
- Weak or unsupported claims: archive 的目的如果只说“归档旧记忆”会太抽象。文章已约束为运行时暴露的维护能力，不把它扩大解释成完整长期记忆治理系统。
- Revisions needed: 无新的源码证据缺口。后续如果更新到 soul-protocol 新提交，需要重新检查 memory 模块命名和入口函数是否变动。

## Reader Experience Review
- Over-abstract parts: “memory manager 编排所有东西”这种句子对读者帮助有限。文章已在源码细读里改成 entry point -> manager -> store -> retrieval 的路径，并配合短代码摘录说明每一步做什么。
- Over-abstract parts: “向量是可选能力”原本只是一句结论，容易被跳过。现在通过 `SplitBlock` 把默认文件存储与可选向量候选、LLM rerank 并排展示。
- Long prose / fatigue points: “可复用设计”原先有连续大段纯文本。已改成条目化设计要点，减少阅读压力。
- Long prose / fatigue points: 末尾“边界”如果只连续写限制，会显得像总结备忘录。已增加 `CalloutBlock`，把最重要的负面事实和使用边界收束出来。
- Visual or structured component opportunities: 已有两个 SVG 图，一个讲宏观架构，一个讲 observe 写入流程。新增结构化组件后，文章现在同时有 `FigureBlock`、`SplitBlock`、`StepFlow`、`AlgorithmBlock`、`ConceptTabs` 和 `CalloutBlock`，不再依赖连续文本推进。
- Visual or structured component opportunities: 本次没有使用 imagegen raster 图。原因是该项目讲解的关键是架构和源码机制，确定性 SVG 比生成式概念图更准确；如果后续讲人格演化或记忆时间线，可再使用 imagegen 做概念插图。

## Revision Actions
- Applied: 在 `content/projects/soul-protocol-memory/explainer.mdx` 的宏观架构段落后加入 `SplitBlock`，专门解释默认路径和可选增强路径。
- Applied: 在端到端生命周期部分加入 `StepFlow`，让读者能一次看清 observe 写入、抽取、持久化、召回和 rerank 的顺序。
- Applied: 把“可复用设计”的连续段落改成短列表，避免连续大段纯文本。
- Applied: 在“边界”附近加入 `CalloutBlock`，突出默认不是向量数据库、LLM rerank 不是无条件路径这些容易误解的点。
- Applied: 新增 `scripts/check-project-review.mjs`，并把 `project:review` 接入 `package.json` 的 build 链路，要求每个 project explainer 必须有 `content/projects/<slug>/review.md`。
- Applied: 更新 `.agents/skills/open-source-project-to-site/SKILL.md` 和 `references/project-content-checklist.md`，把 review 阶段变成 skill 的标准步骤。
- Deferred with reason: 未补第三张图。当前两个图分别覆盖宏观架构和写入流程，召回链路已经由结构化解释和源码片段支撑；再加图会接近重复，不符合“去除不重要部分”的要求。
- Deferred with reason: 未加入 lark 画板版本。当前站点产物需要可复现的本地静态资源，SVG 更适合版本管理和构建。

## Final Verdict
PASS / 通过

当前 explainer 已经能回答用户原始问题，并且通过 review 阶段确认：没有漏掉写入、存储、冲突、召回、检索策略、默认与可选边界这些核心机制；此前较抽象和较疲劳的段落已经完成二次修改。
