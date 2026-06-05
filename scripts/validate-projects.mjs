import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "projects");
const categoryFile = path.join(root, "content", "categories.json");
const categoryItems = JSON.parse(fs.readFileSync(categoryFile, "utf8"));
const categories = new Set(categoryItems.map((item) => item.slug));
const categoryLabels = new Map(categoryItems.map((item) => [item.slug, item.label]));
const strictLocalSource = process.env.PROJECT_VALIDATE_LOCAL_SOURCE === "1";
const required = [
  "slug",
  "title",
  "repoUrl",
  "localSourcePath",
  "projectName",
  "focus",
  "analyzedDate",
  "category",
  "categoryLabel",
  "tags",
  "summary",
  "coverImagePath",
  "coverImageAlt"
];
const errors = [];

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

if (!fs.existsSync(contentDir)) {
  errors.push("缺少 content/projects 目录。");
} else {
  for (const slug of fs.readdirSync(contentDir)) {
    const projectDir = path.join(contentDir, slug);
    if (!fs.statSync(projectDir).isDirectory()) continue;

    const projectPath = path.join(projectDir, "project.json");
    const explainerPath = path.join(projectDir, "explainer.mdx");

    if (!fs.existsSync(projectPath)) errors.push(`${slug}: 缺少 project.json`);
    if (!fs.existsSync(explainerPath)) errors.push(`${slug}: 缺少 explainer.mdx`);
    if (!fs.existsSync(projectPath)) continue;

    const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
    for (const key of required) {
      if (project[key] === undefined || project[key] === "") errors.push(`${slug}: project.json 缺少 ${key}`);
    }
    if (project.slug !== slug) errors.push(`${slug}: 目录名必须和 project.json slug 一致`);
    if (!isUrl(project.repoUrl)) errors.push(`${slug}: repoUrl 必须是有效 URL`);
    if (!categories.has(project.category)) {
      errors.push(`${slug}: 未知分类 ${project.category}`);
    } else if (project.categoryLabel !== categoryLabels.get(project.category)) {
      errors.push(`${slug}: categoryLabel 应为 ${categoryLabels.get(project.category)}`);
    }
    if (!Array.isArray(project.tags) || project.tags.length === 0) errors.push(`${slug}: tags 至少需要一个标签`);
    if (String(project.summary || "").length < 40) errors.push(`${slug}: summary 太短`);
    const localSourcePath = path.join(root, project.localSourcePath);
    if (strictLocalSource && !fs.existsSync(localSourcePath)) {
      errors.push(`${slug}: localSourcePath 不存在`);
    }
    if (!fs.existsSync(path.join(root, "public", project.coverImagePath.replace(/^\//, "")))) {
      errors.push(`${slug}: coverImagePath 指向的 public 资源不存在`);
    }

    if (fs.existsSync(explainerPath)) {
      const explainer = fs.readFileSync(explainerPath, "utf8");
      const headings = [...explainer.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
      if (headings.length < 6) errors.push(`${slug}: explainer.mdx 至少需要 6 个二级标题`);
      if (!explainer.includes("<FigureBlock")) errors.push(`${slug}: explainer.mdx 至少需要引用一张项目内图像`);
      if (!explainer.includes("```")) errors.push(`${slug}: explainer.mdx 至少需要包含源码片段`);
      if (/待补充|占位|TODO/i.test(explainer)) errors.push(`${slug}: explainer.mdx 不应包含占位说明`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("project:validate 通过");
