import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const papersDir = path.join(root, "content", "papers");
const outputPath = path.join(root, "lib", "generated-papers.ts");

const slugs = fs.existsSync(papersDir)
  ? fs.readdirSync(papersDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => {
      const dir = path.join(papersDir, slug);
      return fs.existsSync(path.join(dir, "paper.json")) && fs.existsSync(path.join(dir, "reading.json"));
    })
    .sort()
  : [];

const imports = slugs.flatMap((slug, index) => [
  `import paper${index}Meta from "@/content/papers/${slug}/paper.json";`,
  `import paper${index}Reading from "@/content/papers/${slug}/reading.json";`
]).join("\n");

function firstExplainerFigure(slug) {
  const explainerPath = path.join(papersDir, slug, "explainer.mdx");
  if (!fs.existsSync(explainerPath)) return "";

  const explainer = fs.readFileSync(explainerPath, "utf8");
  const figureMatch = explainer.match(/<FigureBlock[\s\S]*?\bsrc=["']([^"']+)["']/);
  if (figureMatch) return figureMatch[1];

  const markdownImageMatch = explainer.match(/!\[[^\]]*]\(([^)]+)\)/);
  return markdownImageMatch?.[1] ?? "";
}

const modules = slugs
  .map((slug, index) => `  { meta: paper${index}Meta, reading: paper${index}Reading, explainerCoverImagePath: ${JSON.stringify(firstExplainerFigure(slug))} }`)
  .join(",\n");

const body = `${imports}

export const generatedPaperModules = [
${modules}
];
`;

fs.writeFileSync(outputPath, body);
console.log(JSON.stringify({ slugs, output: path.relative(root, outputPath).replaceAll("\\", "/") }, null, 2));
