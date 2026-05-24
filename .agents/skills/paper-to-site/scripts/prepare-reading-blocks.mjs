import fs from "node:fs";
import path from "node:path";

const [, , slug, flag] = process.argv;

if (!slug) {
  console.error("用法: node .agents/skills/paper-to-site/scripts/prepare-reading-blocks.mjs {slug} [--preserve-translations]");
  process.exit(1);
}

const root = process.cwd();
const readingPath = path.join(root, "content", "papers", slug, "reading.json");
const outDir = path.join(root, ".tmp", "paper-to-site", slug, "reading-blocks");
const preserveTranslations = flag === "--preserve-translations";

if (!fs.existsSync(readingPath)) {
  console.error(`找不到 reading.json: ${path.relative(root, readingPath)}`);
  process.exit(1);
}

const blocks = JSON.parse(fs.readFileSync(readingPath, "utf8"));
if (!Array.isArray(blocks)) {
  console.error("reading.json 必须是数组。");
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const [index, block] of blocks.entries()) {
  const id = index + 1;
  const tempBlock = {
    id,
    section: block.section || "",
    page: block.page,
    kind: block.kind || "paragraph",
    sourceText: block.sourceText || "",
    translation: preserveTranslations ? block.translation || "" : "",
    note: block.note || ""
  };

  if (block.sectionPath) tempBlock.sectionPath = block.sectionPath;
  if (block.assetPath) tempBlock.assetPath = block.assetPath;
  if (block.language) tempBlock.language = block.language;

  const filename = `${String(id).padStart(4, "0")}.json`;
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(tempBlock, null, 2)}\n`);
}

console.log(JSON.stringify({
  slug,
  blocks: blocks.length,
  output: path.relative(root, outDir),
  preserveTranslations
}, null, 2));
