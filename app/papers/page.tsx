import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import PageIntro from "@/components/PageIntro";
import Reveal from "@/components/Reveal";
import { papers } from "@/lib/papers";
import { publicPath } from "@/lib/public-path";

export default function PapersPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <PageIntro eyebrow="Paper Library" title="论文库" description="按主题机制浏览 Agent 论文讲解、图示、公式与代码直觉。" />
      <div className="paper-list">
        {papers.map((paper, index) => (
          <Reveal delay={index * 35} distance={14} key={paper.slug}>
            <Link className="paper-row blog-row card-link" href={`/papers/${paper.slug}/`}>
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
          </Reveal>
        ))}
      </div>
    </div>
  );
}
