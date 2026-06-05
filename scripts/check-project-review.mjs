import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectsDir = path.join(root, "content", "projects");
const errors = [];

const requiredHeadings = [
  "Review Scope",
  "Coverage Review",
  "Source Evidence Review",
  "Reader Experience Review",
  "Revision Actions"
];

const requiredPhrases = [
  ["遗漏", "missing", "coverage"],
  ["抽象", "不好理解", "unclear", "reader"],
  ["源码", "source", "evidence"],
  ["修改", "修订", "revision", "action"]
];

function includesAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

if (!fs.existsSync(projectsDir)) {
  errors.push("缺少 content/projects 目录。");
} else {
  for (const slug of fs.readdirSync(projectsDir)) {
    const projectDir = path.join(projectsDir, slug);
    if (!fs.statSync(projectDir).isDirectory()) continue;
    const explainerPath = path.join(projectDir, "explainer.mdx");
    const metaPath = path.join(projectDir, "project.json");
    if (!fs.existsSync(explainerPath) || !fs.existsSync(metaPath)) continue;

    const reviewPath = path.join(projectDir, "review.md");
    if (!fs.existsSync(reviewPath)) {
      errors.push(`${slug}: 缺少 review 报告 content/projects/${slug}/review.md`);
      continue;
    }

    const review = fs.readFileSync(reviewPath, "utf8");
    if (review.length < 1200) {
      errors.push(`${slug}: review.md 太短，无法证明完成过覆盖、证据和读者体验审查`);
    }
    for (const heading of requiredHeadings) {
      if (!review.includes(`## ${heading}`)) {
        errors.push(`${slug}: review.md 缺少章节 ## ${heading}`);
      }
    }
    for (const terms of requiredPhrases) {
      if (!includesAny(review, terms)) {
        errors.push(`${slug}: review.md 缺少审查关键词：${terms.join(" / ")}`);
      }
    }
    if (!/PASS|通过/.test(review)) {
      errors.push(`${slug}: review.md 必须明确给出最终 PASS/通过 判断`);
    }
    if (!/content\/projects\/.+\/explainer\.mdx|content\\projects\\.+\\explainer\.mdx/.test(review)) {
      errors.push(`${slug}: review.md 必须引用被审查的 explainer.mdx 路径`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("project:review 通过");
