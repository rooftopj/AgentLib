import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { blogs } from "@/lib/blogs";

export default function BlogsPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <div className="page-title">
        <h1>博客</h1>
      </div>
      <div className="paper-list">
        {blogs.map((blog) => (
          <Link className="paper-row blog-row card-link" href={`/blogs/${blog.slug}/`} key={blog.slug}>
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
        ))}
      </div>
    </div>
  );
}
