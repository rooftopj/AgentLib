# 解读 Plan: claude-code-permission-sandbox

## 读者问题
- 这篇要回答什么：Claude Code 在 tool call 前如何形成 allow/ask/deny，哪些判断强于 bypass/acceptEdits，用户批准如何回写，Bash sandbox 如何从 settings 和 permission rules 生成执行隔离。
- 不回答什么：不完整展开 MCP 协议、所有 UI 组件、漏洞审计细节；只说明这些机制和 permission/sandbox 主链路的关系。

## 源码侦察摘要
- 关键洞察：权限是所有工具共享的统一协议，不是 Bash 专属；sandbox 主要约束 shell command execution，不是完整 VM；MCP 和 WebFetch 共享 permission pipeline，但不天然继承 shell sandbox。
- 主代理二次核验的源码：`Tool.ts`、`services/tools/toolExecution.ts`、`utils/permissions/permissions.ts`、`PermissionMode.ts`、`PermissionUpdate.ts`、`BashTool.tsx`、`bashPermissions.ts`、`shouldUseSandbox.ts`、`sandbox-adapter.ts`、`filesystem.ts`、`FileWriteTool.ts`、`MCPTool.ts`。

## 源码证据地图
- 入口：`runToolUse()`、`streamedCheckPermissionsAndCallTool()`、`resolveHookPermissionDecision()`。
- 权限上下文：`ToolPermissionContext`、`PermissionMode`、always allow/deny/ask rules。
- 主闸口：`hasPermissionsToUseToolInner()` 的 deny -> ask -> tool.checkPermissions -> safety/mode 顺序。
- Bash：`bashToolHasPermission()`、env var stripping、compound command 子命令检查、`shouldUseSandbox()`。
- 文件工具：`checkWritePermissionForTool()`、`checkPathSafetyForAutoEdit()`、`FileWriteTool` 的 read-before-write / mtime check。
- Sandbox：`convertToSandboxRuntimeConfig()`、settings/rules 到 filesystem/network config 的映射。
- 回写：`applyPermissionUpdate()` 区分 session/local/user/project destination。
- 边界：`MCPTool.checkPermissions()` passthrough，WebFetch domain rule 在工具权限和 sandbox network 中语义不同。

## 讲解大纲
- 先给结论：Permission 是产品层决策，Sandbox 是 Bash 执行层隔离。
- 宏观架构：tool use -> hook -> permission decision -> tool.call -> Bash sandbox。
- 生命周期：触发、上下文、主闸口、工具自检、用户批准、回写、执行。
- 源码细读：主闸口顺序、Bash 命令语义、sandbox config、文件路径安全。
- 可复用设计：统一协议、局部风险判断、分级回写、执行隔离。
- 边界：不是 VM，不是所有工具都进 sandbox，bypass 不是更强隔离。

## 配图规划
- 架构图：`architecture.svg` 展示 permission 与 sandbox 两层。
- 流程图：`permission-flow.svg` 展示主闸口顺序。
- 配置图：`sandbox-config.svg` 展示 settings/rules 到 sandbox config 的映射。
- 工具边界图：`tool-boundaries.svg` 展示 Bash、File、MCP 的不同局部安全逻辑。

## 默认与可选
- 默认路径：所有 tool call 都走 permission pipeline；Bash 在 sandbox enabled 且没有 override/exclusion 时进入 sandbox。
- 可选路径：bypassPermissions、acceptEdits、auto classifier、PermissionRequest hook、SDK prompt、session/local/user/project rules、sandbox.failIfUnavailable、autoAllowBashIfSandboxed。
