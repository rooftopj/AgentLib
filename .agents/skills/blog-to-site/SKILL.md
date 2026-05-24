---
name: blog-to-site
description: 将 Agent 领域知名博客、工程文章、产品实践文章或项目复盘链接转换为本站可发布的中文博客 insight 页面。Use when the user provides a blog/article URL and asks Codex to生成博客分享、关键内容、insight、MDX、原文跳转、博客页面或将文章加入 Agent Lib；必须使用 Browser 插件访问网页并抓取标题、canonical、正文结构、meta、og:image 和正文图片 URL。
---

# Blog To Site

这个 skill 用于把一篇 Agent 领域博客或工程文章转成当前 Next.js 站点的中文 insight 内容。它和论文讲解页相似，但目标不是逐段翻译，而是提炼观点、机制、工程启发和可复用实践，并保留跳回原文的链接。

## 输出位置

写入：

```text
content/blogs/{slug}/blog.json
content/blogs/{slug}/insight.mdx
```

不要修改 `content/papers/**` 的论文讲解或精读内容。博客图片默认使用原站远程 URL，不下载到 `public/`，除非用户明确要求本地化。

## 必须使用 Browser

处理链接前必须使用 Browser 插件打开原网页。抓取并记录：

- 用户输入的原始 `sourceUrl`。
- 浏览器解析后的 `canonicalUrl`，优先读 `link[rel="canonical"]`，没有则用当前 URL。
- 标题：优先 `h1`，其次 `document.title`。
- 发布方、作者、发布日期：优先 meta、页面正文可见信息和 JSON-LD。
- 摘要：优先 `meta description` 和正文首段，最终写成中文概括。
- 封面：优先 `og:image` 或 `twitter:image`。
- 正文图片：从 `article` 或 `main` 中抓取 `img.currentSrc/src` 和 `alt`，挑选与 insight 相关的图片。
- 正文结构：抓取 `h2/h3` 和关键段落，用来建立理解框架。

如果网页重定向到本地化版本，`sourceUrl` 仍保留用户给的链接，`canonicalUrl` 保存实际 canonical。详情页“阅读原文”按钮应跳转 `sourceUrl`。

## blog.json 协议

必须包含：

```json
{
  "slug": "harness-engineering",
  "title": "文章标题",
  "sourceUrl": "https://example.com/original",
  "canonicalUrl": "https://example.com/canonical",
  "publisher": "OpenAI",
  "author": "Author Name",
  "publishedDate": "2026-02-11",
  "category": "code-agents",
  "categoryLabel": "代码与软件工程",
  "tags": ["Codex", "可观测性"],
  "summary": "中文摘要。",
  "coverImageUrl": "https://...",
  "coverImageAlt": "封面说明。"
}
```

`category` 必须来自 `content/categories.json`，`categoryLabel` 必须严格等于对应 `label`。如果没有发布日期，用浏览器可见日期；仍找不到时写空字符串前先向用户说明不确定性。

## insight.mdx 写作协议

`insight.mdx` 是中文博客分享，不是全文翻译。不要复制原文长段落；只允许短语级引用，主体必须是中文转述、分析和工程启发。

推荐结构：

- `# {title}`
- `## 先抓住这篇文章的真正主题`
- `## 背景：它在回答什么问题`
- `## 核心 insight`
- `## 工程机制或方法拆解`
- `## 对 Agent 项目的复用启发`
- `## 边界与误读提醒`

可以根据文章内容调整标题，但至少保留 4 个 `##`。使用和论文讲解页相同的富内容组件：

```mdx
<FigureBlock
  src="https://..."
  caption="原文图：说明这张图在文章论证中的作用。"
/>

<CalloutBlock
  title="一句话 insight"
  body="用中文提炼一个可复用判断。"
/>

<SplitBlock
  leftTitle="旧工作流"
  left="..."
  rightTitle="Agent-first 工作流"
  right="..."
/>

<StepFlow
  steps="描述意图|运行智能体|收集证据|修复与验证"
  descriptions="...|...|...|..."
/>
```

正文中不要重复写 `sourceUrl`；前端详情页按钮会提供原文跳转。

## 工作流

1. 使用 Browser 打开用户提供的 URL，抓取元数据、正文结构和图片 URL。
2. 基于标题生成短 slug，使用小写字母、数字和连字符。
3. 读取 `content/categories.json`，选择最贴切分类。
4. 写入 `content/blogs/{slug}/blog.json`。
5. 写入 `content/blogs/{slug}/insight.mdx`，用中文输出 insight、关键内容、结构拆解和可迁移启发。
6. 运行：

```bash
npm run blog:registry
npm run blog:validate
npm run content:index
npm run build
```

## 质量要求

- insight 必须能独立帮助中文读者理解文章，不依赖读者先看原文。
- 至少引用一张原文图片；如果文章没有图片，在 `blog.json` 中使用可用封面图，并在正文说明没有正文图可复用。
- 所有远程图片必须使用 `https://`。
- 不伪造文章没有提供的数据、发布日期、作者或实验结果。
- 关键判断要区分“原文明确提出”和“本站 insight 推断”。
- 不写制作说明、TODO、占位符或“后续补充”。
