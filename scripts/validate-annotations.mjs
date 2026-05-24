import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

const configs = {
  paper: { dir: path.join(root, "content", "papers"), bodyFile: "explainer.mdx" },
  blog: { dir: path.join(root, "content", "blogs"), bodyFile: "insight.mdx" },
  project: { dir: path.join(root, "content", "projects"), bodyFile: "explainer.mdx" }
};

function countOccurrences(source, quote) {
  let count = 0;
  let cursor = 0;

  while (quote && cursor < source.length) {
    const index = source.indexOf(quote, cursor);
    if (index === -1) break;
    count += 1;
    cursor = index + quote.length;
  }

  return count;
}

function sectionSource(source, sectionTitle) {
  if (!sectionTitle) return source;

  const lines = source.split(/\r?\n/);
  const chunks = [];
  let collecting = false;
  let targetLevel = 0;

  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      if (collecting && level <= targetLevel && title !== sectionTitle) {
        collecting = false;
      }
      if (title === sectionTitle) {
        collecting = true;
        targetLevel = level;
      }
      if (collecting) chunks.push(line);
      continue;
    }
    if (collecting) chunks.push(line);
  }

  return chunks.join("\n");
}

function validateAnnotationFile(contentType, slug, annotationPath, bodyPath) {
  let annotations;
  try {
    annotations = JSON.parse(fs.readFileSync(annotationPath, "utf8"));
  } catch (error) {
    errors.push(`${contentType}/${slug}: annotations.json 不是有效 JSON (${error.message})`);
    return;
  }

  if (annotations.version !== 1) errors.push(`${contentType}/${slug}: version 必须为 1`);
  if (annotations.contentType !== contentType) errors.push(`${contentType}/${slug}: contentType 必须为 ${contentType}`);
  if (annotations.slug !== slug) errors.push(`${contentType}/${slug}: slug 必须为 ${slug}`);
  if (!Array.isArray(annotations.items)) errors.push(`${contentType}/${slug}: items 必须是数组`);
  if (!Array.isArray(annotations.items)) return;
  if (!fs.existsSync(bodyPath)) {
    errors.push(`${contentType}/${slug}: 缺少正文文件 ${path.relative(root, bodyPath)}`);
    return;
  }

  const body = fs.readFileSync(bodyPath, "utf8");
  const ids = new Set();

  for (const [index, item] of annotations.items.entries()) {
    const label = `${contentType}/${slug}: items[${index}]`;
    for (const field of ["id", "quote", "title", "body"]) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        errors.push(`${label}: ${field} 必须是非空字符串`);
      }
    }
    if (ids.has(item.id)) errors.push(`${label}: id 重复 ${item.id}`);
    ids.add(item.id);
    if (!Number.isInteger(item.occurrence) || item.occurrence < 1) {
      errors.push(`${label}: occurrence 必须是大于 0 的整数`);
      continue;
    }

    const scopedSource = sectionSource(body, item.sectionTitle);
    if (item.sectionTitle && !scopedSource) {
      errors.push(`${label}: sectionTitle 无法匹配正文标题 ${item.sectionTitle}`);
      continue;
    }

    const occurrences = countOccurrences(scopedSource, item.quote);
    if (occurrences === 0) {
      errors.push(`${label}: quote 无法在正文中匹配：${item.quote}`);
    } else if (item.occurrence > occurrences) {
      errors.push(`${label}: occurrence=${item.occurrence} 超过 quote 出现次数 ${occurrences}`);
    }
  }
}

for (const [contentType, config] of Object.entries(configs)) {
  if (!fs.existsSync(config.dir)) continue;

  for (const entry of fs.readdirSync(config.dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const annotationPath = path.join(config.dir, slug, "annotations.json");
    if (!fs.existsSync(annotationPath)) continue;
    validateAnnotationFile(contentType, slug, annotationPath, path.join(config.dir, slug, config.bodyFile));
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("annotations:validate 通过");
