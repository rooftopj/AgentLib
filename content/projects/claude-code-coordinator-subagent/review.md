# Project Explainer Review: claude-code-coordinator-subagent

## Review Scope

- Source repo/path: `assets/projects/claude-code`
- Focus question: Coordinator / Subagent 编排如何工作，主 agent 如何启动、继续、停止和读取 worker 输出。
- Plan path: `content/projects/claude-code-coordinator-subagent/plan.md`
- Explainer path: `content/projects/claude-code-coordinator-subagent/explainer.mdx`

## Coverage Review

- Covered: coordinator mode 入口、worker 能力动态注入、AgentTool schema、async task 登记、runAgent 上下文/工具/权限重组、LocalAgentTask 通知、SendMessage 继续、TaskStop 停止、TaskOutput 输出读取、fork/worktree/remote 边界。
- Missing or weak: 初稿没有充分强调主 coordinator 自己的工具池过滤，也没有解释 pending message 在 worker 下一次工具轮被 drain。已根据 Planck 报告补入。
- Decision: 机制覆盖完整，保留 remote isolation 和 workerAgent.js 缺失为边界说明，不展开不可核验实现。

## Source Evidence Review

- Strong evidence: `coordinatorMode.ts` 明确给出 coordinator role、task notification 格式、并行和 synthesis 规则。
- Strong evidence: `utils/systemPrompt.ts`、`constants/tools.ts`、`utils/toolPool.ts` 证明 coordinator mode 会替换主 prompt 并收窄主线程工具池。
- Strong evidence: `AgentTool.tsx` 的 `shouldRunAsync`、`registerAsyncAgent` 和 worktree/fork 参数说明 worker 如何进入 task runtime。
- Strong evidence: `runAgent.ts` 说明 worker 的上下文、权限、工具、MCP、skill、hook 都会重新组装。
- Strong evidence: `LocalAgentTask.tsx`、`SendMessageTool.ts`、`TaskStopTool.ts`、`TaskOutputTool.tsx` 构成 worker 控制面。
- Weak or unsupported claims: “默认不创建 worktree”来自 `effectiveIsolation = isolation ?? selectedAgent.isolation`，如果某个 agent definition 自带 isolation，则会进入可选路径；正文已说明为默认/可选边界。
- Revisions needed: Planck 报告指出 `coordinator/workerAgent.js` 在本地 TS 源中不可见，因此正文不展开 coordinator 内置 worker agent 的具体 prompt，只讨论可核验的 runtime 编排。

## Reader Experience Review

- Over-abstract parts: 初稿已把“Coordinator 是提示协议 + runtime”拆成架构图、流程图、控制面图和源码片段。
- Long prose / fatigue points: 正文穿插 FigureBlock、SplitBlock、StepFlow、CalloutBlock 和短源码片段，没有连续大段纯文本。
- Visual or structured component opportunities: 已加入 4 张 SVG，覆盖架构、spawn 生命周期、隔离层和控制面。

## Revision Actions

- Applied: 删除与 coordinator 编排无关的防御性边界说明，改回真实运行语义。
- Applied: 明确区分 coordinator worker 与 fork subagent，防止读者误以为 fork 是默认多代理路径。
- Applied: 根据 Planck 报告新增 `utils/systemPrompt.ts`、`constants/tools.ts`、`utils/toolPool.ts` 的主线程 prompt/tool filter 证据。
- Applied: 根据 Planck 报告补入 `drainPendingMessages()`，解释 SendMessage 对运行中 worker 的队列语义。
- Deferred with reason: remote isolation 和 ant-only coordinator worker 源码在本地不可完整核验，只作为可选边界提及。

## Final Verdict

PASS
