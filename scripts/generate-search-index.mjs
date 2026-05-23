import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "papers");
const outputPath = path.join(root, "public", "search-index.json");
const index = [];

for (const slug of fs.readdirSync(contentDir)) {
  const paperDir = path.join(contentDir, slug);
  if (!fs.statSync(paperDir).isDirectory()) continue;

  const paper = JSON.parse(fs.readFileSync(path.join(paperDir, "paper.json"), "utf8"));
  const explainer = fs.existsSync(path.join(paperDir, "explainer.mdx"))
    ? fs.readFileSync(path.join(paperDir, "explainer.mdx"), "utf8")
    : "";
  const headings = [...explainer.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]);

  index.push({
    slug: paper.slug,
    title: paper.title,
    category: paper.categoryLabel,
    tags: paper.tags,
    summary: paper.summary,
    arxivId: paper.arxivId,
    arxivUrl: paper.arxivUrl,
    headings
  });
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`paper:index 已生成 ${path.relative(root, outputPath)}`);
