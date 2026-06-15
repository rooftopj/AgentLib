# Project Explainer Review: claude-code-tool-lifecycle

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: Tool 调度与工具结果生命周期如何从 `tool_use` 到 `tool_result`，并处理并发、hooks、permission、失败和结果预算。
- Plan path: `content/projects/claude-code-tool-lifecycle/plan.md`
- Explainer path: `content/projects/claude-code-tool-lifecycle/explainer.mdx`

## Coverage Review
- Covered: query loop 发现 tool_use、streaming/non-streaming 两条调度路径、Tool 接口契约、非流式批次、StreamingToolExecutor 状态机、最终顺序保证、单工具 schema/validate/hook/permission/call、result mapping、MCP PostToolUse 分支、单次大输出持久化、历史 aggregate budget、Bash/Agent/MCP/ToolSearch 特殊路径、失败 tool_result。
- Missing or weak: Permission/Sandbox 细节只作为执行插槽出现；完整安全链路属于 05，不在当前主轴内。
- Decision: PASS。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: “Query Loop 先发现工作项”解释 tool_use 如何进入调度；“流式调度是状态机”解释 queued/executing/completed/yielded；“Hooks 和 Permission 包住 tool.call”解释执行插槽；“第二层结果治理是历史预算”解释 ContentReplacementState 如何稳定替换。
- Sections that only list files/functions: 无。证据地图只定位源码，正文按触发、状态流、分支、源码和边界讲解。
- Reader questions still unanswered: UI 展示和每个工具的业务能力没有展开；这些不是 tool lifecycle 的核心机制。
- Revisions needed: 无。

## Source Evidence Review
- Strong evidence: `query.ts` 证明流式/非流式结果收集和 `applyToolResultBudget()`。
- Strong evidence: `StreamingToolExecutor.ts` 和 `toolOrchestration.ts` 证明并发安全判断、状态机和顺序回填。
- Strong evidence: `Tool.ts` 证明工具接口的调度和结果契约。
- Strong evidence: `toolExecution.ts` 与 `toolHooks.ts` 证明 schema、hooks、permission、call、MCP 分支和 failure hooks。
- Strong evidence: `toolResultStorage.ts` 证明 `tool-results`、`persisted-output`、`ContentReplacementState` 和历史预算替换。
- Strong evidence: `BashTool.tsx`、`AgentTool.tsx`、`MCPTool.ts`、`ToolSearchTool.ts` 证明特殊工具仍服从统一外壳。
- Weak or unsupported claims: 无。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: 已把 tool 系统拆成调度层、执行层和结果层，每层都有源码片段和结构化组件。
- Long prose / fatigue points: 正文使用 4 张 FigureBlock、2 个 StepFlow、多个 SplitBlock、CalloutBlock 和短代码片段。
- Visual or structured component opportunities: 现有四张 SVG 覆盖架构、调度、生命周期和结果预算，无需新增。

## Revision Actions
- Applied: 重写 `explainer.mdx`，按 query -> scheduler -> execution -> result governance -> special tools -> failure 组织。
- Applied: 更新 `plan.md` 为标准项目解读模板。
- Applied: 更新 `review.md` 为机制教学审查结构。
- Deferred with reason: 未新增图，现有图已经覆盖核心机制。

## Final Verdict
PASS
