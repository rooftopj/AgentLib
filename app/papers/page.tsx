import Link from "next/link";
import { papers } from "@/lib/papers";

export default function PapersPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <div className="page-title">
        <p className="eyebrow">Agent Lib</p>
        <h1>论文库</h1>
      </div>
      <div className="paper-list">
        {papers.map((paper) => (
          <article className="paper-row" key={paper.slug}>
            <div>
              <p className="paper-meta">{paper.categoryLabel} · {paper.year}</p>
              <h2>{paper.title}</h2>
              <p>{paper.summary}</p>
              <div className="tag-row">
                {paper.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className="row-actions">
              <Link className="button primary" href={`/papers/${paper.slug}/`}>讲解</Link>
              <Link className="button" href={`/papers/${paper.slug}/reading/`}>精读</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
