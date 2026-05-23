"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { categories, papers } from "@/lib/papers";

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

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return papers.filter((paper) => {
      const inCategory = category === "all" || paper.category === category;
      const haystack = [
        paper.title,
        paper.summary,
        paper.categoryLabel,
        ...paper.tags,
        ...paper.sections.map((section) => section.title)
      ].join(" ").toLowerCase();
      return inCategory && (!text || haystack.includes(text));
    });
  }, [category, query]);

  return (
    <section className="search-panel">
      <div className="search-controls">
        <label>
          <span>关键词</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：workflow、评测、代码生成"
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
        {results.map((paper) => (
          <article className="paper-row" key={paper.slug}>
            <div>
              <p className="paper-meta">{paper.categoryLabel} · {paper.year}</p>
              <h2><Highlight text={paper.title} query={query} /></h2>
              <p><Highlight text={paper.summary} query={query} /></p>
              <div className="tag-row">
                {paper.tags.map((tag) => (
                  <span className="tag" key={tag}><Highlight text={tag} query={query} /></span>
                ))}
              </div>
            </div>
            <Link className="button primary" href={`/papers/${paper.slug}/`}>打开</Link>
          </article>
        ))}
        {results.length === 0 ? <p className="empty-state">没有找到匹配论文，可以换一个中文关键词。</p> : null}
      </div>
    </section>
  );
}
