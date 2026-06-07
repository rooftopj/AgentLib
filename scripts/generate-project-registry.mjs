import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectsDir = path.join(root, "content", "projects");
const outputPath = path.join(root, "lib", "generated-projects.ts");

function getLectureNumber(title) {
  const match = String(title || "").match(/[（(]\s*(\d{1,3})\s*[）)]/);
  return match ? Number(match[1]) : null;
}

const slugs = fs.existsSync(projectsDir)
  ? fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => {
      const dir = path.join(projectsDir, slug);
      return fs.existsSync(path.join(dir, "project.json")) && fs.existsSync(path.join(dir, "explainer.mdx"));
    })
    .map((slug) => {
      const meta = JSON.parse(fs.readFileSync(path.join(projectsDir, slug, "project.json"), "utf8"));
      return { slug, meta, lectureNumber: getLectureNumber(meta.title) };
    })
    .sort((a, b) => {
      if (a.meta.projectName === b.meta.projectName && a.lectureNumber !== null && b.lectureNumber !== null) {
        return b.lectureNumber - a.lectureNumber || a.slug.localeCompare(b.slug);
      }
      return a.slug.localeCompare(b.slug);
    })
    .map((entry) => entry.slug)
  : [];

function slugifyHeading(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

const imports = slugs
  .map((slug, index) => `import project${index}Meta from "@/content/projects/${slug}/project.json";`)
  .join("\n");

const modules = slugs
  .map((slug, index) => {
    const explainer = fs.readFileSync(path.join(projectsDir, slug, "explainer.mdx"), "utf8");
    const sections = [...explainer.matchAll(/^##\s+(.+)$/gm)]
      .map((match) => match[1].trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((title) => ({ id: slugifyHeading(title), title }));
    return `  { meta: project${index}Meta, sections: ${JSON.stringify(sections)} }`;
  })
  .join(",\n");

const body = `${imports}

export const generatedProjectModules: Array<{
  meta: {
    slug: string;
    title: string;
    repoUrl: string;
    localSourcePath: string;
    projectName: string;
    focus: string;
    analyzedCommit?: string;
    analyzedDate: string;
    category: string;
    categoryLabel?: string;
    tags: string[];
    summary: string;
    coverImagePath: string;
    coverImageAlt: string;
  };
  sections: Array<{ id: string; title: string }>;
}> = [
${modules}
];
`;

fs.writeFileSync(outputPath, body);
console.log(JSON.stringify({ slugs, output: path.relative(root, outputPath).replaceAll("\\", "/") }, null, 2));
