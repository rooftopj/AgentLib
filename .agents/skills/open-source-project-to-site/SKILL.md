---
name: open-source-project-to-site
description: 将开源项目源码和一个学习焦点转换为 Agent Lib 的中文项目讲解页面。适用于用户提供 GitHub 仓库或本地源码目录，希望围绕某个机制做深度源码解读、架构图、流程图、实现细节分析，并发布到 content/projects。
---

# 开源项目源码解读到站点

## 工作流

用这个 skill 把“仓库 + 学习焦点”转成 Agent Lib 的开源项目讲解页。不要一开始凭空写最终大纲；必须先形成源码认知，再生成解读 plan。

1. 确认源码来源。
   - 优先使用本地已下载仓库，例如 `assets/projects/<repo>`。
   - 只有用户允许网络访问且本地没有源码时，才考虑 clone 或拉取。
   - 记录 `repoUrl`、`localSourcePath`、`projectName`、`focus`、`analyzedCommit` 和分析日期。

2. 启动源码侦察阶段。
   - 如果任务较大，或用户要求“不要流于表面”，优先启动一个 `explorer` 子代理阅读源码。
   - 子代理不要写文件，只返回：源码证据地图、关键洞察、推荐讲解顺序、容易误读的负面事实、推荐配图、与主轴相关的边界。
   - 主代理不要照抄子代理结论；必须带着侦察报告二次阅读关键源码并核验。

3. 生成解读 plan。
   - plan 必须在源码侦察之后生成，落盘到 `content/projects/<slug>/plan.md`。
   - plan 要先回答“这篇讲解到底解决什么问题”，再组织讲解顺序。
   - plan 至少包含：读者问题、源码证据地图、讲解大纲、配图规划、默认路径与可选路径、当前主题的边界。

4. 提炼真实机制，而不是平均摘要。
   - 必须回答本主题真正关心的生命周期问题，例如：什么时候触发、输入/输出是什么、状态存在哪、如何更新、如何恢复或继续、默认路径和可选能力分别是什么。
   - 只有 memory/retrieval 主题才必须回答：什么时候触发写入、写入什么、存在哪、如何更新或处理冲突、什么时候触发召回、如何检索、如何排序或过滤。
   - memory/retrieval 主题必须明确区分 vector storage、vector search、lexical/BM25 search、LLM rerank、文件或数据库持久化；非 memory 主题不要为了过门控强行牵扯这些概念。
   - 主动写出不容易从 README 看出的负面事实。memory/retrieval 主题可以写“默认不是向量库”“没有结构化 supersede 表”；其他主题应写本主题自己的边界，例如“不是 git 回滚”“默认不创建 worktree”“不是自动规划器”。

5. 制作项目配图。
   - 默认至少 3 张图；复杂主题建议 4 张：宏观架构图、关键生命周期图、存储布局图、召回或更新流程图。
   - 简单架构和流程优先使用确定性 SVG 或 Mermaid 转图，保存到 `public/generated/<project-slug>/`。
   - 只有概念型、氛围型或需要丰富视觉表达的图片才使用 `imagegen`；不要用 imagegen 画普通架构框图。
   - 正文用 `<FigureBlock src="/generated/<project-slug>/<file>" caption="..." />` 引用。

6. 生成 Agent Lib 项目内容。
   - 创建 `content/projects/<slug>/project.json`。
   - 创建 `content/projects/<slug>/plan.md`。
   - 创建 `content/projects/<slug>/explainer.mdx`。
   - 创建 `content/projects/<slug>/review.md`。
   - 开源项目讲解只放在 `content/projects`，不要放到 `content/blogs`。
   - 正文要精选关键路径，不要枚举目录树。读者读完应该理解机制，而不是只知道文件列表。

6. Review and revise.
   - Create `content/projects/<slug>/review.md` as the final review report. You may keep scratch notes in `.tmp/project-to-site/<slug>/`, but the content review must live with the project so builds are reproducible.
   - Re-read the explainer against the source evidence map and the user's focus question.
   - Identify missing mechanisms, weak source evidence, over-abstract explanation, long prose runs, missing visuals, or places needing a second pass.
   - Apply revisions before final validation. The review is not a formality; it must record what changed or why no change was needed.

7. Update and validate the site.
   - Ensure `project:registry`, `project:validate`, and `content:index` include the new project.
   - Run `npm run project:registry`, `npm run project:validate`, `npm run project:quality`, `npm run project:review`, and the broader build when feasible.

## plan.md 模板

```md
# 解读 Plan: <slug>

## 读者问题
- 这篇要回答什么：
- 不回答什么：

## 源码侦察摘要
- 子代理或侦察阶段的关键洞察：
- 主代理二次核验的源码：

## 源码证据地图
- 入口：
- 写入：
- 存储：
- 更新/冲突：
- 召回/检索：
- 权限/边界：

## 讲解大纲
- 先给结论：
- 宏观架构：
- 生命周期：
- 源码细读：
- 可复用设计：
- 边界：

## 配图规划
- 架构图：
- 流程图：
- 存储图：
- 召回或冲突图：

## 默认与可选
- 默认路径：
- 可选路径：
```

## 项目元数据

`project.json` 使用这个结构：

```json
{
  "slug": "repo-focus",
  "title": "中文标题",
  "repoUrl": "https://github.com/org/repo",
  "localSourcePath": "assets/projects/repo",
  "projectName": "repo",
  "focus": "要学习的功能或设计问题",
  "analyzedCommit": "optional commit or version",
  "analyzedDate": "YYYY-MM-DD",
  "category": "memory",
  "categoryLabel": "记忆系统",
  "tags": ["开源项目", "源码解读"],
  "summary": "不少于 40 字的中文摘要。",
  "coverImagePath": "/generated/repo-focus/architecture.svg",
  "coverImageAlt": "图像说明"
}
```

## 正文结构

优先使用这些章节，可以根据项目语义改名：

- `先给结论`：直接回答学习焦点。
- `宏观架构`：解释模块职责和数据流。
- `写入链路`：解释什么时候写、由谁写、写入什么。
- `存储形态`：解释数据存在哪，默认路径和可选路径分别是什么。
- `冲突与更新`：解释 dedup、merge、supersede、删除、重写或一致性约束。
- `召回链路`：解释触发、search、ranking、filter、rerank。
- `源码细读`：放短源码片段，说明为什么这段是关键路径。
- `可复用设计`：总结 Agent builder 能复用什么。
- `边界`：说明限制、风险和可能演进。

## 质量标准

- 每个重要结论都要能追溯到源码文件。
- 只引用短源码片段，用中文解释行为。
- 不要罗列所有文件。读者读完应该理解机制，而不是记住目录树。
- 成熟项目优先用“默认路径 / 可选路径 / 扩展点”组织。
- 声称完成前必须运行验证。

## 质量门控

交付前把这些当作硬门槛：

1. **机制覆盖门控**
   - 正文必须直接回答当前主题的关键生命周期：什么时候触发、由谁执行、输入/输出是什么、状态如何保存或传递、如何更新/恢复/停止、默认和可选分别是什么。
   - 只有 memory/retrieval 主题才强制覆盖：什么时候写入、写入什么、存在哪、冲突/更新怎么处理、什么时候召回、如何检索/排序、默认和可选分别是什么。
   - memory/retrieval 主题必须明确区分 vector storage、vector search、lexical/BM25 search、LLM rerank 和持久化后端；非 memory 主题不要硬写这些边界。

2. **源码证据门控**
   - 每个核心结论都必须引用具体本地源码路径和函数/类/常量名。
   - 关键路径要包含短源码片段，不要只靠 README 级描述。
   - 优先按入口 -> 编排 -> 数据模型 -> 存储 -> 检索/更新路径组织。

3. **删减门控**
   - 不要枚举每个模块。移除所有不能解释学习焦点的文件、功能和文档。
   - 只保留解释架构、运行路径、实现细节、扩展点和限制所需的内容。
   - 正文是知识讲解页面，不是作者工作记录或系列规划。不要写“第一篇只讲”“本文不展开”“后续单独成篇”“更适合另写一篇”“留到后续”等制作说明；如果某个机制不是主轴，直接说明它和当前机制的关系及边界。

4. **Plan 门控**
   - 交付前必须存在 `content/projects/<slug>/plan.md`。
   - plan 必须基于源码侦察，而不是阅读前猜测。
   - review 必须说明最终正文是否遵循 plan，若改变顺序要解释原因。

5. **配图门控**
   - 默认至少 3 张项目图；复杂主题建议 4 张。
   - 至少包含一张宏观架构图和一张关键流程图。
   - 图片保存在 `public/generated/<project-slug>/`，并在 `explainer.mdx` 引用。

6. **读者价值门控**
   - 第一节必须直接给出主结论。
   - 结尾要有基于源码的可复用设计和边界。
   - 如果源码没有直接说明，需要把推断标为推断。

7. **机械验证门控**
   - Run:

```bash
npm run project:registry
npm run project:validate
npm run project:quality
npm run project:review
npm run content:index
npm run build
```

`project:quality` enforces minimum depth and readability signals: enough sections, figures, rich components, several source excerpts, source-path evidence, required mechanism terms, no placeholders, default-vs-optional framing, no overlong pure-text paragraphs, and no long run of uninterrupted prose.

It also rejects meta narration in `explainer.mdx`: no author-facing production notes, series scheduling, or deferred-article language such as “本文不展开”, “第一篇只讲”, “后续单独成篇”, or “更适合另写一篇”. Convert those into concrete mechanism boundaries.

`project:review` enforces that every project explainer has an explicit review report at `content/projects/<slug>/review.md`.

## 阅读体验门控

不要靠连续长文本凑深度。如果某节开始变密，改成这些结构：

- `<FigureBlock />`：架构、生命周期、数据流、召回、冲突/更新、存储布局。
- `<SplitBlock />`：默认 vs 可选、运行态 vs 持久化、主路径 vs 扩展路径；memory/retrieval 主题可用写入 vs 召回、文本检索 vs 向量检索。
- `<StepFlow />`：observe/write pipeline、recall pipeline、compact pipeline、conflict-resolution pipeline。
- `<CalloutBlock />`：主结论、负面事实、警告、源码 caveat。

硬性阅读体验要求：

- 避免超过约 260 个汉字的纯文本段落。
- 避免超过四段连续纯文本，中间要插入图、callout、分栏、步骤流、列表或源码片段。
- 每个主要机制章节尽量有一个图或结构化组件。

## Review 阶段

正文草稿完成后，交付前必须单独做 review。最终报告写到：

```text
content/projects/<slug>/review.md
```

Use this structure:

```md
# Project Explainer Review: <slug>

## Review Scope
- Source repo/path:
- Focus question:
- Plan path:
- Explainer path:

## Coverage Review
- Covered:
- Missing or weak:
- Decision:

## Source Evidence Review
- Strong evidence:
- Weak or unsupported claims:
- Revisions needed:

## Reader Experience Review
- Over-abstract parts:
- Long prose / fatigue points:
- Visual or structured component opportunities:

## Revision Actions
- Applied:
- Deferred with reason:

## Final Verdict
PASS / FAIL
```

Review 规则：

- 对照用户原始问题和 plan，而不是只对照正文自己的目录。
- 查找有没有重要源码机制未解释。
- 标记读者无法还原实现的抽象句子。
- 如果某节连续多段纯文字，优先添加图、`SplitBlock`、`StepFlow`、`CalloutBlock`、列表或源码片段。
- 先应用具体修订，再更新 `Revision Actions`。
- 已知有遗漏或抽象不好理解时，不允许写 PASS。
