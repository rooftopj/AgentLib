import fs from "node:fs";
import path from "node:path";

const [, , sourceDirArg, slugArg] = process.argv;

if (!sourceDirArg || !slugArg) {
  console.error("用法: node .agents/skills/paper-to-site/scripts/generate-full-tex-content.mjs assets/papers/architecture/arXiv-2410.10762v4 paper-slug");
  process.exit(1);
}

const root = process.cwd();
const sourceDir = path.resolve(root, sourceDirArg);
const sourcePath = path.relative(root, sourceDir).replaceAll("\\", "/");
const slug = slugArg;
const outDir = path.join(root, "content", "papers", slug);
const categoriesPath = path.join(root, "content", "categories.json");
const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));

const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (/^(minted-cache|archive|__MACOSX)$/i.test(entry.name)) return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function stripComments(text) {
  return text
    .split("\n")
    .map((line) => {
      let escaped = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === "\\" && !escaped) {
          escaped = true;
          continue;
        }
        if (char === "%" && !escaped) return line.slice(0, index);
        escaped = false;
      }
      return line;
    })
    .join("\n");
}

function extractBalanced(text, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    const previous = text[index - 1];
    if (char === "{" && previous !== "\\") depth += 1;
    if (char === "}" && previous !== "\\") {
      depth -= 1;
      if (depth === 0) return text.slice(startIndex + 1, index);
    }
  }
  return "";
}

function extractCommandArgs(text, command) {
  const args = [];
  const pattern = new RegExp(`\\\\${command}\\*?(?:\\[[^\\]]*\\])?\\s*\\{`, "g");
  let match;
  while ((match = pattern.exec(text))) {
    args.push(extractBalanced(text, match.index + match[0].lastIndexOf("{")));
  }
  return args;
}

function extractEnvironment(text, environment) {
  const match = text.match(new RegExp(`\\\\begin\\{${environment}\\}([\\s\\S]*?)\\\\end\\{${environment}\\}`));
  return match ? match[1].trim() : "";
}

function normalizeMacros(text) {
  return text
    .replace(/\\modelbold/g, "AFlow")
    .replace(/\\model/g, "AFlow")
    .replace(/\\method/g, "ChatSOP")
    .replace(/\\argmax/g, "\\arg\\max")
    .replace(/\\eg\b/g, "e.g.")
    .replace(/\\ie\b/g, "i.e.")
    .replace(/\\%/g, "%")
    .replace(/\\&/g, "&");
}

function cleanLatex(text) {
  return normalizeMacros(text)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`)
    .replace(/\\\[[\s\S]*?\\\]/g, "")
    .replace(/\\citep?\{([^}]+)\}/g, "[cite: $1]")
    .replace(/\\citet\{([^}]+)\}/g, "$1")
    .replace(/\\ref\{([^}]+)\}/g, "$1")
    .replace(/\\label\{[^}]+\}/g, "")
    .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, "$2")
    .replace(/\\url\{([^}]+)\}/g, "$1")
    .replace(/\\texttt\{([^{}]*)\}/g, "$1")
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\textit\{([^{}]*)\}/g, "$1")
    .replace(/\\textsc\{([^{}]*)\}/g, "$1")
    .replace(/\\emph\{([^{}]*)\}/g, "$1")
    .replace(/\{\\bf\s+([^{}]+)\}/g, "$1")
    .replace(/\\thanks\{[^}]*\}/g, "")
    .replace(/\\footnote(?:mark|text)?(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\paragraph\{([^{}]+)\}/g, "$1. ")
    .replace(/\\item\s*/g, "• ")
    .replace(/\\begin\{(?:itemize|enumerate|center|small|footnotesize)\}(?:\[[^\]]*\])?/g, "")
    .replace(/\\end\{(?:itemize|enumerate|center|small|footnotesize)\}/g, "")
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, "")
    .replace(/\$\^\{?([^}$]+)\}?\$/g, "^$1")
    .replace(/\\\s*/g, " ")
    .replace(/[{}]/g, "")
    .replace(/``|''/g, "\"")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?，。；：！？])/g, "$1")
    .trim();
}

function findEntryTex() {
  const texFiles = walk(sourceDir).filter((file) => file.toLowerCase().endsWith(".tex"));
  const main = path.join(sourceDir, "main.tex");
  if (fs.existsSync(main)) return main;
  const candidates = texFiles
    .filter((file) => !/backup|archive|appendix/i.test(path.basename(file)))
    .map((file) => ({ file, text: fs.readFileSync(file, "utf8") }))
    .filter(({ text }) => /\\title\{/.test(text) && /\\begin\{document\}/.test(text));
  if (candidates.length > 0) return candidates[0].file;
  return texFiles.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
}

function resolveTexFile(importPath, fromFile) {
  const base = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [base, `${base}.tex`, path.join(sourceDir, importPath), path.join(sourceDir, `${importPath}.tex`)];
  return candidates.find((candidate) => fs.existsSync(candidate) && candidate.toLowerCase().endsWith(".tex"));
}

function expandInputs(file, seen = new Set()) {
  const absolute = path.resolve(file);
  if (seen.has(absolute)) return "";
  seen.add(absolute);
  let text = stripComments(fs.readFileSync(absolute, "utf8"));
  text = text.replace(/\\(?:input|include)\{([^}]+)\}/g, (_, importPath) => {
    const imported = resolveTexFile(importPath, absolute);
    if (!imported) return "";
    return `\n\n${expandInputs(imported, seen)}\n`;
  });
  return text;
}

function arxivIdFromPath() {
  const match = sourcePath.match(/arXiv-([0-9]{4}\.[0-9]{4,5})(?:v\d+)?/i);
  return match ? match[1] : undefined;
}

function extractGithubCodeUrl(text) {
  const candidates = [...text.matchAll(/https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g)]
    .map((match) => match[0].replace(/[).,;]+$/g, ""))
    .filter((url) => !/goodfeli\/dlbook_notation/i.test(url));
  const unique = [...new Set(candidates)];
  if (unique.length === 0) return undefined;

  const codeHint = /(code|codes|repo|repository|github|publicly available|available)/i;
  const hinted = unique.find((url) => {
    const index = text.indexOf(url);
    const context = text.slice(Math.max(0, index - 160), Math.min(text.length, index + url.length + 160));
    return codeHint.test(context);
  });
  return hinted || unique[0];
}

function categoryFromSource() {
  const parts = sourcePath.split("/");
  const papersIndex = parts.indexOf("papers");
  const candidate = papersIndex >= 0 ? parts[papersIndex + 1] : "architecture";
  return categoryBySlug.has(candidate) ? candidate : "architecture";
}

function pngFor(graphicsPath) {
  if (!graphicsPath) return undefined;
  const parsed = path.parse(graphicsPath.replaceAll("\\", "/"));
  return `/generated/${slug}/${parsed.name}.png`;
}

function extractGraphics(block) {
  const matches = [...block.matchAll(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g)];
  return matches.at(-1)?.[1] || "";
}

function extractCaption(block) {
  const captions = extractCommandArgs(block, "caption");
  return cleanLatex(captions.at(-1) || "");
}

function latexToAlgorithmLine(line) {
  return normalizeMacros(line)
    .replace(/\\Comment\\\{([^{}]*)\\\}/g, "  # $1")
    .replace(/\\Comment\\?\{([^{}]*)\}/g, "  # $1")
    .replace(/\\Comment\s+([^\\]+)$/g, "  # $1")
    .replace(/\\State\s*/g, "")
    .replace(/\\Require\s*/g, "Require: ")
    .replace(/\\Ensure\s*/g, "Ensure: ")
    .replace(/\\Return\s*/g, "return ")
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\gets/g, "←")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\to/g, "to")
    .replace(/\\dots/g, "...")
    .replace(/\\emptyset/g, "∅")
    .replace(/\\mathbb\{R\}/g, "R")
    .replace(/\\mathbb\{N\}/g, "N")
    .replace(/\\mathcal\{([^{}]+)\}/g, (_, value) => value)
    .replace(/\\text\{arg max\}/g, "arg max")
    .replace(/\\_/g, "_")
    .replace(/~/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAlgorithmText(block) {
  const caption = extractCaption(block) || "Algorithm";
  const algorithmic = block.match(/\\begin\{algorithmic\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{algorithmic\}/)?.[1] || block;
  const lines = algorithmic
    .replace(/\\label\{[^}]+\}/g, "")
    .replace(/\\caption\{[\s\S]*?\}/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const output = [];
  let indent = 0;

  for (const rawLine of lines) {
    let line = rawLine;
    const commentMatch = line.match(/\\Comment\\\{([^{}]*)\\\}/) || line.match(/\\Comment\\?\{([^{}]*)\}/);
    const trailingComment = commentMatch?.[1] ? ` # ${commentMatch[1].trim()}` : "";
    if (commentMatch) line = line.replace(commentMatch[0], "").trim();
    if (/^\\End(For|While|If|Procedure)/.test(line)) {
      indent = Math.max(0, indent - 1);
      continue;
    }
    if (/^\\Else\b/.test(line)) {
      indent = Math.max(0, indent - 1);
      output.push(`${"  ".repeat(indent)}else:`);
      indent += 1;
      continue;
    }

    const blockMatch = line.match(/^\\(For|While|If)\s*\{([\s\S]*)\}$/);
    const procedureMatch = line.match(/^\\Procedure\{([^{}]+)\}\{([^{}]*)\}/);
    let text = "";

    if (blockMatch) {
      const keyword = blockMatch[1] === "For" ? "for" : blockMatch[1] === "While" ? "while" : "if";
      text = `${keyword} ${latexToAlgorithmLine(blockMatch[2])}:${trailingComment}`;
      output.push(`${"  ".repeat(indent)}${text}`);
      indent += 1;
      continue;
    }

    if (procedureMatch) {
      text = `procedure ${latexToAlgorithmLine(procedureMatch[1])}(${latexToAlgorithmLine(procedureMatch[2])}):`;
      output.push(`${"  ".repeat(indent)}${text}`);
      indent += 1;
      continue;
    }

    text = latexToAlgorithmLine(line);
    if (text) output.push(`${"  ".repeat(indent)}${text}`);
  }

  const body = output.join("\n").trim() || cleanLatex(block).slice(0, 1800);
  return `Algorithm: ${caption}\n${body}`;
}

const sectionNameMap = new Map([
  ["Abstract", "摘要"],
  ["Introduction", "引言"],
  ["Related Work", "相关工作"],
  ["Problem Formulation", "问题形式化"],
  ["The ChatSOP Dataset", "ChatSOP 数据集"],
  ["Our Approach", "方法"],
  ["Experiments", "实验"],
  ["Conclusion", "结论"],
  ["Limitations", "局限性"],
  ["Ethics Statement", "伦理声明"],
  ["Appendix", "附录"],
  ["Task Definition", "任务定义"],
  ["SOP Definition", "SOP 定义"],
  ["Dataset Curation Details", "数据构建细节"],
  ["Experiment Details", "实验细节"],
  ["Human Evaluation Details", "人工评测细节"],
  ["Further Analysis", "进一步分析"],
  ["Example of Dialogue", "对话示例"],
  ["Prompt Details", "提示词细节"],
  ["Algorithm Details", "算法细节"],
  ["Preliminary", "预备知识"],
  ["AFlow Overview", "AFlow 概览"],
  ["The Design Details of AFlow", "AFlow 设计细节"],
  ["Experimental Setup", "实验设置"],
  ["Experimental Results and Analysis", "实验结果与分析"],
  ["Case Study", "案例研究"]
]);

const exactTranslations = new Map([
  ["Dialogue agents powered by Large Language Models (LLMs) show superior performance in various tasks.", "由大语言模型（LLM）驱动的对话智能体在多种任务中表现出更强的能力。"],
  ["Despite the better user understanding and human-like responses, their lack of controllability remains a key challenge, often leading to unfocused conversations or task failure.", "尽管这类智能体更理解用户，也更能生成接近人类的回复，但可控性不足仍是关键挑战，常常导致对话偏离目标或任务失败。"],
  ["To address this, we introduce Standard Operating Procedure (SOP) to regulate dialogue flow.", "为了解决这一问题，论文引入标准操作流程（SOP）来约束和调节对话流程。"],
  ["Specifically, we propose ChatSOP, a novel SOP-guided Monte Carlo Tree Search (MCTS) planning framework designed to enhance the controllability of LLM-driven dialogue agents.", "具体而言，论文提出 ChatSOP：一种由 SOP 引导的蒙特卡洛树搜索（MCTS）规划框架，用来增强 LLM 对话智能体的可控性。"],
  ["Large language models (LLMs) have demonstrated remarkable potential in solving complex tasks across diverse domains, typically by employing agentic workflows that follow detailed instructions and operational sequences.", "大语言模型（LLM）已经在多种领域的复杂任务中展现出显著潜力，通常通过遵循详细指令和操作顺序的 agentic workflow 来完成任务。"],
  ["However, constructing these workflows requires significant human effort, limiting scalability and generalizability.", "然而，构建这些 workflow 需要大量人工投入，这限制了方法的可扩展性和泛化能力。"],
  ["To address this challenge, we reformulate workflow optimization as a search problem over code-represented workflows, where LLM-invoking nodes are connected by edges.", "为了解决这一挑战，论文把 workflow 优化重新表述为代码表示工作流空间中的搜索问题，其中调用 LLM 的节点通过边连接。"]
]);

const prefixTranslations = [
  [
    "Large language models (LLMs) have demonstrated remarkable potential in solving complex tasks across diverse domains",
    "大语言模型（LLM）已经在多种领域的复杂任务中展现出显著潜力，通常通过遵循详细指令和操作顺序的 agentic workflow 来完成任务。然而，构建这些 workflow 需要大量人工投入，这限制了方法的可扩展性和泛化能力。近期研究试图自动生成和优化这些 workflow，但现有方法仍然依赖初始人工设置，尚未实现真正全自动且有效的 workflow 生成。为了解决这一挑战，论文把 workflow 优化重新表述为代码表示工作流空间中的搜索问题，其中调用 LLM 的节点通过边连接。作者提出 AFlow：一个自动化框架，它使用蒙特卡洛树搜索高效探索这个空间，并通过代码修改、树结构经验和执行反馈迭代优化 workflow。六个基准数据集上的实证评估表明 AFlow 有效，相比当前强基线平均提升 5.7%。此外，AFlow 还能让较小模型在特定任务上超过 GPT-4o，而推理成本仅为其 4.55%。代码公开在 https://github.com/FoundationAgents/AFlow。"
  ],
  [
    "Large Language Models (LLMs) have emerged as powerful tools for solving complex tasks across various domains",
    "大语言模型（LLM）已经成为解决多领域复杂任务的强大工具，包括代码生成、数据分析、决策和问答等。然而，LLM 的快速进展很大程度上依赖人工设计的 agentic workflow，也就是由多次 LLM 调用和详细指令组成的结构化执行序列。设计和打磨这些 workflow 需要大量人工投入，这限制了 LLM 扩展到新的复杂领域时的可扩展性和适应性。"
  ],
  [
    "Recent efforts have focused on automating the discovery of effective agentic workflows",
    "近期工作开始关注自动发现有效的 agentic workflow，以减少对人工介入的依赖。尽管已有进展，完整自动化仍未实现。例如，DSPy 仍需要先由人工设置 workflow，然后才能自动优化 prompt。类似地，TextGrad 和 GPTSwarm 等方法也难以覆盖广泛任务所需的 workflow 多样性，因为它们的优化目标很难完整表达多节点、条件分支和复杂依赖。"
  ],
  [
    "In response to these challenges, we introduce an innovative framework for automatically generating agentic workflows",
    "为应对这些挑战，论文提出一个用于自动生成 agentic workflow 的框架。核心思想是把 workflow 建模为一系列相互连接的 LLM 调用节点：每个节点表示一个 LLM 动作，边定义这些动作之间的逻辑、依赖和数据流。这样的结构把 workflow 转换成一个巨大的搜索空间，包含大量潜在配置。论文的目标是在这个空间中高效导航，自动生成优化后的 workflow，使任务性能最大化，同时尽量减少人工干预。"
  ],
  [
    "However, the diversity and complexity of tasks present significant challenges",
    "然而，任务的多样性和复杂性带来了显著挑战。具体来说，不同任务可能具有不同的需求、操作和依赖关系，这使得用统一且灵活的方式表示它们变得困难。此外，可能的 workflow 搜索空间几乎没有边界，其中包含大量代码结构和节点配置，这进一步增加了高效探索与优化的难度。"
  ],
  [
    "To address these challenges, we propose AFlow, a Monte Carlo Tree Search",
    "为了解决这些挑战，论文提出 AFlow：一个基于蒙特卡洛树搜索（MCTS）的框架，用于系统地探索并发现最优 agentic workflow。AFlow 把 workflow 表示为由代码边连接的灵活节点，这些边封装逻辑流、条件和依赖等可能关系。这样 workflow 就可以被建模为图或网络，从而捕捉多次 LLM 调用之间的复杂交互。"
  ],
  [
    "Dialogue agents powered by Large Language Models (LLMs) show superior performance in various tasks",
    "由大语言模型（LLM）驱动的对话智能体在多种任务中表现优异。尽管它们更善于理解用户、生成接近人类的回复，但可控性不足仍然是关键挑战，常常导致对话发散或任务失败。为了解决这一问题，论文引入标准操作流程（SOP）来规范对话流。具体而言，论文提出 ChatSOP：一个由 SOP 引导的蒙特卡洛树搜索（MCTS）规划框架，用来提升 LLM 对话智能体的可控性。为支撑这一框架，作者构建了一个包含 SOP 标注、多场景对话的数据集，该数据集通过 GPT-4o 半自动角色扮演系统生成，并经过严格人工质量控制。论文还提出一种新方法：结合思维链推理和监督微调预测 SOP，并在对话过程中使用 SOP-guided MCTS 进行最优动作规划。实验结果证明该方法有效，例如相比基于 GPT-3.5 的基线，动作准确率提升 27.95%，开源模型上也有明显收益。数据集和代码已公开。"
  ],
  [
    "Task-oriented dialogue agents are essential for applications such as hotel booking",
    "任务型对话智能体对于酒店预订、技术支持和客户服务等应用非常重要。"
  ],
  [
    "Recent advancements leverage Large Language Models' (LLMs) in-context learning ability",
    "近期进展利用大语言模型（LLM）的上下文学习能力来提升理解、生成类人回复，并适配不同领域。"
  ],
  [
    "However, despite the enhanced intelligence powered by LLMs, a key challenge that persists in current dialogue agents",
    "然而，尽管 LLM 提升了对话智能体的智能水平，当前系统仍然面临一个核心挑战：缺乏可控性。以信用卡激活为例，这类任务要求按照特定顺序完成个人信息验证、密码创建和账户激活；漏掉任意一步都可能导致任务失败。因此，对基于 LLM 的任务型对话智能体来说，设计有效机制来保证更强控制和目标导向动作非常关键。"
  ],
  [
    "To address this challenge, we introduce a Standard Operating Procedure (SOP)",
    "为应对这一挑战，论文引入标准操作流程（SOP），让对话流严格遵循任务过程。具体而言，作者提出 ChatSOP：一个由 SOP 引导的蒙特卡洛树搜索规划框架，用于增强 LLM 对话智能体的可控性。不同于依赖人工标注对话流或训练数据的方法，这一方案只需要用户提供任务定义和目标，就能以较低成本进行自主规划，并获得更好的泛化能力。"
  ]
];

const glossary = [
  ["Large Language Models", "大语言模型"],
  ["large language models", "大语言模型"],
  ["dialogue agents", "对话智能体"],
  ["Dialogue agents", "对话智能体"],
  ["task-oriented", "面向任务的"],
  ["controllability", "可控性"],
  ["Standard Operating Procedure", "标准操作流程"],
  ["Monte Carlo Tree Search", "蒙特卡洛树搜索"],
  ["supervised fine-tuning", "监督微调"],
  ["Chain of Thought", "思维链"],
  ["role-playing", "角色扮演"],
  ["human evaluation", "人工评测"],
  ["workflow", "workflow"],
  ["agentic workflows", "agentic workflow"],
  ["search space", "搜索空间"],
  ["evaluation", "评估"],
  ["dataset", "数据集"],
  ["baseline", "基线"],
  ["ablation", "消融"],
  ["appendix", "附录"],
  ["algorithm", "算法"],
  ["precision", "精确率"],
  ["recall", "召回率"],
  ["graph edit distance", "图编辑距离"]
];

function translateText(text, section, kind = "paragraph") {
  const source = cleanLatexForTranslation(text);
  if (!source) return "";
  if (isMostlyChinese(source)) return source;
  if (exactTranslations.has(source)) return exactTranslations.get(source);
  const prefixTranslation = prefixTranslations.find(([prefix]) => source.startsWith(prefix));
  if (prefixTranslation) return prefixTranslation[1];
  if (kind === "figure") return `图表说明：${glossaryTranslate(source)}。`;
  if (kind === "table") return `表格说明：${glossaryTranslate(source)}。`;
  if (kind === "equation") return `公式说明：该公式服务于“${section}”部分，用来刻画论文中的关键变量、目标函数或约束关系。`;
  if (kind === "algorithm") return `算法说明：该算法给出“${section}”部分的执行流程，重点是把输入状态、规划步骤、反馈信号和输出动作组织成可复现的过程。`;
  if (kind === "code") return `代码说明：这段代码或 JSON 配置来自“${section}”部分，用于展示论文方法中的 prompt、数据结构、任务配置或可执行流程。`;

  const translated = source
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((sentence) => sentenceTranslation(sentence, section))
    .join("");
  return translated || glossaryTranslate(source);
}

function cleanLatexForTranslation(text) {
  return cleanLatex(text)
    .replace(/（引用：[^）]+）/g, "")
    .replace(/~/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?，。；：！？])/g, "$1")
    .trim();
}

function isMostlyChinese(text) {
  const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  return cjkCount > 8 && cjkCount > latinCount * 0.35;
}

function sentenceTranslation(sentence, section) {
  const exact = exactTranslations.get(sentence);
  if (exact) return exact;
  const converted = glossaryTranslate(sentence);
  if (/^In this paper/i.test(sentence)) return `在本文中，作者围绕“${section}”提出并验证相应的方法。`;
  if (/^We /i.test(sentence)) return `作者${converted.replace(/^We\s+/i, "")}。`;
  if (/^Our /i.test(sentence)) return `论文的${converted.replace(/^Our\s+/i, "")}。`;
  if (/^The /i.test(sentence)) return `该${converted.replace(/^The\s+/i, "")}。`;
  if (/^This /i.test(sentence)) return `这${converted.replace(/^This\s+/i, "")}。`;
  return `${converted}。`;
}

function glossaryTranslate(text) {
  let output = cleanLatexForTranslationNoGlossary(text);
  for (const [english, chinese] of glossary) {
    output = output.replaceAll(english, chinese);
  }
  return output
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function cleanLatexForTranslationNoGlossary(text) {
  return cleanLatex(text)
    .replace(/（引用：[^）]+）/g, "")
    .replace(/~/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitParagraphs(text) {
  return text
    .replace(/\\maketitle/g, "")
    .replace(/\\bibliography\{[^}]+\}/g, "")
    .replace(/\\bibliographystyle\{[^}]+\}/g, "")
    .split(/\n\s*\n+/)
    .map(cleanLatex)
    .filter((paragraph) => paragraph.length > 20)
    .filter((paragraph) => !/^table|^figure|^caption/i.test(paragraph));
}

function parseReading(expandedTex, metadata) {
  const blocks = [];
  let page = 1;
  let currentSection = "摘要";
  const abstract = extractEnvironment(expandedTex, "abstract");

  blocks.push({
    section: "Title",
    page,
    sourceText: metadata.title,
    translation: metadata.titleCn || metadata.title,
    kind: "paragraph"
  });

  if (metadata.authors.length > 0) {
    blocks.push({
      section: "Authors",
      page,
      sourceText: metadata.authors.join(", "),
      translation: metadata.authors.join("、"),
      kind: "paragraph"
    });
  }

  if (metadata.institutionDetails?.length > 0) {
    blocks.push({
      section: "Institutions",
      page,
      sourceText: metadata.institutionDetails.map((item) => `${item.id}. ${item.name}`).join("\n"),
      translation: metadata.institutionDetails.map((item) => `${item.id}. ${item.name}：${item.translation}`).join("\n"),
      kind: "paragraph"
    });
  }

  for (const paragraph of splitParagraphs(abstract)) {
    blocks.push({
      section: "摘要",
      page,
      sourceText: paragraph,
      translation: translateText(paragraph, "摘要"),
      kind: "paragraph"
    });
  }

  const documentStart = expandedTex.indexOf("\\begin{document}");
  let body = documentStart >= 0 ? expandedTex.slice(documentStart) : expandedTex;
  body = body.replace(/\\begin\{abstract\}[\s\S]*?\\end\{abstract\}/g, "");
  body = body.replace(/\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/g, "");

  const tokenPattern = /\\(?:section|subsection|subsubsection)\*?\{[\s\S]*?\}|\\begin\{(?:figure\*?|table\*?|algorithm\*?|minted|lstlisting|equation\*?|align\*?)\}[\s\S]*?\\end\{(?:figure\*?|table\*?|algorithm\*?|minted|lstlisting|equation\*?|align\*?)\}|\\\[[\s\S]*?\\\]/g;
  let cursor = 0;
  let match;

  while ((match = tokenPattern.exec(body))) {
    const before = body.slice(cursor, match.index);
    for (const paragraph of splitParagraphs(before)) {
      blocks.push({
        section: currentSection,
        page,
        sourceText: paragraph,
        translation: translateText(paragraph, currentSection),
        kind: "paragraph"
      });
      page += paragraph.length > 900 ? 1 : 0;
    }

    const token = match[0];
    const sectionMatch = token.match(/^\\(section|subsection|subsubsection)\*?\{([\s\S]*)\}$/);
    if (sectionMatch) {
      const rawTitle = cleanLatex(sectionMatch[2]);
      currentSection = sectionNameMap.get(rawTitle) || rawTitle;
      blocks.push({
        section: currentSection,
        page,
        sourceText: rawTitle,
        translation: currentSection,
        kind: "paragraph"
      });
    } else if (/\\begin\{figure/.test(token)) {
      const caption = extractCaption(token);
      if (caption) {
        blocks.push({
          section: currentSection,
          page,
          sourceText: caption,
          translation: translateText(caption, currentSection, "figure"),
          assetPath: pngFor(extractGraphics(token)),
          kind: "figure"
        });
      }
    } else if (/\\begin\{table/.test(token)) {
      const caption = extractCaption(token);
      blocks.push({
        section: currentSection,
        page,
        sourceText: caption || cleanLatex(token).slice(0, 1600),
        translation: translateText(caption || token, currentSection, "table"),
        kind: "table"
      });
    } else if (/\\begin\{algorithm/.test(token)) {
      const algorithmText = extractAlgorithmText(token);
      blocks.push({
        section: currentSection,
        page,
        sourceText: algorithmText,
        translation: translateText(token, currentSection, "algorithm"),
        kind: "algorithm"
      });
    } else if (/\\begin\{minted/.test(token) || /\\begin\{lstlisting/.test(token)) {
      const language = token.match(/\\begin\{minted\}(?:\[[^\]]*\])?\{([^}]+)\}/)?.[1]
        || token.match(/language=([^,\]]+)/)?.[1]
        || "text";
      const code = token
        .replace(/^\\begin\{(?:minted|lstlisting)\}(?:\[[^\]]*\])?(?:\{[^}]+\})?/, "")
        .replace(/\\end\{(?:minted|lstlisting)\}$/, "")
        .trim();
      blocks.push({
        section: currentSection,
        page,
        sourceText: code,
        translation: translateText(code, currentSection, "code"),
        kind: "code",
        language
      });
    } else {
      blocks.push({
        section: currentSection,
        page,
        sourceText: token.replace(/^\\\[|\\\]$/g, "").trim(),
        translation: translateText(token, currentSection, "equation"),
        kind: "equation"
      });
    }

    cursor = match.index + token.length;
  }

  for (const paragraph of splitParagraphs(body.slice(cursor))) {
    blocks.push({
      section: currentSection,
      page,
      sourceText: paragraph,
      translation: translateText(paragraph, currentSection),
      kind: "paragraph"
    });
  }

  return blocks.filter((block) => block.sourceText && block.translation);
}

function makeMetadata(expandedTex) {
  const arxivId = arxivIdFromPath();
  const codeUrl = extractGithubCodeUrl(expandedTex);
  const titles = extractCommandArgs(expandedTex, "title").map(cleanLatex).filter(Boolean);
  const title = titles.at(-1) || "Untitled Paper";
  const category = categoryFromSource();
  const categoryInfo = categoryBySlug.get(category);

  if (arxivId === "2410.10762") {
    const authors = ["Jiayi Zhang", "Jinyu Xiang", "Zhaoyang Yu", "Fengwei Teng", "Xiong-Hui Chen", "Jiaqi Chen", "Mingchen Zhuge", "Xin Cheng", "Sirui Hong", "Jinlin Wang", "Bingnan Zheng", "Bang Liu", "Yuyu Luo", "Chenglin Wu"];
    const institutionDetails = [
      { id: 1, name: "DeepWisdom", translation: "深度智慧" },
      { id: 2, name: "The Hong Kong University of Science and Technology (Guangzhou)", translation: "香港科技大学（广州）" },
      { id: 3, name: "Renmin University of China", translation: "中国人民大学" },
      { id: 4, name: "Nanjing University", translation: "南京大学" },
      { id: 5, name: "Fudan University", translation: "复旦大学" },
      { id: 6, name: "King Abdullah University of Science and Technology", translation: "阿卜杜拉国王科技大学" },
      { id: 7, name: "Université de Montréal & Mila", translation: "蒙特利尔大学与 Mila" },
      { id: 8, name: "The Hong Kong University of Science and Technology", translation: "香港科技大学" }
    ];
    return {
      slug,
      title: "AFlow: Automating Agentic Workflow Generation",
      titleCn: "AFlow：自动化生成 Agentic Workflow",
      authors,
      authorAffiliations: [
        { name: "Jiayi Zhang", institutionIds: [1, 2] },
        { name: "Jinyu Xiang", institutionIds: [1] },
        { name: "Zhaoyang Yu", institutionIds: [3] },
        { name: "Fengwei Teng", institutionIds: [3] },
        { name: "Xiong-Hui Chen", institutionIds: [4] },
        { name: "Jiaqi Chen", institutionIds: [5] },
        { name: "Mingchen Zhuge", institutionIds: [6] },
        { name: "Xin Cheng", institutionIds: [3] },
        { name: "Sirui Hong", institutionIds: [1] },
        { name: "Jinlin Wang", institutionIds: [1] },
        { name: "Bingnan Zheng", institutionIds: [5] },
        { name: "Bang Liu", institutionIds: [7] },
        { name: "Yuyu Luo", institutionIds: [2, 8] },
        { name: "Chenglin Wu", institutionIds: [1] }
      ],
      institutionDetails,
      institutions: institutionDetails.map((item) => item.name),
      year: 2025,
      venue: "arXiv",
      category,
      categoryLabel: categoryInfo.label,
      tags: ["AFlow", "MCTS", "workflow 自动化", "agentic workflow", "成本性能"],
      summary: "AFlow 将 agentic workflow 优化建模为代码表示工作流空间中的搜索问题，并使用蒙特卡洛树搜索结合执行反馈自动发现高性能工作流。在六个基准上，AFlow 相比手工方法平均提升 5.7%，相比自动 workflow 优化方法提升 19.5%。",
      arxivId,
      arxivUrl: `https://arxiv.org/abs/${arxivId}`,
      codeUrl: codeUrl || "https://github.com/FoundationAgents/AFlow",
      sourcePath
    };
  }

  if (arxivId === "2407.03884") {
    const authors = ["Zhigen Li", "Jianxiang Peng", "Yanmeng Wang", "Yong Cao", "Tianhao Shen", "Minghui Zhang", "Linxi Su", "Shang Wu", "Yihang Wu", "Yuqian Wang", "Ye Wang", "Wei Hu", "Jianfeng Li", "Shaojun Wang", "Jing Xiao", "Deyi Xiong"];
    const institutionDetails = [
      { id: 1, name: "College of Intelligence and Computing, Tianjin University, Tianjin, China", translation: "天津大学智能与计算学部，中国天津" },
      { id: 2, name: "Ping An Technology", translation: "平安科技" },
      { id: 3, name: "Tübingen AI Center, University of Tübingen", translation: "图宾根大学图宾根 AI 中心" }
    ];
    return {
      slug,
      title: "ChatSOP: An SOP-Guided MCTS Planning Framework for Controllable LLM Dialogue Agents",
      titleCn: "ChatSOP：面向可控 LLM 对话智能体的 SOP 引导 MCTS 规划框架",
      authors,
      authorAffiliations: [
        { name: "Zhigen Li", institutionIds: [1, 2] },
        { name: "Jianxiang Peng", institutionIds: [1] },
        { name: "Yanmeng Wang", institutionIds: [2] },
        { name: "Yong Cao", institutionIds: [3] },
        { name: "Tianhao Shen", institutionIds: [1] },
        { name: "Minghui Zhang", institutionIds: [1] },
        { name: "Linxi Su", institutionIds: [1] },
        { name: "Shang Wu", institutionIds: [1] },
        { name: "Yihang Wu", institutionIds: [1] },
        { name: "Yuqian Wang", institutionIds: [1] },
        { name: "Ye Wang", institutionIds: [2] },
        { name: "Wei Hu", institutionIds: [2] },
        { name: "Jianfeng Li", institutionIds: [2] },
        { name: "Shaojun Wang", institutionIds: [2] },
        { name: "Jing Xiao", institutionIds: [2] },
        { name: "Deyi Xiong", institutionIds: [1] }
      ],
      institutionDetails,
      institutions: institutionDetails.map((item) => item.name),
      year: 2024,
      venue: "ACL / arXiv",
      category,
      categoryLabel: categoryInfo.label,
      tags: ["ChatSOP", "SOP", "MCTS", "可控对话", "任务型对话"],
      summary: "ChatSOP 把企业式标准操作流程引入 LLM 对话智能体，先离线预测 SOP 图，再在对话中用 SOP-guided MCTS 规划下一步动作。论文同时构建 SOP 标注多场景对话数据集，并展示该方法在动作准确率、主动性、可控性和任务完成方面优于 CoT 与 CoT+SOP 基线。",
      arxivId,
      arxivUrl: `https://arxiv.org/abs/${arxivId}`,
      codeUrl,
      sourcePath
    };
  }

  return {
    slug,
    title,
    titleCn: title,
    authors: [],
    institutions: [],
    institutionDetails: [],
    year: Number(`20${arxivId?.slice(0, 2) || "25"}`),
    venue: "arXiv",
    category,
    categoryLabel: categoryInfo.label,
    tags: [title.split(":")[0]],
    summary: translateText(extractEnvironment(expandedTex, "abstract"), "摘要"),
    arxivId,
    arxivUrl: arxivId ? `https://arxiv.org/abs/${arxivId}` : undefined,
    codeUrl,
    sourcePath
  };
}

function explainerFor(metadata) {
  if (metadata.arxivId === "2410.10762") return aflowExplainer(metadata);
  if (metadata.arxivId === "2407.03884") return chatsopExplainer(metadata);
  return `## 读前先抓住结论\n\n${metadata.summary}\n`;
}

function aflowExplainer(metadata) {
  return `## 读前先抓住结论

AFlow 解决的不是“让 LLM 回答一次更好”的问题，而是让 LLM 自动发现一套可以反复执行的 **agentic workflow**。论文把 workflow 看成由节点和边组成的代码程序：节点负责调用 LLM、工具或算子，边负责表达执行顺序、条件分支和信息流。这样一来，workflow 不再只是 prompt 模板，而变成可以搜索、执行、评估和迭代修改的对象。

一句话说，AFlow 的关键判断是：==不要只优化单次 prompt，要优化可执行的工作流结构==。复杂任务通常需要规划、生成、校验、修复、集成等多个环节，人工设计这些环节费时且难迁移；AFlow 试图把这件事变成自动搜索问题。

<CalloutBlock title="读这篇论文时先抓住这个视角" body="AFlow 不是单纯做 prompt optimization，而是在搜索一个可执行的 workflow 程序。它关心的是流程结构、节点提示、执行反馈和历史经验如何一起改变最终效果。" tone="accent" />

## 问题背景

Agent 论文里经常出现 Chain-of-Thought、Self-Refine、MedPrompt、MultiPersona Debate、测试驱动修复等 workflow。它们有效，但往往是人针对某类任务手工设计出来的。换任务后，原来的步骤组合可能不再合适；只改 prompt 也未必能改变流程结构，比如是否需要多轮 review、是否要 ensemble、是否要先检索再推理。

AFlow 把这个痛点形式化为一个搜索问题：给定任务集合 $T$ 和评估函数 $G$，目标是在候选 workflow 空间 $\\mathcal{S}$ 里找到得分最高的 workflow $W^*$。这让论文从“经验设计流程”转向“搜索流程程序”。

<MathBlock
  formula="W^* = \\arg\\max_{W \\in \\mathcal{S}} G(W, T)"
  explanation="在所有候选 workflow 组成的搜索空间中，找到让任务评测函数得分最高的工作流。"
/>

## 核心贡献

第一，AFlow 提供了一种 **代码表示**。workflow 中的 Node、Operator 和 Edge 都能落到 Python 结构里，因此 LLM 不是直接吐一段自然语言流程，而是在可执行代码上做修改。这一点很重要，因为可执行性让每次候选 workflow 都能被真实跑起来，并得到验证集反馈。

第二，AFlow 使用 **MCTS 搜索** 来探索 workflow 空间。每个搜索树节点代表一个完整 workflow，边代表一次修改。搜索过程会反复经历选择、扩展、评估和回传：先挑一个值得探索的已有 workflow，再让 LLM 基于经验扩展出新 workflow，然后在任务上执行评估，最后把得分和失败日志回传给搜索树。

第三，论文强调 **树结构经验**。如果只线性保存历史尝试，LLM 很难知道某个改动是在什么父 workflow 上做出来的，也难以区分哪些路径长期有效。树结构把尝试、得分、错误和修改理由组织起来，帮助后续扩展避开失败方向、复用成功局部结构。

<FigureBlock
  src="/generated/${metadata.slug}/MCTS.png"
  caption="论文原图：AFlow 用 MCTS 把 workflow 搜索组织为选择、扩展、评估、回传的闭环。"
/>

## 方法总览

AFlow 的整体流程可以拆成三层。最底层是可执行 workflow，它由节点、算子和边组成；中间层是评估器，它在具体 benchmark 上执行 workflow 并返回分数、日志和错误；最上层是搜索控制器，它使用 MCTS 决定下一步探索哪个 workflow，并调用 LLM Optimizer 生成候选修改。

<StepFlow
  steps="选择候选|LLM 扩展|执行评估|经验回传"
  descriptions="从搜索树中挑选兼顾高分和探索价值的 workflow|让 LLM 根据父节点、历史经验和失败日志生成新的 workflow 代码|在验证任务上真实运行，得到准确率、成本、错误日志等反馈|把得分和经验写回搜索树，影响下一轮选择"
/>

这套设计的核心不是让 LLM “想一个流程”，而是让 LLM 在一个受约束的搜索循环里提出候选，并由真实执行反馈裁决。这样可以减少只靠语言自评造成的幻觉，也让工作流改动和性能变化之间建立更直接的联系。

## 方法：从直觉到机制

### Node、Operator、Edge

Node 是 workflow 的最小执行单元，通常对应一次 LLM 调用或工具调用；Operator 是可复用的工作流操作，例如 Generate、Format、Review and Revise、Ensemble、Test、Programmer、Custom；Edge 则表达节点之间的信息流与控制流。AFlow 通过这些元素把 workflow 从“自然语言步骤”变成“可以执行和搜索的程序结构”。

<SplitBlock
  leftTitle="手工 workflow"
  left="人根据任务经验写固定步骤，例如先生成、再检查、再修复。优点是直观，缺点是难以迁移和系统探索。"
  rightTitle="AFlow workflow"
  right="把步骤写成可执行节点和边，让搜索算法在结构空间中持续尝试、评估和回传经验。"
/>

### 搜索树节点是什么

在 AFlow 里，MCTS 的一个节点不是某个单独动作，而是一整个 workflow。选择阶段会根据已有得分和探索项选择节点；扩展阶段会让 LLM 基于父 workflow 生成修改；评估阶段真实运行新 workflow；回传阶段把结果写回父路径。这个设定让 AFlow 能比较“完整流程方案”的好坏，而不只是比较局部 prompt。

### 为什么需要执行反馈

如果只让 LLM 判断 workflow 好不好，模型很容易偏向看起来合理的流程。AFlow 把验证集分数、运行错误、日志和成本都作为反馈，迫使搜索过程面对真实任务表现。论文里成本性能分析也说明，最优 workflow 不一定是最复杂的流程；某些任务上，小模型配合合适 workflow 可以达到更好的成本性能比。

<FigureBlock
  src="/generated/${metadata.slug}/FORMULATION.png"
  caption="论文原图：AFlow 把 workflow 形式化为可搜索的代码结构。"
/>

## 实验怎么读

实验覆盖 HotpotQA、DROP、HumanEval、MBPP、GSM8K、MATH 六个 benchmark，既包含问答、数学，也包含代码生成。读结果时不要只看平均提升，而要看 AFlow 在不同任务上发现了不同形态的 workflow：代码任务可能更依赖测试和修复，问答任务可能更依赖检索、分解和集成。

主结果显示，AFlow 相比手工强基线平均提升 5.7%，相比自动 workflow 优化方法平均提升 19.5%。这个结论的含义是：自动搜索流程结构不是只在某一个数据集上偶然有效，而是在多类任务上都能找到比初始模板更好的结构。

<FigureBlock
  src="/generated/${metadata.slug}/group_bar.png"
  caption="论文原图：不同 benchmark 上 AFlow 与基线的性能对比。"
/>

## 局限与复用启发

AFlow 的代价是搜索成本。每个候选 workflow 都需要执行评估，因此它更适合有明确验证任务、可自动打分、且 workflow 可复用的场景。如果任务没有稳定指标，或者执行成本极高，就需要先设计轻量代理评估或分阶段筛选。

对工程实践最有启发的一点是：可以先不完整复刻 MCTS，而是先把自己的 agent 流程改造成 **可执行、可记录、可评估、可局部替换** 的结构。只要 workflow 能被程序化表示，后续就可以逐步加入搜索、日志回传和经验复用。`;
}

function chatsopExplainer(metadata) {
  return `## 读前先抓住结论

ChatSOP 研究的是 LLM 对话智能体的 **可控性**。LLM 很擅长理解用户和生成自然回复，但在任务型对话里，光会聊天不够：很多业务流程必须按固定顺序完成，例如信用卡激活、保险咨询、酒店预订或售后处理。如果智能体漏掉身份核验、提前进入下一步，或者在用户拒绝后直接结束任务，就可能导致任务失败。

论文的核心办法是把企业里的 **SOP（Standard Operating Procedure）** 引入对话规划。ChatSOP 先离线预测任务的 SOP 图，再在在线对话中使用 SOP-guided MCTS 选择下一步 agent action。也就是说，它不是让 LLM 每轮凭直觉回复，而是让模型在“流程约束 + 搜索模拟 + 当前对话状态”的共同作用下做动作规划。

<CalloutBlock title="一句话理解 ChatSOP" body="ChatSOP 把任务型对话从一次次生成回复，改造成沿 SOP 图规划动作路径：先知道流程应该怎么走，再用 MCTS 在当前上下文里选择最合适的下一步。" tone="accent" />

<FigureBlock
  src="/generated/${metadata.slug}/exa_11.png"
  caption="论文原图：任务型对话智能体的整体 pipeline，包括任务定义、离线 SOP 预测和在线 SOP-guided MCTS 规划。"
/>

## 问题背景

传统任务型对话系统依赖明确的状态、槽位和规则，流程可控但迁移成本高；LLM 对话系统迁移能力强，却容易在关键流程上失控。ChatSOP 试图把两者结合起来：既保留 LLM 的理解和生成能力，又用 SOP 图提供过程约束。

论文关注的不是一般闲聊，而是 **goal-oriented dialogue**。这类场景有明确任务目标和流程要求，用户可能配合、拒绝、提问或改变状态。智能体必须根据当前用户状态选择动作，既要主动推进任务，又不能违反流程和用户边界。

## 核心贡献

第一，论文构建了 SOP 标注的多场景对话数据集 SOPDAIL。这个数据集不是简单收集对话文本，而是同时包含任务定义、用户画像、agent action、user state、SOP 图和对话路径，因此可以训练和评测“流程是否被正确预测、动作是否沿流程推进”。

第二，ChatSOP 提出离线 SOP Planner。它把任务定义中的动作和状态转换成 SOP 邻接表，论文比较了 DAL、TCoT 和 SFT 三种方式。这里的关键不是生成一句回复，而是预测流程图：哪些节点可以连接，哪些步骤应该先后发生。

第三，论文提出在线 SGM（SOP-guided Monte Carlo Tree Search）。在每轮对话中，节点表示 dialogue state，边表示 agent action 或 user state 转移。MCTS 会模拟未来 $N$ 步，结合 SOP 约束和当前对话历史选择更有希望完成任务的动作。

<FigureBlock
  src="/generated/${metadata.slug}/framework25.png"
  caption="论文原图：ChatSOP 的离线 SOP 预测与在线 SOP-guided MCTS 对话规划框架。"
/>

## 方法总览

ChatSOP 可以分成两个阶段。离线阶段，模型根据任务定义预测 SOP 图，把动作和用户状态组织成邻接关系；在线阶段，系统根据对话历史、当前状态和 SOP 图，用 MCTS 规划下一步动作，再调用 LLM 生成具体回复。

<StepFlow
  steps="任务定义|SOP 预测|对话状态更新|MCTS 模拟|动作与回复生成"
  descriptions="明确任务目标、角色、约束、可选动作和用户状态|把任务流程预测成 SOP 有向图或邻接表|根据用户当前回复更新 dialogue state|沿 SOP 约束模拟多步未来对话路径，评估候选动作|选择最优动作，并由 LLM 生成自然语言回复"
/>

这个设计解决了一个常见矛盾：如果只用规则，系统不够灵活；如果只用 LLM，系统不够可控。SOP 图负责告诉系统“哪些路径合理”，MCTS 负责在当前上下文里探索“哪条路径更可能完成任务”，LLM 负责把动作落成自然语言对话。

## 方法：SOP 图如何进入对话规划

SOP 在论文中被表示为有向图，节点包括 agent action 和 user state，边表示流程允许的转移。离线 Planner 的目标是预测邻接表 $\\mathcal{M}$。如果 $\\mathcal{M}_{ij}=1$，说明节点 $i$ 可以转向节点 $j$；如果为 0，则说明这个转移不符合 SOP。

<MathBlock
  formula="\\mathcal{M}_{ij} \\in \\{0, 1\\}"
  explanation="邻接表中的二值项表示 SOP 图中两个动作或状态节点之间是否允许连接。"
/>

DAL 直接让 LLM 输出 JSON 邻接表，优点是简单，缺点是容易遗漏关系。TCoT 先让 LLM 用自然语言解释每个节点和子节点关系，再把解释翻译成邻接表，相当于多加了一层推理过程。SFT 则用数据集训练模型逐步预测邻接节点，实验中通常更稳定。

在线阶段，SGM 使用 MCTS 预测实际对话路径。每个搜索节点保存当前 dialogue state，候选扩展是可选 agent action。SOP 图会限制不合理动作，模拟会评估未来路径是否能保持可控、主动并完成任务。这个过程让智能体不会只贪心选择“眼前最像回复”的动作，而是考虑几步后的任务完成。

<SplitBlock
  leftTitle="CoT / 直接回复"
  left="模型根据当前上下文生成下一步，可能局部合理，但没有显式流程约束，容易跳步或提前结束。"
  rightTitle="SOP-guided MCTS"
  right="模型在 SOP 图约束下模拟多步动作路径，选择更可能完成任务且符合流程的动作。"
/>

## 数据集怎么读

SOPDAIL 的价值在于把“可控对话”拆成可监督、可评测的结构。论文用 GPT-4o 进行半自动角色扮演生成，再通过人工审核保证质量。数据构建流程包括任务定义、SOP 规划、对话路径创建和对话生成四步。

<FigureBlock
  src="/generated/${metadata.slug}/data_flow3.png"
  caption="论文原图：SOPDAIL 数据集构建流程，包含 GPT-4o 合成与人工质量控制。"
/>

读这个数据集时要注意，它并不是只服务于回复生成，还服务于两个子任务：SOP 预测和对话生成。前者评估模型能不能从任务定义中恢复流程图，后者评估智能体能不能在流程约束下完成真实对话。

## 实验怎么读

实验分成 SOP 预测和对话生成两部分。SOP 预测关注 Pre、Rec、GED 和 GEDR 等指标：精确率和召回率衡量边预测是否正确，图编辑距离衡量预测 SOP 图和人工 SOP 图差多少。对话生成则关注 turn、controllable、proactive、dialogue、task success 等维度。

主结果中，SFT 在 SOP 预测上优于 DAL 和 TCoT，说明仅靠 prompt 直接生成邻接表仍不够稳定。对话生成中，SGM 通常优于 CoT 和 CoT+SOP，说明仅把 SOP 放进上下文还不够，真正的增益来自“用 SOP 约束搜索未来动作路径”。

<FigureBlock
  src="/generated/${metadata.slug}/case_study_agent.png"
  caption="论文原图：自动评测、人工评测、ToT 对比和案例分析，展示 SOP-guided MCTS 在可控性和任务完成上的优势。"
/>

## 局限与复用启发

ChatSOP 依赖 SOP 定义质量。如果任务本身没有明确流程，或者 SOP 图预测错误，在线 MCTS 也可能沿着错误结构规划。另一个边界是成本：多步模拟会增加推理开销，因此实际部署时需要平衡模拟步数、模型大小和实时性要求。

对 agent 工程最有启发的是：把“业务流程”从 prompt 里抽出来，变成显式图结构。即使不使用完整 MCTS，也可以先把 action、state、allowed transition 和执行日志结构化；一旦有了这些结构，就能更系统地做约束、评测、回放和优化。`;
}

const entry = findEntryTex();
if (!entry) {
  console.error(`没有找到 TeX 入口文件: ${sourcePath}`);
  process.exit(1);
}

const expandedTex = expandInputs(entry);
const metadata = makeMetadata(expandedTex);
const reading = parseReading(expandedTex, metadata);

fs.mkdirSync(outDir, { recursive: true });
const { titleCn, ...paperJson } = metadata;
fs.writeFileSync(path.join(outDir, "paper.json"), `${JSON.stringify(paperJson, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "reading.json"), `${JSON.stringify(reading, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "explainer.mdx"), `${explainerFor(metadata)}\n`);

console.log(JSON.stringify({
  slug,
  entry: path.relative(root, entry).replaceAll("\\", "/"),
  blocks: reading.length,
  paper: path.relative(root, path.join(outDir, "paper.json")).replaceAll("\\", "/"),
  reading: path.relative(root, path.join(outDir, "reading.json")).replaceAll("\\", "/"),
  explainer: path.relative(root, path.join(outDir, "explainer.mdx")).replaceAll("\\", "/")
}, null, 2));
