import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { blogs } from "@/lib/blogs";
import { categories, papers } from "@/lib/papers";
import { projects } from "@/lib/projects";
import { publicPath } from "@/lib/public-path";

export default function HomePage() {
  const recentPapers = papers.slice(0, 2);
  const recentBlogs = blogs.slice(0, 2);
  const recentProjects = projects.slice(0, 2);
  const categorySummaries = categories.map((category) => {
    const paperCount = papers.filter((paper) => paper.category === category.slug).length;
    const blogCount = blogs.filter((blog) => blog.category === category.slug).length;
    const projectCount = projects.filter((project) => project.category === category.slug).length;

    return { ...category, paperCount, blogCount, projectCount, totalCount: paperCount + blogCount + projectCount };
  });

  return (
    <div className="page-shell library-shell">
      <section className="library-header">
        <div>
          <h1>Agent Lib</h1>
        </div>
        <div className="library-stats" aria-label="资料统计">
          <span>{papers.length} 篇论文</span>
          <span>{blogs.length} 篇博客</span>
          <span>{projects.length} 个项目</span>
          <span>{categories.length} 个主题</span>
        </div>
      </section>

      <section className="content-lanes" aria-label="内容方向">
        <Link className="content-lane card-link" href="/papers/">
          <p className="paper-meta">论文讲解与精读</p>
          <h2>想判断一篇论文值不值得读，从这里先看懂主线。</h2>
          <p>先抓问题、方法、实验和局限，再决定要不要进入中英对照精读。</p>
        </Link>
        <Link className="content-lane card-link" href="/blogs/">
          <p className="paper-meta">博客洞察</p>
          <h2>想借鉴一线团队的做法，先看可复用的工程 insight。</h2>
          <p>把实践经验、架构取舍和迁移提醒提炼出来，保留原文入口方便回看。</p>
        </Link>
        <Link className="content-lane card-link" href="/projects/">
          <p className="paper-meta">开源项目分析</p>
          <h2>想复用一个项目，先拆清结构、模块和实现路径。</h2>
          <p>从仓库入口、核心代码、运行方式和设计取舍里整理可借鉴部分。</p>
        </Link>
      </section>

      <section className="focus-paper latest-section">
        <div className="section-heading">
          <p className="eyebrow">最近更新</p>
        </div>
        <div className="latest-grid">
          {recentPapers.map((paper) => (
            <Link className="latest-card latest-card-with-media card-link" href={`/papers/${paper.slug}/`} key={paper.slug}>
              {paper.coverImagePath ? (
                <img className="blog-row-cover" src={publicPath(paper.coverImagePath)} alt="" aria-hidden="true" />
              ) : null}
              <div>
                <p className="paper-meta"><ContentTypeBadge type="paper" />{paper.categoryLabel} · {paper.year}</p>
                <h3>{paper.title}</h3>
                <p>{paper.summary}</p>
                <div className="tag-row">
                  {paper.tags.slice(0, 4).map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {recentBlogs.map((blog) => (
            <Link className="latest-card latest-card-with-media card-link" href={`/blogs/${blog.slug}/`} key={blog.slug}>
              <img
                className="blog-row-cover"
                src={blog.insightImageUrl || blog.coverImageUrl}
                alt=""
                aria-hidden="true"
              />
              <div>
                <p className="paper-meta"><ContentTypeBadge type="blog" />{blog.publisher} · {blog.publishedDate}</p>
                <h3>{blog.title}</h3>
                <p>{blog.summary}</p>
                <div className="tag-row">
                  {blog.tags.slice(0, 4).map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {recentProjects.map((project) => (
            <Link className="latest-card latest-card-with-media card-link" href={`/projects/${project.slug}/`} key={project.slug}>
              <img className="blog-row-cover" src={publicPath(project.coverImagePath)} alt="" aria-hidden="true" />
              <div>
                <p className="paper-meta"><ContentTypeBadge type="project" />{project.projectName} · {project.analyzedDate}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="tag-row">
                  {project.tags.slice(0, 4).map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <h2>按主题浏览</h2>
        </div>
        <div className="category-grid">
          {categorySummaries.map((category) => (
            <Link className="category-tile card-link" key={category.slug} href={`/categories/${category.slug}/`}>
              <span>{category.label}</span>
              <small>{category.description}</small>
              <em>{category.totalCount} 篇资料 · {category.paperCount} 论文 · {category.blogCount} 博客 · {category.projectCount} 项目</em>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
