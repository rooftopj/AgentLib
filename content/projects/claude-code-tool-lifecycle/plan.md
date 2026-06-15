# 解读 Plan: claude-code-tool-lifecycle

## 读者问题
- 这篇要回答什么：模型产生 tool_use 后，Claude Code 如何调度多个工具、如何执行单个工具、如何映射和压缩 tool_result，以及特殊工具如何仍服从统一生命周期。
- 不回答什么：不展开 Permission/Sandbox 细节，不枚举每个工具业务能力，不完整讲 context compact，只讲 tool result budget 与工具结果生命周期的关系。

## 源码侦察摘要
- 关键洞察：tool 系统分成调度层、执行层和结果层；流式调度允许提前执行但保持最终顺序；单工具执行有固定插槽；结果治理分单次持久化和历史 aggregate budget 两层。
- 主代理二次核验的源码：`query.ts`、`StreamingToolExecutor.ts`、`toolOrchestration.ts`、`toolExecution.ts`、`toolHooks.ts`、`Tool.ts`、`toolResultStorage.ts`、`BashTool.tsx`、`AgentTool.tsx`、`runAgent.ts`、`MCPTool.ts`、`ToolSearchTool.ts`。

## 源码证据地图
- 入口：`query.ts` 发现 tool_use，选择 streaming executor 或 `runTools()`。
- 调度：`StreamingToolExecutor` 状态机、`toolOrchestration.partitionToolCalls()`、`isConcurrencySafe(input)`。
- 执行：`runToolUse()`、schema/validateInput、PreToolUse、permission、`tool.call()`、PostToolUse、failure hooks。
- 存储/结果：`mapToolResultToToolResultBlockParam()`、`processToolResultBlock()`、`buildLargeToolResultMessage()`、`applyToolResultBudget()`、`ContentReplacementState`。
- 特殊工具：Bash persisted output/background、Agent nested query、MCP output update、ToolSearch tool_reference。
- 权限/边界：permission 只作为执行插槽出现；详细安全机制属于 05。

## 讲解大纲
- 先给结论：tool 系统是调度、执行、结果三层。
- 宏观架构：assistant stream -> scheduler -> execution pipeline -> result governance -> next query。
- 生命周期：发现 tool_use、调度并发/独占、执行单工具、映射结果、治理输出、失败回填。
- 源码细读：`Tool` 接口契约、StreamingToolExecutor、toolExecution、toolResultStorage。
- 特殊路径：Bash、Agent、MCP、ToolSearch。
- 可复用设计：并发自声明、固定执行插槽、稳定结果顺序、两层预算。

## 配图规划
- 架构图：`architecture.svg` 展示 query、scheduler、execution、result storage、next context。
- 调度图：`scheduling.svg` 展示 queued/executing/completed/yielded 与并发/独占。
- 生命周期图：`lifecycle.svg` 展示 schema、hooks、permission、call、mapping、failure。
- 结果预算图：`result-budget.svg` 展示单次持久化和历史 aggregate budget。

## 默认与可选
- 默认路径：工具默认独占；并发安全工具可批量/流式并发；最终 tool_result 按原顺序输出；大输出按阈值持久化。
- 可选路径：streaming execution、Bash background task、Agent nested query、MCP updated output、ToolSearch deferred schema、历史 tool result budget 持久 replacement。
