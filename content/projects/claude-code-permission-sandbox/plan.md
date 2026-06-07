# 解读 Plan: claude-code-permission-sandbox

## 读者问题
- 这篇要回答什么：Claude Code 在工具执行前如何判断是否允许，哪些判断会强于 bypass/acceptEdits，sandbox 如何从 settings 与 permission rules 生成执行隔离。
- 不回答什么：不完整讲 MCP 协议、不展开所有 UI 组件、不把安全机制讲成漏洞审计清单。

## 源码侦察摘要
- 子代理关键洞察：权限是每个 tool call 的统一协议，不是 Bash 专属；sandbox 主要约束 shell command，不是完整 VM；MCP 与 WebFetch 还有各自的连接层和工具层规则。
- 主代理二次核验的源码：`Tool.ts`、`utils/permissions/permissions.ts`、`tools/BashTool/bashPermissions.ts`、`tools/BashTool/shouldUseSandbox.ts`、`utils/sandbox/sandbox-adapter.ts`、`utils/permissions/filesystem.ts`、`services/tools/toolExecution.ts`。

## 源码证据地图
- 入口：`services/tools/toolExecution.ts` 的 `runToolUse()` 和 `checkPermissionsAndCallTool()`。
- 权限上下文：`Tool.ts` 的 `ToolPermissionContext`，`types/permissions.ts` 与 `utils/permissions/PermissionMode.ts`。
- 主闸口：`utils/permissions/permissions.ts` 的 `hasPermissionsToUseTool()` / `hasPermissionsToUseToolInner()`。
- Bash：`tools/BashTool/BashTool.tsx`、`tools/BashTool/bashPermissions.ts`、`tools/BashTool/shouldUseSandbox.ts`。
- 文件工具：`utils/permissions/filesystem.ts`、`tools/FileEditTool/FileEditTool.ts`、`tools/FileWriteTool/FileWriteTool.ts`。
- Sandbox：`utils/sandbox/sandbox-adapter.ts` 的 `convertToSandboxRuntimeConfig()`、`isSandboxingEnabled()`、`wrapWithSandbox()`。
- 回写：`utils/permissions/PermissionUpdate.ts` 的 `applyPermissionUpdate()` 与 `persistPermissionUpdate()`。
- 扩展边界：`tools/MCPTool/MCPTool.ts`、`services/mcp/config.ts`、`tools/WebFetchTool/WebFetchTool.ts`。

## 讲解大纲
- 先给结论：Permission 是产品层决策，Sandbox 是执行层隔离。
- 宏观架构：Tool Use -> permission pipeline -> tool.call -> sandbox wrapper。
- 生命周期：tool call 触发、规则和工具自检、用户或自动决策、执行与结果回写。
- 源码细读：主闸口、Bash、FileWrite、Sandbox config。
- 可复用设计：统一决策协议、局部风险判断、临时/持久规则分离。
- 边界：不是 VM、不是所有工具都进 sandbox、`excludedCommands` 不是安全边界。

## 配图规划
- 架构图：`architecture.svg` 展示 permission 与 sandbox 两层。
- 流程图：`permission-flow.svg` 展示 `hasPermissionsToUseToolInner()` 的顺序。
- 存储/配置图：`sandbox-config.svg` 展示 settings/rules 到 sandbox config 的映射。
- 工具边界图：`tool-boundaries.svg` 展示 Bash、File、MCP 的不同责任。

## 默认与可选
- 默认路径：tool call 都走 permission pipeline；Bash 在 sandbox enabled 且没有 override 时再进入 sandbox。
- 可选路径：bypassPermissions、acceptEdits、auto classifier、PermissionRequest hook、session/local/user/project settings rule、sandbox.failIfUnavailable、managed domain policy。
