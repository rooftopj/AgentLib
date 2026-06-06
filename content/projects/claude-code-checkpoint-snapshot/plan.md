# 解读 Plan: claude-code-checkpoint-snapshot

## 读者问题
- 这篇要回答什么：Claude Code 的 `/rewind` 和 `/checkpoint` 到底怎样把一次对话里的代码修改回退到旧状态。
- 不回答什么：不展开 shell snapshot、context-collapse snapshot、agent memory snapshot、plan file snapshot，也不把它们混成同一个机制。

## 源码侦察摘要
- 子代理关键洞察：`/checkpoint` 只是 `/rewind` 的 alias；真正的文件回退机制叫 file history，核心类型是 `FileHistorySnapshot`。
- 主代理二次核验的源码：`commands/rewind`、`components/MessageSelector.tsx`、`utils/fileHistory.ts`、`utils/sessionStorage.ts`、`screens/REPL.tsx`、`cli/print.ts`。
- 负面事实：这不是 git commit/stash，不是完整项目快照，不保证覆盖手工编辑或普通 bash 副作用。

## 源码证据地图
- 入口：`assets/projects/claude-code/src/commands/rewind/index.ts`、`rewind.ts`、`components/MessageSelector.tsx`。
- 写入：`utils/handlePromptSubmit.ts`、`QueryEngine.ts` 调 `fileHistoryMakeSnapshot()`；文件工具在写前调 `fileHistoryTrackEdit()`。
- 存储：`utils/fileHistory.ts` 的 `resolveBackupPath()` 指向 `~/.claude/file-history/<sessionId>/`；`utils/sessionStorage.ts` 写 `file-history-snapshot` entry。
- 更新/冲突：snapshot update 用 `isSnapshotUpdate` 替换同一 messageId 的 snapshot；恢复前用 diff stats 展示会变哪些文件。
- 召回/恢复：resume 时 `buildFileHistorySnapshotChain()` 和 `fileHistoryRestoreStateFromLog()` 重新构造内存状态；恢复时 `fileHistoryRewind()` 调 `applySnapshot()`。
- 权限/边界：`fileCheckpointingEnabled`、`CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`、SDK 需显式开启。

## 讲解大纲
- 先给结论：Rewind 是 conversation rewind + file-history rewind 的组合。
- 宏观架构：入口、消息时间线、文件备份、transcript metadata、恢复 UI。
- 生命周期：用户消息建 checkpoint，工具写文件前补旧版本，恢复时按 messageId 找 snapshot。
- 源码细读：命令入口、snapshot 数据结构、track edit、make snapshot、apply snapshot、JSONL 落盘。
- 可复用设计：metadata 与 blob 分离、按用户消息绑定、恢复前 diff preview。
- 边界：不是 git，不是全量项目快照；只覆盖 Claude Code file-history 追踪到的文件变化。

## 配图规划
- 架构图：Rewind 面板到 transcript/file-history/restore 双路径。
- 流程图：用户消息与 file-history snapshot 时间线。
- 存储图：JSONL entry 指向 file-history backup files。
- 恢复图：conversation slice 与 file applySnapshot 并行。
- 边界图：git/worktree/transcript/file-history 的关系。

## 默认与可选
- 默认路径：交互式会话默认开启 `fileCheckpointingEnabled`，每个可选用户消息建 file-history snapshot。
- 可选路径：SDK/non-interactive 需要 `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`，CLI 有隐藏 `--rewind-files`，SDK control 有 `rewind_files`。
