# Project Explainer Review: claude-code-permission-sandbox

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: Permission / Sandbox 安全机制如何触发、判定、回写和执行隔离。
- Plan path: `content/projects/claude-code-permission-sandbox/plan.md`
- Explainer path: `content/projects/claude-code-permission-sandbox/explainer.mdx`

## Coverage Review
- Covered: Tool 执行入口、PermissionContext、主权限闸口、Bash 权限、sandbox config、文件工具、MCP/WebFetch 边界、用户批准回写、默认/可选路径。
- Missing or weak: 初稿没有完整讲每个 permission UI 组件；这是有意删减，因为主轴是决策协议和执行隔离。
- Decision: PASS

## Source Evidence Review
- Strong evidence: `toolExecution.ts`、`permissions.ts`、`bashPermissions.ts`、`shouldUseSandbox.ts`、`sandbox-adapter.ts`、`filesystem.ts`、`FileWriteTool.ts`、`MCPTool.ts` 都有短源码片段。
- Weak or unsupported claims: “不是完整 VM”来自 sandbox adapter 的作用范围和 Bash shouldUseSandbox 路径，是源码结构推断；正文已按边界表述，没有扩展成实现外结论。
- Revisions needed: 无需新增源码片段。

## Reader Experience Review
- Over-abstract parts: 已用 FigureBlock、SplitBlock、StepFlow、ConceptTabs 降低抽象度。
- Long prose / fatigue points: 主要机制章节之间都插入图、分栏、步骤流或源码片段。
- Visual or structured component opportunities: 已加入 4 张 SVG：架构、权限流程、sandbox config、工具边界。

## Revision Actions
- Applied: 把主线收束为 Permission 决策层与 Sandbox 执行层；加入 bypass 不是 sandbox、MCP 不天然继承 shell sandbox、excludedCommands 不是安全边界。
- Deferred with reason: 没有展开所有 permission dialog UI 组件，避免正文变成组件目录枚举。

## Final Verdict
PASS
