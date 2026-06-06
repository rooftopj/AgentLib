# Project Explainer Review: claude-code-checkpoint-snapshot

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: checkpoint / snapshot 机制如何触发、存储、恢复，以及和 session/transcript/git/worktree 的边界。
- Plan path: `content/projects/claude-code-checkpoint-snapshot/plan.md`
- Explainer path: `content/projects/claude-code-checkpoint-snapshot/explainer.mdx`

## Coverage Review
- Covered: `/rewind` 与 `/checkpoint` 入口、MessageSelector UI、用户消息触发 snapshot、工具写前 track edit、JSONL metadata、file-history backup 目录、resume 迁移、conversation/code 双恢复路径、CLI/SDK 入口、边界。
- Missing or weak: 初稿容易把“召回”写成 memory recall。已明确说明这里没有 vector storage、embedding search 或 LLM rerank，只有 transcript 里的 snapshot chain restore。
- Decision: PASS。

## Source Evidence Review
- Strong evidence: `commands/rewind/index.ts` 证明 alias；`handlePromptSubmit.ts` 与 `QueryEngine.ts` 证明 snapshot 创建；`fileHistory.ts` 证明数据结构、备份路径和恢复逻辑；`sessionStorage.ts` 证明 JSONL metadata；`REPL.tsx` 证明双恢复入口。
- Weak or unsupported claims: “普通 bash 不保证恢复”需要避免说成绝对不能恢复。正文已改成“普通 shell 任意副作用不能可靠进入 file history”，并引用 Bash simulated edit 路径。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: “checkpoint 是两个状态面”已通过架构图、restore-split 图和 StepFlow 解释。
- Long prose / fatigue points: 正文穿插 FigureBlock、SplitBlock、StepFlow、CalloutBlock 和源码片段，没有连续大段纯文本推进。
- Visual or structured component opportunities: 已加入 4 张 SVG 图，覆盖架构、时间线、存储、边界；正文还有两个 SplitBlock、两个 StepFlow、三个 CalloutBlock。

## Revision Actions
- Applied: 把“snapshot 家族”单独成节，排除 shell/context-collapse/agent memory 等同名机制。
- Applied: 增加 “Headless 与 SDK 路径” 节，覆盖 `--rewind-files` 和 SDK `rewind_files`。
- Applied: 增加 “不是向量检索” 分栏，避免和第一讲 memory 召回混淆。
- Deferred with reason: 没展开 todo/tool result 的具体持久化实现，因为它们不是 checkpoint 主链路，只在边界中提及。

## Final Verdict
PASS
