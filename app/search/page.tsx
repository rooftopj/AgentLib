import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="page-shell compact">
      <div className="page-title">
        <p className="eyebrow">搜索</p>
        <h1>Search</h1>
      </div>
      <Suspense fallback={<div className="search-panel">正在加载搜索结果...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
