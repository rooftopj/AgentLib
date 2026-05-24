import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "papers");
const categoryFile = path.join(root, "content", "categories.json");
const categoryItems = JSON.parse(fs.readFileSync(categoryFile, "utf8"));
const categories = new Set(categoryItems.map((item) => item.slug));
const categoryLabels = new Map(categoryItems.map((item) => [item.slug, item.label]));
const required = ["slug", "title", "authors", "year", "venue", "category", "categoryLabel", "tags", "summary"];
const errors = [];

function englishWords(text) {
  return String(text)
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
    .match(/\b[A-Za-z][A-Za-z0-9'’.-]*\b/g) || [];
}

function cjkCount(text) {
  return (String(text).match(/[\u4e00-\u9fff]/g) || []).length;
}

function hasLongEnglishRun(text) {
  const normalized = String(text).replace(/\s+/g, " ");
  const runs = normalized.match(/(?:\b[A-Za-z][A-Za-z0-9'’.-]*\b[\s,;:()[\]\/&+-]*){10,}/g) || [];
  return runs.some((run) => (run.match(/\b[A-Za-z][A-Za-z0-9'’.-]*\b/g) || []).length >= 10);
}

function allowEnglishHeavy(item) {
  return ["Authors", "Institutions", "Title"].includes(item.section)
    || item.kind === "code"
    || item.kind === "equation";
}

if (!fs.existsSync(contentDir)) {
  errors.push("缺少 content/papers 目录。");
} else {
  for (const slug of fs.readdirSync(contentDir)) {
    const paperDir = path.join(contentDir, slug);
    if (!fs.statSync(paperDir).isDirectory()) continue;

    const paperPath = path.join(paperDir, "paper.json");
    const readingPath = path.join(paperDir, "reading.json");
    const explainerPath = path.join(paperDir, "explainer.mdx");

    if (!fs.existsSync(paperPath)) errors.push(`${slug}: 缺少 paper.json`);
    if (!fs.existsSync(readingPath)) errors.push(`${slug}: 缺少 reading.json`);
    if (!fs.existsSync(explainerPath)) errors.push(`${slug}: 缺少 explainer.mdx`);
    if (!fs.existsSync(paperPath)) continue;

    const paper = JSON.parse(fs.readFileSync(paperPath, "utf8"));
    for (const key of required) {
      if (paper[key] === undefined || paper[key] === "") errors.push(`${slug}: paper.json 缺少 ${key}`);
    }
    if (paper.slug !== slug) errors.push(`${slug}: 目录名必须和 paper.json slug 一致`);
    if (!categories.has(paper.category)) {
      errors.push(`${slug}: 未知分类 ${paper.category}`);
    } else if (paper.categoryLabel !== categoryLabels.get(paper.category)) {
      errors.push(`${slug}: categoryLabel 应为 ${categoryLabels.get(paper.category)}`);
    }
    if (!Array.isArray(paper.tags) || paper.tags.length === 0) errors.push(`${slug}: tags 至少需要一个中文标签`);
    if (!Array.isArray(paper.authors) || paper.authors.length === 0) errors.push(`${slug}: authors 至少需要一个作者`);
    if (!paper.arxivUrl && !paper.pdfPath) errors.push(`${slug}: paper.json 至少需要 arxivUrl 或 pdfPath`);
    if (paper.arxivId && !/^\d{4}\.\d{4,5}$/.test(paper.arxivId)) errors.push(`${slug}: arxivId 应为 2410.10762 这种格式，不包含 arXiv- 前缀或版本号`);
    if (paper.arxivUrl && !/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}$/.test(paper.arxivUrl)) errors.push(`${slug}: arxivUrl 应为 https://arxiv.org/abs/2410.10762 这种格式`);
    if (paper.codeUrl && !/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(paper.codeUrl)) errors.push(`${slug}: codeUrl 应为 GitHub 仓库链接，例如 https://github.com/org/repo`);

    if (fs.existsSync(readingPath)) {
      const reading = JSON.parse(fs.readFileSync(readingPath, "utf8"));
      if (!Array.isArray(reading) || reading.length === 0) errors.push(`${slug}: reading.json 需要至少一个精读段落`);
      for (const [index, item] of reading.entries()) {
        for (const key of ["section", "page", "sourceText", "translation"]) {
          if (item[key] === undefined || item[key] === "") errors.push(`${slug}: reading[${index}] 缺少 ${key}`);
        }
        if (String(item.translation || "").includes("中文翻译：")) errors.push(`${slug}: reading[${index}] translation 不能包含“中文翻译：”前缀`);
        if (String(item.translation || "").includes("引用：")) errors.push(`${slug}: reading[${index}] translation 不应翻译或携带引用标记`);
        if (/\[cite:\s*[^\]]+\]|\\cite[tp]?\{[^}]+\}/i.test(String(item.translation || ""))) errors.push(`${slug}: reading[${index}] translation 不应包含 cite 引用键`);
        if (/待翻译|待精译|占位|自动抽取预览|后续补充|本段主要说明|本段围绕|TODO/i.test(String(item.translation || ""))) errors.push(`${slug}: reading[${index}] translation 不应包含制作说明或占位词`);
        if (/% --- expanded .+ ---/.test(String(item.sourceText || item.translation || ""))) errors.push(`${slug}: reading[${index}] 不应包含 TeX 展开标记`);
        if (item.kind === "algorithm") {
          const source = String(item.sourceText || "");
          const hasAlgorithmBody = source.split(/\r?\n/).length > 1 && /(Require|Ensure|for |while |if |procedure |return |←)/i.test(source);
          if (!hasAlgorithmBody) errors.push(`${slug}: reading[${index}] algorithm 不能只有标题，必须包含原文算法步骤`);
        }
        if (!allowEnglishHeavy(item) && !["code", "equation"].includes(item.kind || "paragraph")) {
          const sourceWords = englishWords(item.sourceText).length;
          const zhCount = cjkCount(item.translation);
          const latinCount = (String(item.translation || "").match(/[A-Za-z]/g) || []).length;
          const totalLetters = latinCount + zhCount;
          if (sourceWords >= 12 && zhCount < 12) errors.push(`${slug}: reading[${index}] translation 中文量过少，疑似未完整翻译`);
          if (sourceWords >= 20 && zhCount < Math.min(80, Math.ceil(sourceWords * 0.55))) errors.push(`${slug}: reading[${index}] translation 中文覆盖不足，疑似半翻译`);
          if (totalLetters > 0 && String(item.translation || "").length > 80 && latinCount / totalLetters > 0.38) errors.push(`${slug}: reading[${index}] translation 英文占比过高，疑似复制原文`);
          if (hasLongEnglishRun(item.translation)) errors.push(`${slug}: reading[${index}] translation 含连续英文长句，疑似未翻译`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("paper:validate 通过");
