import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { spaceMixedText } from "@/components/InlineText";
import LearningAnnotations from "@/components/LearningAnnotations";
import { groupToc, renderMdxContent } from "@/components/RichMdxRenderer";
import TocNav from "@/components/TocNav";
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
        <TocNav backHref="/blogs/" backLabel="返回博客" groups={tocGroups} ariaLabel="博客目录" />
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
