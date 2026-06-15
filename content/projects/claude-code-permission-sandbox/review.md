# Project Explainer Review: claude-code-permission-sandbox

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: Permission / Sandbox 安全机制如何触发、判定、回写和执行隔离。
- Plan path: `content/projects/claude-code-permission-sandbox/plan.md`
- Explainer path: `content/projects/claude-code-permission-sandbox/explainer.mdx`

## Coverage Review
- Covered: tool execution 入口、PreToolUse hook、PermissionContext、PermissionMode、主权限闸口顺序、Bash rule matching、compound command 检查、sandbox 启用条件、sandbox config 映射、文件工具路径/竞态检查、PermissionUpdate 回写、MCP/WebFetch 边界、默认/可选路径。
- Missing or weak: 没有展开所有 permission dialog UI 和 auto classifier prompts。它们是决策来源的前端/内部模型实现，不是当前机制主链路。
- Decision: PASS。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: “Tool Use 先进入统一执行器”解释执行器如何进入 permission；“主权限闸口的顺序”解释 deny/ask/tool self-check/bypass 的优先级；“Bash 工具要分析命令语义”解释命令字符串如何拆分判断；“用户批准会更新权限状态”解释 ask 到 PermissionUpdate 的状态流。
- Sections that only list files/functions: 无。证据地图只做定位，正文各节都解释触发、状态、分支、例子和边界。
- Reader questions still unanswered: classifier 失败策略和所有 bridge prompt 没有展开；正文已经把它们归为可选决策来源。
- Revisions needed: 无。

## Source Evidence Review
- Strong evidence: `toolExecution.ts` 证明统一执行器和 hook/permission 合并。
- Strong evidence: `Tool.ts`、`PermissionMode.ts`、`permissions.ts` 证明上下文结构和主闸口顺序。
- Strong evidence: `BashTool.tsx`、`bashPermissions.ts`、`shouldUseSandbox.ts` 证明 Bash 的工具自检和 sandbox 触发边界。
- Strong evidence: `sandbox-adapter.ts` 证明 settings/rules 到 runtime filesystem/network config 的映射。
- Strong evidence: `filesystem.ts` 和 `FileWriteTool.ts` 证明文件工具路径 safety check 与 read-before-write。
- Strong evidence: `PermissionUpdate.ts` 和 `MCPTool.ts` 证明授权回写与 MCP passthrough。
- Weak or unsupported claims: 无。`sandbox 不是完整 VM` 是从调用路径和 adapter 作用范围得出的机制边界，正文已按边界表述。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: 已把 Permission/Sandbox 拆成执行器、上下文、主闸口、Bash、sandbox config、文件工具、回写、MCP/WebFetch 边界。
- Long prose / fatigue points: 正文使用 4 张 FigureBlock、2 个 StepFlow、多个 SplitBlock、CalloutBlock、ConceptTabs 和短源码片段，阅读节奏符合门控。
- Visual or structured component opportunities: 现有四张 SVG 覆盖架构、权限流程、sandbox config 和工具边界，无需新增重复图。

## Revision Actions
- Applied: 重写 `explainer.mdx`，按机制闭环解释触发、状态、分支、源码证据和边界。
- Applied: 更新 `plan.md`，补充 hook、PermissionUpdate、MCP/WebFetch 边界和 sandbox config 证据地图。
- Applied: 更新 `review.md`，对照新正文做机制教学检查。
- Deferred with reason: 未新增图，现有图已覆盖核心路径。

## Final Verdict
PASS
