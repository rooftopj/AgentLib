import fs from "node:fs";
import path from "node:path";

const [, , sourceDirArg] = process.argv;

if (!sourceDirArg) {
  console.error("用法: node .agents/skills/paper-to-site/scripts/inspect-tex-project.mjs assets/papers/architecture/arXiv-2410.10762v4");
  process.exit(1);
}

const root = process.cwd();
const sourceDir = path.resolve(root, sourceDirArg);
const arxivMatch = sourceDirArg.replaceAll("\\", "/").match(/arxiv[-_]?(\d{4}\.\d{4,5})(?:v\d+)?/i);

if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
  console.error(`TeX 工程目录不存在: ${sourceDirArg}`);
  process.exit(1);
}

function listFiles(dir, predicate) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(sourceDir, fullPath).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (["minted-cache", ".git", "__MACOSX"].includes(entry.name)) continue;
      output.push(...listFiles(fullPath, predicate));
    } else if (predicate(fullPath, relative)) {
      output.push(relative);
    }
  }
  return output.sort();
}

const texFiles = listFiles(sourceDir, (fullPath) => path.extname(fullPath).toLowerCase() === ".tex");
const imageFiles = listFiles(sourceDir, (fullPath) => [".pdf", ".png", ".jpg", ".jpeg", ".svg"].includes(path.extname(fullPath).toLowerCase()));
const bibFiles = listFiles(sourceDir, (fullPath) => [".bib", ".bbl"].includes(path.extname(fullPath).toLowerCase()));

function findEntryTex() {
  const main = path.join(sourceDir, "main.tex");
  if (fs.existsSync(main)) return main;

  const candidates = texFiles
    .filter((relative) => !/(^|\/)(archive|minted-cache)\//i.test(relative))
    .map((relative) => {
      const file = path.join(sourceDir, relative);
      const text = fs.readFileSync(file, "utf8");
      const hasTitle = /\\title\s*\{/.test(text);
      const hasDocument = /\\begin\s*\{document\}/.test(text);
      return { file, hasTitle, hasDocument, size: fs.statSync(file).size };
    })
    .sort((a, b) => {
      const scoreA = Number(a.hasTitle) + Number(a.hasDocument);
      const scoreB = Number(b.hasTitle) + Number(b.hasDocument);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.size - a.size;
    });

  const exact = candidates.find((candidate) => candidate.hasTitle && candidate.hasDocument);
  return exact?.file || candidates[0]?.file || null;
}

const entryPath = findEntryTex();
if (!entryPath) {
  console.error(`没有找到可用的 TeX 入口: ${sourceDirArg}`);
  process.exit(1);
}

const mainText = fs.readFileSync(entryPath, "utf8");
const inputs = [...mainText.matchAll(/\\(?:input|include)\{([^}]+)\}/g)]
  .map((match) => match[1])
  .map((item) => item.endsWith(".tex") ? item : `${item}.tex`);

console.log(JSON.stringify({
  sourcePath: path.relative(root, sourceDir).replaceAll("\\", "/"),
  arxivId: arxivMatch?.[1] || null,
  arxivUrl: arxivMatch ? `https://arxiv.org/abs/${arxivMatch[1]}` : null,
  main: path.relative(sourceDir, entryPath).replaceAll("\\", "/"),
  mainInputs: inputs,
  texFiles,
  imageFiles,
  bibFiles
}, null, 2));
