import { Suspense } from "react";
import PageIntro from "@/components/PageIntro";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="page-shell compact">
      <PageIntro eyebrow="Search" title="搜索 Agent Lib" description="输入论文、机制、项目或工程关键词，在资料库里快速定位相关内容。" />
      <Suspense fallback={<div className="search-panel">正在加载搜索结果...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
