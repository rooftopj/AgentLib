# Project Explainer Review: claude-code-checkpoint-snapshot

## Review Scope
- Source repo/path: `assets/projects/claude-code`
- Focus question: checkpoint / snapshot 机制如何触发、存储、恢复，以及和 session、transcript、git、worktree 的边界。
- Plan path: `content/projects/claude-code-checkpoint-snapshot/plan.md`
- Explainer path: `content/projects/claude-code-checkpoint-snapshot/explainer.mdx`

## Coverage Review
- Covered: `/rewind` 与 `/checkpoint` alias、MessageSelector UI、用户消息建立 checkpoint、文件工具写前 track edit、`FileHistorySnapshot` 数据结构、metadata/blob 分离、snapshot update、diff preview、resume 恢复 metadata 和 backup blob、代码恢复、对话恢复、CLI/SDK headless 路径、边界。
- Missing or weak: 没有展开 shell snapshot、context collapse snapshot、agent memory snapshot。正文开头已经把这些同名机制排除，避免和 file-history checkpoint 混淆。
- Decision: PASS。

## Mechanism Teaching Review
- Sections that explain cause -> state -> effect well: “什么时候建立 checkpoint”解释 user message 如何变成坐标；“文件旧版本怎么捕获”解释写前备份；“metadata 和 blob 分离”解释 transcript entry 与 file-history 目录；“resume 后怎么找回 checkpoint”解释 metadata chain 与 backup 迁移；“恢复代码怎么执行”解释 `backupFileName: null` 和 copy-back 分支。
- Sections that only list files/functions: 无。证据地图只用来定位源码，正文各节都解释触发条件、状态流动、关键分支和边界。
- Reader questions still unanswered: UI 具体交互细节和 Ink 渲染不展开；它们不影响 checkpoint 状态机。
- Revisions needed: 无。

## Source Evidence Review
- Strong evidence: `commands/rewind/index.ts` 和 `rewind.ts` 证明命令入口只是打开选择器。
- Strong evidence: `handlePromptSubmit.ts` 与 `QueryEngine.ts` 证明 selectable user message 会触发 `fileHistoryMakeSnapshot()`。
- Strong evidence: `utils/fileHistory.ts` 证明 snapshot 类型、写前备份、恢复、diff stats 和 resume backup 迁移。
- Strong evidence: `utils/sessionStorage.ts` 证明 metadata 以 `file-history-snapshot` entry 写入 transcript，并用 `isSnapshotUpdate` 替换同一 messageId 的旧索引。
- Strong evidence: `screens/REPL.tsx` 证明 conversation/code 两个恢复回调分离。
- Weak or unsupported claims: 无。
- Revisions needed: 无。

## Reader Experience Review
- Over-abstract parts: 已把“回到过去”改成消息坐标、写前备份、metadata/blob 分离、applySnapshot 分支和 conversation slice 两条状态线。
- Long prose / fatigue points: 正文使用 5 张 FigureBlock、2 个 StepFlow、2 个 SplitBlock、多个短代码片段和 CalloutBlock，避免连续长段落。
- Visual or structured component opportunities: 现有图覆盖架构、双恢复路径、时间线、存储布局和边界，足够支撑该机制。

## Revision Actions
- Applied: 重写 `content/projects/claude-code-checkpoint-snapshot/explainer.mdx`，按状态机顺序组织。
- Applied: 明确 `backupFileName: null` 表示目标 checkpoint 时文件不存在。
- Applied: 补强 snapshot update、resume metadata/blob 双恢复和 headless SDK/CLI 路径。
- Deferred with reason: 未新增图片；该项目已有 5 张机制图，新增图会重复。

## Final Verdict
PASS
