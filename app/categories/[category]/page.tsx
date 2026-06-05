import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { blogs } from "@/lib/blogs";
import { categories, papers } from "@/lib/papers";
import { projects } from "@/lib/projects";
import { publicPath } from "@/lib/public-path";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const scopedPapers = papers.filter((paper) => paper.category === categorySlug);
  const scopedBlogs = blogs.filter((blog) => blog.category === categorySlug);
  const scopedProjects = projects.filter((project) => project.category === categorySlug);
  const resources = [
    ...scopedPapers.map((paper) => ({
      type: "paper" as const,
      href: `/papers/${paper.slug}/`,
      key: `paper-${paper.slug}`,
      title: paper.title,
      summary: paper.summary,
      coverImageUrl: paper.coverImagePath ? publicPath(paper.coverImagePath) : undefined,
      meta: `${paper.categoryLabel} · ${paper.year}`,
      tags: paper.tags
    })),
    ...scopedBlogs.map((blog) => ({
      type: "blog" as const,
      href: `/blogs/${blog.slug}/`,
      key: `blog-${blog.slug}`,
      title: blog.title,
      summary: blog.summary,
      coverImageUrl: blog.insightImageUrl || blog.coverImageUrl,
      meta: `${blog.publisher} · ${blog.publishedDate}`,
      tags: blog.tags
    })),
    ...scopedProjects.map((project) => ({
      type: "project" as const,
      href: `/projects/${project.slug}/`,
      key: `project-${project.slug}`,
      title: project.title,
      summary: project.summary,
      coverImageUrl: publicPath(project.coverImagePath),
      meta: `${project.projectName} · ${project.analyzedDate}`,
      tags: project.tags
    }))
  ];

  return (
    <div className="page-shell compact">
      <div className="page-title">
        <p className="eyebrow">主题</p>
        <h1>{category.label}</h1>
        <p>{category.description} 当前包含 {scopedPapers.length} 篇论文、{scopedBlogs.length} 篇博客、{scopedProjects.length} 个项目。</p>
      </div>
      <div className="paper-list">
        {resources.map((item) => (
          <Link className="paper-row blog-row card-link" href={item.href} key={item.key}>
            {item.coverImageUrl ? (
              <img className="blog-row-cover" src={item.coverImageUrl} alt="" aria-hidden="true" />
            ) : null}
            <div>
              <p className="paper-meta"><ContentTypeBadge type={item.type} />{item.meta}</p>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <div className="tag-row">
                {item.tags.slice(0, 5).map((tag) => (
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
