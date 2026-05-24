import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "blogs");
const categoryFile = path.join(root, "content", "categories.json");
const categoryItems = JSON.parse(fs.readFileSync(categoryFile, "utf8"));
const categories = new Set(categoryItems.map((item) => item.slug));
const categoryLabels = new Map(categoryItems.map((item) => [item.slug, item.label]));
const required = [
  "slug",
  "title",
  "sourceUrl",
  "canonicalUrl",
  "publisher",
  "author",
  "publishedDate",
  "category",
  "categoryLabel",
  "tags",
  "summary",
  "coverImageUrl",
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
  errors.push("缺少 content/blogs 目录。");
} else {
  for (const slug of fs.readdirSync(contentDir)) {
    const blogDir = path.join(contentDir, slug);
    if (!fs.statSync(blogDir).isDirectory()) continue;

    const blogPath = path.join(blogDir, "blog.json");
    const insightPath = path.join(blogDir, "insight.mdx");

    if (!fs.existsSync(blogPath)) errors.push(`${slug}: 缺少 blog.json`);
    if (!fs.existsSync(insightPath)) errors.push(`${slug}: 缺少 insight.mdx`);
    if (!fs.existsSync(blogPath)) continue;

    const blog = JSON.parse(fs.readFileSync(blogPath, "utf8"));
    for (const key of required) {
      if (blog[key] === undefined || blog[key] === "") errors.push(`${slug}: blog.json 缺少 ${key}`);
    }
    if (blog.slug !== slug) errors.push(`${slug}: 目录名必须和 blog.json slug 一致`);
    if (!isUrl(blog.sourceUrl)) errors.push(`${slug}: sourceUrl 必须是有效 URL`);
    if (!isUrl(blog.canonicalUrl)) errors.push(`${slug}: canonicalUrl 必须是有效 URL`);
    if (!isUrl(blog.coverImageUrl)) errors.push(`${slug}: coverImageUrl 必须是有效 URL`);
    if (!categories.has(blog.category)) {
      errors.push(`${slug}: 未知分类 ${blog.category}`);
    } else if (blog.categoryLabel !== categoryLabels.get(blog.category)) {
      errors.push(`${slug}: categoryLabel 应为 ${categoryLabels.get(blog.category)}`);
    }
    if (!Array.isArray(blog.tags) || blog.tags.length === 0) errors.push(`${slug}: tags 至少需要一个标签`);
    if (String(blog.summary || "").length < 30) errors.push(`${slug}: summary 太短`);

    if (fs.existsSync(insightPath)) {
      const insight = fs.readFileSync(insightPath, "utf8");
      const headings = [...insight.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
      if (headings.length < 4) errors.push(`${slug}: insight.mdx 至少需要 4 个二级标题`);
      if (!insight.includes("<FigureBlock")) errors.push(`${slug}: insight.mdx 至少需要引用一张原文图片`);
      if (/待补充|占位|TODO|原文链接待定/i.test(insight)) errors.push(`${slug}: insight.mdx 不应包含占位说明`);
      if (insight.includes(blog.sourceUrl)) errors.push(`${slug}: insight.mdx 不需要在正文重复原文 URL，页面按钮会处理跳转`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("blog:validate 通过");
