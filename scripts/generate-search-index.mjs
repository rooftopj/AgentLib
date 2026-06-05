import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const papersDir = path.join(root, "content", "papers");
const blogsDir = path.join(root, "content", "blogs");
const projectsDir = path.join(root, "content", "projects");
const outputPath = path.join(root, "public", "search-index.json");
const index = [];

if (fs.existsSync(papersDir)) {
  for (const slug of fs.readdirSync(papersDir)) {
    const paperDir = path.join(papersDir, slug);
    if (!fs.statSync(paperDir).isDirectory()) continue;

    const paper = JSON.parse(fs.readFileSync(path.join(paperDir, "paper.json"), "utf8"));
    const explainer = fs.existsSync(path.join(paperDir, "explainer.mdx"))
      ? fs.readFileSync(path.join(paperDir, "explainer.mdx"), "utf8")
      : "";
    const headings = [...explainer.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]);

    index.push({
      type: "paper",
      slug: paper.slug,
      href: `/papers/${paper.slug}/`,
      title: paper.title,
      category: paper.categoryLabel,
      tags: paper.tags,
      summary: paper.summary,
      arxivId: paper.arxivId,
      arxivUrl: paper.arxivUrl,
      headings
    });
  }
}

if (fs.existsSync(blogsDir)) {
  for (const slug of fs.readdirSync(blogsDir)) {
    const blogDir = path.join(blogsDir, slug);
    if (!fs.statSync(blogDir).isDirectory()) continue;

    const blog = JSON.parse(fs.readFileSync(path.join(blogDir, "blog.json"), "utf8"));
    const insight = fs.existsSync(path.join(blogDir, "insight.mdx"))
      ? fs.readFileSync(path.join(blogDir, "insight.mdx"), "utf8")
      : "";
    const headings = [...insight.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]);

    index.push({
      type: "blog",
      slug: blog.slug,
      href: `/blogs/${blog.slug}/`,
      title: blog.title,
      category: blog.categoryLabel,
      tags: blog.tags,
      summary: blog.summary,
      publisher: blog.publisher,
      sourceUrl: blog.sourceUrl,
      headings
    });
  }
}

if (fs.existsSync(projectsDir)) {
  for (const slug of fs.readdirSync(projectsDir)) {
    const projectDir = path.join(projectsDir, slug);
    if (!fs.statSync(projectDir).isDirectory()) continue;

    const project = JSON.parse(fs.readFileSync(path.join(projectDir, "project.json"), "utf8"));
    const explainer = fs.existsSync(path.join(projectDir, "explainer.mdx"))
      ? fs.readFileSync(path.join(projectDir, "explainer.mdx"), "utf8")
      : "";
    const headings = [...explainer.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]);

    index.push({
      type: "project",
      slug: project.slug,
      href: `/projects/${project.slug}/`,
      title: project.title,
      category: project.categoryLabel,
      tags: project.tags,
      summary: project.summary,
      projectName: project.projectName,
      repoUrl: project.repoUrl,
      headings
    });
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`content:index 已生成 ${path.relative(root, outputPath)}`);
