import fs from "node:fs";
import path from "node:path";

const [, , sourceArg, ...rest] = process.argv;

if (!sourceArg) {
  console.error("用法: npm run paper:new -- assets/papers/architecture/arXiv-2410.10762v4 --category architecture");
  process.exit(1);
}

const categoryFlagIndex = rest.indexOf("--category");
const category = categoryFlagIndex >= 0 ? rest[categoryFlagIndex + 1] : "architecture";
const normalizedSource = sourceArg.replaceAll("\\", "/");
const sourceStat = fs.existsSync(sourceArg) ? fs.statSync(sourceArg) : undefined;
const title = path.basename(sourceArg, path.extname(sourceArg)).replaceAll("_", " ");
const arxivMatch = normalizedSource.match(/arxiv[-_]?(\d{4}\.\d{4,5})(?:v\d+)?/i);
const arxivId = arxivMatch?.[1];
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const paperDir = path.join(process.cwd(), "content", "papers", slug);

if (fs.existsSync(paperDir)) {
  console.error(`论文目录已存在: ${paperDir}`);
  process.exit(1);
}

fs.mkdirSync(paperDir, { recursive: true });
fs.writeFileSync(
  path.join(paperDir, "paper.json"),
  `${JSON.stringify({
    slug,
    title,
    authors: [],
    year: new Date().getFullYear(),
    venue: "",
    category,
    categoryLabel: "",
    tags: [],
    summary: "待生成中文摘要。",
    arxivId,
    arxivUrl: arxivId ? `https://arxiv.org/abs/${arxivId}` : "",
    sourcePath: sourceStat?.isDirectory() ? normalizedSource : "",
    pdfPath: sourceStat?.isFile() && path.extname(sourceArg).toLowerCase() === ".pdf" ? `/${normalizedSource}` : ""
  }, null, 2)}\n`,
  "utf8"
);
fs.writeFileSync(path.join(paperDir, "reading.json"), "[]\n", "utf8");
fs.writeFileSync(
  path.join(paperDir, "explainer.mdx"),
  `# ${title}\n\n## 研究动机\n\n待生成。\n\n## 方法框架\n\n待生成。\n`,
  "utf8"
);

console.log(`已创建论文内容目录: ${path.relative(process.cwd(), paperDir)}`);
