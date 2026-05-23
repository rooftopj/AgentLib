import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import katex from "katex";
import AlgorithmBlock from "@/components/AlgorithmBlock";
import CodeBlock from "@/components/CodeBlock";
import MathBlock from "@/components/MathBlock";
import { publicPath } from "@/lib/public-path";
import type { ReadingBlock } from "@/lib/papers";
import { getPaper, papers } from "@/lib/papers";

export function generateStaticParams() {
  return papers.map((paper) => ({ slug: paper.slug }));
}

export default async function ReadingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  let previousSection = "";

  return (
    <div className="immersive-reading-shell">
      <header className="reading-header">
        <div>
          <Link href={`/papers/${paper.slug}/`} className="back-link">返回讲解页</Link>
          <h1>{paper.title}</h1>
          <p>英文原文后紧跟中文翻译，按论文结构连续阅读。</p>
        </div>
      </header>
      <article className="immersive-paper">
        {paper.reading.map((item, index) => {
          const showHeading = item.section !== previousSection;
          previousSection = item.section;
          return <ReadingItem item={item} index={index} showHeading={showHeading} key={`${item.section}-${index}`} />;
        })}
      </article>
    </div>
  );
}

function spaceMixedText(text: string) {
  return text
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2");
}

function renderInlineMath(formula: string) {
  const html = katex.renderToString(formula, {
    displayMode: false,
    throwOnError: false,
    strict: "ignore"
  });

  return <span className="inline-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderReadingInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(spaceMixedText(text.slice(lastIndex, match.index)));
    }

    parts.push(
      <span key={`math-${match.index}`}>
        {renderInlineMath(match[1].trim())}
      </span>
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(spaceMixedText(text.slice(lastIndex)));
  }

  return parts;
}

function parseAlgorithmSource(sourceText: string) {
  const lines = sourceText.replace(/^Algorithm:\s*/i, "").split(/\r?\n/);
  const title = lines.shift()?.trim() || "Algorithm";
  const code = lines.join("\n").trim() || title;
  return { title, code };
}

function ReadingItem({ item, index, showHeading }: {
  item: ReadingBlock;
  index: number;
  showHeading: boolean;
}) {
  const isFigure = item.kind === "figure" || item.sourceText.startsWith("Figure:");
  const isTable = item.kind === "table" || item.sourceText.startsWith("Table:");
  const isAlgorithm = item.kind === "algorithm" || item.sourceText.startsWith("Algorithm:");
  const isEquation = item.kind === "equation";
  const isCode = item.kind === "code";
  const resolvedAssetPath = item.assetPath;
  const displayAssetPath = resolvedAssetPath ? publicPath(resolvedAssetPath) : "";
  const isPng = resolvedAssetPath?.endsWith(".png");
  const algorithm = isAlgorithm ? parseAlgorithmSource(item.sourceText) : null;

  return (
    <section className="paper-reading-block" id={`p-${index + 1}`}>
      {showHeading ? <h2>{spaceMixedText(item.section)}</h2> : null}
      {isEquation ? (
        <MathBlock formula={item.sourceText} explanation={item.translation} />
      ) : isAlgorithm ? (
        <AlgorithmBlock
          title={algorithm?.title || "Algorithm"}
          code={algorithm?.code || ""}
          explanation={item.translation}
        />
      ) : isCode ? (
        <div className="paper-code-reading">
          <CodeBlock code={item.sourceText} language={item.language || "text"} />
          <p className="translation-paragraph">{renderReadingInline(item.translation)}</p>
        </div>
      ) : isFigure || isTable || isAlgorithm ? (
        <figure className="paper-inline-asset">
          {resolvedAssetPath && isPng ? (
            <img src={displayAssetPath} alt={item.sourceText} />
          ) : resolvedAssetPath ? (
            <object data={displayAssetPath} type="application/pdf" aria-label={item.sourceText} />
          ) : null}
          {!resolvedAssetPath && isTable ? <pre className="reading-raw-block">{item.sourceText}</pre> : null}
          <figcaption>
            <span>{isFigure ? "Figure" : "Table"}</span>
            {renderReadingInline(item.sourceText.replace(/^(Figure|Table):\s*/, ""))}
          </figcaption>
          <p className="translation-paragraph">{renderReadingInline(item.translation)}</p>
        </figure>
      ) : (
        <>
          <p className="source-paragraph">{renderReadingInline(item.sourceText)}</p>
          <p className="translation-paragraph">{renderReadingInline(item.translation)}</p>
        </>
      )}
    </section>
  );
}
