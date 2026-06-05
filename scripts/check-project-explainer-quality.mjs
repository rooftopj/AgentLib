import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectsDir = path.join(root, "content", "projects");
const errors = [];

const requiredMechanismTerms = [
  ["写入", "触发", "observe", "remember"],
  ["存储", "持久化", "to_dict", "storage"],
  ["冲突", "更新", "supersede", "dedup"],
  ["召回", "检索", "recall", "search"],
  ["向量", "vector", "embedding", "默认"]
];

function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function includesAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function plainParagraphs(markdown) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "\n");
  return withoutCode
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      if (/^#{1,6}\s/.test(part)) return false;
      if (/^[-*]\s/m.test(part)) return false;
      if (/^\d+\.\s/m.test(part)) return false;
      if (/^<([A-Z][A-Za-z0-9]*)\b[\s\S]*\/>$/.test(part)) return false;
      if (/^<([A-Z][A-Za-z0-9]*)\b/.test(part)) return false;
      return true;
    });
}

function cjkCount(text) {
  return (String(text).match(/[\u4e00-\u9fff]/g) || []).length;
}

function longestPlainRun(markdown) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "\n```code```\n");
  const blocks = withoutCode.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  let current = 0;
  let max = 0;
  for (const block of blocks) {
    const isPlain = plainParagraphs(block).length === 1;
    if (isPlain) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

function sourceReferenceCount(text, localSourcePath) {
  const escaped = localSourcePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    /#\s+[^\n]*assets\/projects\//g,
    /#\s+[^\n]*assets\\projects\\/g,
    new RegExp(escaped.replaceAll("\\\\", "[\\\\/]"), "g"),
    /runtime\/[a-z0-9_/-]+\.py/g,
    /runtime\\[a-z0-9_\\-]+\.py/g
  ];
  const matches = patterns.flatMap((pattern) => text.match(pattern) || []);
  return new Set(matches).size;
}

if (!fs.existsSync(projectsDir)) {
  errors.push("缺少 content/projects 目录。");
} else {
  for (const slug of fs.readdirSync(projectsDir)) {
    const projectDir = path.join(projectsDir, slug);
    if (!fs.statSync(projectDir).isDirectory()) continue;

    const metaPath = path.join(projectDir, "project.json");
    const explainerPath = path.join(projectDir, "explainer.mdx");
    if (!fs.existsSync(metaPath) || !fs.existsSync(explainerPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const explainer = fs.readFileSync(explainerPath, "utf8");
    const headings = [...explainer.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
    const figureCount = (explainer.match(/<FigureBlock\b/g) || []).length;
    const richBlockCount = (
      explainer.match(/<(FigureBlock|CalloutBlock|SplitBlock|StepFlow|ConceptTabs|AlgorithmBlock)\b/g) || []
    ).length;
    const codeFenceCount = (explainer.match(/```/g) || []).length / 2;
    const sourceRefs = sourceReferenceCount(explainer, meta.localSourcePath || "");
    const paragraphs = plainParagraphs(explainer);
    const longParagraphs = paragraphs
      .map((paragraph) => ({ paragraph, cjk: cjkCount(paragraph) }))
      .filter((item) => item.cjk > 260);
    const maxPlainRun = longestPlainRun(explainer);

    if (headings.length < 8) {
      errors.push(`${slug}: 至少需要 8 个二级标题，覆盖结论、架构、写入、存储、冲突、召回、源码和边界`);
    }
    if (figureCount < 2) {
      errors.push(`${slug}: 至少需要 2 张图，覆盖宏观架构和关键流程`);
    }
    if (richBlockCount < 5) {
      errors.push(`${slug}: 富内容组件过少，至少需要 5 个 Figure/Callout/Split/Step/Concept/Algorithm 组件来降低阅读疲劳`);
    }
    if (codeFenceCount < 5) {
      errors.push(`${slug}: 至少需要 5 个源码片段，说明关键实现路径`);
    }
    if (sourceRefs < 5) {
      errors.push(`${slug}: 源码证据不足，至少引用 5 个本地源码文件或具体源码路径`);
    }
    if (longParagraphs.length > 0) {
      errors.push(`${slug}: 存在 ${longParagraphs.length} 个超长纯文本段落，请拆分或改成 SplitBlock/StepFlow/CalloutBlock/FigureBlock`);
    }
    if (maxPlainRun > 4) {
      errors.push(`${slug}: 连续纯文本段落过多（${maxPlainRun} 段），请插入图、分栏、步骤流、callout 或代码讲解`);
    }
    for (const terms of requiredMechanismTerms) {
      if (!includesAny(explainer, terms)) {
        errors.push(`${slug}: 缺少机制问题覆盖，需出现以下任一关键词：${terms.join(" / ")}`);
      }
    }
    if (!/默认|default/i.test(explainer) || !/可选|optional|pluggable|插拔/i.test(explainer)) {
      errors.push(`${slug}: 必须区分默认路径与可选/可插拔路径`);
    }
    if (/content\/blogs|content\\blogs/i.test(explainer)) {
      errors.push(`${slug}: 开源项目讲解正文不应引用 blog 内容目录作为输出位置`);
    }
    if (/待补充|占位|TODO|后续补充/i.test(explainer)) {
      errors.push(`${slug}: 不应包含占位或制作说明`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("project:quality 通过");
