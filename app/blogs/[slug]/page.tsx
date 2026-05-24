import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spaceMixedText } from "@/components/InlineText";
import LearningAnnotations from "@/components/LearningAnnotations";
import { groupToc, renderMdxContent } from "@/components/RichMdxRenderer";
import { annotationItems, readAnnotations } from "@/lib/annotations";
import { blogs, getBlog } from "@/lib/blogs";

export function generateStaticParams() {
  return blogs.map((blog) => ({ slug: blog.slug }));
}

function readInsight(slug: string) {
  const filePath = path.join(process.cwd(), "content", "blogs", slug, "insight.mdx");
  return fs.readFileSync(filePath, "utf8");
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = getBlog(slug);
  if (!blog) notFound();
  const insight = readInsight(blog.slug);
  const annotations = annotationItems(readAnnotations("blog", blog.slug));
  const renderedInsight = renderMdxContent(insight, annotations);
  const tocGroups = groupToc(renderedInsight.toc);

  return (
    <div className={`reader-shell${annotations.length > 0 ? " annotated-reader-shell" : ""}`}>
      <aside className="reader-aside">
        <Link href="/blogs/" className="back-link">返回博客</Link>
        <nav aria-label="博客目录">
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
        <header className="article-header blog-article-header">
          <p className="paper-meta">{spaceMixedText(blog.publisher)} · {spaceMixedText(blog.categoryLabel)} · {blog.publishedDate}</p>
          <h1>{blog.title}</h1>
          <p>{spaceMixedText(blog.summary)}</p>
          <dl className="paper-credits">
            <div className="paper-credit-row">
              <dt>作者</dt>
              <dd>{blog.author}</dd>
            </div>
            <div className="paper-credit-row">
              <dt>来源</dt>
              <dd>{blog.canonicalUrl}</dd>
            </div>
          </dl>
          <div className="article-actions">
            <a className="button primary" href={blog.sourceUrl} target="_blank" rel="noreferrer">阅读原文</a>
          </div>
        </header>
        <div className="mdx-content">
          {renderedInsight.elements}
        </div>
      </article>
      <LearningAnnotations annotations={annotations} />
    </div>
  );
}
