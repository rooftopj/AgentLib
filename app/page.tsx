import Link from "next/link";
import { categories, papers } from "@/lib/papers";

export default function HomePage() {
  const featured = papers[0];

  return (
    <div className="page-shell library-shell">
      <section className="library-header">
        <div>
          <p className="eyebrow">Agent Lib</p>
          <h1>Agent Lib</h1>
        </div>
        <div className="library-stats" aria-label="论文统计">
          <span>{papers.length} 篇论文</span>
          <span>{categories.length} 个分类</span>
        </div>
      </section>

      <section className="focus-paper">
        <div className="section-heading">
          <p className="eyebrow">最近更新</p>
          <h2>{featured.title}</h2>
        </div>
        <article className="paper-feature featured-paper">
          <div>
            <p className="paper-meta">{featured.categoryLabel} · {featured.year}</p>
            <p>{featured.summary}</p>
            <div className="tag-row">
              {featured.tags.map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="feature-actions">
            <Link className="button primary" href={`/papers/${featured.slug}/`}>
              讲解页
            </Link>
            <Link className="button" href={`/papers/${featured.slug}/reading/`}>
              精读页
            </Link>
          </div>
        </article>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <h2>按主题浏览</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-tile" key={category.slug} href={`/categories/${category.slug}/`}>
              <span>{category.label}</span>
              <small>{category.description}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
