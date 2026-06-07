# Review Report: claude-code-tool-lifecycle

## Review Scope

审查对象是 `content/projects/claude-code-tool-lifecycle/explainer.mdx`，配套元数据为 `content/projects/claude-code-tool-lifecycle/project.json`，图像为 `public/generated/claude-code-tool-lifecycle/*.svg`。本次 review 聚焦第六讲“Tool 调度与工具结果生命周期”的覆盖完整性、源码证据强度、读者体验，以及是否存在过于抽象或制作说明式文字。

## Coverage Review

覆盖通过。正文没有停留在 tool 列表，而是围绕完整生命周期展开：`query.ts` 发现 tool_use，`StreamingToolExecutor` 和 `runTools` 负责流式/非流式调度，`Tool.ts` 定义并发与结果映射契约，`toolExecution.ts` 包住 schema、hook、permission、call 和 failure hook，`toolResultStorage.ts` 处理单次持久化与历史预算。

已覆盖默认路径与可选路径。默认路径讲清了“工具默认独占，显式声明并发安全才并行，最终结果按原顺序输出”。可选和特殊路径覆盖了 streaming execution、Bash background/persisted output、Agent 嵌套 query、MCP PostToolUse 输出更新、ToolSearch deferred schema。

遗漏风险检查：本主题容易漏掉结果生命周期，只讲调度。正文已用“第一层结果治理是单次持久化”和“第二层结果治理是历史预算”补齐，并说明 `tool-results`、`ContentReplacementState`、`applyToolResultBudget()` 与 prompt cache 的关系。

## Source Evidence Review

源码证据通过。正文引用的关键本地源码路径超过 5 个，并且每个源码片段都服务于机制说明，而不是堆引用：

- `assets/projects/claude-code/src/query.ts`
- `assets/projects/claude-code/src/services/tools/StreamingToolExecutor.ts`
- `assets/projects/claude-code/src/services/tools/toolOrchestration.ts`
- `assets/projects/claude-code/src/services/tools/toolExecution.ts`
- `assets/projects/claude-code/src/Tool.ts`
- `assets/projects/claude-code/src/utils/toolResultStorage.ts`
- `assets/projects/claude-code/src/tools/BashTool/BashTool.tsx`
- `assets/projects/claude-code/src/tools/AgentTool/AgentTool.tsx`
- `assets/projects/claude-code/src/tools/MCPTool/MCPTool.ts`
- `assets/projects/claude-code/src/tools/ToolSearchTool/ToolSearchTool.ts`

证据链也覆盖了失败路径：`runPostToolUseFailureHooks()` 和 error `tool_result` 被单独解释，避免读者以为异常只是普通 throw。

## Reader Experience Review

读者体验通过。正文使用 4 张图、多个 `SplitBlock`、`StepFlow` 和 `CalloutBlock` 拆分信息，没有连续大段纯文本。每个章节只承担一个问题：工作项发现、接口契约、非流式调度、流式状态机、结果顺序、单工具生命周期、结果治理、特殊工具、失败路径和可复用设计。

抽象度检查：并发安全、结果顺序、持久化、历史预算都配了具体源码片段。`ContentReplacementState` 没有只说“做压缩”，而是解释为“稳定替换记录，避免破坏 prompt cache”。Agent 和 MCP 也没有泛泛说“特殊”，而是指出它们仍回到统一 tool_result 外壳，但内部运行时或输出更新时机不同。

制作说明检查：正文没有“后续补充”“另篇再讲”“本篇只讲”这类面向作者的安排文字，内容语气保持知识讲解。

## Revision Actions

已完成以下修改动作：

1. 新增 `architecture.svg`，把 query、scheduler、execution pipeline、result storage 和 next context 串成总览。
2. 新增 `scheduling.svg`，用状态和规则解释并发安全工具与独占工具的调度差异。
3. 新增 `lifecycle.svg`，把单个 tool_use 的 schema、hooks、permission、call、mapping、failure hook 画成生命周期。
4. 新增 `result-budget.svg`，明确单次持久化和历史 aggregate budget 是两层不同结果治理。
5. 在正文中补充 Bash、Agent、MCP、ToolSearch 的特殊路径，防止讲解过窄。
6. 在结尾补充可复用设计，把源码机制落到工程启发。

最终判断：PASS。当前版本覆盖主轴完整，源码证据足够，图文密度合适，没有发现需要二次修改的遗漏或过于抽象段落。
