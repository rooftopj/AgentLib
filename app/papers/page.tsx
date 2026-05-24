import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { papers } from "@/lib/papers";
import { publicPath } from "@/lib/public-path";

export default function PapersPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <div className="page-title">
        <h1>论文</h1>
      </div>
      <div className="paper-list">
        {papers.map((paper) => (
          <Link className="paper-row blog-row card-link" href={`/papers/${paper.slug}/`} key={paper.slug}>
            {paper.coverImagePath ? (
              <img className="blog-row-cover" src={publicPath(paper.coverImagePath)} alt="" aria-hidden="true" />
            ) : null}
            <div>
              <p className="paper-meta"><ContentTypeBadge type="paper" />{paper.categoryLabel} · {paper.year}</p>
              <h2>{paper.title}</h2>
              <p>{paper.summary}</p>
              <div className="tag-row">
                {paper.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
