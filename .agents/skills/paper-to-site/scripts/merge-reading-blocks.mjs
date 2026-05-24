import fs from "node:fs";
import path from "node:path";

const [, , slug, flag] = process.argv;

if (!slug) {
  console.error("用法: node .agents/skills/paper-to-site/scripts/merge-reading-blocks.mjs {slug} [--keep-temp]");
  process.exit(1);
}

const root = process.cwd();
const blocksDir = path.join(root, ".tmp", "paper-to-site", slug, "reading-blocks");
const readingPath = path.join(root, "content", "papers", slug, "reading.json");
const keepTemp = flag === "--keep-temp";

if (!fs.existsSync(blocksDir)) {
  console.error(`找不到临时块目录: ${path.relative(root, blocksDir)}`);
  process.exit(1);
}

const badTranslationPattern = /(中文翻译：|待翻译|待精译|占位|自动抽取预览|后续补充|\\cite[tp]?\{|（引用：)/;

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

const files = fs.readdirSync(blocksDir)
  .filter((file) => /^\d{4}\.json$/.test(file))
  .sort();

const blocks = files.map((file) => {
  const fullPath = path.join(blocksDir, file);
  const block = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return { file, block };
});

const errors = [];
for (const { file, block } of blocks) {
  if (!Number.isInteger(block.id)) errors.push(`${file}: 缺少数值 id`);
  if (!block.sourceText || !String(block.sourceText).trim()) errors.push(`${file}: sourceText 为空`);
  if (!block.translation || !String(block.translation).trim()) errors.push(`${file}: translation 为空`);
  if (badTranslationPattern.test(block.translation || "")) errors.push(`${file}: translation 包含制作提示或引用`);

  const latinCount = ((block.translation || "").match(/[A-Za-z]/g) || []).length;
  const totalCount = (block.translation || "").length || 1;
  const allowLatinHeavy = block.kind === "code" || block.section === "Authors" || block.section === "Institutions";
  if (!allowLatinHeavy && totalCount > 80 && latinCount / totalCount > 0.45) {
    errors.push(`${file}: translation 可能复制了过多英文`);
  }

  if (!allowLatinHeavy && !["code", "equation"].includes(block.kind || "paragraph")) {
    const sourceWords = englishWords(block.sourceText).length;
    const zhCount = cjkCount(block.translation);
    if (sourceWords >= 12 && zhCount < 12) errors.push(`${file}: translation 中文量过少，疑似未完整翻译`);
    if (sourceWords >= 20 && zhCount < Math.min(80, Math.ceil(sourceWords * 0.55))) errors.push(`${file}: translation 中文覆盖不足，疑似摘要或半翻译`);
    if (hasLongEnglishRun(block.translation)) errors.push(`${file}: translation 含连续英文长句，疑似偷懒未翻译`);
  }

  if (block.kind === "figure" && !block.assetPath) errors.push(`${file}: figure 缺少 assetPath`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const reading = blocks
  .sort((a, b) => a.block.id - b.block.id)
  .map(({ block }) => {
    const item = {
      section: block.section,
      page: block.page,
      sourceText: block.sourceText,
      translation: block.translation,
      kind: block.kind || "paragraph"
    };
    if (block.assetPath) item.assetPath = block.assetPath;
    if (block.language) item.language = block.language;
    if (block.note) item.note = block.note;
    return item;
  });

fs.mkdirSync(path.dirname(readingPath), { recursive: true });
fs.writeFileSync(readingPath, `${JSON.stringify(reading, null, 2)}\n`);

if (!keepTemp) {
  fs.rmSync(blocksDir, { recursive: true, force: true });
}

console.log(JSON.stringify({
  slug,
  blocks: reading.length,
  output: path.relative(root, readingPath),
  tempRemoved: !keepTemp
}, null, 2));
