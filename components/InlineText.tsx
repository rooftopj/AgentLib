import type { ReactNode } from "react";
import katex from "katex";

function renderInlineMath(formula: string) {
  const html = katex.renderToString(formula, {
    displayMode: false,
    throwOnError: false,
    strict: "ignore",
  });
  return <span className="inline-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function spaceMixedText(text: string) {
  return text
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2");
}

export function renderInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|==[^=]+==|\$[^$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(spaceMixedText(text.slice(lastIndex, match.index)));
    const token = match[0];
    const key = `${parts.length}-${match.index}`;

    if (token.startsWith("**")) {
      parts.push(<strong key={key}>{renderInlineText(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("==")) {
      parts.push(<mark key={key}>{renderInlineText(token.slice(2, -2))}</mark>);
    } else if (token.startsWith("$")) {
      parts.push(<span key={key}>{renderInlineMath(token.slice(1, -1))}</span>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(spaceMixedText(text.slice(lastIndex)));
  return parts;
}
