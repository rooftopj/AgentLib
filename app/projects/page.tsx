import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import PageIntro from "@/components/PageIntro";
import Reveal from "@/components/Reveal";
import { projects } from "@/lib/projects";
import { publicPath } from "@/lib/public-path";

export default function ProjectsPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <PageIntro eyebrow="Source Walkthroughs" title="开源项目" description="围绕关键机制阅读源码，把 Agent 工程实现拆成可复用的结构和流程。" />
      <div className="paper-list">
        {projects.map((project, index) => (
          <Reveal delay={index * 40} distance={14} key={project.slug}>
            <Link className="paper-row blog-row card-link" href={`/projects/${project.slug}/`}>
            <img className="blog-row-cover" src={publicPath(project.coverImagePath)} alt="" aria-hidden="true" />
            <div>
              <p className="paper-meta"><ContentTypeBadge type="project" />{project.projectName} · {project.categoryLabel} · {project.analyzedDate}</p>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              <div className="tag-row">
                {project.tags.map((tag) => (
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
