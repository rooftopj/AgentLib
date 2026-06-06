# 解读 Plan: claude-code-coordinator-subagent

## 读者问题

- 这篇要回答什么：Claude Code 的主 agent 如何从“自己做事”切换成 coordinator，如何 spawn、继续、停止和收回 worker 结果。
- 不回答什么：不展开通用工具执行、安全权限全链路、MCP 协议细节，也不把 fork subagent 误讲成 coordinator 的默认路径。

## 源码侦察摘要

- 子代理或侦察阶段的关键洞察：Planck 确认 coordinator 不只换 prompt，也会收窄主线程工具池；普通 worker 不继承完整用户对话；`SendMessage` 对 running worker 是 pending-message 队列，对 stopped/evicted worker 才走 transcript resume；fork subagent 与 coordinator 互斥。
- 主代理二次核验的源码：`coordinatorMode.ts` 的 prompt 协议、`utils/systemPrompt.ts` 的 prompt 替换、`constants/tools.ts` / `utils/toolPool.ts` 的工具池过滤、`AgentTool.tsx` 的异步任务注册、`runAgent.ts` 的子上下文组装、`LocalAgentTask.tsx` 的通知与进度、`SendMessageTool.ts` / `TaskStopTool.ts` / `TaskOutputTool.tsx` 的控制面。

## 源码证据地图

- 入口：`assets/projects/claude-code/src/coordinator/coordinatorMode.ts`、`assets/projects/claude-code/src/utils/systemPrompt.ts`。
- 主线程工具池：`assets/projects/claude-code/src/constants/tools.ts`、`assets/projects/claude-code/src/utils/toolPool.ts`。
- 写入：`assets/projects/claude-code/src/tools/AgentTool/AgentTool.tsx`、`assets/projects/claude-code/src/tasks/LocalAgentTask/LocalAgentTask.tsx`。
- 存储：`assets/projects/claude-code/src/utils/sessionStorage.ts`、`assets/projects/claude-code/src/utils/task/diskOutput.ts`、`assets/projects/claude-code/src/utils/worktree.ts`。
- 更新/冲突：`assets/projects/claude-code/src/tools/SendMessageTool/SendMessageTool.ts` 的 pending message / resume，`assets/projects/claude-code/src/tasks/stopTask.ts` 的 stop 状态更新。
- 输出读取/恢复：`assets/projects/claude-code/src/tools/TaskOutputTool/TaskOutputTool.tsx` 读取 task output；`SendMessageTool` 可按 agent name 或 agentId 查找并恢复 worker。
- 权限/边界：`assets/projects/claude-code/src/tools/AgentTool/runAgent.ts`、`agentToolUtils.ts`、`loadAgentsDir.ts`。

## 讲解大纲

- 先给结论：coordinator 是一套提示协议 + task runtime，而不是简单“开多个聊天窗口”。
- 宏观架构：Coordinator prompt、AgentTool、LocalAgentTask、task notification、SendMessage/TaskStop/TaskOutput。
- 生命周期：进入 coordinator、spawn、异步运行、通知回流、继续/停止/读取输出。
- 源码细读：worker 能力说明、shouldRunAsync、runAgent 子上下文、task notification、SendMessage 路由。
- 可复用设计：主控只做综合和决策，worker 做可并行的研究/实现/验证。
- 边界：worker 默认看不到完整用户对话；fork 不是 coordinator 默认；默认不创建 worktree，也不替主 agent 自动设计分工。

## 配图规划

- 架构图：Coordinator、AgentTool、LocalAgentTask、worker query、notification 回流。
- 流程图：spawn -> async task -> transcript/output -> task notification -> SendMessage / TaskStop。
- 隔离图：上下文、工具、权限、MCP/skill/hook 的继承与裁剪。
- 控制面图：TaskOutput、SendMessage、TaskStop 的不同用途。

## 默认与可选

- 默认路径：coordinator mode 下 worker 通过 AgentTool 以 async task 运行，结果用 task-notification 注入主循环。
- 可选路径：命名 teammate、fork subagent、worktree isolation、remote isolation、agent frontmatter MCP/skill/hook、background summarization。
