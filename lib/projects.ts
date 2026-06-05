import categoriesData from "@/content/categories.json";
import { generatedProjectModules } from "./generated-projects";

export type ProjectExplainer = {
  slug: string;
  title: string;
  repoUrl: string;
  localSourcePath: string;
  projectName: string;
  focus: string;
  analyzedCommit?: string;
  analyzedDate: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  summary: string;
  coverImagePath: string;
  coverImageAlt: string;
  sections: Array<{ id: string; title: string }>;
};

const categoryLabels = new Map(categoriesData.map((item) => [item.slug, item.label]));

export const projects: ProjectExplainer[] = generatedProjectModules.map(({ meta, sections }) => ({
  ...meta,
  categoryLabel: meta.categoryLabel || categoryLabels.get(meta.category) || meta.category,
  sections
}));

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
