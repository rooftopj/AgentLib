import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const [contentType, slug, explicitNotesPath] = process.argv.slice(2);

const configs = {
  paper: { contentDir: "papers", bodyFile: "explainer.mdx" },
  blog: { contentDir: "blogs", bodyFile: "insight.mdx" },
  project: { contentDir: "projects", bodyFile: "explainer.mdx" }
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

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

function sectionBounds(source, sectionTitle) {
  if (!sectionTitle) return { start: 0, end: source.length };

  const headingPattern = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = headingPattern.exec(source)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    if (title !== sectionTitle) continue;

    const start = match.index;
    headingPattern.lastIndex = match.index + match[0].length;
    let next;
    while ((next = headingPattern.exec(source)) !== null) {
      const nextLevel = next[1].length;
      if (nextLevel <= level) {
        return { start, end: next.index };
      }
    }
    return { start, end: source.length };
  }

  return null;
}

function sectionSource(source, sectionTitle) {
  const bounds = sectionBounds(source, sectionTitle);
  return bounds ? source.slice(bounds.start, bounds.end) : "";
}

function quotePosition(source, item) {
  const bounds = sectionBounds(source, item.sectionTitle);
  if (!bounds) return Number.MAX_SAFE_INTEGER;

  const scopedSource = source.slice(bounds.start, bounds.end);
  let cursor = 0;
  const targetOccurrence = item.occurrence && Number.isInteger(item.occurrence) ? item.occurrence : 1;

  for (let occurrence = 1; occurrence <= targetOccurrence; occurrence += 1) {
    const index = scopedSource.indexOf(item.quote, cursor);
    if (index === -1) return Number.MAX_SAFE_INTEGER;
    if (occurrence === targetOccurrence) return bounds.start + index;
    cursor = index + item.quote.length;
  }

  return Number.MAX_SAFE_INTEGER;
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        fail(`${path.relative(root, filePath)}:${index + 1} 不是有效 JSON (${error.message})`);
      }
    });
}

if (!configs[contentType] || !slug) {
  fail("Usage: node .agents/skills/annotation-to-site/scripts/export-annotations.mjs <paper|blog|project> <slug> [notes.jsonl]");
}

const config = configs[contentType];
const contentDir = path.join(root, "content", config.contentDir, slug);
const bodyPath = path.join(contentDir, config.bodyFile);
const notesPath = explicitNotesPath
  ? path.resolve(root, explicitNotesPath)
  : path.join(root, ".tmp", "learning-annotations", contentType, slug, "notes.jsonl");
const annotationPath = path.join(contentDir, "annotations.json");
const exportLogPath = path.join(root, ".tmp", "learning-annotations", contentType, slug, "export-log.json");

if (!fs.existsSync(bodyPath)) fail(`缺少正文文件：${path.relative(root, bodyPath)}`);
if (!fs.existsSync(notesPath)) fail(`缺少临时批注记录：${path.relative(root, notesPath)}`);

const body = fs.readFileSync(bodyPath, "utf8");
const notes = readJsonl(notesPath).filter((note) => note.status === "ready");
if (notes.length === 0) fail(`${path.relative(root, notesPath)} 中没有 status 为 ready 的记录`);

const existing = fs.existsSync(annotationPath)
  ? JSON.parse(fs.readFileSync(annotationPath, "utf8"))
  : { version: 1, contentType, slug, items: [] };

if (existing.version !== 1 || existing.contentType !== contentType || existing.slug !== slug || !Array.isArray(existing.items)) {
  fail(`${path.relative(root, annotationPath)} 的元数据或 items 结构不符合 annotations v1`);
}

const byId = new Map(existing.items.map((item) => [item.id, item]));
const exported = [];

for (const note of notes) {
  for (const field of ["id", "quote", "shortTitle", "explanation"]) {
    if (typeof note[field] !== "string" || note[field].trim() === "") {
      fail(`${note.id || "unknown"} 缺少非空字段 ${field}`);
    }
  }
  if (note.contentType !== contentType || note.slug !== slug) {
    fail(`${note.id}: contentType/slug 与命令参数不一致`);
  }

  const scopedSource = sectionSource(body, note.sectionTitle);
  if (note.sectionTitle && !scopedSource) fail(`${note.id}: sectionTitle 无法匹配正文标题 ${note.sectionTitle}`);
  const occurrences = countOccurrences(scopedSource, note.quote);
  if (occurrences === 0) fail(`${note.id}: quote 无法在正文中匹配：${note.quote}`);

  const item = {
    id: note.id,
    sectionTitle: note.sectionTitle || undefined,
    quote: note.quote,
    occurrence: note.occurrence && Number.isInteger(note.occurrence) ? note.occurrence : 1,
    title: note.shortTitle,
    body: note.explanation
  };

  if (item.occurrence > occurrences) {
    fail(`${note.id}: occurrence=${item.occurrence} 超过 quote 出现次数 ${occurrences}`);
  }

  const sourcePosition = quotePosition(body, item);

  byId.set(item.id, item);
  exported.push({ id: item.id, occurrence: item.occurrence, matchedOccurrences: occurrences, sourcePosition });
}

function compareBySourceOrder(a, b) {
  const positionDelta = quotePosition(body, a) - quotePosition(body, b);
  if (positionDelta !== 0) return positionDelta;
  return a.id.localeCompare(b.id);
}

const nextFile = {
  version: 1,
  contentType,
  slug,
  items: [...byId.values()].sort(compareBySourceOrder)
};

fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(annotationPath, `${JSON.stringify(nextFile, null, 2)}\n`, "utf8");
fs.mkdirSync(path.dirname(exportLogPath), { recursive: true });
fs.writeFileSync(exportLogPath, `${JSON.stringify({
  contentType,
  slug,
  notesPath: path.relative(root, notesPath).replaceAll("\\", "/"),
  annotationPath: path.relative(root, annotationPath).replaceAll("\\", "/"),
  exportedAt: new Date().toISOString(),
  exported
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  exported: exported.length,
  annotationPath: path.relative(root, annotationPath).replaceAll("\\", "/"),
  exportLogPath: path.relative(root, exportLogPath).replaceAll("\\", "/")
}, null, 2));
