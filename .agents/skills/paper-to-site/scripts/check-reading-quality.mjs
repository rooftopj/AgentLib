import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const [, , slugArg] = process.argv;
const papersDir = path.join(root, "content", "papers");
const errors = [];

const badTranslationPattern = /(中文翻译：|待翻译|待精译|占位|自动抽取预览|后续补充|本段主要说明|本段围绕|精读：|\\cite[tp]?\{|（引用：|TODO)/i;
const citationLikePattern = /(\[cite:\s*[^\]]+\]|\\cite[tp]?\{[^}]+\}|（引用：[^）]+）)/i;
const englishWordPattern = /\b[A-Za-z][A-Za-z0-9'’.-]*\b/g;
const cjkPattern = /[\u4e00-\u9fff]/g;

function countMatches(text, pattern) {
  return (String(text).match(pattern) || []).length;
}

function normalizeText(text) {
  return String(text)
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
    .replace(/[`*_{}$\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function englishWords(text) {
  return normalizeText(text).match(englishWordPattern) || [];
}

function hasLongEnglishRun(text) {
  const normalized = normalizeText(text);
  const runPattern = /(?:\b[A-Za-z][A-Za-z0-9'’.-]*\b[\s,;:()[\]\/&+-]*){10,}/g;
  const runs = normalized.match(runPattern) || [];
  return runs.some((run) => {
    const words = run.match(englishWordPattern) || [];
    const letters = (run.match(/[A-Za-z]/g) || []).length;
    return words.length >= 10 && letters >= 45;
  });
}

function longestCommonTokenRun(source, translation) {
  const sourceWords = englishWords(source).map((word) => word.toLowerCase());
  const translationWords = englishWords(translation).map((word) => word.toLowerCase());
  let longest = 0;

  for (let i = 0; i < sourceWords.length; i += 1) {
    for (let j = 0; j < translationWords.length; j += 1) {
      let length = 0;
      while (
        i + length < sourceWords.length
        && j + length < translationWords.length
        && sourceWords[i + length] === translationWords[j + length]
      ) {
        length += 1;
      }
      if (length > longest) longest = length;
    }
  }

  return longest;
}

function isNaturalLanguageKind(kind) {
  return !["code", "equation"].includes(kind || "paragraph");
}

function allowEnglishHeavy(item) {
  return ["Authors", "Institutions", "Title"].includes(item.section)
    || item.kind === "code"
    || item.kind === "equation";
}

function checkReading(slug, readingPath) {
  const reading = JSON.parse(fs.readFileSync(readingPath, "utf8"));
  if (!Array.isArray(reading) || reading.length === 0) {
    errors.push(`${slug}: reading.json 必须是非空数组`);
    return;
  }

  for (const [index, item] of reading.entries()) {
    const label = `${slug}: reading[${index}]`;
    const source = String(item.sourceText || "");
    const translation = String(item.translation || "");
    const kind = item.kind || "paragraph";

    if (!source.trim()) errors.push(`${label}: sourceText 为空`);
    if (!translation.trim()) errors.push(`${label}: translation 为空`);
    if (badTranslationPattern.test(translation)) errors.push(`${label}: translation 包含制作说明、占位词或引用标记`);
    if (citationLikePattern.test(translation)) errors.push(`${label}: translation 不应包含 cite 引用键或引用标记`);

    if (kind === "figure" && !item.assetPath) errors.push(`${label}: figure 缺少 assetPath`);
    if (kind === "algorithm") {
      const hasAlgorithmBody = source.split(/\r?\n/).length > 1 && /(Require|Ensure|for |while |if |procedure |return |←|输入|输出)/i.test(source);
      if (!hasAlgorithmBody) errors.push(`${label}: algorithm 不能只有标题，必须包含原文算法步骤`);
    }

    if (!isNaturalLanguageKind(kind) || allowEnglishHeavy(item)) continue;

    const sourceWordCount = englishWords(source).length;
    const translationEnglishCount = englishWords(translation).length;
    const cjkCount = countMatches(translation, cjkPattern);
    const totalLetters = countMatches(translation, /[A-Za-z]/g) + cjkCount;
    const englishLetterRatio = totalLetters > 0 ? countMatches(translation, /[A-Za-z]/g) / totalLetters : 0;
    const commonRun = longestCommonTokenRun(source, translation);

    if (sourceWordCount >= 12 && cjkCount < 12) {
      errors.push(`${label}: translation 中文量过少，疑似未完整翻译`);
    }
    if (sourceWordCount >= 20 && cjkCount < Math.min(80, Math.ceil(sourceWordCount * 0.55))) {
      errors.push(`${label}: translation 中文覆盖不足，疑似摘要或半翻译`);
    }
    if (translation.length > 80 && englishLetterRatio > 0.38) {
      errors.push(`${label}: translation 英文占比过高，疑似复制原文`);
    }
    if (hasLongEnglishRun(translation)) {
      errors.push(`${label}: translation 含连续英文长句，疑似偷懒未翻译`);
    }
    if (sourceWordCount >= 15 && translationEnglishCount >= 10 && commonRun >= 8) {
      errors.push(`${label}: translation 与 sourceText 存在 ${commonRun} 个连续英文词相同，疑似原文复制`);
    }
  }
}

if (!fs.existsSync(papersDir)) {
  errors.push("缺少 content/papers 目录。");
} else {
  const slugs = slugArg ? [slugArg] : fs.readdirSync(papersDir).filter((slug) => fs.statSync(path.join(papersDir, slug)).isDirectory());
  for (const slug of slugs) {
    const readingPath = path.join(papersDir, slug, "reading.json");
    if (!fs.existsSync(readingPath)) {
      errors.push(`${slug}: 缺少 reading.json`);
      continue;
    }
    checkReading(slug, readingPath);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("reading:quality 通过");
