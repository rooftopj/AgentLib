import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const papersDir = path.join(root, "content", "papers");
const errors = [];

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function cjkLength(text) {
  const withoutCode = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<AlgorithmBlock[\s\S]*?\/>/g, "")
    .replace(/<[^>]+>/g, "");
  return (withoutCode.match(/[\u4e00-\u9fff]/g) || []).length;
}

function loadReadingStats(paperDir) {
  const readingPath = path.join(paperDir, "reading.json");
  if (!fs.existsSync(readingPath)) {
    return { algorithms: 0, equations: 0, figures: 0, tables: 0, code: 0 };
  }

  const reading = JSON.parse(fs.readFileSync(readingPath, "utf8"));
  return reading.reduce((stats, item) => {
    if (item.kind === "algorithm") stats.algorithms += 1;
    if (item.kind === "equation") stats.equations += 1;
    if (item.kind === "figure") stats.figures += 1;
    if (item.kind === "table") stats.tables += 1;
    if (item.kind === "code") stats.code += 1;
    return stats;
  }, { algorithms: 0, equations: 0, figures: 0, tables: 0, code: 0 });
}

function expectedMinChars(stats) {
  let minimum = 8000;
  if (stats.algorithms > 0) minimum += 1500;
  if (stats.tables >= 2) minimum += 1000;
  if (stats.figures >= 4) minimum += 500;
  return Math.min(minimum, 12000);
}

if (!fs.existsSync(papersDir)) {
  errors.push("缺少 content/papers 目录。");
} else {
  for (const slug of fs.readdirSync(papersDir)) {
    const paperDir = path.join(papersDir, slug);
    if (!fs.statSync(paperDir).isDirectory()) continue;

    const explainerPath = path.join(paperDir, "explainer.mdx");
    if (!fs.existsSync(explainerPath)) {
      errors.push(`${slug}: 缺少 explainer.mdx`);
      continue;
    }

    const text = fs.readFileSync(explainerPath, "utf8");
    const h2Count = countMatches(text, /^## /gm);
    const h3Count = countMatches(text, /^### /gm);
    const richBlockCount = countMatches(text, /<(FigureBlock|MathBlock|AlgorithmBlock|CalloutBlock|SplitBlock|StepFlow|ConceptTabs)\b/g);
    const figureCount = countMatches(text, /<FigureBlock\b/g);
    const algorithmBlockCount = countMatches(text, /<AlgorithmBlock\b/g);
    const mathBlockCount = countMatches(text, /<MathBlock\b/g);
    const codeBlockCount = countMatches(text, /```[a-zA-Z0-9_-]+/g);
    const paragraphCount = text.split(/\n\s*\n/).filter((block) => /^[^\n<#`-]/.test(block.trim()) && block.trim().length > 60).length;
    const stats = loadReadingStats(paperDir);
    const minChars = expectedMinChars(stats);
    const notesPath = path.join(root, ".tmp", "paper-to-site", slug, "explainer-notes.md");
    const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8") : "";

    if (h2Count < 7) errors.push(`${slug}: explainer.mdx 至少需要 7 个主线 ## 章节，当前 ${h2Count} 个`);
    if (h2Count > 10) errors.push(`${slug}: explainer.mdx 的 ## 章节过多，目录可能割裂`);
    if (h3Count > 22) errors.push(`${slug}: explainer.mdx 的 ### 子标题过多，可能把技术点切碎了`);
    if (cjkLength(text) < minChars) errors.push(`${slug}: explainer.mdx 中文讲解正文过短，至少需要 ${minChars} 个中文字符`);
    if (paragraphCount < 30) errors.push(`${slug}: explainer.mdx 实质讲解段落过少，至少需要 30 段`);
    if (richBlockCount < 6) errors.push(`${slug}: explainer.mdx 至少需要 6 个富内容块，例如 FigureBlock/MathBlock/AlgorithmBlock/StepFlow`);
    if (stats.figures >= 2 && figureCount < 2) errors.push(`${slug}: reading.json 有 ${stats.figures} 个图，讲解页至少应展示 2 张核心图`);
    if (stats.figures === 1 && figureCount < 1) errors.push(`${slug}: explainer.mdx 至少需要展示或解释一张论文图或辅助图`);
    if (stats.algorithms > 0 && algorithmBlockCount < 1) errors.push(`${slug}: reading.json 有 ${stats.algorithms} 个算法，讲解页必须包含至少 1 个 AlgorithmBlock`);
    if (stats.equations > 0 && mathBlockCount < 1) errors.push(`${slug}: reading.json 有 ${stats.equations} 个公式，讲解页必须包含至少 1 个 MathBlock`);
    if (stats.code > 0 && codeBlockCount < 1) errors.push(`${slug}: reading.json 有代码或 prompt，讲解页应至少用一个代码块或解释其结构`);
    if (stats.tables > 0 && !/指标|基线|主结果|消融|成本|效率|人工评测|案例/.test(text)) {
      errors.push(`${slug}: reading.json 有表格，讲解页必须解释指标、基线、主结果、消融、成本或案例`);
    }
    if (!/算法|伪代码|步骤|循环|初始化|输出|回传|状态更新|规划|搜索/.test(text)) {
      errors.push(`${slug}: explainer.mdx 缺少算法或实现流程层面的解释`);
    }
    if (!/局限|边界|失败|不适用|成本|风险/.test(text)) {
      errors.push(`${slug}: explainer.mdx 必须说明局限、失败场景或适用边界`);
    }
    if (!notes) {
      errors.push(`${slug}: 缺少 .tmp/paper-to-site/${slug}/explainer-notes.md，讲解页必须从研究笔记 reduce 而来`);
    } else {
      for (const heading of ["Content Inventory", "Mechanism Ledger", "Figure/Table Ledger", "Results Ledger", "Reduce Plan", "Explainer Outline", "Coverage Check"]) {
        if (!notes.includes(heading)) errors.push(`${slug}: explainer-notes.md 缺少 ${heading}`);
      }
      if (stats.algorithms > 0 && !notes.includes("Algorithm Ledger")) errors.push(`${slug}: explainer-notes.md 缺少 Algorithm Ledger`);
    }
    if (/生成记录|由 skill 生成|后续补充|占位|待补充|TODO/i.test(text)) {
      errors.push(`${slug}: explainer.mdx 不应包含制作说明或占位词`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("explainer:quality 通过");
