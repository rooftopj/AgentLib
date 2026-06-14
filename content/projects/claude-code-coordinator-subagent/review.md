# Project Explainer Review: claude-code-coordinator-subagent

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: Coordinator / Subagent 编排如何工作，主 agent 如何启动、继续、停止和读取 worker 输出。
- Plan path: `content/projects/claude-code-coordinator-subagent/plan.md`
- Explainer path: `content/projects/claude-code-coordinator-subagent/explainer.mdx`

## Coverage Review
- Covered: coordinator mode 入口、system prompt 替换、主线程工具池过滤、worker 能力动态注入、AgentTool schema、async task 登记、runAgent 上下文/工具/权限重组、agent definition 扩展点、LocalAgentTask 通知、pendingMessages drain、SendMessage 继续、TaskStop 停止、TaskOutput 输出读取、fork 边界。
- Missing or weak: remote isolation 和 worktree isolation 只作为可选路径说明，没有展开内部实现。它们不是默认 coordinator 编排主链路。
- Decision: PASS。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: “Coordinator 先改变主 Agent”解释 prompt 替换；“主线程工具池被收窄”解释 coordinator 为什么像调度者；“AgentTool 把委派写入 Task Runtime”解释 task state 生成；“SendMessage 是续写”解释 running worker 队列和 resume 分支。
- Sections that only list files/functions: 无。证据地图只做定位，正文按入口、状态流、关键分支、例子和边界展开。
- Reader questions still unanswered: worker 具体 prompt 文本和 remote worker 内部 runner 未展开；当前本地源码可核验的主链路已经覆盖。
- Revisions needed: 无。

## Source Evidence Review
- Strong evidence: `coordinatorMode.ts` 和 `utils/systemPrompt.ts` 证明主 prompt 切换。
- Strong evidence: `constants/tools.ts` 与 `utils/toolPool.ts` 证明主线程工具池过滤。
- Strong evidence: `AgentTool.tsx` 的 `shouldRunAsync` 和 `registerAsyncAgent` 证明 coordinator worker 默认进入 async task runtime。
- Strong evidence: `runAgent.ts`、`agentToolUtils.ts`、`loadAgentsDir.ts` 证明 worker 的上下文、工具、权限、MCP、skills、hooks 会重新组装。
- Strong evidence: `LocalAgentTask.tsx`、`utils/attachments.ts`、`SendMessageTool.ts`、`stopTask.ts`、`TaskOutputTool.tsx` 构成通知、继续、停止和输出读取的控制面。
- Weak or unsupported claims: 无。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: 已把“Coordinator 是 prompt + runtime”拆成 prompt、tool filter、AgentTool task state、runAgent isolation、notification、SendMessage、TaskStop/TaskOutput。
- Long prose / fatigue points: 正文使用 4 张 FigureBlock、2 个 SplitBlock、2 个 StepFlow、CalloutBlock 和短代码片段，阅读节奏较稳。
- Visual or structured component opportunities: 现有架构图、spawn-flow、isolation、control-plane 已覆盖核心机制。

## Revision Actions
- Applied: 重写 `content/projects/claude-code-coordinator-subagent/explainer.mdx`，移除工作过程痕迹，改成源码机制讲解。
- Applied: 补强主线程工具池过滤、worker 能力动态注入和 pendingMessages drain。
- Applied: 明确普通 coordinator worker 与 fork subagent 的互斥和语义差异。
- Deferred with reason: 未新增图片；现有 4 张图已覆盖架构、生命周期、隔离和控制面。

## Final Verdict
PASS
