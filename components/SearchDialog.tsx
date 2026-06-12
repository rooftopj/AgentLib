"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";
import { publicPath } from "@/lib/public-path";

const quickSearches = [
  "workflow",
  "记忆",
  "工具使用",
  "Skill",
  "RAG",
  "评测",
  "代码生成",
  "可观测性",
  "长期记忆",
  "权限沙箱",
  "上下文管理",
  "多智能体"
];

export default function SearchDialog() {
  const inputRef = useRef<HTMLInputElement>(null);

  function focusSearch() {
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

  return (
    <>
      <button className="icon-button" type="button" popoverTarget="site-search" aria-label="搜索资料" onClick={focusSearch}>
        <Search aria-hidden="true" size={18} />
      </button>
      <div className="search-dialog" id="site-search" popover="auto" role="dialog" aria-label="搜索资料">
        <form action={publicPath("/search/")} method="get">
          <Search aria-hidden="true" size={22} />
          <input ref={inputRef} name="q" type="search" placeholder="搜索论文、博客、方法、工程实践" autoComplete="off" />
          <button className="icon-button subtle" type="button" popoverTarget="site-search" popoverTargetAction="hide" aria-label="关闭搜索">
            <X aria-hidden="true" size={18} />
          </button>
        </form>
        <div className="quick-searches">
          <span className="quick-searches-label">热门搜索</span>
          {quickSearches.map((item, index) => (
            <a key={item} href={publicPath(`/search/?q=${encodeURIComponent(item)}`)} style={{ "--quick-index": index } as React.CSSProperties}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
