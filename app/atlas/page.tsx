import PageIntro from "@/components/PageIntro";
import TopicAtlas from "@/components/TopicAtlas";
import { atlasResourceTotals, atlasTopicGroupViews } from "@/lib/atlas";

export default function AtlasPage() {
  return (
    <div className="atlas-page">
      <PageIntro eyebrow="Agent Knowledge Atlas" title="Agent 主题机制图谱" description="从主题进入，观察机制如何流动、互相支撑，再顺着节点进入对应论文、博客和项目。" className="atlas-hero">
        <div className="atlas-hero-stats" aria-label="图谱统计">
          <span>{atlasTopicGroupViews.length} 个主题域</span>
          <span>{atlasResourceTotals.topics} 个机制节点</span>
          <span>{atlasResourceTotals.papers} 篇论文</span>
          <span>{atlasResourceTotals.projects} 个项目</span>
          <span>{atlasResourceTotals.blogs} 篇博客</span>
        </div>
      </PageIntro>
      <TopicAtlas groups={atlasTopicGroupViews} />
    </div>
  );
}
