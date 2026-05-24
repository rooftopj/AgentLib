import categoriesData from "@/content/categories.json";
import { generatedBlogModules } from "./generated-blogs";

export type Blog = {
  slug: string;
  title: string;
  sourceUrl: string;
  canonicalUrl: string;
  publisher: string;
  author: string;
  publishedDate: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  summary: string;
  coverImageUrl: string;
  coverImageAlt: string;
  insightImageUrl?: string;
  sections: Array<{ id: string; title: string }>;
};

const categoryLabels = new Map(categoriesData.map((item) => [item.slug, item.label]));

export const blogs: Blog[] = generatedBlogModules.map(({ meta, sections }) => ({
  ...meta,
  categoryLabel: meta.categoryLabel || categoryLabels.get(meta.category) || meta.category,
  sections
}));

export function getBlog(slug: string) {
  return blogs.find((blog) => blog.slug === slug);
}
