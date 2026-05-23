import categoriesData from "@/content/categories.json";
import { generatedPaperModules } from "./generated-papers";

export type RichBlock =
  | { type: "section"; id: string; title: string; kicker?: string; body: string }
  | { type: "callout"; tone: "idea" | "note" | "warning"; title: string; body: string }
  | { type: "code"; id?: string; language: string; filename?: string; code: string; highlights?: number[]; caption?: string }
  | { type: "walkthrough"; title: string; language: string; code: string; steps: Array<{ title: string; body: string; lines: number[] }> }
  | { type: "diagram"; title: string; caption: string; nodes: Array<{ id: string; label: string }>; edges: Array<[string, string, string]> }
  | { type: "table"; id?: string; title: string; columns: string[]; rows: string[][]; highlightColumn?: number }
  | { type: "math"; title?: string; formula: string; explanation: string };

export type ReadingBlock = {
  section: string;
  page: number;
  sourceText: string;
  translation: string;
  note?: string;
  assetPath?: string;
  kind?: "paragraph" | "figure" | "table" | "algorithm" | "equation" | "code";
  language?: string;
};

export type Paper = {
  slug: string;
  title: string;
  authors: string[];
  institutions?: string[];
  authorAffiliations?: Array<{ name: string; institutionIds: number[] }>;
  institutionDetails?: Array<{ id: number; name: string; translation: string }>;
  year: number;
  venue: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  difficulty?: string;
  summary: string;
  pdfPath?: string;
  arxivId?: string;
  arxivUrl?: string;
  sourcePath?: string;
  sections: Array<{ id: string; title: string }>;
  reading: ReadingBlock[];
};

export const categories = categoriesData;

function slugifyHeading(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sectionsFromReading(reading: ReadingBlock[]) {
  const seen = new Set<string>();
  const ignored = new Set(["Title", "Authors"]);
  return reading
    .filter((item) => !ignored.has(item.section))
    .map((item) => item.section)
    .filter((section) => {
      if (seen.has(section)) return false;
      seen.add(section);
      return true;
    })
    .slice(0, 12)
    .map((title) => ({ id: slugifyHeading(title), title }));
}

export const papers: Paper[] = generatedPaperModules.map(({ meta, reading }) => ({
  ...meta,
  reading: reading as ReadingBlock[],
  sections: sectionsFromReading(reading as ReadingBlock[])
}));

export function getPaper(slug: string) {
  return papers.find((paper) => paper.slug === slug);
}
