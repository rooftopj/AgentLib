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
          <p className="library-kicker">以主题机制为索引，沉淀 Agent 论文、工程实践和开源项目。</p>
        </div>
        <div className="library-stats" aria-label="资料统计">
          <span>{papers.length} 篇论文</span>
          <span>{blogs.length} 篇博客</span>
          <span>{projects.length} 个项目</span>
          <span>{categories.length} 个主题</span>
        </div>
      </section>

      <section className="home-constellation-wrap" aria-label="Agent Lib 知识星图">
        <Link className="home-constellation card-link" href="/atlas/" aria-label="打开知识图谱">
          <svg viewBox="0 0 1180 390" role="img" aria-labelledby="constellation-title">
            <title id="constellation-title">Agent Lib knowledge constellation</title>
            <defs>
              <radialGradient id="constellationGlow" cx="50%" cy="50%" r="58%">
                <stop offset="0%" stopColor="#d9f4e7" stopOpacity="0.86" />
                <stop offset="48%" stopColor="#eef8f2" stopOpacity="0.36" />
                <stop offset="100%" stopColor="#fbf8f3" stopOpacity="0" />
              </radialGradient>
              <marker id="constellationArrow" markerHeight="9" markerWidth="9" orient="auto" refX="8" refY="4.5">
                <path d="M0,0 L9,4.5 L0,9 Z" />
              </marker>
              <filter id="softNodeShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#10251d" floodOpacity="0.12" />
              </filter>
            </defs>

            <rect className="constellation-field" x="0" y="0" width="1180" height="390" rx="12" />
            <circle className="constellation-glow" cx="590" cy="192" r="236" />
            <circle className="constellation-ring ring-one" cx="590" cy="192" r="128" />
            <circle className="constellation-ring ring-two" cx="590" cy="192" r="196" />

            <g className="constellation-line line-a">
              <path d="M590 192 C480 140 412 118 310 126" />
              <path d="M590 192 C482 226 394 262 270 282" />
              <path d="M590 192 C682 116 746 78 868 72" />
              <path d="M590 192 C706 210 802 248 940 276" />
              <path d="M590 192 C592 112 592 86 602 46" />
              <path d="M590 192 C604 238 620 278 650 320" />
            </g>
            <g className="constellation-line line-b">
              <path d="M310 126 C390 84 485 82 602 46" />
              <path d="M270 282 C392 316 525 294 650 320" />
              <path d="M868 72 C820 156 824 216 940 276" />
              <path d="M650 320 C748 318 830 302 940 276" />
            </g>

            <g className="constellation-sparks">
              <circle cx="214" cy="164" r="3" />
              <circle cx="392" cy="68" r="2.5" />
              <circle cx="488" cy="316" r="3" />
              <circle cx="760" cy="128" r="2.5" />
              <circle cx="1008" cy="224" r="3" />
              <circle cx="704" cy="348" r="2.5" />
            </g>

            <g className="constellation-node node-core">
              <circle cx="590" cy="192" r="58" />
              <text x="590" y="184" textAnchor="middle">Agent</text>
              <text x="590" y="209" textAnchor="middle">Lib</text>
            </g>
            <g className="constellation-node node-memory">
              <circle cx="310" cy="126" r="48" />
              <text x="310" y="132" textAnchor="middle">Memory</text>
            </g>
            <g className="constellation-node node-architecture">
              <circle cx="270" cy="282" r="52" />
              <text x="270" y="287" textAnchor="middle">Workflow</text>
            </g>
            <g className="constellation-node node-skills">
              <circle cx="868" cy="72" r="43" />
              <text x="868" y="77" textAnchor="middle">Skills</text>
            </g>
            <g className="constellation-node node-tools">
              <circle cx="940" cy="276" r="47" />
              <text x="940" y="281" textAnchor="middle">Tools</text>
            </g>
            <g className="constellation-node node-rag">
              <circle cx="602" cy="46" r="34" />
              <text x="602" y="51" textAnchor="middle">RAG</text>
            </g>
            <g className="constellation-node node-code">
              <circle cx="650" cy="320" r="45" />
              <text x="650" y="325" textAnchor="middle">Design</text>
            </g>
          </svg>
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
        <div className="section-heading atlas-home-heading">
          <div>
            <p className="eyebrow">知识图谱</p>
            <h2>按主题机制理解 Agent 领域</h2>
            <p className="section-copy">从记忆、架构、Skill 和工具使用等主题切入，查看核心机制之间的关系，再进入具体论文、博客和项目。</p>
          </div>
          <Link className="button primary" href="/atlas/">打开知识图谱</Link>
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
