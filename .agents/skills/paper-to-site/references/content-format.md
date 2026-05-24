# 内容格式

论文内容存放在 `content/papers/{slug}/`。

- `paper.json`：论文元数据、分类、arXiv 链接、源 TeX 目录路径、搜索字段。
- `explainer.mdx`：中文论文讲解页，面向理解和学习。
- `reading.json`：沉浸式中英对照精读页，必须覆盖 TeX 正文和附录中的全部可读内容。

`reading.json` 中的 `translation` 必须是可直接展示给读者的中文翻译，不能写“占位”“待精译”“自动抽取预览”“后续补充”等制作说明，也不能用“本段主要说明……”这类精读说明模板替代翻译。自然语言段落必须逐句完整翻译，不能保留英文长句，不能用“英文原文 + 少量中文术语替换”冒充译文。图、表、算法、公式和代码也要有中文说明，并通过 `assetPath` 明确声明要展示的资源；前端不负责猜测论文图片。算法块的 `sourceText` 必须包含原文算法步骤，不能只有标题或 caption。

精读页支持行内公式和块级公式。自然语言段落里的公式要保留为 `$...$`，例如 `$\\mathcal{S}$`、`$W^*$`；`kind: "equation"` 的块级公式保留 LaTeX 环境或公式主体，前端会用 KaTeX 渲染。抽取脚本不能把公式清洗成空 `$ $` 或丢失变量。

精读页支持 `kind: "algorithm"`。推荐 `sourceText` 格式为：

```text
Algorithm: Algorithm of AFlow: Detailed implementation
Require: Evaluator $G$, Dataset $D$, Operators $\\mathcal{O}$
Ensure: Optimized Workflow $W^*$
for iteration ← 1 to $N_{max}$:
  workflow ← Select(tree)
```

前端会把第一行作为算法标题，把后续内容作为伪代码块展示，并在下方展示中文 `translation`。

生成 `reading.json` 不应一次性在一个上下文里完成。必须按 `references/reading-translation-workflow.md` 的段落级流程执行：先把 TeX 中的每个原文块抽成 `.tmp/paper-to-site/{slug}/reading-blocks/{编号}.json`，再逐块由当前 agent 翻译并写回，最后合并为前端消费的 `reading.json`。

精读质量必须通过：

```bash
node .agents/skills/paper-to-site/scripts/check-reading-quality.mjs {slug}
```

该脚本会拦截空译文、占位词、引用键进入中文译文、英文占比过高、连续英文长句、中文覆盖不足等常见偷懒模式。脚本失败时必须修译文，不要降低校验门槛。

TeX 工程目录只作为本地源材料，通常位于 `assets/papers/{category}/arXiv-{id}v{version}/`。不要把 TeX 工程复制到 `public/`。

站点需要发布的图片、插图或转换后的图表存放在 `public/generated/{slug}/`。TeX 的 `images/*.pdf` 应转换为同名 `.png`，例如 `images/MCTS.pdf` -> `public/generated/{slug}/MCTS.png`。前端内容优先引用 PNG；只有转换工具不可用时才临时回退 PDF。

论文分类来自 `content/categories.json`。生成 `paper.json` 时，`category` 必须使用其中已有的 `slug`，`categoryLabel` 必须使用同一条目的 `label`。`tags` 才是论文自己的细粒度 topic，用于写方法、任务、数据集、关键词或技术名。

## explainer.mdx 支持的写法

讲解页不是完整 MDX 运行时，而是本站前端约定的安全内容格式。生成时使用下面这些能力即可：

- `##` 和 `###`：生成正文标题，并自动进入讲解页目录。`##` 用于 6-9 个主线章节，`###` 只用于长章节内部的少量子问题。不要把每个技术动作都写成 `##`，否则目录会变成割裂的术语堆砌。
- `**重点**`：加粗关键概念。
- `==重点==`：高亮核心结论或容易忽略的判断。
- `` `变量名/代码对象` ``：行内代码。
- `$W$`：行内公式，前端用 KaTeX 渲染。
- fenced code block：代码块，必须写语言名，如 `python`、`typescript`。
- `<MathBlock formula="..." explanation="..." />`：块级公式。
- `<AlgorithmBlock title="..." code="..." explanation="..." />`：论文原文算法块。`code` 中的换行用 `&#10;` 或 `\n` 表示。
- `<FigureBlock src="..." caption="..." />`：论文原图或辅助图。
- `<CalloutBlock title="..." body="..." tone="accent" />`：重点提示、误区、核心判断。
- `<SplitBlock leftTitle="..." left="..." rightTitle="..." right="..." />`：左右分栏对比。
- `<StepFlow steps="选择|扩展|评估|回传" descriptions="...|...|...|..." />`：流程步骤展示。
- `<ConceptTabs tabs="直觉|公式|工程" panels="...|...|..." />`：轻量交互式切换。

示例：

````mdx
## 方法总览

AFlow 把 **workflow 优化** 变成一个搜索问题：在候选空间 $\\mathcal{S}$ 中寻找得分最高的 workflow。

<MathBlock
  formula="W^* = \\arg\\max_{W \\in \\mathcal{S}} G(W, T)"
  explanation="在所有候选 workflow 组成的搜索空间中，找到让任务评测函数得分最高的工作流。"
/>

```python
workflow = init_template()
tree = SearchTree(workflow)
for step in range(max_iterations):
    child = llm_expand(tree)
```

<FigureBlock
  src="/generated/{slug}/MCTS.png"
  caption="AFlow 使用搜索树保存候选 workflow 的执行经验，并不断扩展更有希望的分支。"
/>
````

写作上不要只给摘要。每个重要方法点都要说明：问题是什么、论文怎么做、为什么有效、实验或推理证据是什么、读者能复用什么。

### explainer.mdx 内容深度约束

讲解页面向读者的目标是“理解论文并知道如何复现核心思路”，不是快速概览。生成时必须满足：

- 正文通常不少于 8,000 个中文字符；如果论文含核心算法、多张实验表格或长附录，通常不少于 12,000 个中文字符。代码块、原文算法和图注不计入正文深度。
- `##` 通常使用 7-10 个主线章节。方法复杂时，应拆出“方法总览”“核心机制”“算法与实现细节”“实验结果”“消融/成本/案例”“局限与复用启发”等主线，而不是把所有内容压进 5 个短章节。
- 如果 `reading.json` 中有 `kind: "algorithm"`，讲解页必须包含至少一个 `<AlgorithmBlock />`，并在算法块前后解释输入、输出、初始化、主循环、关键分支、状态更新、终止条件和它与实验结果的关系。
- 如果 `reading.json` 中有 `kind: "equation"`，讲解页必须至少使用一个 `<MathBlock />` 或在正文中逐项解释关键公式变量。
- 如果 `reading.json` 中有 `kind: "table"`，讲解页必须解释实验指标、基线、主结果、消融/成本/案例中的至少几类证据，不能只贴一句“效果更好”。
- 如果 `reading.json` 中有多张核心图，讲解页至少展示 2 张，并在正文里解释图中模块、箭头、数据流或结果趋势。
- 讲解页必须包含实现直觉：关键数据结构是什么、模块之间如何传递状态、反馈信号如何影响下一步、工程复用时哪些地方要替换。

## explainer.mdx 生成过程要求

正式写 `explainer.mdx` 之前，先按 `references/explainer-research-workflow.md` 创建 `.tmp/paper-to-site/{slug}/explainer-notes.md`。讲解页必须从研究笔记 reduce 而来，而不是直接从摘要生成。写完后用笔记中的 Coverage Check 对照检查：方法、实验、图表、算法、代码、附录和局限都必须有明确处理。

研究笔记必须至少包含 `Content Inventory`、`Mechanism Ledger`、`Figure/Table Ledger`、`Results Ledger`、`Reduce Plan`、`Explainer Outline` 和 `Coverage Check`。如果论文含算法，还必须包含 `Algorithm Ledger`。这些账本不是形式要求，而是为了防止漏掉重要概念、算法块、实验结果或附录实现细节。

`paper.json` 示例：

```json
{
  "slug": "evoagentx-automated-framework-evolving-agentic-workflows",
  "title": "EvoAgentX: An Automated Framework for Evolving Agentic Workflows",
  "authors": ["Yingxu Wang", "Siwei Liu"],
  "institutions": ["Mohamed bin Zayed University of Artificial Intelligence", "University of Aberdeen"],
  "authorAffiliations": [
    { "name": "Yingxu Wang", "institutionIds": [1] },
    { "name": "Siwei Liu", "institutionIds": [2] }
  ],
  "institutionDetails": [
    { "id": 1, "name": "Mohamed bin Zayed University of Artificial Intelligence", "translation": "穆罕默德·本·扎耶德人工智能大学" },
    { "id": 2, "name": "University of Aberdeen", "translation": "阿伯丁大学" }
  ],
  "year": 2025,
  "venue": "arXiv",
  "category": "architecture",
  "categoryLabel": "Agent 架构",
  "tags": ["agent workflow", "evolution", "multi-agent"],
  "summary": "中文摘要。",
  "arxivId": "2410.10762",
  "arxivUrl": "https://arxiv.org/abs/2410.10762",
  "sourcePath": "assets/papers/architecture/arXiv-2410.10762v4"
}
```
