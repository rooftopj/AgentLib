---
name: annotation-to-site
description: Convert learning-session annotation notes into Agent Lib annotations.json files. Use when a user asks to沉淀学习批注、把对正文某句话/概念的解释加入右侧批注区、生成 annotations.json, or convert temporary .tmp/learning-annotations notes for paper, blog, or future project explainer pages.
---

# Annotation To Site

Use this skill to turn learning-time explanations into static annotation files for Agent Lib. Do not modify `paper-to-site` or `blog-to-site`; those skills generate the main content, while this skill only manages learning annotations.

## Temporary Notes

During a learning conversation, append one JSON object per line to:

```text
.tmp/learning-annotations/paper/{slug}/notes.jsonl
.tmp/learning-annotations/blog/{slug}/notes.jsonl
.tmp/learning-annotations/project/{slug}/notes.jsonl
```

Record the original quoted text and the explanation. Do not edit the formal content files while merely collecting notes.

Required note shape:

```json
{
  "id": "aflow-search-reset-001",
  "createdAt": "2026-05-24T16:00:00+08:00",
  "contentType": "paper",
  "slug": "aflow-automating-agentic-workflow-generation",
  "sourceFile": "content/papers/aflow-automating-agentic-workflow-generation/explainer.mdx",
  "sectionTitle": "核心机制：算子、树结构经验与执行反馈",
  "quote": "如果搜索永远围绕它微调，就可能错过另一类完全不同的流程。",
  "userQuestion": "这里为什么说会错过完全不同的流程？",
  "shortTitle": "为什么要保留重新探索？",
  "explanation": "这里讲的是搜索空间探索问题：如果系统一直微调当前高分 workflow，就容易陷入局部最优。重新打开一条路径，是为了让搜索有机会跳到另一类结构。",
  "status": "ready"
}
```

Rules:

- `quote` must be exact text from the source MDX file. Include Markdown markers if they are part of the source text.
- `sectionTitle` should match a `##` or `###` heading when possible.
- `explanation` is reader-facing annotation body text.
- `explanation` may use lightweight Markdown: blank-line paragraphs, numbered lines like `1. ...`, bullet lines like `- ...`, fenced code blocks, `**bold**`, `==highlight==`, inline `` `code` ``, and inline math `$x$`.
- Keep fenced code blocks short, usually no more than 8-12 lines, because the annotation rail is narrow. Use them to illustrate a mechanism, not to carry a full implementation.
- `userQuestion` preserves context for future maintenance but is not shown by the frontend.
- Only records with `"status": "ready"` are exported.
- Each annotation must stand alone for a reader who has not seen the learning chat. Avoid openings like “对”, “不是”, “这里”, “刚才”, or “如前所述” that depend on the user's question. Restate the concept being clarified, then answer it directly.

## Learning Context Lookup

When the user asks for explanation before or while creating an annotation, prefer the richest available source:

- **Paper pages**: use `content/papers/{slug}/reading.json` to inspect original paper excerpts, translations, appendix snippets, and case-study details. Use `explainer.mdx` for the exact quote anchor because exported annotations must match the rendered site text.
- **Blog pages**: use the Browser plugin to open and inspect the original blog/article when the existing `insight.mdx` is too condensed or the user asks about source context. Keep the final annotation anchored to an exact quote from `content/blogs/{slug}/insight.mdx`.
- **Project pages**: inspect available source artifacts in the project content folder first, then use the explainer MDX as the quote anchor.

Do not quote from `reading.json` or an external blog URL as the annotation `quote` unless that exact text also appears in the source MDX file. Use richer sources to explain, and the MDX source to anchor.

## Export Workflow

1. Identify `contentType` and `slug`.
2. Read the source body:
   - paper: `content/papers/{slug}/explainer.mdx`
   - blog: `content/blogs/{slug}/insight.mdx`
   - project: `content/projects/{slug}/explainer.mdx`
3. Read temporary notes from the default JSONL path, or a user-provided JSONL path.
4. Run:

```bash
npm run annotations:export -- paper {slug}
npm run annotations:export -- blog {slug}
npm run annotations:export -- project {slug}
```

Pass a custom notes path as the third argument when needed:

```bash
npm run annotations:export -- paper {slug} .tmp/learning-annotations/paper/{slug}/notes.jsonl
```

The script writes or updates:

```text
content/papers/{slug}/annotations.json
content/blogs/{slug}/annotations.json
content/projects/{slug}/annotations.json
```

It also writes an export log at:

```text
.tmp/learning-annotations/{contentType}/{slug}/export-log.json
```

## Output Contract

Formal annotation files use this v1 shape:

```json
{
  "version": 1,
  "contentType": "paper",
  "slug": "aflow-automating-agentic-workflow-generation",
  "items": [
    {
      "id": "aflow-search-reset-001",
      "sectionTitle": "核心机制：算子、树结构经验与执行反馈",
      "quote": "如果搜索永远围绕它微调，就可能错过另一类完全不同的流程。",
      "occurrence": 1,
      "title": "为什么要保留重新探索？",
      "body": "这里讲的是 **搜索空间探索** 问题：\n\n```python\ndrafts = [await llm(problem) for _ in range(3)]\nfinal = await llm(\"choose best\", drafts)\n```\n\n1. 如果系统一直微调当前高分 `workflow`，就容易陷入局部最优。\n2. 重新打开一条路径，是为了让搜索有机会跳到另一类结构。"
    }
  ]
}
```

Existing annotations are merged by `id`. Reusing an `id` updates that annotation; a new `id` appends a new annotation.

Exported `items` should be sorted by the matched quote position in the source MDX, following the reader's scroll order. Use `id` only as a stable tie-breaker, not as the primary display order.

## Validation

After export, run:

```bash
npm run annotations:validate
```

Validation checks metadata, unique IDs, required fields, exact quote matching, valid section titles, and `occurrence` bounds. If validation fails, fix the temporary note or source quote instead of weakening the validator.
