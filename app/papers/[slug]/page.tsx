import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import katex from "katex";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlgorithmBlock from "@/components/AlgorithmBlock";
import CodeBlock from "@/components/CodeBlock";
import ConceptTabs from "@/components/ConceptTabs";
import MathBlock from "@/components/MathBlock";
import { publicPath } from "@/lib/public-path";
import { getPaper, papers } from "@/lib/papers";

export function generateStaticParams() {
  return papers.map((paper) => ({ slug: paper.slug }));
}

function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readExplainer(slug: string) {
  const filePath = path.join(process.cwd(), "content", "papers", slug, "explainer.mdx");
  return fs.readFileSync(filePath, "utf8");
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

function publicFileExists(src: string) {
  if (!src.startsWith("/")) return false;
  return fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function resolveAssetSrc(src: string) {
  if (!src.endsWith(".png") || publicFileExists(src)) return src;
  const pdfSrc = src.replace(/\.png$/, ".pdf");
  return publicFileExists(pdfSrc) ? pdfSrc : src;
}

function FigureBlock({ src, caption }: { src: string; caption: string }) {
  const resolvedSrc = resolveAssetSrc(src);
  const displaySrc = publicPath(resolvedSrc);
  return (
    <figure className="explainer-figure">
      {resolvedSrc.endsWith(".png") ? (
        <img src={displaySrc} alt={caption} />
      ) : (
        <object data={displaySrc} type="application/pdf" aria-label={caption} />
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function CalloutBlock({ title, body, tone = "accent" }: { title: string; body: string; tone?: string }) {
  return (
    <aside className={`explainer-callout tone-${tone}`}>
      <strong>{title}</strong>
      <p>{renderInline(body)}</p>
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
        <p>{renderInline(left)}</p>
      </div>
      <div>
        <h3>{rightTitle}</h3>
        <p>{renderInline(right)}</p>
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
          {descriptionItems[index] ? <p>{renderInline(descriptionItems[index])}</p> : null}
        </div>
      ))}
    </section>
  );
}

function PaperCredits({ paper }: { paper: NonNullable<ReturnType<typeof getPaper>> }) {
  const authorItems = paper.authorAffiliations?.length
    ? paper.authorAffiliations
    : paper.authors.map((name) => ({ name, institutionIds: [] }));
  const institutionItems = paper.institutionDetails?.length
    ? paper.institutionDetails
    : paper.institutions?.map((name, index) => ({ id: index + 1, name, translation: "" })) || [];

  return (
    <dl className="paper-credits">
      <div className="paper-credit-row">
        <dt>作者</dt>
        <dd className="author-list">
          {authorItems.map((author) => (
            <span className="author-item" key={author.name}>
              {author.name}
              {author.institutionIds.length > 0 ? (
                <sup>{author.institutionIds.join(",")}</sup>
              ) : null}
            </span>
          ))}
        </dd>
      </div>
      {institutionItems.length > 0 ? (
        <div className="paper-credit-row">
          <dt>机构</dt>
          <dd>
            <ol className="institution-list">
              {institutionItems.map((institution) => (
                <li key={institution.id}>
                  <span>{institution.name}</span>
                  {institution.translation ? <em>{spaceMixedText(institution.translation)}</em> : null}
                </li>
              ))}
            </ol>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function renderInlineMath(formula: string) {
  const html = katex.renderToString(formula, {
    displayMode: false,
    throwOnError: false,
    strict: "ignore",
  });
  return <span className="inline-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

function spaceMixedText(text: string) {
  return text
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2");
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|==[^=]+==|\$[^$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(spaceMixedText(text.slice(lastIndex, match.index)));
    const token = match[0];
    const key = `${parts.length}-${match.index}`;

    if (token.startsWith("**")) {
      parts.push(<strong key={key}>{renderInline(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("==")) {
      parts.push(<mark key={key}>{renderInline(token.slice(2, -2))}</mark>);
    } else if (token.startsWith("$")) {
      parts.push(<span key={key}>{renderInlineMath(token.slice(1, -1))}</span>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(spaceMixedText(text.slice(lastIndex)));
  return parts;
}

function renderExplainer(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const elements: ReactNode[] = [];
  const toc: { id: string; title: string; level: 2 | 3 }[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let orderedList: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      elements.push(<p key={`p-${elements.length}`}>{renderInline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {list.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>)}
        </ul>
      );
      list = [];
    }
    if (orderedList.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`}>
          {orderedList.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>)}
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

function groupToc(toc: { id: string; title: string; level: 2 | 3 }[]) {
  const groups: { id: string; title: string; children: { id: string; title: string }[] }[] = [];

  for (const item of toc) {
    if (item.level === 2 || groups.length === 0) {
      groups.push({ id: item.id, title: item.title, children: [] });
    } else {
      groups[groups.length - 1].children.push({ id: item.id, title: item.title });
    }
  }

  return groups;
}

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();
  const explainer = readExplainer(paper.slug);
  const renderedExplainer = renderExplainer(explainer);
  const tocGroups = groupToc(renderedExplainer.toc);

  return (
    <div className="reader-shell">
      <aside className="reader-aside">
        <Link href="/papers/" className="back-link">返回论文索引</Link>
        <nav aria-label="论文目录">
          {tocGroups.map((group) => (
            <section className="toc-group" key={group.id}>
              <a className="toc-primary" href={`#${group.id}`}>{group.title}</a>
              {group.children.length > 0 ? (
                <div className="toc-children">
                  {group.children.map((child) => (
                    <a href={`#${child.id}`} key={child.id}>{child.title}</a>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </nav>
      </aside>
      <article className="paper-article">
        <header className="article-header">
          <p className="paper-meta">{spaceMixedText(paper.categoryLabel)} · {paper.year}</p>
          <h1>{paper.title}</h1>
          <p>{spaceMixedText(paper.summary)}</p>
          <PaperCredits paper={paper} />
          <div className="article-actions">
            <Link className="button primary" href={`/papers/${paper.slug}/reading/`}>进入中英精读</Link>
            {paper.arxivUrl ? (
              <a className="button" href={paper.arxivUrl} target="_blank" rel="noreferrer">arXiv</a>
            ) : null}
            {paper.pdfPath ? <a className="button" href={paper.pdfPath}>打开 PDF</a> : null}
          </div>
        </header>
        <div className="mdx-content">
          {renderedExplainer.elements}
        </div>
      </article>
    </div>
  );
}
