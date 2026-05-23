import Link from "next/link";
import { categories, papers } from "@/lib/papers";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const scopedPapers = papers.filter((paper) => paper.category === categorySlug);

  return (
    <div className="page-shell compact">
      <div className="page-title">
        <p className="eyebrow">分类</p>
        <h1>{category.label}</h1>
        <p>{category.description}</p>
      </div>
      <div className="paper-list">
        {scopedPapers.map((paper) => (
          <article className="paper-row" key={paper.slug}>
            <div>
              <p className="paper-meta">{paper.categoryLabel} · {paper.year}</p>
              <h2>{paper.title}</h2>
              <p>{paper.summary}</p>
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
