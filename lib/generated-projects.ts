import project0Meta from "@/content/projects/claude-code-tool-lifecycle/project.json";
import project1Meta from "@/content/projects/claude-code-permission-sandbox/project.json";
import project2Meta from "@/content/projects/claude-code-coordinator-subagent/project.json";
import project3Meta from "@/content/projects/claude-code-context-management/project.json";
import project4Meta from "@/content/projects/claude-code-checkpoint-snapshot/project.json";
import project5Meta from "@/content/projects/claude-code-memory/project.json";
import project6Meta from "@/content/projects/soul-protocol-memory/project.json";

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
  { meta: project0Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"query-loop-先发现工作项","title":"Query Loop 先发现工作项"},{"id":"tool-接口声明调度与结果契约","title":"Tool 接口声明调度与结果契约"},{"id":"默认路径与可选路径","title":"默认路径与可选路径"},{"id":"非流式调度按批次运行","title":"非流式调度按批次运行"},{"id":"流式调度是状态机","title":"流式调度是状态机"},{"id":"单个工具先过校验和权限","title":"单个工具先过校验和权限"},{"id":"hooks-和-permission-包住-tool-call","title":"Hooks 和 Permission 包住 tool.call"},{"id":"result-mapping-决定模型看到什么","title":"Result Mapping 决定模型看到什么"},{"id":"第一层结果治理是单次大输出持久化","title":"第一层结果治理是单次大输出持久化"},{"id":"第二层结果治理是历史预算","title":"第二层结果治理是历史预算"}] },
  { meta: project1Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"tool-use-先进入统一执行器","title":"Tool Use 先进入统一执行器"},{"id":"permission-context-是状态容器","title":"Permission Context 是状态容器"},{"id":"主权限闸口的顺序","title":"主权限闸口的顺序"},{"id":"bash-工具要分析命令语义","title":"Bash 工具要分析命令语义"},{"id":"sandbox-是-bash-的执行层","title":"Sandbox 是 Bash 的执行层"},{"id":"sandbox-config-从权限规则翻译而来","title":"Sandbox Config 从权限规则翻译而来"},{"id":"文件工具关注路径和读写竞态","title":"文件工具关注路径和读写竞态"},{"id":"用户批准会更新权限状态","title":"用户批准会更新权限状态"},{"id":"mcp-和-webfetch-的边界","title":"MCP 和 WebFetch 的边界"},{"id":"可复用设计","title":"可复用设计"}] },
  { meta: project2Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"coordinator-先改变主-agent","title":"Coordinator 先改变主 Agent"},{"id":"1-your-role","title":"1. Your Role"},{"id":"主线程工具池被收窄","title":"主线程工具池被收窄"},{"id":"worker-能力是动态注入的","title":"Worker 能力是动态注入的"},{"id":"agenttool-把委派写入-task-runtime","title":"AgentTool 把委派写入 Task Runtime"},{"id":"子-agent-不是完整复制主会话","title":"子 Agent 不是完整复制主会话"},{"id":"工具-权限和扩展点会重算","title":"工具、权限和扩展点会重算"},{"id":"结果不是-return-而是通知回流","title":"结果不是 return，而是通知回流"},{"id":"进度-输出和-pending-message-存在哪","title":"进度、输出和 pending message 存在哪"},{"id":"sendmessage-是续写-不是新开一个-worker","title":"SendMessage 是续写，不是新开一个 worker"}] },
  { meta: project3Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"固定上下文只放稳定信息","title":"固定上下文只放稳定信息"},{"id":"动态注入不是拼大-prompt","title":"动态注入不是拼大 prompt"},{"id":"delta-注入解决缓存破坏","title":"Delta 注入解决缓存破坏"},{"id":"nested-memory-是运行态召回","title":"Nested memory 是运行态召回"},{"id":"第一层压缩-工具结果预算","title":"第一层压缩：工具结果预算"},{"id":"第二层压缩-microcompact","title":"第二层压缩：microcompact"},{"id":"第三层压缩-auto-compact","title":"第三层压缩：auto compact"},{"id":"session-memory-compact-是优先尝试","title":"Session memory compact 是优先尝试"},{"id":"legacy-compact-会补回必要上下文","title":"legacy compact 会补回必要上下文"},{"id":"可复用设计","title":"可复用设计"}] },
  { meta: project4Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"先排除同名误解","title":"先排除同名误解"},{"id":"宏观架构","title":"宏观架构"},{"id":"什么时候建立-checkpoint","title":"什么时候建立 checkpoint"},{"id":"snapshot-里存什么","title":"snapshot 里存什么"},{"id":"文件旧版本怎么捕获","title":"文件旧版本怎么捕获"},{"id":"metadata-和-blob-分离","title":"metadata 和 blob 分离"},{"id":"snapshot-如何更新","title":"snapshot 如何更新"},{"id":"resume-后怎么找回-checkpoint","title":"resume 后怎么找回 checkpoint"},{"id":"恢复代码怎么执行","title":"恢复代码怎么执行"},{"id":"恢复对话怎么执行","title":"恢复对话怎么执行"},{"id":"headless-与-sdk-路径","title":"Headless 与 SDK 路径"}] },
  { meta: project5Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"memory-家族","title":"Memory 家族"},{"id":"auto-memory-主轴","title":"auto-memory 主轴"},{"id":"写入什么时候触发","title":"写入什么时候触发"},{"id":"写入什么内容","title":"写入什么内容"},{"id":"存储形态","title":"存储形态"},{"id":"冲突与更新","title":"冲突与更新"},{"id":"召回什么时候触发","title":"召回什么时候触发"},{"id":"怎么检索","title":"怎么检索"},{"id":"session-memory","title":"Session Memory"},{"id":"autodream","title":"autoDream"}] },
  { meta: project6Meta, sections: [{"id":"先给结论","title":"先给结论"},{"id":"源码证据地图","title":"源码证据地图"},{"id":"宏观架构","title":"宏观架构"},{"id":"写入什么时候触发","title":"写入什么时候触发"},{"id":"写入什么东西","title":"写入什么东西"},{"id":"存储形态","title":"存储形态"},{"id":"冲突怎么更新","title":"冲突怎么更新"},{"id":"召回什么时候触发","title":"召回什么时候触发"},{"id":"怎么检索和排序","title":"怎么检索和排序"},{"id":"向量能力到底是什么","title":"向量能力到底是什么"},{"id":"端到端路径","title":"端到端路径"},{"id":"可复用设计","title":"可复用设计"}] }
];
