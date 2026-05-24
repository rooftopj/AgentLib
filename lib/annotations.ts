import fs from "node:fs";
import path from "node:path";

export type AnnotationContentType = "paper" | "blog" | "project";

export type AnnotationItem = {
  id: string;
  sectionTitle?: string;
  quote: string;
  occurrence: number;
  title: string;
  body: string;
};

export type AnnotationFile = {
  version: 1;
  contentType: AnnotationContentType;
  slug: string;
  items: AnnotationItem[];
};

const contentDirs: Record<AnnotationContentType, string> = {
  paper: "papers",
  blog: "blogs",
  project: "projects"
};

export function getAnnotationPath(contentType: AnnotationContentType, slug: string) {
  return path.join(process.cwd(), "content", contentDirs[contentType], slug, "annotations.json");
}

export function readAnnotations(contentType: AnnotationContentType, slug: string): AnnotationFile | null {
  const filePath = getAnnotationPath(contentType, slug);
  if (!fs.existsSync(filePath)) return null;

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as AnnotationFile;
  if (parsed.version !== 1 || parsed.contentType !== contentType || parsed.slug !== slug) {
    throw new Error(`Invalid annotations metadata in ${path.relative(process.cwd(), filePath)}`);
  }

  return parsed;
}

export function annotationItems(annotationFile: AnnotationFile | null) {
  return annotationFile?.items ?? [];
}
