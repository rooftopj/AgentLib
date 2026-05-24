import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [, , sourceDirArg, slugArg] = process.argv;

if (!sourceDirArg || !slugArg) {
  console.error("用法: node .agents/skills/paper-to-site/scripts/convert-figure-pdfs.mjs assets/papers/architecture/arXiv-2410.10762v4 aflow-automating-agentic-workflow-generation");
  process.exit(1);
}

const root = process.cwd();
const sourceDir = path.resolve(root, sourceDirArg);
const outputDir = path.join(root, "public", "generated", slugArg);
const supportedImages = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function commandExists(command) {
  const probe = process.platform === "win32"
    ? spawnSync("where.exe", [command], { encoding: "utf8" })
    : spawnSync("which", [command], { encoding: "utf8" });
  return probe.status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} 执行失败`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (/^(minted-cache|archive|__MACOSX)$/i.test(entry.name)) return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

fs.mkdirSync(outputDir, { recursive: true });

const imageFiles = walk(sourceDir)
  .filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".pdf" || supportedImages.has(ext);
  })
  .sort((a, b) => a.localeCompare(b));

if (imageFiles.length === 0) {
  console.log("没有发现需要处理的图片资源。");
  process.exit(0);
}

const hasMagick = commandExists("magick");
const hasPdftoppm = commandExists("pdftoppm");
const hasMutool = commandExists("mutool");
const hasGs = commandExists("gswin64c") || commandExists("gs");
const copied = [];
const converted = [];

for (const file of imageFiles) {
  const ext = path.extname(file).toLowerCase();
  const stem = path.basename(file, ext);
  const output = path.join(outputDir, `${stem}.png`);

  if (supportedImages.has(ext)) {
    fs.copyFileSync(file, path.join(outputDir, `${stem}${ext === ".jpeg" ? ".jpg" : ext}`));
    copied.push(path.relative(root, path.join(outputDir, `${stem}${ext === ".jpeg" ? ".jpg" : ext}`)).replaceAll("\\", "/"));
    continue;
  }

  if (!hasMagick && !hasPdftoppm && !hasMutool && !hasGs) {
    console.error([
      "没有找到可用的 PDF 转 PNG 工具。",
      "请安装以下任一工具后重试：",
      "- ImageMagick: magick",
      "- Poppler: pdftoppm",
      "- MuPDF: mutool",
      "- Ghostscript: gswin64c 或 gs",
      "",
      "脚本没有联网安装依赖，避免把环境依赖藏在生成流程里。"
    ].join("\n"));
    process.exit(2);
  }

  if (hasPdftoppm) {
    const prefix = path.join(outputDir, stem);
    run("pdftoppm", ["-cropbox", "-png", "-singlefile", "-r", "220", file, prefix]);
  } else if (hasMagick) {
    run("magick", ["-density", "220", "-define", "pdf:use-cropbox=true", file, "-trim", "+repage", "-quality", "95", output]);
  } else if (hasMutool) {
    run("mutool", ["draw", "-r", "220", "-o", output, file, "1"]);
  } else {
    const gs = commandExists("gswin64c") ? "gswin64c" : "gs";
    run(gs, [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-dUseCropBox",
      "-sDEVICE=pngalpha",
      "-r220",
      `-sOutputFile=${output}`,
      file
    ]);
  }

  converted.push(path.relative(root, output).replaceAll("\\", "/"));
}

console.log(JSON.stringify({ copied, converted }, null, 2));
