import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { spaceMixedText } from "@/components/InlineText";
import LearningAnnotations from "@/components/LearningAnnotations";
import { groupToc, renderMdxContent } from "@/components/RichMdxRenderer";
import TocNav from "@/components/TocNav";
import { annotationItems, readAnnotations } from "@/lib/annotations";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

function readExplainer(slug: string) {
  const filePath = path.join(process.cwd(), "content", "projects", slug, "explainer.mdx");
  return fs.readFileSync(filePath, "utf8");
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const explainer = readExplainer(project.slug);
  const annotations = annotationItems(readAnnotations("project", project.slug));
  const renderedExplainer = renderMdxContent(explainer, annotations);
  const tocGroups = groupToc(renderedExplainer.toc);

  return (
    <div className={`reader-shell${annotations.length > 0 ? " annotated-reader-shell" : ""}`}>
      <aside className="reader-aside">
        <TocNav backHref="/projects/" backLabel="返回开源项目" groups={tocGroups} ariaLabel="项目讲解目录" />
      </aside>
      <article className="paper-article">
        <header className="article-header blog-article-header">
          <p className="paper-meta">{spaceMixedText(project.projectName)} · {spaceMixedText(project.categoryLabel)} · {project.analyzedDate}</p>
          <h1>{project.title}</h1>
          <p>{spaceMixedText(project.summary)}</p>
          <dl className="paper-credits">
            <div className="paper-credit-row">
              <dt>聚焦</dt>
              <dd>{project.focus}</dd>
            </div>
            <div className="paper-credit-row">
              <dt>源码</dt>
              <dd>{project.localSourcePath}</dd>
            </div>
            {project.analyzedCommit ? (
              <div className="paper-credit-row">
                <dt>版本</dt>
                <dd>{project.analyzedCommit}</dd>
              </div>
            ) : null}
          </dl>
          <div className="article-actions">
            <a className="button primary" href={project.repoUrl} target="_blank" rel="noreferrer">查看仓库</a>
          </div>
        </header>
        <div className="mdx-content">
          {renderedExplainer.elements}
        </div>
      </article>
      <LearningAnnotations annotations={annotations} />
    </div>
  );
}
