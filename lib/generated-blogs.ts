import blog0Meta from "@/content/blogs/harness-engineering/blog.json";

export const generatedBlogModules: Array<{
  meta: {
    slug: string;
    title: string;
    sourceUrl: string;
    canonicalUrl: string;
    publisher: string;
    author: string;
    publishedDate: string;
    category: string;
    categoryLabel?: string;
    tags: string[];
    summary: string;
    coverImageUrl: string;
    coverImageAlt: string;
    insightImageUrl?: string;
  };
  sections: Array<{ id: string; title: string }>;
}> = [
  { meta: blog0Meta, sections: [{"id":"先抓住这篇文章的真正主题","title":"先抓住这篇文章的真正主题"},{"id":"关键章节亮点","title":"关键章节亮点"},{"id":"亮点一-应用可读性决定-codex-能不能闭环","title":"亮点一：应用可读性决定 Codex 能不能闭环"},{"id":"亮点二-仓库不是代码容器-而是智能体的记录系统","title":"亮点二：仓库不是代码容器，而是智能体的记录系统"},{"id":"亮点三-架构边界在智能体项目里要提前-而不是推迟","title":"亮点三：架构边界在智能体项目里要提前，而不是推迟"},{"id":"亮点四-吞吐量会改变合并策略-但前提是纠错足够便宜","title":"亮点四：吞吐量会改变合并策略，但前提是纠错足够便宜"},{"id":"亮点五-熵管理才是长期胜负手","title":"亮点五：熵管理才是长期胜负手"},{"id":"工程机制或方法拆解","title":"工程机制或方法拆解"},{"id":"对-agent-项目的复用启发","title":"对 Agent 项目的复用启发"},{"id":"边界与误读提醒","title":"边界与误读提醒"}] }
];
