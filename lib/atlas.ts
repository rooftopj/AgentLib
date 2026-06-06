import { blogs } from "@/lib/blogs";
import atlasHighlightsData from "@/content/atlas-highlights.json";
import { categories } from "@/lib/papers";
import { papers } from "@/lib/papers";
import { projects } from "@/lib/projects";
import { publicPath } from "@/lib/public-path";

export type AtlasResourceType = "paper" | "blog" | "project";

export type AtlasResource = {
  type: AtlasResourceType;
  slug: string;
  href: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  meta: string;
  coverImageUrl?: string;
  topicNodeIds: string[];
  highlights: Array<{ title: string; body: string }>;
};

export type TopicNode = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  keywords: string[];
  x: number;
  y: number;
  tone: "green" | "blue" | "gold" | "rose";
};

export type TopicEdge = {
  from: string;
  to: string;
  label: string;
};

export type AtlasTopicGroup = {
  slug: string;
  label: string;
  description: string;
  framing: string;
  nodes: TopicNode[];
  edges: TopicEdge[];
};

export type AtlasTopicGroupView = Omit<AtlasTopicGroup, "nodes"> & {
  resourceCount: number;
  nodes: Array<TopicNode & { resourceCount: number; resources: AtlasResource[] }>;
};

type AtlasHighlightsFile = {
  version: 1;
  resources: Array<{
    type: AtlasResourceType;
    slug: string;
    topicNodeIds: string[];
    highlights: Array<{ title: string; body: string }>;
  }>;
};

const atlasHighlights = atlasHighlightsData as AtlasHighlightsFile;
const atlasHighlightsByResource = new Map(
  atlasHighlights.resources.map((resource) => [`${resource.type}:${resource.slug}`, resource])
);

const allResources: AtlasResource[] = [
  ...papers.map((paper) => ({
    type: "paper" as const,
    slug: paper.slug,
    href: `/papers/${paper.slug}/`,
    title: paper.title,
    summary: paper.summary,
    category: paper.category,
    categoryLabel: paper.categoryLabel,
    tags: paper.tags,
    meta: `${paper.year} · ${paper.venue}`,
    coverImageUrl: paper.coverImagePath ? publicPath(paper.coverImagePath) : undefined,
    topicNodeIds: atlasHighlightsByResource.get(`paper:${paper.slug}`)?.topicNodeIds || [],
    highlights: atlasHighlightsByResource.get(`paper:${paper.slug}`)?.highlights || []
  })),
  ...blogs.map((blog) => ({
    type: "blog" as const,
    slug: blog.slug,
    href: `/blogs/${blog.slug}/`,
    title: blog.title,
    summary: blog.summary,
    category: blog.category,
    categoryLabel: blog.categoryLabel,
    tags: blog.tags,
    meta: `${blog.publisher} · ${blog.publishedDate}`,
    coverImageUrl: blog.insightImageUrl || blog.coverImageUrl,
    topicNodeIds: atlasHighlightsByResource.get(`blog:${blog.slug}`)?.topicNodeIds || [],
    highlights: atlasHighlightsByResource.get(`blog:${blog.slug}`)?.highlights || []
  })),
  ...projects.map((project) => ({
    type: "project" as const,
    slug: project.slug,
    href: `/projects/${project.slug}/`,
    title: project.title,
    summary: project.summary,
    category: project.category,
    categoryLabel: project.categoryLabel,
    tags: project.tags,
    meta: `${project.projectName} · ${project.analyzedDate}`,
    coverImageUrl: publicPath(project.coverImagePath),
    topicNodeIds: atlasHighlightsByResource.get(`project:${project.slug}`)?.topicNodeIds || [],
    highlights: atlasHighlightsByResource.get(`project:${project.slug}`)?.highlights || []
  }))
];

export const atlasTopicGroups: AtlasTopicGroup[] = [
  {
    slug: "memory",
    label: "记忆系统",
    description: "把长期交互、用户偏好、历史状态和检索证据组织成可复用上下文。",
    framing: "重点看写入、组织、召回和压缩之间如何配合，哪些设计负责低延迟，哪些设计负责长期质量。",
    nodes: [
      {
        id: "memory-write",
        label: "记忆写入与巩固",
        shortLabel: "写入巩固",
        description: "把交互事件、偏好或经验落盘，并在后台整理成更稳定的结构。",
        keywords: ["写入", "巩固", "Fast Path", "Slow Path", "auto dream", "经验沉淀", "长期记忆", "memory"],
        x: 232,
        y: 116,
        tone: "green"
      },
      {
        id: "memory-structure",
        label: "结构化组织",
        shortLabel: "结构组织",
        description: "用图、树、Markdown 索引或实体关系管理记忆之间的连接。",
        keywords: ["多图", "图", "实体", "PersonaTree", "MEMORY.md", "索引", "文件化", "结构"],
        x: 532,
        y: 108,
        tone: "blue"
      },
      {
        id: "memory-retrieval",
        label: "记忆检索与路由",
        shortLabel: "检索路由",
        description: "根据问题意图召回相关记忆，再通过 rerank、图遍历或路由选择证据。",
        keywords: ["检索", "召回", "RRF", "beam search", "图遍历", "路由", "锚点", "retrieve", "rerank"],
        x: 626,
        y: 324,
        tone: "gold"
      },
      {
        id: "context-compression",
        label: "上下文压缩与折叠",
        shortLabel: "压缩折叠",
        description: "把长程会话和工具轨迹压缩成摘要、状态块或可恢复上下文。",
        keywords: ["上下文", "压缩", "折叠", "context", "session memory", "会话压缩", "checkpoint", "snapshot"],
        x: 328,
        y: 356,
        tone: "rose"
      }
    ],
    edges: [
      { from: "memory-write", to: "memory-structure", label: "沉淀为结构" },
      { from: "memory-structure", to: "memory-retrieval", label: "提供可走的关系" },
      { from: "memory-retrieval", to: "context-compression", label: "筛成上下文" },
      { from: "context-compression", to: "memory-write", label: "回写长期经验" },
      { from: "memory-write", to: "memory-retrieval", label: "新记忆进入召回" }
    ]
  },
  {
    slug: "architecture",
    label: "Agent 架构",
    description: "把任务拆成模块、workflow、控制器和执行状态，形成可维护的 agent 系统。",
    framing: "重点看模块边界、执行图、反馈信号和自动搜索如何共同塑造 agent 工作流。",
    nodes: [
      {
        id: "workflow-graph",
        label: "Workflow 图结构",
        shortLabel: "Workflow 图",
        description: "把 agent 执行过程表达为 AOV、DAG、模块链或可执行程序。",
        keywords: ["workflow", "AOV", "DAG", "流程", "工作流", "可执行", "模块化"],
        x: 214,
        y: 142,
        tone: "green"
      },
      {
        id: "module-design",
        label: "模块化设计空间",
        shortLabel: "模块空间",
        description: "用规划、记忆、工具、反思等模块组合出不同 agent 架构。",
        keywords: ["模块", "MoLAS", "模块化 Agent", "设计空间", "算子", "operator"],
        x: 512,
        y: 92,
        tone: "blue"
      },
      {
        id: "execution-feedback",
        label: "执行反馈闭环",
        shortLabel: "反馈闭环",
        description: "用测试、失败信号、人工评分或状态变化驱动下一轮执行和修正。",
        keywords: ["反馈", "失败", "Test", "Programmer", "评估", "状态", "执行", "修复"],
        x: 642,
        y: 304,
        tone: "gold"
      },
      {
        id: "search-optimization",
        label: "自动搜索与优化",
        shortLabel: "搜索优化",
        description: "通过 MCTS、性能预测器或演化策略搜索更好的 workflow 或模块组合。",
        keywords: ["搜索", "MCTS", "性能预测器", "优化", "演化", "自动架构搜索", "AFlow", "AgentSquare"],
        x: 322,
        y: 366,
        tone: "rose"
      }
    ],
    edges: [
      { from: "module-design", to: "workflow-graph", label: "组合成流程" },
      { from: "workflow-graph", to: "execution-feedback", label: "运行后产生信号" },
      { from: "execution-feedback", to: "search-optimization", label: "驱动下一轮搜索" },
      { from: "search-optimization", to: "module-design", label: "发现新模块" },
      { from: "search-optimization", to: "workflow-graph", label: "改写流程结构" }
    ]
  },
  {
    slug: "skills",
    label: "Skill 自进化",
    description: "把经验沉淀成可检索、可版本化、可注入的技能资产。",
    framing: "重点看 skill 从表示、召回、注入到版本演化的生命周期。",
    nodes: [
      {
        id: "skill-representation",
        label: "Skill 表示与存储",
        shortLabel: "表示存储",
        description: "把行为偏好、工具流程或领域规范写成标准化 skill 工件。",
        keywords: ["SKILL.md", "Skill", "技能", "表示", "存储", "注册表", "body"],
        x: 230,
        y: 132,
        tone: "green"
      },
      {
        id: "skill-retrieval",
        label: "Skill 召回与重排",
        shortLabel: "召回重排",
        description: "从大量 skill 中检索候选，再用 reranker 选出真正相关的能力。",
        keywords: ["skill 召回", "skill routing", "retrieve", "rerank", "reranker", "bi-encoder", "cross-encoder"],
        x: 556,
        y: 122,
        tone: "blue"
      },
      {
        id: "runtime-injection",
        label: "推理时注入",
        shortLabel: "推理注入",
        description: "把被选中的 skill 作为上下文、规则或操作指南注入当前任务。",
        keywords: ["注入", "推理时", "上下文", "prompt", "工具流程", "候选 skill"],
        x: 642,
        y: 334,
        tone: "gold"
      },
      {
        id: "skill-evolution",
        label: "版本合并与演化",
        shortLabel: "版本演化",
        description: "根据新经验修正、合并、淘汰或扩展既有 skill。",
        keywords: ["版本", "演化", "合并", "淘汰", "终身学习", "自进化", "经验"],
        x: 330,
        y: 360,
        tone: "rose"
      }
    ],
    edges: [
      { from: "skill-representation", to: "skill-retrieval", label: "进入注册表" },
      { from: "skill-retrieval", to: "runtime-injection", label: "选择可用技能" },
      { from: "runtime-injection", to: "skill-evolution", label: "执行产生新经验" },
      { from: "skill-evolution", to: "skill-representation", label: "更新技能工件" },
      { from: "skill-evolution", to: "skill-retrieval", label: "改善可召回性" }
    ]
  },
  {
    slug: "tools",
    label: "工具使用",
    description: "让 agent 在真实环境中调用函数、代码、浏览器、测试器和外部系统。",
    framing: "重点看工具如何被选择、调用、验证，以及失败后如何回到任务控制流。",
    nodes: [
      {
        id: "tool-routing",
        label: "工具选择与路由",
        shortLabel: "工具路由",
        description: "根据任务目标选择合适工具或 skill，减少候选能力过多带来的噪声。",
        keywords: ["工具", "路由", "skill routing", "函数调用", "tool", "候选"],
        x: 226,
        y: 132,
        tone: "green"
      },
      {
        id: "code-execution",
        label: "代码执行与测试",
        shortLabel: "代码测试",
        description: "通过生成、运行、测试和修复代码，把语言推理落到可验证动作上。",
        keywords: ["代码", "测试", "Programmer", "Test", "执行", "Python", "MBPP", "HumanEval"],
        x: 548,
        y: 118,
        tone: "blue"
      },
      {
        id: "environment-state",
        label: "环境状态建模",
        shortLabel: "环境状态",
        description: "把网页、任务状态、交互历史和工具结果维持成可继续行动的状态。",
        keywords: ["环境", "网页", "状态", "工具结果", "长程任务", "BrowseComp", "GAIA"],
        x: 648,
        y: 324,
        tone: "gold"
      },
      {
        id: "failure-recovery",
        label: "失败恢复策略",
        shortLabel: "失败恢复",
        description: "用报错、测试失败、状态异常和人工反馈触发修复或重规划。",
        keywords: ["失败", "恢复", "修复", "报错", "重新规划", "反馈", "容错"],
        x: 326,
        y: 362,
        tone: "rose"
      }
    ],
    edges: [
      { from: "tool-routing", to: "code-execution", label: "选择执行工具" },
      { from: "code-execution", to: "environment-state", label: "产生可观测结果" },
      { from: "environment-state", to: "failure-recovery", label: "暴露异常" },
      { from: "failure-recovery", to: "tool-routing", label: "重新选择能力" },
      { from: "failure-recovery", to: "code-execution", label: "修复后再测" }
    ]
  }
];

const categoryLabels = new Map(categories.map((category) => [category.slug, category.label]));

function resourceText(resource: AtlasResource) {
  return [
    resource.title,
    resource.summary,
    resource.categoryLabel,
    ...resource.tags
  ].join(" ").toLowerCase();
}

function matchesNode(resource: AtlasResource, node: TopicNode, groupSlug: string) {
  if (resource.topicNodeIds.includes(node.id)) return true;
  const text = resourceText(resource);
  const keywordHit = node.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  const categoryHit = resource.category === groupSlug;
  return keywordHit || (categoryHit && node.keywords.some((keyword) => resourceText(resource).includes(keyword.toLowerCase())));
}

function nodeResources(node: TopicNode, groupSlug: string) {
  return allResources
    .filter((resource) => matchesNode(resource, node, groupSlug))
    .sort((a, b) => {
      if (a.category === groupSlug && b.category !== groupSlug) return -1;
      if (a.category !== groupSlug && b.category === groupSlug) return 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 8);
}

const manualTopicGroupsBySlug = new Map(atlasTopicGroups.map((group) => [group.slug, group]));

const completeAtlasTopicGroups: AtlasTopicGroup[] = categories.map((category) => {
  const manualGroup = manualTopicGroupsBySlug.get(category.slug);
  if (manualGroup) return {
    ...manualGroup,
    label: category.label,
    description: category.description
  };

  return {
    slug: category.slug,
    label: category.label,
    description: category.description,
    framing: "这个主题还没有沉淀机制关系，后续可以从相关资源里继续抽取关键节点。",
    nodes: [],
    edges: []
  };
});

export const atlasTopicGroupViews: AtlasTopicGroupView[] = completeAtlasTopicGroups.map((group) => {
  const nodes = group.nodes.map((node) => {
    const resources = nodeResources(node, group.slug);
    return { ...node, resources, resourceCount: resources.length };
  });
  const uniqueResources = new Set(nodes.flatMap((node) => node.resources.map((resource) => `${resource.type}-${resource.slug}`)));
  return {
    ...group,
    label: categoryLabels.get(group.slug) || group.label,
    nodes,
    resourceCount: uniqueResources.size
  };
});

export const atlasResourceTotals = {
  papers: papers.length,
  blogs: blogs.length,
  projects: projects.length,
  topics: atlasTopicGroups.reduce((total, group) => total + group.nodes.length, 0)
};
