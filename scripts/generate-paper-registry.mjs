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

const modules = slugs
  .map((_, index) => `  { meta: paper${index}Meta, reading: paper${index}Reading }`)
  .join(",\n");

const body = `${imports}

export const generatedPaperModules = [
${modules}
];
`;

fs.writeFileSync(outputPath, body);
console.log(JSON.stringify({ slugs, output: path.relative(root, outputPath).replaceAll("\\", "/") }, null, 2));
