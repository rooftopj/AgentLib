import project0Meta from "@/content/projects/claude-code-memory/project.json";
import project1Meta from "@/content/projects/claude-code-checkpoint-snapshot/project.json";
import project2Meta from "@/content/projects/claude-code-context-management/project.json";
import project3Meta from "@/content/projects/soul-protocol-memory/project.json";

export const generatedProjectModules: Array<{
  meta: {
    slug: string;
    title: string;
    repoUrl: string;
    localSourcePath: string;
    projectName: string;
    focus: string;
    analyzedCommit?: string;
    analyzedDate: string;
    category: string;
    categoryLabel?: string;
    tags: string[];
    summary: string;
    coverImagePath: string;
    coverImageAlt: string;
  };
  sections: Array<{ id: string; title: string }>;
}> = [
  { meta: project0Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"memory-家族","title":"Memory 家族"},{"id":"auto-memory-主轴","title":"auto-memory 主轴"},{"id":"写入什么时候触发","title":"写入什么时候触发"},{"id":"写入什么内容","title":"写入什么内容"},{"id":"存储形态","title":"存储形态"},{"id":"冲突与更新","title":"冲突与更新"},{"id":"召回什么时候触发","title":"召回什么时候触发"},{"id":"怎么检索","title":"怎么检索"},{"id":"session-memory","title":"Session Memory"},{"id":"autodream","title":"autoDream"},{"id":"team-memory-和-agent-memory","title":"Team Memory 和 Agent Memory"}] },
  { meta: project1Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"不要先误解-snapshot","title":"不要先误解 snapshot"},{"id":"宏观架构","title":"宏观架构"},{"id":"什么时候触发写入","title":"什么时候触发写入"},{"id":"写入什么东西","title":"写入什么东西"},{"id":"文件旧版本怎么捕获","title":"文件旧版本怎么捕获"},{"id":"存储在哪里","title":"存储在哪里"},{"id":"冲突-更新与差异预览","title":"冲突、更新与差异预览"},{"id":"什么时候触发召回与恢复","title":"什么时候触发召回与恢复"},{"id":"恢复代码怎么做","title":"恢复代码怎么做"},{"id":"恢复对话怎么做","title":"恢复对话怎么做"},{"id":"headless-与-sdk-路径","title":"Headless 与 SDK 路径"}] },
  { meta: project2Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"先看证据地图","title":"先看证据地图"},{"id":"固定上下文只放稳定信息","title":"固定上下文只放稳定信息"},{"id":"动态注入不是拼大-prompt","title":"动态注入不是拼大 prompt"},{"id":"delta-注入解决缓存破坏","title":"Delta 注入解决缓存破坏"},{"id":"nested-memory-有去重设计","title":"Nested memory 有去重设计"},{"id":"第一层压缩-工具结果预算","title":"第一层压缩：工具结果预算"},{"id":"第二层压缩-microcompact","title":"第二层压缩：microcompact"},{"id":"第三层压缩-auto-compact","title":"第三层压缩：auto compact"},{"id":"session-memory-compact-是优先尝试","title":"Session memory compact 是优先尝试"},{"id":"legacy-compact-会补回必要上下文","title":"legacy compact 会补回必要上下文"},{"id":"边界与可复用设计","title":"边界与可复用设计"}] },
  { meta: project3Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"宏观架构","title":"宏观架构"},{"id":"什么时候触发写入","title":"什么时候触发写入"},{"id":"写入什么东西","title":"写入什么东西"},{"id":"存在哪","title":"存在哪"},{"id":"冲突怎么更新","title":"冲突怎么更新"},{"id":"什么时候触发召回","title":"什么时候触发召回"},{"id":"怎么检索和排序","title":"怎么检索和排序"},{"id":"向量存储到底在哪里","title":"向量存储到底在哪里"},{"id":"源码细读-这套设计的关键取舍","title":"源码细读：这套设计的关键取舍"},{"id":"端到端运行路径","title":"端到端运行路径"},{"id":"可复用设计","title":"可复用设计"}] }
];
