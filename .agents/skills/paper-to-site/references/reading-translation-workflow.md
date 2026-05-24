# 精读页段落级翻译流程

这个流程用于生成 `reading.json`。目标是避免一次性把整篇论文、全部译文和最终 JSON 都塞进上下文，导致漏段、伪翻译、英文原文复制或引用错乱。执行时必须按“抽取原文块 -> 逐块翻译 -> 批量质量检查 -> 合并校验 -> 删除临时块文件”的方式工作。

精读页的底线是：`translation` 必须是给中文读者看的完整中文译文或中文说明，不能是英文原文加少量中文词替换，不能是摘要，不能是模板说明。

## 临时目录

对每篇论文创建独立临时目录：

```text
.tmp/paper-to-site/{slug}/reading-blocks/
```

其中每个原文块保存为一个编号 JSON 文件：

```text
0001.json
0002.json
0003.json
...
```

临时文件只服务于生成过程，不进入前端，不复制到 `public/`，最终 `reading.json` 通过校验后删除 `reading-blocks/`。

## 第 1 步：建立文档顺序

先读取入口 TeX，并追踪：

- `\input{...}`
- `\include{...}`
- `\bibliography{...}`
- `\addbibresource{...}`

优先使用 `main.tex`；没有 `main.tex` 时，选择同时包含 `\title{...}` 和 `\begin{document}` 的 TeX 文件作为入口。

抽取时必须覆盖：

- 标题、作者、机构、邮箱。
- 摘要、关键词。
- 所有 numbered 和 unnumbered section/subsection/subsubsection。
- 正文段落。
- 公式、定理、定义、假设。
- 图、表、算法、代码 listing 的标题与说明。
- 脚注、重要注释。
- 结论、局限、致谢、附录。

不要把 TeX 编译缓存、模板样式文件或非内容文件写入精读块。

## 第 2 步：抽取原文块为临时 JSON

每个临时块必须是一个完整 JSON 对象。字段格式：

```json
{
  "id": 1,
  "section": "Introduction",
  "kind": "paragraph",
  "sourceText": "Original English text.",
  "assetPath": "/generated/{slug}/figure.png",
  "translation": ""
}
```

字段说明：

- `id`：从 1 开始递增，最终合并时按 `id` 排序。
- `section`：当前块所属章节名，前端用于分组。
- `kind`：只能使用 `paragraph`、`figure`、`table`、`equation`、`algorithm`、`code`。
- `sourceText`：英文原文或 LaTeX/代码原文，必须保留顺序和意义。算法块不能只保留 caption，必须保留算法正文。
- `assetPath`：资源路径。普通段落、公式、代码可为空字符串；`kind=figure` 时必须填写，优先指向 PNG，例如 `/generated/{slug}/MCTS.png`。
- `translation`：抽取阶段先留空。

算法块推荐使用下面的 `sourceText` 格式，第一行是标题，后续是论文原算法步骤：

```json
{
  "id": 12,
  "section": "Method",
  "kind": "algorithm",
  "sourceText": "Algorithm: Algorithm of AFlow: Detailed implementation\nRequire: Evaluator $G$, Dataset $D$, Operators $\\mathcal{O}$\nEnsure: Optimized Workflow $W^*$\nfor iteration ← 1 to $N_{max}$:\n  workflow ← Select(tree)",
  "translation": ""
}
```

不要把算法块抽成 `Algorithm: {caption}` 这种单行标题；如果 TeX 使用 `algorithmic`、`algorithm2e` 或自定义宏，仍要尽量保留 `Require`、`Ensure`、循环、条件、返回和注释等步骤。

可选字段只在需要时添加：

- `language`：代码块填写语言名。
- `page`：能稳定确定页码时填写；不能确定就省略。
- `note`：只在需要解释宏、缺失图像、异常 TeX 时填写；不要把 note 当翻译。
- `sectionPath`：只有章节层级很复杂、需要辅助校对时才添加。

文件命名必须用固定宽度编号，例如 `0001.json`、`0002.json`，这样后续可以稳定排序。

如果已经有结构抽取脚本生成了初版 `reading.json`，可以用辅助脚本把它拆成临时块，再由 agent 逐块翻译：

```bash
node .agents/skills/paper-to-site/scripts/prepare-reading-blocks.mjs {slug}
```

这个命令会读取 `content/papers/{slug}/reading.json`，写入 `.tmp/paper-to-site/{slug}/reading-blocks/*.json`，并默认清空 `translation`，避免误把脚本兜底译文、半英文译文或旧译文当成最终译文。需要保留已有译文做人工校对时，才使用 `--preserve-translations`。

硬约束：结构抽取脚本生成的 `translation` 只能用于占位或辅助定位，不能作为最终精读译文。最终译文必须由当前 agent 或 reading subagent 逐块写入临时 JSON。

## 第 3 步：逐块读取并翻译

翻译阶段一次只读取少量临时块，推荐一次 1-3 个。对于长段落、公式密集段落、代码块、算法块、表格块或附录 prompt，一次只处理 1 个。

处理每个文件时：

1. 读取 `sourceText`、`kind`、`section` 和必要上下文。
2. 将 `translation` 补成可直接展示给读者的中文译文或中文说明。
3. 保留 `sourceText` 不变。
4. 写回同一个临时 JSON 文件。
5. 继续下一个编号文件。

翻译要求：

- 自然语言段落必须逐句完整翻译，不要摘要式改写。长段落可以译成长中文段落，但不能漏句、不能只翻开头、不能只改几个术语。
- `translation` 必须以中文为主。除必要术语、模型名、数据集名、变量名、方法名、英文缩写外，不要保留英文句子。
- 禁止出现“英文原句 + 少量中文词替换”的伪翻译，例如 `Existing approaches to 对话智能体 can be categorized...`。
- 禁止复制连续英文长句。若译文中连续保留 8 个以上英文单词，通常说明没有翻译完成，必须重写。
- 禁止保留 `[cite: ...]`、`\cite{...}`、作者年份引用键或中文“引用：...”标记。引用只允许留在 `sourceText`。
- 行内公式必须保留为 `$...$`，块级公式必须保留 LaTeX 表达。不要在清洗 TeX 时丢失 `\mathcal{S}`、`\tau`、`\lambda`、`\alpha`、上下标、集合符号或变量名。
- 不要写“本段主要说明……”来代替译文。
- 不要出现“中文翻译：”这类前缀。
- 不要把英文原句混入中文译文，除非是必要术语、模型名、数据集名、变量名或方法名。
- 引用只保留在英文 `sourceText` 中，中文 `translation` 不翻译、不复述引用键。
- 公式块保留 LaTeX 表达，`translation` 解释公式变量、目标和直觉。
- 图表块翻译 caption，并说明图表在论文论证中的作用。
- 算法块解释输入、输出、主要步骤和它对应的方法环节；如果算法 `sourceText` 只有标题，必须回到 TeX 重新抽取 algorithm/algorithmic 主体后再翻译。
- 代码块保留原代码，`translation` 写代码说明：这段代码展示哪个结构、prompt、workflow、数据配置或实验逻辑。不要写“前端会展示”。
- 作者名、机构名可以保留英文，同时给机构中文译名。

### 翻译写法参考

错误示例：

```text
Dialogue Agents.o Existing approaches to 对话智能体 can be categorized into four groups...
```

正确方向：

```text
对话智能体。现有对话智能体方法大致可以分为四类：会话式问答、开放域对话、任务型对话和会话式推荐系统。会话式问答和开放域对话主要以被动方式回应用户，提供知识性或更具互动性的交流；任务型对话则依托训练数据驱动的结构化流程提供功能服务。
```

## 第 4 步：块级质量检查

每翻译一批临时块后，做局部检查：

- `translation` 是否为空。
- `translation` 是否复制了大段英文，或保留连续英文长句。
- `translation` 是否只是把少数术语替换成中文、主体仍是英文。
- `translation` 的中文量是否足够覆盖原文信息。
- `translation` 是否包含 `中文翻译：`、`待翻译`、`占位`、`自动抽取预览`、`后续补充`。
- 中文译文中是否出现 `[cite: ...]`、`（引用：...）`、`\cite{...}`、`\citep{...}` 等引用内容。
- 图、表、算法、代码是否有正确 `kind`。
- `kind=algorithm` 是否至少包含标题和多行算法步骤，而不是单独 caption。
- 图像块是否有有效 `assetPath`。

每完成一批临时块后，推荐立刻运行：

```bash
node .agents/skills/paper-to-site/scripts/merge-reading-blocks.mjs {slug} --keep-temp
node .agents/skills/paper-to-site/scripts/check-reading-quality.mjs {slug}
```

如果检查失败，回到对应编号 JSON 修复。不要等全部翻译完再统一修；那样很难定位，也容易让后半篇继续缩水。

发现问题就回到对应编号文件修复，不要等合并后再猜是哪一段出错。

## 第 5 步：合并为 reading.json

所有临时块翻译完成后：

1. 读取 `reading-blocks/*.json`。
2. 按 `id` 升序排序。
3. 删除临时字段中前端不需要的过程性信息，但保留 `section`、`page`、`sourceText`、`translation`、`kind`、`assetPath`、`language`、`note`。
4. 写入：

```text
content/papers/{slug}/reading.json
```

最终 `reading.json` 必须是数组：

```json
[
  {
    "section": "Introduction",
    "page": 1,
    "sourceText": "Original English text.",
    "translation": "对应中文译文。",
    "kind": "paragraph"
  }
]
```

推荐使用辅助脚本合并并做基础校验：

```bash
node .agents/skills/paper-to-site/scripts/merge-reading-blocks.mjs {slug}
```

默认合并成功后会删除 `.tmp/paper-to-site/{slug}/reading-blocks/`。如果仍需人工抽查临时块，可临时加 `--keep-temp`，但最终交付前应删除临时块目录。

## 第 6 步：最终校验与清理

合并后运行项目校验：

```bash
node .agents/skills/paper-to-site/scripts/check-reading-quality.mjs {slug}
node .agents/skills/paper-to-site/scripts/check-paper-content.mjs
```

同时人工抽查：

- 第一段、最后一段、每个 section 第一段。
- 所有 `kind=figure`、`kind=table`、`kind=algorithm`、`kind=code` 的块。
- 附录中的 prompt、代码和案例块。

确认通过后删除临时块目录：

```text
.tmp/paper-to-site/{slug}/reading-blocks/
```

可以保留 `.tmp/paper-to-site/{slug}/reading-manifest.json` 或简短日志，用于记录抽取数量、章节数量、校验结果；但不要让这些文件进入前端内容。

## 常见失败模式

- 一次性翻译整篇论文，导致后半部分出现英文原文复制。
- 用脚本生成的 glossary 替换文本冒充中文翻译。
- 译文中英文句子大量保留，只把 `dialogue agents`、`dataset` 等词替换成中文。
- 把引用键翻进中文译文。
- 图表 caption 只写“图表说明”，没有真正翻译内容。
- 代码块说明写成前端实现说明，而不是解释代码在论文中的作用。
- 抽取时漏掉 appendix、algorithm、prompt 或 minted/listing。
- 合并时按文件系统默认顺序排序，导致 `10.json` 排在 `2.json` 前面；必须使用固定宽度编号并按 `id` 数值排序。
