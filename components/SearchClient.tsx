"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import { blogs } from "@/lib/blogs";
import { categories, papers } from "@/lib/papers";
import { publicPath } from "@/lib/public-path";

type SearchItem = {
  type: "paper" | "blog";
  slug: string;
  href: string;
  title: string;
  meta: string;
  summary: string;
  category: string;
  tags: string[];
  sections: Array<{ title: string }>;
  coverImageUrl?: string;
};

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const pieces: ReactNode[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerNeedle);

  while (index !== -1) {
    if (index > cursor) pieces.push(text.slice(cursor, index));
    pieces.push(<mark key={`${index}-${needle}`}>{text.slice(index, index + needle.length)}</mark>);
    cursor = index + needle.length;
    index = lowerText.indexOf(lowerNeedle, cursor);
  }

  if (cursor < text.length) pieces.push(text.slice(cursor));
  return <>{pieces}</>;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);

  const items = useMemo<SearchItem[]>(() => [
    ...papers.map((paper) => ({
      type: "paper" as const,
      slug: paper.slug,
      href: `/papers/${paper.slug}/`,
      title: paper.title,
      meta: `论文 · ${paper.categoryLabel} · ${paper.year}`,
      summary: paper.summary,
      category: paper.category,
      tags: paper.tags,
      sections: paper.sections,
      coverImageUrl: paper.coverImagePath ? publicPath(paper.coverImagePath) : undefined
    })),
    ...blogs.map((blog) => ({
      type: "blog" as const,
      slug: blog.slug,
      href: `/blogs/${blog.slug}/`,
      title: blog.title,
      meta: `博客 · ${blog.publisher} · ${blog.categoryLabel}`,
      summary: blog.summary,
      category: blog.category,
      tags: blog.tags,
      sections: blog.sections,
      coverImageUrl: blog.insightImageUrl || blog.coverImageUrl
    }))
  ], []);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      const inCategory = category === "all" || item.category === category;
      const haystack = [
        item.title,
        item.summary,
        item.meta,
        ...item.tags,
        ...item.sections.map((section) => section.title)
      ].join(" ").toLowerCase();
      return inCategory && (!text || haystack.includes(text));
    });
  }, [category, items, query]);

  return (
    <section className="search-panel">
      <div className="search-controls">
        <label>
          <span>关键词</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：workflow、可观测性、代码生成"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span>分类</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="all">全部分类</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="paper-list">
        {results.map((item) => (
          <Link className="paper-row blog-row card-link" href={item.href} key={`${item.type}-${item.slug}`}>
            {item.coverImageUrl ? (
              <img className="blog-row-cover" src={item.coverImageUrl} alt="" aria-hidden="true" />
            ) : null}
            <div>
              <p className="paper-meta"><ContentTypeBadge type={item.type} />{item.meta.replace(/^(论文|博客)\s+·\s+/, "")}</p>
              <h2><Highlight text={item.title} query={query} /></h2>
              <p><Highlight text={item.summary} query={query} /></p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span className="tag" key={tag}><Highlight text={tag} query={query} /></span>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {results.length === 0 ? <p className="empty-state">没有找到匹配资料，可以换一个中文关键词。</p> : null}
      </div>
    </section>
  );
}
