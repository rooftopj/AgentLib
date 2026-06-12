import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import PageIntro from "@/components/PageIntro";
import Reveal from "@/components/Reveal";
import { blogs } from "@/lib/blogs";

export default function BlogsPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <PageIntro eyebrow="Field Notes" title="博客洞察" description="收集 Agent 工程文章、产品实践和项目复盘，保留可迁移的设计经验。" />
      <div className="paper-list">
        {blogs.map((blog, index) => (
          <Reveal delay={index * 45} distance={14} key={blog.slug}>
            <Link className="paper-row blog-row card-link" href={`/blogs/${blog.slug}/`}>
            <img className="blog-row-cover" src={blog.insightImageUrl || blog.coverImageUrl} alt="" aria-hidden="true" />
            <div>
              <p className="paper-meta"><ContentTypeBadge type="blog" />{blog.publisher} · {blog.categoryLabel} · {blog.publishedDate}</p>
              <h2>{blog.title}</h2>
              <p>{blog.summary}</p>
              <div className="tag-row">
                {blog.tags.map((tag) => (
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
