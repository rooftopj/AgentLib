import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blogsDir = path.join(root, "content", "blogs");
const outputPath = path.join(root, "lib", "generated-blogs.ts");

const slugs = fs.existsSync(blogsDir)
  ? fs.readdirSync(blogsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => {
      const dir = path.join(blogsDir, slug);
      return fs.existsSync(path.join(dir, "blog.json")) && fs.existsSync(path.join(dir, "insight.mdx"));
    })
    .sort()
  : [];

function slugifyHeading(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

const imports = slugs
  .map((slug, index) => `import blog${index}Meta from "@/content/blogs/${slug}/blog.json";`)
  .join("\n");

const modules = slugs
  .map((slug, index) => {
    const insight = fs.readFileSync(path.join(blogsDir, slug, "insight.mdx"), "utf8");
    const sections = [...insight.matchAll(/^##\s+(.+)$/gm)]
      .map((match) => match[1].trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((title) => ({ id: slugifyHeading(title), title }));
    return `  { meta: blog${index}Meta, sections: ${JSON.stringify(sections)} }`;
  })
  .join(",\n");

const body = `${imports}

export const generatedBlogModules: Array<{
  meta: {
    slug: string;
    title: string;
    sourceUrl: string;
    canonicalUrl: string;
    publisher: string;
    author: string;
    publishedDate: string;
    category: string;
    categoryLabel?: string;
    tags: string[];
    summary: string;
    coverImageUrl: string;
    coverImageAlt: string;
    insightImageUrl?: string;
  };
  sections: Array<{ id: string; title: string }>;
}> = [
${modules}
];
`;

fs.writeFileSync(outputPath, body);
console.log(JSON.stringify({ slugs, output: path.relative(root, outputPath).replaceAll("\\", "/") }, null, 2));
