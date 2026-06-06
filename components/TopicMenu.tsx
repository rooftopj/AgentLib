"use client";

import Link from "next/link";
import { ChevronDown, Tags } from "lucide-react";
import { categories } from "@/lib/papers";

export default function TopicMenu() {
  return (
    <div className="topic-menu">
      <button className="nav-link topic-menu-trigger" type="button" aria-haspopup="true">
        <Tags size={16} aria-hidden="true" />
        <span>主题</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div className="topic-menu-panel" role="menu" aria-label="主题列表">
        {categories.map((category) => (
          <Link href={`/categories/${category.slug}/`} key={category.slug} role="menuitem">
            <span>{category.label}</span>
            <small>{category.description}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
