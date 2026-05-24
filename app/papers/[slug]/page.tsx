import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spaceMixedText } from "@/components/InlineText";
import LearningAnnotations from "@/components/LearningAnnotations";
import { groupToc, renderMdxContent } from "@/components/RichMdxRenderer";
import { annotationItems, readAnnotations } from "@/lib/annotations";
import { getPaper, papers } from "@/lib/papers";

export function generateStaticParams() {
  return papers.map((paper) => ({ slug: paper.slug }));
}

function readExplainer(slug: string) {
  const filePath = path.join(process.cwd(), "content", "papers", slug, "explainer.mdx");
  return fs.readFileSync(filePath, "utf8");
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

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();
  const explainer = readExplainer(paper.slug);
  const annotations = annotationItems(readAnnotations("paper", paper.slug));
  const renderedExplainer = renderMdxContent(explainer, annotations);
  const tocGroups = groupToc(renderedExplainer.toc);

  return (
    <div className={`reader-shell${annotations.length > 0 ? " annotated-reader-shell" : ""}`}>
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
            {paper.codeUrl ? (
              <a className="button" href={paper.codeUrl} target="_blank" rel="noreferrer">GitHub</a>
            ) : null}
            {paper.pdfPath ? <a className="button" href={paper.pdfPath}>打开 PDF</a> : null}
          </div>
        </header>
        <div className="mdx-content">
          {renderedExplainer.elements}
        </div>
      </article>
      <LearningAnnotations annotations={annotations} />
    </div>
  );
}
