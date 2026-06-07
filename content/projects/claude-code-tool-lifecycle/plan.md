# Claude Code Tool 调度与工具结果生命周期讲解计划

## Reconnaissance

本轮先让子代理只读 `assets/projects/claude-code`，聚焦 tool_use 调度、单工具执行管线、结果持久化和特殊工具路径。主线程同步阅读 `query.ts`、`StreamingToolExecutor.ts`、`toolOrchestration.ts`、`toolExecution.ts`、`Tool.ts`、`toolResultStorage.ts`、`BashTool.tsx`，把子代理证据与本地源码交叉确认。

## 讲解主轴

目标不是列工具清单，而是解释一次工具调用在 Claude Code 内部的生命周期：

1. 模型流里出现 `tool_use`，`query.ts` 负责收集和触发执行。
2. 调度器决定工具能否流式并发、何时必须串行、最终结果按什么顺序回给模型。
3. 单个工具进入统一执行管线，经过 schema、PreToolUse hook、permission、`tool.call()`、progress、PostToolUse hook 和 failure hook。
4. 工具结果被映射成 `tool_result`，大输出先做单次持久化，历史上下文再做 aggregate budget 替换。
5. Bash、Agent、MCP、ToolSearch 走特殊内部路径，但仍返回统一的 tool_result 或 tool_reference 语义。

## 内容取舍

保留：

- `StreamingToolExecutor` 状态机和并发安全规则。
- `runTools` 非流式 fallback 的批处理规则。
- `Tool` 接口里的 `isConcurrencySafe`、`maxResultSizeChars`、`mapToolResultToToolResultBlockParam`。
- `toolExecution.ts` 的执行前后生命周期。
- `toolResultStorage.ts` 的单次持久化与历史预算压缩。
- Bash、Agent、MCP、ToolSearch 的特殊输出和权限边界。

去除：

- 具体 UI 展示细节。
- 每个工具的业务能力枚举。
- 与调度无关的 permission/sandbox 细节。
- 与 context management 讲解重复的 microcompact/autocompact 全流程，只保留 tool_result budget 接口。

## 图文计划

1. `architecture.svg`：模型流、调度器、执行管线、结果存储、下一轮上下文的总览。
2. `scheduling.svg`：queued/executing/completed/yielded 状态和并发安全/独占规则。
3. `lifecycle.svg`：单个 tool_use 从 schema 到 hooks、permission、call、mapping、failure 的生命周期。
4. `result-budget.svg`：单次大输出持久化与历史 aggregate budget 的两层结果治理。

## Review Gate

完成后检查：

- 是否讲清默认路径与可选/特殊路径。
- 是否至少引用 5 个本地源码文件。
- 是否避免连续大段纯文本。
- 是否没有“另篇再讲”“后续补充”这类制作说明。
- 是否把调度、生命周期、结果预算三条线闭环，而不是停在 API 介绍。
