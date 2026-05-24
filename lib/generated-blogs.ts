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
  { meta: blog0Meta, sections: [{"id":"先抓住这篇文章的真正主题","title":"先抓住这篇文章的真正主题"},{"id":"从写代码转向设计反馈回路","title":"从写代码转向设计反馈回路"},{"id":"代码仓库变成记录系统","title":"代码仓库变成记录系统"},{"id":"可观测性不是给人看的仪表盘-而是给智能体用的感官","title":"可观测性不是给人看的仪表盘，而是给智能体用的感官"},{"id":"架构边界会更早变成必需品","title":"架构边界会更早变成必需品"},{"id":"合并策略也会被吞吐量改写","title":"合并策略也会被吞吐量改写"},{"id":"熵管理-把人类品味编码成持续清理","title":"熵管理：把人类品味编码成持续清理"},{"id":"对自己的-agent-项目怎么复用","title":"对自己的 Agent 项目怎么复用"}] }
];
