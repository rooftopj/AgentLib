import PageIntro from "@/components/PageIntro";
import TopicAtlas from "@/components/TopicAtlas";
import { atlasTopicGroupViews } from "@/lib/atlas";
import { categories } from "@/lib/papers";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const group = atlasTopicGroupViews.find((item) => item.slug === categorySlug);
  if (!group) notFound();

  return (
    <div className="atlas-page category-atlas-page">
      <PageIntro eyebrow="主题图谱" title={category.label} description={category.description} className="category-atlas-header">
        <div className="atlas-hero-stats" aria-label="主题图谱统计">
          <span>{group.nodes.length} 个机制节点</span>
          <span>{group.resourceCount} 个关联资源</span>
        </div>
      </PageIntro>
      <TopicAtlas groups={[group]} showSidebar={false} />
    </div>
  );
}
