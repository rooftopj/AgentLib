import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import AlgorithmBlock from "@/components/AlgorithmBlock";
import CodeBlock from "@/components/CodeBlock";
import ConceptTabs from "@/components/ConceptTabs";
import { renderInlineText } from "@/components/InlineText";
import MathBlock from "@/components/MathBlock";
import { publicPath } from "@/lib/public-path";

export type TocItem = { id: string; title: string; level: 2 | 3 };
export type TocGroup = { id: string; title: string; children: { id: string; title: string }[] };

function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

function decodeMdxAttr(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#10;/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

function getAttributes(source: string) {
  return Object.fromEntries(
    [...source.matchAll(/([A-Za-z][A-Za-z0-9]*)="([\s\S]*?)"/g)].map((match) => [match[1], decodeMdxAttr(match[2])])
  );
}

function localPublicAssetExists(src: string) {
  if (!src.startsWith("/") || src.startsWith("//")) return false;
  return fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function resolveAssetSrc(src: string) {
  if (/^https?:\/\//.test(src) || src.startsWith("//")) return src;
  if (!src.endsWith(".png") || localPublicAssetExists(src)) return src;
  const pdfSrc = src.replace(/\.png$/, ".pdf");
  return localPublicAssetExists(pdfSrc) ? pdfSrc : src;
}

function FigureBlock({ src, caption }: { src: string; caption: string }) {
  const resolvedSrc = resolveAssetSrc(src);
  const displaySrc = publicPath(resolvedSrc);
  const isPdf = resolvedSrc.split("?")[0].endsWith(".pdf");

  return (
    <figure className="explainer-figure">
      {isPdf ? (
        <object data={displaySrc} type="application/pdf" aria-label={caption} />
      ) : (
        <img src={displaySrc} alt={caption} />
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function CalloutBlock({ title, body, tone = "accent" }: { title: string; body: string; tone?: string }) {
  return (
    <aside className={`explainer-callout tone-${tone}`}>
      <strong>{title}</strong>
      <p>{renderInlineText(body)}</p>
    </aside>
  );
}

function SplitBlock({ leftTitle, left, rightTitle, right }: {
  leftTitle: string;
  left: string;
  rightTitle: string;
  right: string;
}) {
  return (
    <section className="split-block">
      <div>
        <h3>{leftTitle}</h3>
        <p>{renderInlineText(left)}</p>
      </div>
      <div>
        <h3>{rightTitle}</h3>
        <p>{renderInlineText(right)}</p>
      </div>
    </section>
  );
}

function StepFlow({ steps, descriptions }: { steps: string; descriptions?: string }) {
  const stepItems = steps.split("|").map((item) => item.trim()).filter(Boolean);
  const descriptionItems = descriptions?.split("|").map((item) => item.trim()) || [];

  return (
    <section className="step-flow">
      {stepItems.map((step, index) => (
        <div className="step-flow-item" key={`${step}-${index}`}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
          {descriptionItems[index] ? <p>{renderInlineText(descriptionItems[index])}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function renderMdxContent(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const elements: ReactNode[] = [];
  const toc: TocItem[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let orderedList: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      elements.push(<p key={`p-${elements.length}`}>{renderInlineText(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {list.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInlineText(item)}</li>)}
        </ul>
      );
      list = [];
    }
    if (orderedList.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`}>
          {orderedList.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInlineText(item)}</li>)}
        </ol>
      );
      orderedList = [];
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("import ")) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      const title = line.replace(/^##\s+/, "");
      const id = headingId(title);
      toc.push({ id, title, level: 2 });
      elements.push(<h2 id={id} key={`h2-${title}`}>{title}</h2>);
      continue;
    }
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      const language = line.replace(/^```/, "") || "text";
      const code: string[] = [];
      while (index < lines.length - 1) {
        index += 1;
        if (lines[index].trim().startsWith("```")) break;
        code.push(lines[index]);
      }
      elements.push(<CodeBlock code={code.join("\n")} language={language} key={`code-${elements.length}`} />);
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      const title = line.replace(/^###\s+/, "");
      const id = headingId(title);
      toc.push({ id, title, level: 3 });
      elements.push(<h3 id={id} key={`h3-${title}`}>{title}</h3>);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      orderedList = [];
      list.push(line.replace(/^-\s+/, ""));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      list = [];
      orderedList.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }
    if (line.startsWith("<MathBlock")) {
      flushParagraph();
      flushList();
      const block = [line];
      while (!block.join("\n").includes("/>") && index < lines.length - 1) {
        index += 1;
        block.push(lines[index]);
      }
      const source = block.join("\n");
      const formula = decodeMdxAttr(source.match(/formula="([\s\S]*?)"/)?.[1] || "");
      const explanation = decodeMdxAttr(source.match(/explanation="([\s\S]*?)"/)?.[1] || "");
      elements.push(<MathBlock key={`math-${elements.length}`} formula={formula} explanation={explanation} />);
      continue;
    }
    if (line.startsWith("<FigureBlock")) {
      flushParagraph();
      flushList();
      const block = [line];
      while (!block.join("\n").includes("/>") && index < lines.length - 1) {
        index += 1;
        block.push(lines[index]);
      }
      const source = block.join("\n");
      const src = decodeMdxAttr(source.match(/src="([\s\S]*?)"/)?.[1] || "");
      const caption = decodeMdxAttr(source.match(/caption="([\s\S]*?)"/)?.[1] || "");
      elements.push(<FigureBlock key={`figure-${elements.length}`} src={src} caption={caption} />);
      continue;
    }
    if (line.startsWith("<AlgorithmBlock")) {
      flushParagraph();
      flushList();
      const block = [line];
      while (!block.join("\n").includes("/>") && index < lines.length - 1) {
        index += 1;
        block.push(lines[index]);
      }
      const attrs = getAttributes(block.join("\n"));
      elements.push(
        <AlgorithmBlock
          key={`algorithm-${elements.length}`}
          title={attrs.title || "Algorithm"}
          code={attrs.code || ""}
          explanation={attrs.explanation || ""}
        />
      );
      continue;
    }
    if (line.startsWith("<CalloutBlock") || line.startsWith("<SplitBlock") || line.startsWith("<StepFlow") || line.startsWith("<ConceptTabs")) {
      flushParagraph();
      flushList();
      const block = [line];
      while (!block.join("\n").includes("/>") && index < lines.length - 1) {
        index += 1;
        block.push(lines[index]);
      }
      const source = block.join("\n");
      const attrs = getAttributes(source);
      if (line.startsWith("<CalloutBlock")) {
        elements.push(<CalloutBlock key={`callout-${elements.length}`} title={attrs.title || "重点"} body={attrs.body || ""} tone={attrs.tone} />);
      } else if (line.startsWith("<SplitBlock")) {
        elements.push(<SplitBlock key={`split-${elements.length}`} leftTitle={attrs.leftTitle || "一侧"} left={attrs.left || ""} rightTitle={attrs.rightTitle || "另一侧"} right={attrs.right || ""} />);
      } else if (line.startsWith("<StepFlow")) {
        elements.push(<StepFlow key={`steps-${elements.length}`} steps={attrs.steps || ""} descriptions={attrs.descriptions} />);
      } else {
        elements.push(<ConceptTabs key={`tabs-${elements.length}`} tabs={attrs.tabs || ""} panels={attrs.panels || ""} />);
      }
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return { elements, toc };
}

export function groupToc(toc: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = [];

  for (const item of toc) {
    if (item.level === 2 || groups.length === 0) {
      groups.push({ id: item.id, title: item.title, children: [] });
    } else {
      groups[groups.length - 1].children.push({ id: item.id, title: item.title });
    }
  }

  return groups;
}
