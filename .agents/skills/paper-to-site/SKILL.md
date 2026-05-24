---
name: paper-to-site
description: 将 Agent 领域论文的 TeX/LaTeX 工程目录转换为本站可发布的中文论文学习内容。适用于添加新论文、从 arXiv TeX 源码生成沉浸式中英对照精读页、生成中文论文讲解页、规划 image_gen 插图/流程图、提取 arXiv 编号与链接、校验论文内容和更新搜索索引。
---

# Paper To Site

这个 skill 用于把一篇论文的 TeX/LaTeX 工程目录转换为当前 Next.js 论文学习站的内容产物。优先使用 TeX 工程，而不是 PDF。PDF 只作为核对排版和页码的辅助材料。

## 输入约定

优先输入论文 TeX 工程目录，例如：

```text
assets/papers/architecture/arXiv-2410.10762v4/
```

处理时必须：

- 从目录名提取 arXiv 编号：`arXiv-2410.10762v4` -> `2410.10762`。
- 在 `paper.json` 写入 `arxivId` 和 `arxivUrl`，例如 `https://arxiv.org/abs/2410.10762`。
- 从 TeX 正文、摘要、脚注、附录、README 或项目说明中提取 GitHub 仓库链接；如果找到正式代码仓库，写入 `paper.json.codeUrl`，例如 `https://github.com/org/repo`。如果没有找到 GitHub 仓库，不要写空字段，前端不会显示 GitHub 按钮。
- 优先读取 `main.tex`；如果工程没有 `main.tex`，自动选择包含 `\title{...}` 与 `\begin{document}` 的主入口 TeX（例如 ACL 模板常见的 `acl_latex.tex`）。随后追踪 `\input{...}`、`\include{...}`、`\bibliography{...}`、`\addbibresource{...}` 引用的文件。
- 读取 `files/`、`sections/`、`appendix/`、`images/`、`figures/`、`pic/`、`.bib`、`.bbl` 等与正文、附录、引用、图表有关的内容。
- 忽略 TeX 编译缓存和非内容文件，例如 `minted-cache/`、`.aux`、`.log`、`.out`。

## 输出位置

站点内容写入：

```text
content/papers/{slug}/paper.json
content/papers/{slug}/explainer.mdx
content/papers/{slug}/reading.json
```

生成或转换后的站点图片资源写入：

```text
public/generated/{slug}/
```

TeX 工程目录只作为本地源材料，不复制到 `public/`，也不进入 GitHub Pages 的最终发布产物。当前 Pages workflow 只上传 `out/`，因此最终线上站点不需要 TeX 工程。

## Reference 级流程

主 skill 只保留项目硬约束和执行入口。具体生成流程必须按需读取 references：

- 精读页生成：先读取并执行 `references/reading-translation-workflow.md`。
- 讲解页生成：先读取并执行 `references/explainer-research-workflow.md`。
- 前端内容格式：写入前读取 `references/content-format.md`。

不要把 references 当成可选建议；当任务涉及对应产物时，它们就是生成协议。

## 多论文生成与 subagent 隔离

当用户一次性指定生成多篇论文的内容时，必须使用 subagent 隔离每篇论文的生成过程。主 agent 只做协调，不直接在同一上下文中混合阅读多篇论文。

执行规则：

- 先由主 agent 扫描输入目录，列出每篇论文的 `sourcePath`、arXiv ID、候选 `slug`、分类和预期输出目录。
- 为每篇论文启动一个独立 subagent。每个 subagent 只接收当前论文的源目录、目标 `slug`、分类表位置、Poppler/图片转换工具路径和本 skill 路径。
- 每个 subagent 必须独立读取 `SKILL.md`、`references/content-format.md`、`references/reading-translation-workflow.md` 和 `references/explainer-research-workflow.md`，并独立生成该论文的 `paper.json`、`reading.json`、`explainer.mdx`、`public/generated/{slug}/` 与 `.tmp/paper-to-site/{slug}/explainer-notes.md`。
- 每个 subagent 只能写自己的 `content/papers/{slug}/`、`public/generated/{slug}/` 和 `.tmp/paper-to-site/{slug}/`。不要让一个 subagent 修改其他论文内容、全局索引或其他论文临时笔记。
- 主 agent 在所有 subagent 完成后，统一运行 `node .agents/skills/paper-to-site/scripts/check-paper-content.mjs`、`node .agents/skills/paper-to-site/scripts/check-explainer-quality.mjs`、`npm run paper:index` 和 `npm run build`。
- 如果某篇论文失败，只让对应 subagent 或一个新的隔离 subagent 修复该论文；不要把多篇论文的 TeX、笔记和正文同时塞回主 agent 上下文里修。
- 如果当前环境没有可用 subagent 能力，必须明确说明无法做到真正隔离；然后逐篇顺序生成，并在每篇之间清空当前论文相关上下文，只保留路径、slug 和校验结果这类最小状态。

## 单篇论文内的阶段隔离

即使用户只要求生成一篇论文，也应尽量把精读页和讲解页放到独立干净的上下文中完成。推荐同一论文至少拆成两个 subagent：

- `reading subagent`：只负责 TeX 展开、原文块抽取、逐块翻译、`reading.json` 和 `check-reading-quality`。它不写 `explainer.mdx`。
- `explainer subagent`：在 `reading.json` 已通过质量检查后启动，只负责研究笔记、讲解页大纲、`explainer.mdx` 和 `check-explainer-quality`。它可以读取已通过校验的 `reading.json`、论文 TeX、图表和附录，但不要继承 reading subagent 的翻译上下文。

主 agent 负责顺序编排：

1. 准备 `paper.json`、图片资源和基础元数据。
2. 启动 reading subagent 生成并校验 `reading.json`。
3. 只有 `check-reading-quality` 通过后，才启动 explainer subagent。
4. 最后由主 agent 统一运行全局校验、搜索索引和 build。

如果没有 subagent 能力，必须按阶段顺序执行，并在精读页完成后主动压缩状态：只保留 `sourcePath`、`slug`、通过校验的 `reading.json` 路径、图表路径和少量结构摘要，再开始讲解页生成。不要在同一个长上下文里既翻译整篇论文又写深度讲解。

隔离目标：

- 防止 A 论文的术语、算法、实验数字或图表误写进 B 论文。
- 防止长上下文导致后续论文讲解页缩水、漏算法、漏附录或实验解读变浅。
- 让每篇论文的 `.tmp/paper-to-site/{slug}/explainer-notes.md` 都能成为独立、可审计的生成依据。
- 防止精读页翻译阶段的长段英文残留和讲解页写作阶段互相污染。

## 分类与标签规则

生成 `paper.json` 前必须读取项目分类表：

```text
content/categories.json
```

`category` 只能从分类表中的 `slug` 选择，`categoryLabel` 必须严格等于对应条目的 `label`。不要临时编造分类，也不要让同一类论文出现多个近义 slug。如果没有合适分类，先向用户说明建议新增的 `slug`、`label` 和 `description`，确认后再修改 `content/categories.json`。

当前分类体系面向 Agent 论文，常见选择包括：

- `architecture` / `Agent 架构`：agent workflow、模块协作、任务分解、搜索与自我改进。
- `planning` / `规划与推理`：任务规划、推理策略、反思和长程决策。
- `memory` / `记忆系统`：短期记忆、长期记忆、经验复用和状态管理。
- `rag` / `RAG 与知识`：检索增强生成、知识库构建和外部知识利用。
- `evaluation` / `评测与基准`：任务设计、指标、实验协议和结果解释。
- `evolution` / `演化与自我改进`：自动优化、workflow 演化、搜索、反馈学习和持续改进。
- `multi-agent` / `多智能体协作`：多 agent 通信、角色分工、协作协议和群体决策。
- `tools` / `工具使用`：函数调用、工具路由、环境交互和代码执行。
- `code-agents` / `代码与软件工程`：代码生成、程序修复、软件工程自动化和测试。
- `safety` / `安全与可靠性`：鲁棒性、权限边界、攻击防护、对齐和失败恢复。

`tags` 是论文级细粒度 topic，可以自由生成，但要具体到方法、任务或关键词，例如 `MCTS`、`workflow 自动化`、`长期记忆`、`RAG 路由`。不要把分类名原样堆进 tags。

## 图表资源处理

TeX 工程里的论文图像应转换或复制到站点资源目录。脚本会递归扫描常见图片目录（例如 `images/`、`figures/`、`pic/`），把 PDF 转为 PNG，并把 PNG/JPG/WebP 复制到 `public/generated/{slug}/`。优先使用 PNG，因为它比在页面里嵌入 PDF 更适合 GitHub Pages、移动端和浏览器一致性。

运行：

```bash
node .agents/skills/paper-to-site/scripts/convert-figure-pdfs.mjs assets/papers/architecture/arXiv-2410.10762v4 aflow-automating-agentic-workflow-generation
```

脚本会优先使用本机已有工具：ImageMagick `magick`、Poppler `pdftoppm`、MuPDF `mutool`、Ghostscript `gswin64c/gs`。使用 Poppler/Ghostscript 时必须按 PDF 的 CropBox 渲染，避免把整张 MediaBox 页面空白转成 PNG。如果都没有安装，脚本会明确提示安装其中任意一个。不要把 TeX 原始 PDF 图直接作为最终展示方案，除非当前环境无法转换，且需要临时预览。

## 沉浸式精读页生成规则

生成 `reading.json` 时必须先读取并执行：

```text
.agents/skills/paper-to-site/references/reading-translation-workflow.md
```

核心流程是：**逐步读取 TeX -> 抽取每个原文块为编号临时 JSON -> 当前 agent 逐块翻译并写回临时 JSON -> 合并为 `reading.json` -> 校验后删除临时块文件**。不要一次性把整篇论文全部翻译结果塞进一个上下文里生成最终 JSON。

精读页硬约束：

- `reading.json` 必须覆盖 TeX 正文和附录中的全部可读内容，包括标题、作者、机构、摘要、章节、正文段落、公式、图、表、算法、代码、脚注、结论、局限、致谢和附录。
- 英文 `sourceText` 必须保留原意和顺序；中文 `translation` 必须是完整译文，不能是摘要、说明模板或占位。
- 引用标记只保留在英文原文中，不要把 `\cite{...}`、`\citep{...}`、作者年份引用或引用键翻进中文译文。
- 不要默认调用联网翻译服务。除非用户明确要求使用外部翻译工具，否则中文翻译由当前 agent 基于 TeX 原文逐段完成。
- 图、表、算法、公式和代码都要进入 `reading.json`，并用 `kind` 标明类型；图像块优先通过 `assetPath` 指向 PNG。
- `kind: "algorithm"` 的 `sourceText` 不能只写算法标题或 caption，必须包含论文原文算法步骤。推荐格式是第一行 `Algorithm: {caption}`，随后保留 `Require`、`Ensure`、`for/while/if`、`return` 等伪代码主体；中文 `translation` 解释输入、输出、循环、选择/扩展/评估/回传等关键阶段。
- 代码块的 `sourceText` 保留原代码；`translation` 解释代码在论文方法、实验或附录中的作用，不能写前端实现说明。
- 最终 `translation` 不能出现“占位”“待精译”“自动抽取预览”“后续补充”“中文翻译：”或大段英文原文复制。
- 最终 `translation` 必须通过 `node .agents/skills/paper-to-site/scripts/check-reading-quality.mjs {slug}`。该脚本失败时，不允许把 `reading.json` 视为完成。

## 中文讲解页生成规则

`explainer.mdx` 是面向中文读者的论文深度讲解，不是逐段翻译，也不是摘要扩写。它的首要目标是让读者真正理解论文的核心思想、方法结构、算法流程、实现细节、实验结果、局限边界和可复用启发。

生成 `explainer.mdx` 时必须先读取并执行：

```text
.agents/skills/paper-to-site/references/explainer-research-workflow.md
```

核心流程是：**逐步阅读 TeX -> 写临时研究笔记 -> 建立 Content Inventory / Mechanism Ledger / Algorithm Ledger / Figure/Table Ledger / Results Ledger -> 生成 Reduce Plan -> 写 `explainer.mdx` -> 用覆盖矩阵和质量脚本检查并补齐**。不要只基于 abstract、`paper.json` 或一次性脚本输出直接写讲解页。

临时研究笔记写入：

```text
.tmp/paper-to-site/{slug}/explainer-notes.md
```

这个临时文件只服务于生成过程，不进入前端内容，也不要在讲解页提到。它必须记录每个章节的动机、核心主张、机制/公式/算法、图表代码、实验结果、局限和可复用启发。生成讲解页前，先在笔记中写 `Content Inventory`、`Mechanism Ledger`、`Algorithm Ledger`、`Figure/Table Ledger`、`Results Ledger`、`Reduce Plan` 和 `Explainer Outline`，说明每个讲解主线章节来自哪些论文证据。

讲解页长度和深度要求：

- 普通论文讲解正文通常不少于 8,000 个中文字符；方法复杂、含核心算法、多张实验表格或长附录的论文通常不少于 12,000 个中文字符。不要把代码块、原文算法和图注当作正文深度。
- 讲解页通常使用 7-10 个 `##` 主线章节。不能把方法、算法、实验和局限压缩成几段短摘要。
- 如果论文或 `reading.json` 有算法，讲解页必须至少包含一个 `<AlgorithmBlock />`，并在算法块前后解释输入、输出、初始化、主循环、关键分支、状态更新、终止条件和实验意义。
- 如果论文有公式、图、表、代码或 prompt，它们不能只进入精读页；讲解页必须挑出对理解论文最重要的部分进行解释。
- 实验章节必须解释数据集、指标、基线、主结果、消融、成本/效率/案例或人工评测，不能只复述“优于基线”。

### explainer.mdx 前端内容协议

当前前端会直接解析 `explainer.mdx`，生成正文、目录、公式、代码块和图表。生成内容时必须遵守这些语法：

- 用 `##` 写论文讲解的主线章节，用 `###` 写主线章节内部的少量子节。前端目录默认突出 `##`，`###` 会收纳在对应章节下，避免目录变成技术点清单。
- 段落中可以使用 `**加粗重点**`、`==高亮重点==`、`` `代码/变量名` ``、行内公式 `$W$`。
- 块级公式必须使用组件，不要直接写裸 `$$...$$`：

```mdx
<MathBlock
  formula="W^* = \\arg\\max_{W \\in \\mathcal{S}} G(W, T)"
  explanation="在所有候选 workflow 组成的搜索空间中，找到让任务评测函数得分最高的工作流。"
/>
```

- 代码或伪代码必须使用带语言名的 fenced code block，前端会提供复制、行号和基础语法高亮：

````md
```python
workflow = init_template()
for step in range(max_iterations):
    child = llm_expand(workflow)
```
````

- 论文原文算法优先使用固定组件，展示原算法块并紧跟中文讲解：

```mdx
<AlgorithmBlock
  title="Algorithm of AFlow: Detailed implementation"
  code="Require: Evaluator $G$, Dataset $D$, Operators $\\mathcal{O}$&#10;Ensure: Optimized Workflow $W^*$&#10;for iteration ← 1 to $N_{max}$:&#10;  workflow ← Select(tree)  # Using soft mixed probability strategy"
  explanation="这段算法把 AFlow 的搜索闭环压缩成初始化、选择、扩展、评估、回传和早停六个阶段。"
/>
```

- 论文原图、TeX 图表或 image_gen 辅助图使用：

```mdx
<FigureBlock
  src="/generated/{slug}/MCTS.png"
  caption="AFlow 的 MCTS 搜索闭环：选择、扩展、评估、回传。"
/>
```

- 图表资源优先引用 PNG。如果 PNG 暂时不存在但 PDF 存在，前端会回退到同名 PDF；skill 仍应继续尝试把 PDF 转成 PNG。
- 富内容块可以使用固定组件，不要生成任意 React：
  - `<AlgorithmBlock title="..." code="..." explanation="..." />`：用于展示论文原文算法块和中文算法讲解。`code` 中的换行用 `&#10;` 或 `\n` 表示。
  - `<CalloutBlock title="..." body="..." tone="accent" />`：用于核心判断、误区、阅读提示。
  - `<SplitBlock leftTitle="..." left="..." rightTitle="..." right="..." />`：用于对比两种方法、两个概念或实验前后。
  - `<StepFlow steps="选择|扩展|评估|回传" descriptions="...|...|...|..." />`：用于展示 pipeline、搜索闭环和算法阶段。
  - `<ConceptTabs tabs="直觉|公式|工程" panels="...|...|..." />`：用于少量交互式概念切换；内容必须简短，不能塞整段论文。
- 不要在 `explainer.mdx` 里写任意 HTML。除 `MathBlock`、`FigureBlock` 和上述固定富内容块外，优先使用上面的固定格式，保证后续论文都能稳定渲染。

### 讲解结构要求

讲解页要“抽丝剥茧”，不能只写论文摘要。`##` 通常控制在 7-10 个主线章节；它们应该组成一条阅读路径，而不是把每个技术动作都拆成大标题。`###` 只用于长章节内部真正需要跳读的子问题，不要为了让目录显得详细而机械添加。不要连续写语义重复的标题，例如 `### 形式化目标` 后面立刻再写 `### 从自然语言到目标函数`；如果第二个标题只是解释角度，直接写成正文过渡句。

推荐主线结构：

- `## 读前先抓住结论`：用 3-5 段说明论文一句话问题、核心办法、最重要结果、适用边界。
- `## 问题背景`：解释为什么这个问题存在，过去方法为什么不够，和 agent 领域的关系是什么。
- `## 核心贡献`：每条贡献都要说明“解决了什么痛点、用了什么技术、证据在哪里”。
- `## 方法总览`：先给直觉图或流程，再解释整体 pipeline。
- `## 方法：从直觉到机制`：把关键概念、公式、数据结构和模块交互组织在同一个方法叙事里，必要时用 `###` 分出符号、流程、状态、数据结构等子节。
- `## 算法与实现细节`：当论文含算法、代码、prompt、operator、planner、search loop、训练/推理流程时必须出现；展示原文算法或等价伪代码，并拆解每一步。
- `## 实验怎么读`：解释数据集、指标、基线、主结果、消融实验和成本分析，不只复述数字。
- `## 消融、案例与成本`：方法复杂或实验丰富时单独成章，说明哪个模块真正带来增益、成本是否可接受、案例揭示了什么失败或成功模式。
- `## 局限与复用启发`：说明方法在哪些场景可能失败，以及读者如何迁移到自己的 agent 项目。

### 讲解深度要求

每个技术点都按这个顺序展开：

1. **它想解决什么问题**：先用自然语言说清楚动机。
2. **论文怎么做**：说明结构、公式、算法或实验设置。
3. **为什么这样做有效**：连接直觉、搜索空间、反馈信号或实验现象。
4. **读者应该带走什么**：给出可复用的工程启发或理解锚点。

关键机制不能写成摘要式短段。对论文的核心方法、核心公式、关键算法、关键实验和重要局限，必须写出连续解释链：

- **问题入口**：先说明这个机制在论文中解决哪个具体困难。
- **结构拆解**：拆出输入、输出、中间状态、关键变量、约束条件。
- **运行过程**：按执行顺序解释它如何工作，必要时配 `StepFlow` 或代码块。
- **直觉解释**：用中文把公式、算法或实验现象翻译成读者能复述的判断。
- **证据连接**：指出它对应论文哪张图、哪个表、哪个消融或哪个案例。
- **边界提醒**：说明它什么时候可能不适用，或者实现时最容易误解什么。

每个核心 `##` 章节至少应包含 2-4 个实质段落；方法和实验章节通常需要更多。不要只用一句话总结技术点。宁可让段落适当变长，也要把“为什么这样设计”和“它如何影响结果”讲清楚。

算法讲解必须做到：

- 算法块前先说明它解决哪个问题、为什么需要显式算法。
- `<AlgorithmBlock />` 中保留论文原文算法的关键步骤，不能只有标题或 caption。
- 算法块后用 2-5 段解释 Require/Ensure、初始化、主循环、选择/扩展/生成/检索/评估/更新/回传等阶段、终止条件和返回值。
- 明确指出算法与论文图、公式、消融或主结果之间的关系。

实验讲解必须做到：

- 解释每个核心指标的含义和方向。
- 说明主要基线各代表什么方法家族。
- 读出主结果趋势、消融结论、成本/效率 trade-off、案例或人工评测含义。
- 明确指出结果不能证明什么，避免夸大。

写作要求：

- 所有面向用户的讲解使用中文，英文标题、术语、变量名和引用可以保留英文。
- 段落按理解节奏组织：一般段落保持清晰可扫读；遇到公式推导、算法解释、实验结果解读时可以适当写长，但要保证一段只围绕一个中心问题展开，避免无分隔地堆叠多个技术点。
- 关键变量、算子、模块和实验结论要加粗或高亮。
- 有公式就必须配中文 explanation；有算法就优先展示论文原文算法块 `<AlgorithmBlock />`，并配中文步骤拆解；有实验表格就必须解释指标含义和结果趋势。
- 不要在面向用户的讲解页生成“生成记录”“由 skill 生成”“后续可继续加入”这类制作说明。此类信息只能放在开发日志或提交说明，不进入 `explainer.mdx`。
- 如果论文原图不足以说明结构，可以使用 Codex `image_gen` 生成辅助中文图解，但不能伪造实验数据或替代论文真实结果。**每一张 image_gen 生成的 PNG 都必须被复制到 `public/generated/{slug}/`，并在 `explainer.mdx` 中用 `<FigureBlock src="/generated/{slug}/xxx.png" caption="..." />` 引用展示；不得留下未使用的生成图。**

## image_gen 使用规则

当论文原图不足以解释概念，或需要更直观的中文图解时，可以使用 Codex `image_gen` 生成辅助图。

适合生成：

- 方法流程图
- agent workflow 架构图
- 搜索/演化/优化闭环图
- 实验 pipeline 图
- 概念类插图

不适合生成：

- 伪造实验结果图
- 改写论文原始数据图
- 替代必须忠实呈现的论文表格

生成图片后写入 `public/generated/{slug}/`，并在内容中保留中文图注和 alt 文本。

image_gen 图片使用后必须满足：

- 文件名语义化，例如 `aflow-search-loop-cn.png`，不要使用随机文件名。
- 至少在 `explainer.mdx` 中出现一次对应 `<FigureBlock />`。
- 图注必须说明这是辅助图解，不能让读者误以为是论文原始实验图。
- 如果生成多张备选图，只保留实际展示的一张；未使用图片不要进入 `public/generated/{slug}/`。

## paper.json 字段

必须包含：

- `slug`
- `title`
- `authors`
- `institutions`
- `authorAffiliations`
- `institutionDetails`
- `year`
- `venue`
- `category`
- `categoryLabel`
- `tags`
- `summary`
- `arxivId`
- `arxivUrl`
- `sourcePath`

可选：

- `pdfPath`
- `codeUrl`
- `projectUrl`

其中 `codeUrl` 只在确实提取到 GitHub 仓库链接时填写。优先使用论文正文显式写出的 “code / repository / code repo is available” 链接；不要把模板、LaTeX 样式、引用库或非论文项目链接误写为代码仓库。

## 工作流

1. 检查输入 TeX 目录和目录名中的 arXiv 编号。
   可先运行：

```bash
node .agents/skills/paper-to-site/scripts/inspect-tex-project.mjs assets/papers/architecture/arXiv-2410.10762v4
```

2. 解析 `main.tex` 和被引用的章节文件，建立完整文档顺序。
3. 提取论文元数据、章节树、正文块、公式、图表、算法、代码、引用和附录。
   同时扫描 GitHub 链接并判断是否为论文代码仓库；提取到时写入 `paper.json.codeUrl`，未提取到时省略。
4. 将 `images/*.pdf` 转成 `public/generated/{slug}/*.png`，内容中优先引用 PNG。
5. 读取 `content/categories.json`，从已有分类中选择最贴切的 `category`，并让 `categoryLabel` 与分类表一致。
6. 生成 `paper.json`。
7. 按 `references/reading-translation-workflow.md` 生成完整中英对照 `reading.json`。结构抽取脚本只能帮助定位原文块；`translation` 必须由当前 agent 逐块翻译。翻译完成后检查 `translation`，确认自然语言段落不是模板说明，也不是英文原文复制。校验通过后删除 `.tmp/paper-to-site/{slug}/reading-blocks/`。
   - 如已有初版 `reading.json`，可运行 `node .agents/skills/paper-to-site/scripts/prepare-reading-blocks.mjs {slug}` 拆成编号临时块。
   - 每块翻译完成后写回对应 `.tmp/paper-to-site/{slug}/reading-blocks/{编号}.json`。
   - 全部翻译完成后运行 `node .agents/skills/paper-to-site/scripts/merge-reading-blocks.mjs {slug}` 合并并清理临时块。
8. 按 `references/explainer-research-workflow.md` 先生成 `.tmp/paper-to-site/{slug}/explainer-notes.md`，逐节记录研究笔记、Reduce Plan 和 Coverage Check。
9. 基于研究笔记生成中文讲解 `explainer.mdx`，必要时规划或生成 image_gen 图片。讲解页必须覆盖研究笔记中的机制账本、算法账本、图表账本和结果账本。
10. 运行：

```bash
node .agents/skills/paper-to-site/scripts/check-paper-content.mjs
node .agents/skills/paper-to-site/scripts/check-reading-quality.mjs
node .agents/skills/paper-to-site/scripts/check-explainer-quality.mjs
npm run paper:index
npm run build
```

## 质量要求

- 所有面向用户的内容使用中文，英文原文、论文标题、专有术语和引用信息除外。
- 精读页重完整性，讲解页重理解效率，两者不能互相替代。
- 精读页和讲解页应尽量由不同 subagent 或不同干净上下文生成；精读页先通过质量检查，讲解页再开始。
- 讲解页必须由临时研究笔记 reduce 而来；如果没有 `.tmp/paper-to-site/{slug}/explainer-notes.md` 的 Content Inventory、Mechanism Ledger、Algorithm Ledger（论文含算法时）、Figure/Table Ledger、Results Ledger、Reduce Plan、Explainer Outline 和 Coverage Check，不应认为讲解页生成完成。
- 讲解页宁可稍长，也不能漏掉核心机制、算法、实验和附录实现细节。太短的讲解页是不合格产物。
- 不要把 TeX 源码目录复制到 `public/`。
- 不要只根据摘要生成整篇论文内容，必须追踪 TeX 的完整正文和附录。
- 如果存在多个版本文件，优先使用 `main.tex` 实际引用的文件。
