import Link from "next/link";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { projects } from "@/lib/projects";
import { publicPath } from "@/lib/public-path";

export default function ProjectsPage() {
  return (
    <div className="page-shell compact papers-library-page">
      <div className="page-title">
        <h1>开源项目</h1>
      </div>
      <div className="paper-list">
        {projects.map((project) => (
          <Link className="paper-row blog-row card-link" href={`/projects/${project.slug}/`} key={project.slug}>
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
        ))}
      </div>
    </div>
  );
}
